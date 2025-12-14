-- Drop the security definer view and recreate without security definer
DROP VIEW IF EXISTS public.seller_profiles_public;

-- Create view without SECURITY DEFINER (normal view respects caller's RLS)
CREATE VIEW public.seller_profiles_public AS
SELECT 
  user_id,
  full_name,
  avatar_url,
  bio,
  is_seller,
  created_at
FROM public.profiles
WHERE is_seller = true;

-- Grant access to the view
GRANT SELECT ON public.seller_profiles_public TO anon, authenticated;