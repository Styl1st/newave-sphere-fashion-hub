-- Create function to clean up likes and purchases when a product is deleted
CREATE OR REPLACE FUNCTION public.cleanup_product_relations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete all likes for this product
  DELETE FROM public.likes WHERE product_id = OLD.id;
  
  -- Delete all purchases for this product
  DELETE FROM public.purchases WHERE product_id = OLD.product_id;
  
  RETURN OLD;
END;
$$;

-- Create trigger to automatically cleanup when a product is deleted
CREATE TRIGGER cleanup_product_relations_trigger
  BEFORE DELETE ON public.products
  FOR EACH ROW
  EXECUTE FUNCTION public.cleanup_product_relations();