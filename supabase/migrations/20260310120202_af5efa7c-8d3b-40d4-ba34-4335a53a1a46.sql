DROP FUNCTION IF EXISTS public.submit_org_kyc(uuid,integer,text,text,text,text,text,text,text,text,text,text,text,text,text,text);
DROP FUNCTION IF EXISTS public.submit_org_kyc(uuid,integer,text,text,text,text,text,text,text);

CREATE OR REPLACE FUNCTION public.submit_org_kyc(
  _org_id uuid,
  _kyc_level integer,
  _id_document_url text DEFAULT NULL,
  _id_document_type text DEFAULT NULL,
  _id_document_back_url text DEFAULT NULL,
  _selfie_url text DEFAULT NULL,
  _selfie_with_doc_url text DEFAULT NULL,
  _org_document_url text DEFAULT NULL,
  _org_document_type text DEFAULT NULL,
  _verification_type text DEFAULT 'individual',
  _bank_account_name text DEFAULT NULL,
  _bank_account_number text DEFAULT NULL,
  _bank_name text DEFAULT NULL,
  _payout_method text DEFAULT NULL,
  _payout_phone text DEFAULT NULL,
  _payout_provider text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _caller uuid;
  _org record;
  _sub_id uuid;
BEGIN
  _caller := auth.uid();
  IF _caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.can_admin_org(_caller, _org_id) THEN
    RAISE EXCEPTION 'Not authorized to manage this organization';
  END IF;
  SELECT * INTO _org FROM public.organizations WHERE id = _org_id;
  IF _org IS NULL THEN RAISE EXCEPTION 'Organization not found'; END IF;
  IF _org.kyc_status = 'level2' THEN RAISE EXCEPTION 'KYC already fully approved'; END IF;
  IF _kyc_level = 1 AND (_id_document_url IS NULL OR _id_document_url = '') THEN
    RAISE EXCEPTION 'Identity document is required for Level 1';
  END IF;

  INSERT INTO public.kyc_submissions (
    organization_id, submitted_by, kyc_level,
    id_document_url, id_document_type, id_document_back_url,
    selfie_url, selfie_with_doc_url,
    bank_account_name, bank_account_number, bank_name,
    org_document_url, org_document_type, verification_type,
    payout_method, payout_phone, payout_provider,
    status, submitted_at, reviewed_at, reviewed_by, rejection_reason
  ) VALUES (
    _org_id, _caller, _kyc_level,
    _id_document_url, _id_document_type, _id_document_back_url,
    _selfie_url, _selfie_with_doc_url,
    _bank_account_name, _bank_account_number, _bank_name,
    _org_document_url, _org_document_type, _verification_type,
    _payout_method, _payout_phone, _payout_provider,
    'pending', now(), NULL, NULL, NULL
  )
  ON CONFLICT (organization_id) DO UPDATE SET
    submitted_by = _caller, kyc_level = _kyc_level,
    id_document_url = COALESCE(_id_document_url, kyc_submissions.id_document_url),
    id_document_type = COALESCE(_id_document_type, kyc_submissions.id_document_type),
    id_document_back_url = COALESCE(_id_document_back_url, kyc_submissions.id_document_back_url),
    selfie_url = COALESCE(_selfie_url, kyc_submissions.selfie_url),
    selfie_with_doc_url = COALESCE(_selfie_with_doc_url, kyc_submissions.selfie_with_doc_url),
    bank_account_name = COALESCE(_bank_account_name, kyc_submissions.bank_account_name),
    bank_account_number = COALESCE(_bank_account_number, kyc_submissions.bank_account_number),
    bank_name = COALESCE(_bank_name, kyc_submissions.bank_name),
    org_document_url = COALESCE(_org_document_url, kyc_submissions.org_document_url),
    org_document_type = COALESCE(_org_document_type, kyc_submissions.org_document_type),
    verification_type = _verification_type,
    payout_method = COALESCE(_payout_method, kyc_submissions.payout_method),
    payout_phone = COALESCE(_payout_phone, kyc_submissions.payout_phone),
    payout_provider = COALESCE(_payout_provider, kyc_submissions.payout_provider),
    status = 'pending', submitted_at = now(),
    reviewed_at = NULL, reviewed_by = NULL, rejection_reason = NULL,
    ai_confidence_score = NULL, ai_ocr_data = '{}'::jsonb,
    ai_quality_assessment = '{}'::jsonb, ai_face_match = '{}'::jsonb,
    ai_fraud_detection = '{}'::jsonb, ai_summary = NULL,
    ai_recommendations = NULL, ai_analyzed_at = NULL
  RETURNING id INTO _sub_id;

  UPDATE public.organizations SET kyc_status = 'pending' WHERE id = _org_id;
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (_caller, 'org.kyc_submitted', 'organization', _org_id,
    jsonb_build_object('level', _kyc_level, 'verification_type', _verification_type));
  RETURN jsonb_build_object('ok', true, 'level', _kyc_level, 'submission_id', _sub_id);
END;
$$;