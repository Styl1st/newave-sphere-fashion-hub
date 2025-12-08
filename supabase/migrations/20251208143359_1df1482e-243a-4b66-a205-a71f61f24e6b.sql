-- Allow admins to delete profiles
CREATE POLICY "Admins can delete any profile" 
ON public.profiles 
FOR DELETE 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Allow admins to delete conversations
CREATE POLICY "Admins can delete any conversation" 
ON public.conversations 
FOR DELETE 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Allow admins to delete messages
CREATE POLICY "Admins can delete any message" 
ON public.messages 
FOR DELETE 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Allow admins to delete notifications
CREATE POLICY "Admins can delete any notification" 
ON public.notifications 
FOR DELETE 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Allow admins to delete purchases
CREATE POLICY "Admins can delete any purchase" 
ON public.purchases 
FOR DELETE 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Allow admins to delete likes
CREATE POLICY "Admins can delete any like" 
ON public.likes 
FOR DELETE 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Allow admins to delete comments
CREATE POLICY "Admins can delete any comment" 
ON public.comments 
FOR DELETE 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Allow admins to delete project members
CREATE POLICY "Admins can delete any project member" 
ON public.project_members 
FOR DELETE 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Function to delete all user data (for admins)
CREATE OR REPLACE FUNCTION public.delete_user_and_data(target_user_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Check if caller is admin
  IF get_user_role(auth.uid()) != 'admin'::user_role THEN
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

  -- Finally delete the profile
  DELETE FROM public.profiles WHERE user_id = target_user_id;

  RETURN true;
END;
$$;