-- Create separate user_roles table for secure role management
-- This prevents privilege escalation attacks from the profiles table

CREATE TABLE public.user_roles (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
    role user_role NOT NULL DEFAULT 'buyer',
    created_at timestamp with time zone NOT NULL DEFAULT now(),
    updated_at timestamp with time zone NOT NULL DEFAULT now(),
    UNIQUE (user_id)
);

-- Enable RLS on user_roles
ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

-- Create security definer function to check roles
CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role user_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

-- Create function to get user role from the new table
CREATE OR REPLACE FUNCTION public.get_user_role_secure(user_uuid uuid)
RETURNS user_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.user_roles WHERE user_id = user_uuid),
    'buyer'::user_role
  )
$$;

-- RLS policies for user_roles table
CREATE POLICY "Users can view their own role"
ON public.user_roles
FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all roles"
ON public.user_roles
FOR SELECT
USING (public.has_role(auth.uid(), 'admin'));

-- Create admin-only function to change user roles
CREATE OR REPLACE FUNCTION public.admin_update_user_role(
  target_user_id uuid,
  new_role user_role
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can change user roles';
  END IF;
  
  -- Prevent demoting yourself from admin
  IF target_user_id = auth.uid() AND new_role != 'admin' THEN
    RAISE EXCEPTION 'Cannot demote yourself from admin';
  END IF;

  -- Insert or update the role
  INSERT INTO public.user_roles (user_id, role, updated_at)
  VALUES (target_user_id, new_role, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET role = new_role, updated_at = now();
  
  -- Also update the legacy profiles.role and is_seller for backwards compatibility
  UPDATE public.profiles 
  SET role = new_role, 
      is_seller = (new_role = 'seller' OR new_role = 'admin')
  WHERE user_id = target_user_id;

  RETURN true;
END;
$$;

-- Create function to approve seller request (admin only)
CREATE OR REPLACE FUNCTION public.approve_seller_request(
  ticket_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_ticket_type text;
BEGIN
  -- Check if caller is admin
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can approve seller requests';
  END IF;
  
  -- Get the ticket info
  SELECT user_id, type INTO v_user_id, v_ticket_type
  FROM public.support_tickets
  WHERE id = ticket_id;
  
  IF v_ticket_type != 'seller_request' THEN
    RAISE EXCEPTION 'This ticket is not a seller request';
  END IF;
  
  -- Update the user role to seller
  INSERT INTO public.user_roles (user_id, role, updated_at)
  VALUES (v_user_id, 'seller', now())
  ON CONFLICT (user_id) 
  DO UPDATE SET role = 'seller', updated_at = now();
  
  -- Also update profiles for backwards compatibility
  UPDATE public.profiles 
  SET role = 'seller', is_seller = true
  WHERE user_id = v_user_id;
  
  -- Update ticket status
  UPDATE public.support_tickets
  SET status = 'resolved', updated_at = now()
  WHERE id = ticket_id;

  RETURN true;
END;
$$;

-- Migrate existing roles from profiles to user_roles
INSERT INTO public.user_roles (user_id, role)
SELECT user_id, COALESCE(role, 'buyer')
FROM public.profiles
ON CONFLICT (user_id) DO NOTHING;

-- Update the invite_user_to_project function to NOT auto-promote users
CREATE OR REPLACE FUNCTION public.invite_user_to_project(p_project_id uuid, p_user_email text, p_inviter_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id UUID;
  v_project_name TEXT;
BEGIN
  -- Get user by email
  SELECT profiles.user_id INTO v_user_id
  FROM public.profiles 
  WHERE email = p_user_email;
  
  IF v_user_id IS NULL THEN
    RETURN jsonb_build_object('success', false, 'message', 'User not found');
  END IF;

  -- Get project name
  SELECT name INTO v_project_name FROM public.projects WHERE id = p_project_id;
  
  -- Check if user is already a member
  IF EXISTS (SELECT 1 FROM public.project_members WHERE project_id = p_project_id AND user_id = v_user_id) THEN
    RETURN jsonb_build_object('success', false, 'message', 'User is already a member');
  END IF;
  
  -- Add user to project (NO automatic role promotion - this was the security issue!)
  INSERT INTO public.project_members (project_id, user_id, role, invited_by)
  VALUES (p_project_id, v_user_id, 'collaborator', p_inviter_id);
  
  -- Create notification
  INSERT INTO public.notifications (user_id, title, message, type, data)
  VALUES (
    v_user_id,
    'Invitation au projet',
    'Vous avez été invité à rejoindre le projet "' || v_project_name || '"',
    'invitation',
    jsonb_build_object('project_id', p_project_id, 'project_name', v_project_name)
  );
  
  RETURN jsonb_build_object('success', true, 'message', 'Invitation sent successfully');
END;
$$;

-- Update handle_new_user to also create a user_roles entry
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Create profile
  INSERT INTO public.profiles (user_id, email, full_name)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', NEW.email)
  );
  
  -- Create user role entry (default to buyer)
  INSERT INTO public.user_roles (user_id, role)
  VALUES (NEW.id, 'buyer');
  
  RETURN NEW;
END;
$$;

-- Add trigger for updated_at on user_roles
CREATE TRIGGER update_user_roles_updated_at
BEFORE UPDATE ON public.user_roles
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();