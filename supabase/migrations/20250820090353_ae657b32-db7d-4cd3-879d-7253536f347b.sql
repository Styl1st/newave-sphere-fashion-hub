-- Fix function search path security issue
CREATE OR REPLACE FUNCTION public.get_user_role(user_uuid UUID)
RETURNS user_role 
SECURITY DEFINER 
STABLE
SET search_path = public
LANGUAGE plpgsql AS $$
BEGIN
  RETURN (
    SELECT role 
    FROM public.profiles 
    WHERE user_id = user_uuid
  );
END;
$$;