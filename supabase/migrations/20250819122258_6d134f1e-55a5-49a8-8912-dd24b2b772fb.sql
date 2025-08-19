-- Add bio field and make profiles accessible to everyone for seller profiles
ALTER TABLE public.profiles 
ADD COLUMN bio TEXT,
ADD COLUMN is_seller BOOLEAN DEFAULT FALSE;

-- Update RLS policies to allow public access to seller profiles
DROP POLICY IF EXISTS "Users can view their own profile" ON public.profiles;

CREATE POLICY "Everyone can view seller profiles"
ON public.profiles 
FOR SELECT 
USING (is_seller = true);

CREATE POLICY "Users can view their own profile"
ON public.profiles 
FOR SELECT 
USING (auth.uid() = user_id);

-- Allow sellers to upload profile pictures
INSERT INTO storage.buckets (id, name, public) VALUES ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- Create policies for profile image uploads
CREATE POLICY "Users can upload their own profile image" 
ON storage.objects 
FOR INSERT 
WITH CHECK (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Profile images are publicly accessible" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'profile-images');

CREATE POLICY "Users can update their own profile image" 
ON storage.objects 
FOR UPDATE 
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own profile image" 
ON storage.objects 
FOR DELETE 
USING (bucket_id = 'profile-images' AND auth.uid()::text = (storage.foldername(name))[1]);