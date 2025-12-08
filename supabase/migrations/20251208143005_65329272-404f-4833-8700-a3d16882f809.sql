-- Allow admins to view all purchases
CREATE POLICY "Admins can view all purchases" 
ON public.purchases 
FOR SELECT 
USING (get_user_role(auth.uid()) = 'admin'::user_role);