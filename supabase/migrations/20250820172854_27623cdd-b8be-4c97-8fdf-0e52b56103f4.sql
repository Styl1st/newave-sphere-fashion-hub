-- Fix the trigger function - correct column name for purchases
CREATE OR REPLACE FUNCTION public.cleanup_product_relations()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Delete all likes for this product
  DELETE FROM public.likes WHERE product_id = OLD.id;
  
  -- Delete all purchases for this product (correct column name)
  DELETE FROM public.purchases WHERE product_id = OLD.id;
  
  RETURN OLD;
END;
$$;