
-- Restore org-uploads as public (logos, photos, media thumbnails are public content)
UPDATE storage.buckets SET public = true WHERE id = 'org-uploads';

-- Create dedicated private bucket for KYC documents
INSERT INTO storage.buckets (id, name, public)
VALUES ('kyc-documents', 'kyc-documents', false)
ON CONFLICT (id) DO NOTHING;

-- KYC upload policy: authenticated users only
CREATE POLICY "Auth users upload KYC docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'kyc-documents');

-- KYC read policy: uploader or superadmin
CREATE POLICY "KYC read by uploader or superadmin"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND (
    auth.uid()::text = (storage.foldername(name))[2]
    OR EXISTS (SELECT 1 FROM public.user_platform_roles WHERE user_id = auth.uid() AND role = 'superadmin')
  )
);
