
-- Add KYC fields to partners table
ALTER TABLE public.partners
ADD COLUMN IF NOT EXISTS kyc_status text NOT NULL DEFAULT 'none',
ADD COLUMN IF NOT EXISTS id_document_url text,
ADD COLUMN IF NOT EXISTS id_document_type text,
ADD COLUMN IF NOT EXISTS selfie_url text,
ADD COLUMN IF NOT EXISTS kyc_submitted_at timestamptz,
ADD COLUMN IF NOT EXISTS kyc_reviewed_at timestamptz,
ADD COLUMN IF NOT EXISTS kyc_reviewed_by uuid,
ADD COLUMN IF NOT EXISTS kyc_rejection_reason text;

-- Create RPC to submit partner KYC
CREATE OR REPLACE FUNCTION public.submit_partner_kyc(
  _partner_id uuid,
  _id_document_url text,
  _id_document_type text,
  _selfie_url text DEFAULT NULL
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
    selfie_url = _selfie_url,
    kyc_submitted_at = now(),
    kyc_reviewed_at = NULL,
    kyc_reviewed_by = NULL,
    kyc_rejection_reason = NULL
  WHERE id = _partner_id;

  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (_caller, 'partner.kyc_submitted', 'partner', _partner_id::text,
    jsonb_build_object('doc_type', _id_document_type));

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- Create RPC to review partner KYC (superadmin)
CREATE OR REPLACE FUNCTION public.review_partner_kyc(
  _partner_id uuid,
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
  _partner record;
BEGIN
  _caller := auth.uid();
  IF NOT public.is_superadmin(_caller) THEN RAISE EXCEPTION 'Superadmin only'; END IF;

  SELECT * INTO _partner FROM public.partners WHERE id = _partner_id;
  IF _partner IS NULL THEN RAISE EXCEPTION 'Partner not found'; END IF;

  IF _action = 'approve' THEN
    UPDATE public.partners SET
      kyc_status = 'approved',
      kyc_reviewed_at = now(),
      kyc_reviewed_by = _caller,
      kyc_rejection_reason = NULL
    WHERE id = _partner_id;
  ELSIF _action = 'reject' THEN
    UPDATE public.partners SET
      kyc_status = 'rejected',
      kyc_reviewed_at = now(),
      kyc_reviewed_by = _caller,
      kyc_rejection_reason = _reason
    WHERE id = _partner_id;
  ELSE
    RAISE EXCEPTION 'Invalid action: %', _action;
  END IF;

  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (_caller, 'partner.kyc_' || _action, 'partner', _partner_id::text,
    jsonb_build_object('partner_name', _partner.full_name, 'reason', _reason));

  RETURN jsonb_build_object('ok', true, 'action', _action);
END;
$$;
