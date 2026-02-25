
-- RPC: submit_org_kyc
-- Handles Level 1 (identity) and Level 2 (org documents) submissions
-- Adapts to org category for validation
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
  _org_document_type text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _caller uuid;
  _org record;
  _existing record;
BEGIN
  _caller := auth.uid();
  IF _caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- Verify caller can admin this org
  IF NOT public.can_admin_org(_caller, _org_id) THEN
    RAISE EXCEPTION 'Not authorized to manage this organization';
  END IF;

  -- Get org info
  SELECT * INTO _org FROM public.organizations WHERE id = _org_id;
  IF _org IS NULL THEN RAISE EXCEPTION 'Organization not found'; END IF;

  -- Prevent re-submission if already approved at this level or higher
  IF _org.kyc_status = 'level2' THEN
    RAISE EXCEPTION 'KYC already fully approved';
  END IF;
  IF _org.kyc_status = 'level1' AND _kyc_level = 1 THEN
    RAISE EXCEPTION 'Level 1 KYC already approved';
  END IF;

  -- Validate Level 1 requirements
  IF _kyc_level = 1 THEN
    IF _id_document_url IS NULL OR _id_document_url = '' THEN
      RAISE EXCEPTION 'Identity document is required for Level 1';
    END IF;
    IF _id_document_type IS NULL OR _id_document_type = '' THEN
      RAISE EXCEPTION 'Document type is required';
    END IF;
  END IF;

  -- Validate Level 2 requirements
  IF _kyc_level = 2 THEN
    IF _org_document_url IS NULL OR _org_document_url = '' THEN
      RAISE EXCEPTION 'Organization document is required for Level 2';
    END IF;
    IF _org_document_type IS NULL OR _org_document_type = '' THEN
      RAISE EXCEPTION 'Organization document type is required';
    END IF;
  END IF;

  -- Upsert the submission
  INSERT INTO public.kyc_submissions (
    organization_id, submitted_by, kyc_level,
    id_document_url, id_document_type,
    bank_account_name, bank_account_number, bank_name,
    org_document_url, org_document_type,
    status, submitted_at, reviewed_at, reviewed_by, rejection_reason
  )
  VALUES (
    _org_id, _caller, _kyc_level,
    _id_document_url, _id_document_type,
    _bank_account_name, _bank_account_number, _bank_name,
    _org_document_url, _org_document_type,
    'pending', now(), NULL, NULL, NULL
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
    rejection_reason = NULL;

  -- Update org kyc_status to pending
  UPDATE public.organizations SET kyc_status = 'pending' WHERE id = _org_id;

  -- Audit log
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (_caller, 'org.kyc_submitted', 'organization', _org_id::text,
    jsonb_build_object('level', _kyc_level, 'category', _org.category));

  RETURN jsonb_build_object('ok', true, 'level', _kyc_level);
END;
$$;

-- Add unique constraint on organization_id for upsert to work
-- Check if constraint exists first
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'kyc_submissions_organization_id_key'
  ) THEN
    ALTER TABLE public.kyc_submissions ADD CONSTRAINT kyc_submissions_organization_id_key UNIQUE (organization_id);
  END IF;
END $$;

-- RPC: review_org_kyc (for superadmin)
CREATE OR REPLACE FUNCTION public.review_org_kyc(
  _org_id uuid,
  _action text,
  _reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _caller uuid;
  _submission record;
  _org record;
  _new_status text;
BEGIN
  _caller := auth.uid();
  IF NOT public.is_superadmin(_caller) THEN
    RAISE EXCEPTION 'Superadmin only';
  END IF;

  SELECT * INTO _submission FROM public.kyc_submissions WHERE organization_id = _org_id;
  IF _submission IS NULL THEN RAISE EXCEPTION 'No KYC submission found'; END IF;

  SELECT * INTO _org FROM public.organizations WHERE id = _org_id;

  IF _action = 'approve' THEN
    -- Determine the new status based on submission level
    IF _submission.kyc_level = 1 THEN
      _new_status := 'level1';
    ELSE
      _new_status := 'level2';
    END IF;

    UPDATE public.kyc_submissions SET
      status = 'approved',
      reviewed_at = now(),
      reviewed_by = _caller,
      rejection_reason = NULL
    WHERE organization_id = _org_id;

    UPDATE public.organizations SET kyc_status = _new_status::kyc_status WHERE id = _org_id;

  ELSIF _action = 'reject' THEN
    UPDATE public.kyc_submissions SET
      status = 'rejected',
      reviewed_at = now(),
      reviewed_by = _caller,
      rejection_reason = _reason
    WHERE organization_id = _org_id;

    UPDATE public.organizations SET kyc_status = 'rejected' WHERE id = _org_id;
  ELSE
    RAISE EXCEPTION 'Invalid action: %', _action;
  END IF;

  -- Audit
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (_caller, 'org.kyc_' || _action, 'organization', _org_id::text,
    jsonb_build_object('level', _submission.kyc_level, 'org_name', _org.name, 'reason', _reason));

  RETURN jsonb_build_object('ok', true, 'action', _action, 'new_status', _new_status);
END;
$$;
