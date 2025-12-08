-- Allow users to see profiles of people they have conversations with
CREATE POLICY "Users can view profiles of conversation participants"
ON public.profiles
FOR SELECT
USING (
  user_id IN (
    SELECT participant_1 FROM conversations WHERE participant_2 = auth.uid()
    UNION
    SELECT participant_2 FROM conversations WHERE participant_1 = auth.uid()
  )
);