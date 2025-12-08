-- Add product_id to messages table to allow mentioning products in messages
ALTER TABLE public.messages 
ADD COLUMN product_id uuid REFERENCES public.products(id) ON DELETE SET NULL;

-- Create index for better performance
CREATE INDEX idx_messages_product_id ON public.messages(product_id);