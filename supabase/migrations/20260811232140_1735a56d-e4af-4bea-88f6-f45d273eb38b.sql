DROP POLICY IF EXISTS "Auth users can upload to private-products" ON storage.objects;
DROP POLICY IF EXISTS "private_products_upload" ON storage.objects;

CREATE POLICY "Private products upload own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'private-products'
  AND (auth.uid())::text = (storage.foldername(name))[2]
);