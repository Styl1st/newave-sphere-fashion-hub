-- Add foreign key constraint from purchases to products
ALTER TABLE public.purchases 
ADD CONSTRAINT purchases_product_id_fkey 
FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;

-- Create function to notify seller on new purchase
CREATE OR REPLACE FUNCTION public.notify_seller_on_purchase()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_product_name TEXT;
  v_buyer_name TEXT;
BEGIN
  -- Get product name
  SELECT name INTO v_product_name FROM public.products WHERE id = NEW.product_id;
  
  -- Get buyer name
  SELECT COALESCE(full_name, email, 'Un acheteur') INTO v_buyer_name 
  FROM public.profiles WHERE user_id = NEW.user_id;
  
  -- Create notification for seller
  INSERT INTO public.notifications (user_id, title, message, type, data)
  VALUES (
    NEW.seller_id,
    'Nouvelle vente !',
    v_buyer_name || ' a acheté "' || COALESCE(v_product_name, 'un produit') || '" pour ' || NEW.price_paid || ' €',
    'sale',
    jsonb_build_object(
      'product_id', NEW.product_id,
      'buyer_id', NEW.user_id,
      'amount', NEW.price_paid,
      'quantity', NEW.quantity
    )
  );
  
  RETURN NEW;
END;
$$;

-- Create trigger
CREATE TRIGGER on_purchase_created
  AFTER INSERT ON public.purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_seller_on_purchase();