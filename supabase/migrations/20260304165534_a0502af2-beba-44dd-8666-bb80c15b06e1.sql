-- 1. Insert the missing partner commission for Jahjah Studios purchase
INSERT INTO public.partner_commissions (partner_id, organization_id, payment_reference, platform_fee_amount, commission_percent, commission_amount, currency, status, payable_at)
VALUES (
  '5e59afbd-d8ba-4bbf-aa9c-7bad43fc7bed',
  'c93a8030-882b-446b-b432-5b2fcd2a6543',
  'SV-1772639297223-BI4Q58TZZ',
  50,
  5,
  2.50,
  'XOF',
  'held',
  now() + interval '15 days'
)
ON CONFLICT DO NOTHING;

-- 2. Create delete_partner function for superadmin
CREATE OR REPLACE FUNCTION public.delete_partner(_partner_id uuid)
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
  IF NOT public.is_superadmin(_caller) THEN
    RAISE EXCEPTION 'Superadmin only';
  END IF;

  SELECT * INTO _partner FROM public.partners WHERE id = _partner_id;
  IF _partner IS NULL THEN RAISE EXCEPTION 'Partner not found'; END IF;

  DELETE FROM public.partner_commissions WHERE partner_id = _partner_id;
  DELETE FROM public.partner_payout_requests WHERE partner_id = _partner_id;
  DELETE FROM public.partner_referrals WHERE partner_id = _partner_id;
  DELETE FROM public.partners WHERE id = _partner_id;

  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (_caller, 'partner.deleted', 'partner', _partner_id,
    jsonb_build_object('partner_name', _partner.full_name, 'email', _partner.email));

  RETURN jsonb_build_object('ok', true, 'deleted', _partner.full_name);
END;
$$;