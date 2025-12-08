-- Allow admins to update any product
CREATE POLICY "Admins can update any product" 
ON public.products 
FOR UPDATE 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Allow admins to delete any product
CREATE POLICY "Admins can delete any product" 
ON public.products 
FOR DELETE 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Allow admins to update any project
CREATE POLICY "Admins can update any project" 
ON public.projects 
FOR UPDATE 
USING (get_user_role(auth.uid()) = 'admin'::user_role);

-- Allow admins to delete any project
CREATE POLICY "Admins can delete any project" 
ON public.projects 
FOR DELETE 
USING (get_user_role(auth.uid()) = 'admin'::user_role);