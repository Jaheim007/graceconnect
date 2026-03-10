
-- Add selfie_with_doc_url to kyc_submissions
ALTER TABLE public.kyc_submissions 
  ADD COLUMN IF NOT EXISTS selfie_url text,
  ADD COLUMN IF NOT EXISTS selfie_with_doc_url text,
  ADD COLUMN IF NOT EXISTS id_document_back_url text,
  ADD COLUMN IF NOT EXISTS payout_method text,
  ADD COLUMN IF NOT EXISTS payout_phone text,
  ADD COLUMN IF NOT EXISTS payout_provider text;

-- Add selfie_with_doc_url to partners
ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS selfie_with_doc_url text,
  ADD COLUMN IF NOT EXISTS id_document_back_url text;

-- Create manual_payouts table for admin-managed payouts
CREATE TABLE IF NOT EXISTS public.manual_payouts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  
  -- Who gets paid
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  partner_id uuid REFERENCES public.partners(id) ON DELETE SET NULL,
  
  -- Payout details
  payout_type text NOT NULL DEFAULT 'organization', -- 'organization', 'partner', 'ambassador'
  amount numeric NOT NULL,
  currency text NOT NULL DEFAULT 'XOF',
  
  -- Recipient info snapshot
  recipient_name text NOT NULL,
  recipient_method text NOT NULL, -- 'mobile_money', 'bank_transfer'
  recipient_account text NOT NULL, -- phone or account number
  recipient_provider text, -- operator or bank name
  
  -- Admin processing
  status text NOT NULL DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  processed_by uuid REFERENCES auth.users(id),
  processed_at timestamptz,
  proof_url text, -- screenshot/receipt of transfer
  admin_notes text,
  
  -- Reference to source
  source_request_id uuid, -- links to payout_requests if applicable
  metadata jsonb DEFAULT '{}'
);

-- RLS
ALTER TABLE public.manual_payouts ENABLE ROW LEVEL SECURITY;

-- Superadmins can do everything
CREATE POLICY "Superadmins manage manual_payouts" ON public.manual_payouts
  FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- Users can view their own payouts
CREATE POLICY "Users view own manual_payouts" ON public.manual_payouts
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Update submit_org_kyc to include new fields
CREATE OR REPLACE FUNCTION public.submit_org_kyc(
  _org_id uuid,
  _kyc_level integer,
  _id_document_url text DEFAULT NULL,
  _id_document_type text DEFAULT NULL,
  _id_document_back_url text DEFAULT NULL,
  _selfie_url text DEFAULT NULL,
  _selfie_with_doc_url text DEFAULT NULL,
  _bank_account_name text DEFAULT NULL,
  _bank_account_number text DEFAULT NULL,
  _bank_name text DEFAULT NULL,
  _org_document_url text DEFAULT NULL,
  _org_document_type text DEFAULT NULL,
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
BEGIN
  _caller := auth.uid();
  IF _caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.can_admin_org(_caller, _org_id) THEN
    RAISE EXCEPTION 'Not authorized to manage this organization';
  END IF;

  SELECT * INTO _org FROM public.organizations WHERE id = _org_id;
  IF _org IS NULL THEN RAISE EXCEPTION 'Organization not found'; END IF;
  IF _org.kyc_status = 'level2' THEN RAISE EXCEPTION 'KYC already fully approved'; END IF;
  IF _org.kyc_status = 'level1' AND _kyc_level = 1 THEN RAISE EXCEPTION 'Level 1 KYC already approved'; END IF;

  IF _kyc_level = 1 THEN
    IF _id_document_url IS NULL OR _id_document_url = '' THEN
      RAISE EXCEPTION 'Identity document is required for Level 1';
    END IF;
    IF _selfie_url IS NULL OR _selfie_url = '' THEN
      RAISE EXCEPTION 'Selfie is required for Level 1';
    END IF;
    IF _selfie_with_doc_url IS NULL OR _selfie_with_doc_url = '' THEN
      RAISE EXCEPTION 'Selfie with document is required for Level 1';
    END IF;
  END IF;

  IF _kyc_level = 2 THEN
    IF _org_document_url IS NULL OR _org_document_url = '' THEN
      RAISE EXCEPTION 'Organization document is required for Level 2';
    END IF;
  END IF;

  INSERT INTO public.kyc_submissions (
    organization_id, submitted_by, kyc_level,
    id_document_url, id_document_type, id_document_back_url,
    selfie_url, selfie_with_doc_url,
    bank_account_name, bank_account_number, bank_name,
    org_document_url, org_document_type,
    payout_method, payout_phone, payout_provider,
    status, submitted_at, reviewed_at, reviewed_by, rejection_reason
  )
  VALUES (
    _org_id, _caller, _kyc_level,
    _id_document_url, _id_document_type, _id_document_back_url,
    _selfie_url, _selfie_with_doc_url,
    _bank_account_name, _bank_account_number, _bank_name,
    _org_document_url, _org_document_type,
    _payout_method, _payout_phone, _payout_provider,
    'pending', now(), NULL, NULL, NULL
  )
  ON CONFLICT (organization_id) DO UPDATE SET
    submitted_by = _caller,
    kyc_level = _kyc_level,
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
    payout_method = COALESCE(_payout_method, kyc_submissions.payout_method),
    payout_phone = COALESCE(_payout_phone, kyc_submissions.payout_phone),
    payout_provider = COALESCE(_payout_provider, kyc_submissions.payout_provider),
    status = 'pending',
    submitted_at = now(),
    reviewed_at = NULL,
    reviewed_by = NULL,
    rejection_reason = NULL;

  UPDATE public.organizations SET kyc_status = 'pending' WHERE id = _org_id;

  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, organization_id, metadata)
  VALUES (_caller, 'org.kyc_submitted', 'organization', _org_id, _org_id,
    jsonb_build_object('level', _kyc_level, 'category', _org.category));

  RETURN jsonb_build_object('ok', true, 'level', _kyc_level);
END;
$$;

-- Update submit_partner_kyc to include new fields
CREATE OR REPLACE FUNCTION public.submit_partner_kyc(
  _partner_id uuid,
  _id_document_url text,
  _id_document_type text,
  _id_document_back_url text DEFAULT NULL,
  _selfie_url text DEFAULT NULL,
  _selfie_with_doc_url text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _caller uuid;
  _partner record;
BEGIN
  _caller := auth.uid();
  IF _caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  SELECT * INTO _partner FROM public.partners WHERE id = _partner_id;
  IF _partner IS NULL THEN RAISE EXCEPTION 'Partner not found'; END IF;
  IF _partner.user_id != _caller THEN RAISE EXCEPTION 'Not authorized'; END IF;
  IF _partner.kyc_status = 'approved' THEN RAISE EXCEPTION 'KYC already approved'; END IF;

  UPDATE public.partners SET
    kyc_status = 'pending',
    id_document_url = _id_document_url,
    id_document_type = _id_document_type,
    id_document_back_url = _id_document_back_url,
    selfie_url = _selfie_url,
    selfie_with_doc_url = _selfie_with_doc_url,
    kyc_submitted_at = now(),
    kyc_reviewed_at = NULL,
    kyc_reviewed_by = NULL,
    kyc_rejection_reason = NULL
  WHERE id = _partner_id;

  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (_caller, 'partner.kyc_submitted', 'partner', _partner_id,
    jsonb_build_object('doc_type', _id_document_type));

  RETURN jsonb_build_object('ok', true);
END;
$$;
