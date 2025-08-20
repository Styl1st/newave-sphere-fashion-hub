-- Fix storage policies for product images
CREATE POLICY "Users can upload product images" 
ON storage.objects 
FOR INSERT 
WITH CHECK (
  bucket_id = 'product-images' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can view product images" 
ON storage.objects 
FOR SELECT 
USING (bucket_id = 'product-images');

CREATE POLICY "Users can update their product images" 
ON storage.objects 
FOR UPDATE 
USING (
  bucket_id = 'product-images' AND 
  auth.uid() IS NOT NULL
);

CREATE POLICY "Users can delete their product images" 
ON storage.objects 
FOR DELETE 
USING (
  bucket_id = 'product-images' AND 
  auth.uid() IS NOT NULL
);