-- Allow users to delete their own conversations
CREATE POLICY "Users can delete their own conversations"
ON public.conversations
FOR DELETE
USING (auth.uid() = participant_1 OR auth.uid() = participant_2);

-- Also allow deleting messages when conversation is deleted (cascade)
CREATE POLICY "Users can delete messages from their conversations"
ON public.messages
FOR DELETE
USING (
  EXISTS (
    SELECT 1 FROM conversations c
    WHERE c.id = messages.conversation_id 
    AND (c.participant_1 = auth.uid() OR c.participant_2 = auth.uid())
  )
);