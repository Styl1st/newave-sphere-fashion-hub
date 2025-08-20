-- Check existing policies and recreate them properly
DROP POLICY IF EXISTS "Users can upload product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can view product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can update their product images" ON storage.objects;
DROP POLICY IF EXISTS "Users can delete their product images" ON storage.objects;

-- Create proper policies for product-images bucket
CREATE POLICY "Allow authenticated uploads to product-images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'product-images' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Allow public read access to product-images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY "Allow authenticated updates to product-images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'product-images' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Allow authenticated deletes to product-images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'product-images' AND 
  auth.uid() IS NOT NULL
);