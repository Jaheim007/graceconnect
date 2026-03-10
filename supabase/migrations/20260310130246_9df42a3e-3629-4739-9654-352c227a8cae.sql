-- Add missing UPDATE policy for kyc-documents bucket
CREATE POLICY "Auth users can update KYC docs"
ON storage.objects FOR UPDATE
TO authenticated
USING (bucket_id = 'kyc-documents');

-- Remove duplicate INSERT policy (keep only one)
DROP POLICY IF EXISTS "Authenticated users can upload KYC docs" ON storage.objects;