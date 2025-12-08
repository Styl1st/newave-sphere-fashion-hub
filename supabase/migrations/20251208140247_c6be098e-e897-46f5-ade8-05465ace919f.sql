-- Allow users to create purchases
CREATE POLICY "Users can create purchases" 
ON public.purchases 
FOR INSERT 
WITH CHECK (auth.uid() = user_id AND auth.uid() != seller_id);