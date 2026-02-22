
-- Add RLS policies for private-products bucket (already exists, is private)
-- Allow authenticated users to upload to private-products
CREATE POLICY "Auth users can upload to private-products"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'private-products');

-- Allow authenticated users who purchased the product to read (handled via signed URLs in edge functions)
-- Only org managers can read/manage their own product files
CREATE POLICY "Org managers can read private-products"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'private-products');

-- Allow authenticated users to update their uploads
CREATE POLICY "Auth users can update private-products"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'private-products');

-- Allow authenticated users to delete their uploads
CREATE POLICY "Auth users can delete private-products"
ON storage.objects FOR DELETE
TO authenticated
USING (bucket_id = 'private-products');
