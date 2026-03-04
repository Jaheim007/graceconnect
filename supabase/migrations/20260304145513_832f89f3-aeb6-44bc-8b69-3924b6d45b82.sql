
-- Fix manage_partner: remove ::text cast on resource_id (column is uuid)
CREATE OR REPLACE FUNCTION public.manage_partner(_partner_id uuid, _action text, _reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _caller uuid;
  _partner record;
BEGIN
  _caller := auth.uid();
  IF NOT public.is_superadmin(_caller) THEN
    RAISE EXCEPTION 'Superadmin only';
  END IF;

  SELECT * INTO _partner FROM public.partners WHERE id = _partner_id;
  IF _partner IS NULL THEN RAISE EXCEPTION 'Partner not found'; END IF;

  CASE _action
    WHEN 'approve' THEN
      UPDATE public.partners SET status = 'approved', approved_by = _caller, approved_at = now() WHERE id = _partner_id;
    WHEN 'reject' THEN
      UPDATE public.partners SET status = 'rejected', suspension_reason = _reason WHERE id = _partner_id;
    WHEN 'suspend' THEN
      UPDATE public.partners SET status = 'suspended', suspended_at = now(), suspension_reason = _reason WHERE id = _partner_id;
    WHEN 'unsuspend' THEN
      UPDATE public.partners SET status = 'approved', suspended_at = NULL, suspension_reason = NULL WHERE id = _partner_id;
    ELSE
      RAISE EXCEPTION 'Invalid action: %', _action;
  END CASE;

  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (_caller, 'partner.' || _action, 'partner', _partner_id, 
    jsonb_build_object('partner_name', _partner.full_name, 'reason', _reason));

  RETURN jsonb_build_object('ok', true, 'action', _action, 'partner_id', _partner_id);
END;
$function$;

-- Fix set_partner_rate_override
CREATE OR REPLACE FUNCTION public.set_partner_rate_override(_partner_id uuid, _rate numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _caller uuid;
  _old_rate numeric;
BEGIN
  _caller := auth.uid();
  IF NOT public.is_superadmin(_caller) THEN
    RAISE EXCEPTION 'Superadmin only';
  END IF;

  SELECT custom_rate_override INTO _old_rate FROM public.partners WHERE id = _partner_id;

  UPDATE public.partners SET custom_rate_override = _rate WHERE id = _partner_id;

  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (_caller, 'partner.rate_override', 'partner', _partner_id,
    jsonb_build_object('old_rate', _old_rate, 'new_rate', _rate));

  RETURN jsonb_build_object('ok', true, 'new_rate', _rate);
END;
$function$;

-- Fix transfer_partner_referral
CREATE OR REPLACE FUNCTION public.transfer_partner_referral(_referral_id uuid, _new_partner_id uuid, _reason text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _caller uuid;
  _ref record;
BEGIN
  _caller := auth.uid();
  IF NOT public.is_superadmin(_caller) THEN
    RAISE EXCEPTION 'Superadmin only';
  END IF;

  SELECT * INTO _ref FROM public.partner_referrals WHERE id = _referral_id;
  IF _ref IS NULL THEN RAISE EXCEPTION 'Referral not found'; END IF;

  IF NOT EXISTS (SELECT 1 FROM public.partners WHERE id = _new_partner_id) THEN
    RAISE EXCEPTION 'Target partner not found';
  END IF;

  UPDATE public.partner_referrals
  SET partner_id = _new_partner_id, notes = COALESCE(notes, '') || E'\n[TRANSFER] ' || _reason
  WHERE id = _referral_id;

  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (_caller, 'partner.transfer_referral', 'partner_referral', _referral_id,
    jsonb_build_object(
      'from_partner', _ref.partner_id,
      'to_partner', _new_partner_id,
      'org_id', _ref.organization_id,
      'reason', _reason
    ));

  RETURN jsonb_build_object('ok', true, 'transferred_to', _new_partner_id);
END;
$function$;

-- Fix submit_partner_kyc
CREATE OR REPLACE FUNCTION public.submit_partner_kyc(_partner_id uuid, _id_document_url text, _id_document_type text, _selfie_url text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  VALUES (_caller, 'partner.kyc_submitted', 'partner', _partner_id,
    jsonb_build_object('doc_type', _id_document_type));

  RETURN jsonb_build_object('ok', true);
END;
$function$;

-- Fix review_partner_kyc
CREATE OR REPLACE FUNCTION public.review_partner_kyc(_partner_id uuid, _action text, _reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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
  VALUES (_caller, 'partner.kyc_' || _action, 'partner', _partner_id,
    jsonb_build_object('partner_name', _partner.full_name, 'reason', _reason));

  RETURN jsonb_build_object('ok', true, 'action', _action);
END;
$function$;

-- Fix submit_org_kyc
CREATE OR REPLACE FUNCTION public.submit_org_kyc(_org_id uuid, _kyc_level integer, _id_document_url text DEFAULT NULL::text, _id_document_type text DEFAULT NULL::text, _selfie_url text DEFAULT NULL::text, _bank_account_name text DEFAULT NULL::text, _bank_account_number text DEFAULT NULL::text, _bank_name text DEFAULT NULL::text, _org_document_url text DEFAULT NULL::text, _org_document_type text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  UPDATE public.organizations SET kyc_status = 'pending' WHERE id = _org_id;

  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (_caller, 'org.kyc_submitted', 'organization', _org_id,
    jsonb_build_object('level', _kyc_level, 'category', _org.category));

  RETURN jsonb_build_object('ok', true, 'level', _kyc_level);
END;
$function$;

-- Fix review_org_kyc
CREATE OR REPLACE FUNCTION public.review_org_kyc(_org_id uuid, _action text, _reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
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

  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (_caller, 'org.kyc_' || _action, 'organization', _org_id,
    jsonb_build_object('level', _submission.kyc_level, 'org_name', _org.name, 'reason', _reason));

  RETURN jsonb_build_object('ok', true, 'action', _action, 'new_status', _new_status);
END;
$function$;
