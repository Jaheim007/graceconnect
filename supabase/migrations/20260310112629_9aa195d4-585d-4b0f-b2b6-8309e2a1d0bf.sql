-- Add verification_type column to kyc_submissions
ALTER TABLE public.kyc_submissions 
ADD COLUMN IF NOT EXISTS verification_type text DEFAULT 'organization' 
CHECK (verification_type IN ('individual', 'organization'));

-- Update the submit_org_kyc function to accept verification_type
CREATE OR REPLACE FUNCTION public.submit_org_kyc(
  _org_id uuid, 
  _kyc_level integer, 
  _id_document_url text DEFAULT NULL, 
  _id_document_type text DEFAULT NULL, 
  _selfie_url text DEFAULT NULL, 
  _bank_account_name text DEFAULT NULL, 
  _bank_account_number text DEFAULT NULL, 
  _bank_name text DEFAULT NULL, 
  _org_document_url text DEFAULT NULL, 
  _org_document_type text DEFAULT NULL,
  _id_document_back_url text DEFAULT NULL,
  _selfie_with_doc_url text DEFAULT NULL,
  _payout_method text DEFAULT NULL,
  _payout_phone text DEFAULT NULL,
  _payout_provider text DEFAULT NULL,
  _verification_type text DEFAULT 'organization'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _caller uuid;
  _org record;
BEGIN
  _caller := auth.uid();
  IF _caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  IF NOT public.can_admin_org(_caller, _org_id) THEN
    RAISE EXCEPTION 'Not authorized to manage this organization';
  END IF;

  SELECT * INTO _org FROM public.organizations WHERE id = _org_id;
  IF _org IS NULL THEN RAISE EXCEPTION 'Organization not found'; END IF;

  IF _org.kyc_status = 'level2' THEN
    RAISE EXCEPTION 'KYC already fully approved';
  END IF;
  IF _org.kyc_status = 'level1' AND _kyc_level = 1 THEN
    RAISE EXCEPTION 'Level 1 KYC already approved';
  END IF;

  IF _kyc_level = 1 THEN
    IF _id_document_url IS NULL OR _id_document_url = '' THEN
      RAISE EXCEPTION 'Identity document is required for Level 1';
    END IF;
    IF _id_document_type IS NULL OR _id_document_type = '' THEN
      RAISE EXCEPTION 'Document type is required';
    END IF;
  END IF;

  IF _kyc_level = 2 THEN
    IF _org_document_url IS NULL OR _org_document_url = '' THEN
      RAISE EXCEPTION 'Organization document is required for Level 2';
    END IF;
    IF _org_document_type IS NULL OR _org_document_type = '' THEN
      RAISE EXCEPTION 'Organization document type is required';
    END IF;
  END IF;

  INSERT INTO public.kyc_submissions (
    organization_id, submitted_by, kyc_level,
    id_document_url, id_document_type,
    bank_account_name, bank_account_number, bank_name,
    org_document_url, org_document_type,
    status, submitted_at, reviewed_at, reviewed_by, rejection_reason,
    verification_type
  )
  VALUES (
    _org_id, _caller, _kyc_level,
    _id_document_url, _id_document_type,
    _bank_account_name, _bank_account_number, _bank_name,
    _org_document_url, _org_document_type,
    'pending', now(), NULL, NULL, NULL,
    COALESCE(_verification_type, 'organization')
  )
  ON CONFLICT (organization_id) DO UPDATE SET
    submitted_by = _caller,
    kyc_level = _kyc_level,
    id_document_url = COALESCE(_id_document_url, kyc_submissions.id_document_url),
    id_document_type = COALESCE(_id_document_type, kyc_submissions.id_document_type),
    bank_account_name = COALESCE(_bank_account_name, kyc_submissions.bank_account_name),
    bank_account_number = COALESCE(_bank_account_number, kyc_submissions.bank_account_number),
    bank_name = COALESCE(_bank_name, kyc_submissions.bank_name),
    org_document_url = COALESCE(_org_document_url, kyc_submissions.org_document_url),
    org_document_type = COALESCE(_org_document_type, kyc_submissions.org_document_type),
    status = 'pending',
    submitted_at = now(),
    reviewed_at = NULL,
    reviewed_by = NULL,
    rejection_reason = NULL,
    verification_type = COALESCE(_verification_type, kyc_submissions.verification_type);

  UPDATE public.organizations SET kyc_status = 'pending' WHERE id = _org_id;

  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (_caller, 'org.kyc_submitted', 'organization', _org_id,
    jsonb_build_object('level', _kyc_level, 'category', _org.category, 'verification_type', _verification_type));

  RETURN jsonb_build_object('ok', true, 'level', _kyc_level, 'verification_type', _verification_type);
END;
$$;