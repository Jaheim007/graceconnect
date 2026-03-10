
-- Create private bucket for KYC documents
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES ('kyc-documents', 'kyc-documents', false, 10485760, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf'])
ON CONFLICT (id) DO NOTHING;

-- RLS: Only authenticated users can upload to their own org/partner folder
CREATE POLICY "Authenticated users can upload KYC docs"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'kyc-documents');

-- RLS: Only superadmins can read KYC docs (via signed URLs from edge function)
CREATE POLICY "Superadmins can read KYC docs"
ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND public.is_superadmin(auth.uid())
);

-- RLS: Only superadmins can delete KYC docs (for retention cleanup)
CREATE POLICY "Superadmins can delete KYC docs"
ON storage.objects FOR DELETE TO authenticated
USING (
  bucket_id = 'kyc-documents'
  AND public.is_superadmin(auth.uid())
);

-- Add retention tracking to kyc_submissions
ALTER TABLE public.kyc_submissions 
  ADD COLUMN IF NOT EXISTS document_expires_at timestamptz,
  ADD COLUMN IF NOT EXISTS documents_purged_at timestamptz;

-- Auto-set expiration to 5 years from submission
CREATE OR REPLACE FUNCTION public.set_kyc_document_expiry()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  IF NEW.submitted_at IS NOT NULL AND NEW.document_expires_at IS NULL THEN
    NEW.document_expires_at := NEW.submitted_at + interval '5 years';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_set_kyc_doc_expiry ON public.kyc_submissions;
CREATE TRIGGER trg_set_kyc_doc_expiry
  BEFORE INSERT OR UPDATE ON public.kyc_submissions
  FOR EACH ROW EXECUTE FUNCTION public.set_kyc_document_expiry();

-- Add audit log function for KYC document access
CREATE OR REPLACE FUNCTION public.log_kyc_document_access(_org_id uuid, _document_type text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (
    auth.uid(),
    'kyc.document_accessed',
    'organization',
    _org_id,
    jsonb_build_object('document_type', _document_type, 'accessed_at', now())
  );
END;
$$;
