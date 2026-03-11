
-- Make ticket-screenshots bucket public so images display correctly
UPDATE storage.buckets SET public = true WHERE id = 'ticket-screenshots';

-- Allow anyone to read ticket screenshots (public bucket)
DROP POLICY IF EXISTS "Users can view own ticket screenshots" ON storage.objects;
CREATE POLICY "Anyone can view ticket screenshots"
ON storage.objects FOR SELECT
TO public
USING (bucket_id = 'ticket-screenshots');
