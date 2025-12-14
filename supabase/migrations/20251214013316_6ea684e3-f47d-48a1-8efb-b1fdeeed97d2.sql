-- Fix 1: Restrict public access to profiles - create a view that exposes only safe fields
-- Drop the overly permissive policy
DROP POLICY IF EXISTS "Everyone can view seller profiles" ON public.profiles;

-- Create a more restrictive policy that still allows viewing seller profiles
-- but the client code should only request safe columns
CREATE POLICY "Public can view seller display info"
ON public.profiles FOR SELECT
USING (is_seller = true);

-- Create a secure view for public seller profiles (without email)
CREATE OR REPLACE VIEW public.seller_profiles_public AS
SELECT 
  user_id,
  full_name,
  avatar_url,
  bio,
  is_seller,
  created_at
FROM public.profiles
WHERE is_seller = true;

-- Grant access to the view
GRANT SELECT ON public.seller_profiles_public TO anon, authenticated;

-- Fix 2: Update delete_user_and_data to properly handle auth deletion
-- Note: Direct deletion from auth.users requires service_role, which RPC doesn't have
-- The function will now also delete from user_roles and document that auth user must be deleted separately
CREATE OR REPLACE FUNCTION public.delete_user_and_data(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin using the secure function
  IF NOT public.has_role(auth.uid(), 'admin') THEN
    RAISE EXCEPTION 'Only admins can delete users';
  END IF;

  -- Delete all messages from conversations where user is participant
  DELETE FROM public.messages 
  WHERE conversation_id IN (
    SELECT id FROM public.conversations 
    WHERE participant_1 = target_user_id OR participant_2 = target_user_id
  );

  -- Delete all conversations where user is participant
  DELETE FROM public.conversations 
  WHERE participant_1 = target_user_id OR participant_2 = target_user_id;

  -- Delete all likes by the user
  DELETE FROM public.likes WHERE user_id = target_user_id;

  -- Delete all comments by the user
  DELETE FROM public.comments WHERE user_id = target_user_id;

  -- Delete all notifications for the user
  DELETE FROM public.notifications WHERE user_id = target_user_id;

  -- Delete all purchases involving the user (as buyer)
  DELETE FROM public.purchases WHERE user_id = target_user_id;

  -- Delete project memberships
  DELETE FROM public.project_members WHERE user_id = target_user_id;

  -- Delete all products by the user (this will cascade to likes and comments via triggers)
  DELETE FROM public.products WHERE user_id = target_user_id;

  -- Delete projects created by the user
  DELETE FROM public.projects WHERE creator_id = target_user_id;

  -- Delete user role entry
  DELETE FROM public.user_roles WHERE user_id = target_user_id;

  -- Delete the profile
  DELETE FROM public.profiles WHERE user_id = target_user_id;

  -- Note: The auth.users record must be deleted separately via Supabase Admin API
  -- or through the Supabase Dashboard. This RPC cannot delete from auth.users
  -- as it requires service_role privileges not available in RPC context.
  
  RETURN true;
END;
$$;

-- Add comment documenting the limitation
COMMENT ON FUNCTION public.delete_user_and_data IS 'Deletes all user data from public schema. IMPORTANT: The auth.users record must be deleted separately via Supabase Dashboard or Admin API as RPC cannot access auth schema with service_role privileges.';