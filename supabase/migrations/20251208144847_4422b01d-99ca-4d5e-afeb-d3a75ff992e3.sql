-- Allow everyone to view likes for counting purposes
CREATE POLICY "Everyone can view likes for counting"
ON public.likes
FOR SELECT
USING (true);