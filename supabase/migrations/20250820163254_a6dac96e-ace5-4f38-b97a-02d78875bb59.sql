-- Create projects table for brand management
CREATE TABLE public.projects (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  logo_url TEXT,
  creator_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create project members table for collaboration
CREATE TABLE public.project_members (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  role TEXT NOT NULL DEFAULT 'collaborator', -- 'owner' or 'collaborator'
  invited_by UUID,
  joined_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(project_id, user_id)
);

-- Create notifications table
CREATE TABLE public.notifications (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  message TEXT NOT NULL,
  type TEXT NOT NULL, -- 'invitation', 'announcement', 'general'
  data JSONB DEFAULT '{}',
  read BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Add project_id to products table
ALTER TABLE public.products ADD COLUMN project_id UUID REFERENCES public.projects(id) ON DELETE CASCADE;

-- Create new role type for collaborators
CREATE TYPE public.collaboration_role AS ENUM ('owner', 'collaborator');

-- Enable RLS
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- RLS Policies for projects
CREATE POLICY "Projects are viewable by everyone" ON public.projects FOR SELECT USING (true);
CREATE POLICY "Users can create projects" ON public.projects FOR INSERT WITH CHECK (auth.uid() = creator_id);
CREATE POLICY "Project creators and members can update projects" ON public.projects FOR UPDATE 
USING (
  auth.uid() = creator_id OR 
  EXISTS (SELECT 1 FROM public.project_members WHERE project_id = id AND user_id = auth.uid())
);
CREATE POLICY "Project creators can delete projects" ON public.projects FOR DELETE USING (auth.uid() = creator_id);

-- RLS Policies for project_members
CREATE POLICY "Project members are viewable by project members" ON public.project_members FOR SELECT 
USING (
  EXISTS (SELECT 1 FROM public.project_members pm WHERE pm.project_id = project_id AND pm.user_id = auth.uid()) OR
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.creator_id = auth.uid())
);
CREATE POLICY "Project owners can manage members" ON public.project_members FOR ALL 
USING (
  EXISTS (SELECT 1 FROM public.projects p WHERE p.id = project_id AND p.creator_id = auth.uid())
);

-- RLS Policies for notifications
CREATE POLICY "Users can view their own notifications" ON public.notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update their own notifications" ON public.notifications FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can create notifications" ON public.notifications FOR INSERT 
WITH CHECK (get_user_role(auth.uid()) = 'admin'::user_role);

-- Update products policy to include project members
DROP POLICY IF EXISTS "Users can update their own products" ON public.products;
CREATE POLICY "Product creators and project members can update products" ON public.products FOR UPDATE 
USING (
  auth.uid() = user_id OR 
  (project_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.project_members WHERE project_id = products.project_id AND user_id = auth.uid()
  ))
);

DROP POLICY IF EXISTS "Users can delete their own products" ON public.products;
CREATE POLICY "Product creators and project members can delete products" ON public.products FOR DELETE 
USING (
  auth.uid() = user_id OR 
  (project_id IS NOT NULL AND EXISTS (
    SELECT 1 FROM public.project_members WHERE project_id = products.project_id AND user_id = auth.uid()
  ))
);

-- Triggers for timestamps
CREATE TRIGGER update_projects_updated_at
BEFORE UPDATE ON public.projects
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Function to handle project invitations
CREATE OR REPLACE FUNCTION public.invite_user_to_project(
  p_project_id UUID,
  p_user_email TEXT,
  p_inviter_id UUID
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_user_id UUID;
  v_user_role user_role;
  v_project_name TEXT;
BEGIN
  -- Get user by email
  SELECT profiles.user_id, profiles.role INTO v_user_id, v_user_role
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
  
  -- Add user to project
  INSERT INTO public.project_members (project_id, user_id, role, invited_by)
  VALUES (p_project_id, v_user_id, 'collaborator', p_inviter_id);
  
  -- Update user role to seller if they're a buyer
  IF v_user_role = 'buyer' THEN
    UPDATE public.profiles SET role = 'seller' WHERE user_id = v_user_id;
  END IF;
  
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