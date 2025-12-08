-- Allow admins to view all project members
CREATE POLICY "Admins can view all project members" 
ON public.project_members 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin'::user_role);