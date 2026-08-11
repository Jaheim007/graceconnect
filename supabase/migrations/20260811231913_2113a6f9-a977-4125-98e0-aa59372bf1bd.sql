-- 1. KYC documents: writes scoped to the uploader's own folder (kyc/<uid>/...)
DROP POLICY IF EXISTS "Auth users upload KYC docs" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can update KYC docs" ON storage.objects;

CREATE POLICY "KYC upload own folder only"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'kyc-documents'
  AND (auth.uid())::text = (storage.foldername(name))[2]
);

CREATE POLICY "KYC update own folder only"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND (auth.uid())::text = (storage.foldername(name))[2]
)
WITH CHECK (
  bucket_id = 'kyc-documents'
  AND (auth.uid())::text = (storage.foldername(name))[2]
);

-- 2. private-products: only the uploader (or superadmin) can read/replace/remove
DROP POLICY IF EXISTS "Auth users can update private-products" ON storage.objects;
DROP POLICY IF EXISTS "Auth users can delete private-products" ON storage.objects;

CREATE POLICY "Private products read by owner or superadmin"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'private-products'
  AND (
    owner = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_platform_roles
      WHERE user_id = auth.uid() AND role = 'superadmin'::platform_role
    )
  )
);

CREATE POLICY "Private products update by owner or superadmin"
ON storage.objects FOR UPDATE TO authenticated
USING (
  bucket_id = 'private-products'
  AND (
    owner = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_platform_roles
      WHERE user_id = auth.uid() AND role = 'superadmin'::platform_role
    )
  )
)
WITH CHECK (bucket_id = 'private-products');

CREATE POLICY "Private products delete by owner or superadmin"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'private-products'
  AND (
    owner = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_platform_roles
      WHERE user_id = auth.uid() AND role = 'superadmin'::platform_role
    )
  )
);

-- 3. ticket screenshots: owner-or-superadmin reads via signed URLs
DROP POLICY IF EXISTS "Anyone can view ticket screenshots" ON storage.objects;

CREATE POLICY "Ticket screenshots read by owner or superadmin"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'ticket-screenshots'
  AND (
    (auth.uid())::text = (storage.foldername(name))[1]
    OR owner = auth.uid()
    OR EXISTS (
      SELECT 1 FROM public.user_platform_roles
      WHERE user_id = auth.uid() AND role = 'superadmin'::platform_role
    )
  )
);

CREATE POLICY "Ticket screenshots upload own folder"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (
  bucket_id = 'ticket-screenshots'
  AND (auth.uid())::text = (storage.foldername(name))[1]
);