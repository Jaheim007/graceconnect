
-- ============================================================
-- PARTNER NETWORK MODULE — Phase 1: Schema + RLS + Indexes + RPCs
-- ============================================================

-- 0) Enums
CREATE TYPE public.partner_status AS ENUM ('pending','approved','rejected','suspended');
CREATE TYPE public.partner_scope AS ENUM ('country','regional','international');
CREATE TYPE public.partner_commission_status AS ENUM ('held','payable','paid','reversed');
CREATE TYPE public.partner_payout_status AS ENUM ('requested','approved','processing','paid','failed','rejected');
CREATE TYPE public.partner_referral_status AS ENUM ('pending','active','rejected');

-- ============================================================
-- 1) partners
-- ============================================================
CREATE TABLE public.partners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  phone TEXT,
  email TEXT NOT NULL,
  country TEXT NOT NULL DEFAULT 'CI',
  scope partner_scope NOT NULL DEFAULT 'country',
  status partner_status NOT NULL DEFAULT 'pending',
  level INT NOT NULL DEFAULT 1 CHECK (level BETWEEN 1 AND 5),
  rate_percent NUMERIC(5,2) NOT NULL DEFAULT 5.00,
  custom_rate_override NUMERIC(5,2),
  min_payout_threshold NUMERIC(12,2) NOT NULL DEFAULT 10000,
  payout_method TEXT CHECK (payout_method IN ('bank','mobile_money')),
  paystack_recipient_code TEXT,
  -- Invite fields (single code per partner MVP)
  invite_code TEXT UNIQUE,
  invite_link_slug TEXT UNIQUE,
  invite_uses_count INT NOT NULL DEFAULT 0,
  last_invite_used_at TIMESTAMPTZ,
  -- Metadata
  terms_accepted_at TIMESTAMPTZ,
  approved_by UUID REFERENCES auth.users(id),
  approved_at TIMESTAMPTZ,
  suspended_at TIMESTAMPTZ,
  suspension_reason TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE TRIGGER set_partners_updated_at
  BEFORE UPDATE ON public.partners
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 2) partner_referrals
-- ============================================================
CREATE TABLE public.partner_referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  status partner_referral_status NOT NULL DEFAULT 'pending',
  attributed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  locked_at TIMESTAMPTZ,
  notes TEXT,
  UNIQUE (partner_id, organization_id)
);

-- ============================================================
-- 3) partner_commissions
-- ============================================================
CREATE TABLE public.partner_commissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id),
  payment_reference TEXT NOT NULL,
  platform_fee_amount NUMERIC(12,2) NOT NULL,
  commission_percent NUMERIC(5,2) NOT NULL,
  commission_amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XOF',
  status partner_commission_status NOT NULL DEFAULT 'held',
  payable_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  payout_request_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  -- Idempotency: one commission per partner per payment
  UNIQUE (partner_id, payment_reference)
);

-- ============================================================
-- 4) partner_payout_requests
-- ============================================================
CREATE TABLE public.partner_payout_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id UUID NOT NULL REFERENCES public.partners(id) ON DELETE CASCADE,
  amount NUMERIC(12,2) NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XOF',
  status partner_payout_status NOT NULL DEFAULT 'requested',
  paystack_transfer_code TEXT,
  failure_reason TEXT,
  requested_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  reviewed_at TIMESTAMPTZ,
  reviewed_by UUID REFERENCES auth.users(id),
  paid_at TIMESTAMPTZ,
  metadata JSONB DEFAULT '{}'::jsonb
);

-- FK: partner_commissions → partner_payout_requests
ALTER TABLE public.partner_commissions
  ADD CONSTRAINT fk_commission_payout
  FOREIGN KEY (payout_request_id) REFERENCES public.partner_payout_requests(id);

-- ============================================================
-- 5) Indexes
-- ============================================================
CREATE INDEX idx_partners_user_id ON public.partners(user_id);
CREATE INDEX idx_partners_status ON public.partners(status);
CREATE INDEX idx_partners_invite_code ON public.partners(invite_code);

CREATE INDEX idx_partner_referrals_partner ON public.partner_referrals(partner_id, status);
CREATE INDEX idx_partner_referrals_org ON public.partner_referrals(organization_id);

CREATE INDEX idx_partner_commissions_partner_status ON public.partner_commissions(partner_id, status);
CREATE INDEX idx_partner_commissions_payable ON public.partner_commissions(payable_at) WHERE status = 'held';
CREATE INDEX idx_partner_commissions_org ON public.partner_commissions(organization_id);

CREATE INDEX idx_partner_payouts_partner ON public.partner_payout_requests(partner_id, status);

-- ============================================================
-- 6) RLS
-- ============================================================
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_commissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_payout_requests ENABLE ROW LEVEL SECURITY;

-- Helper: check if current user is the partner
CREATE OR REPLACE FUNCTION public.is_partner_owner(_partner_id uuid)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.partners
    WHERE id = _partner_id AND user_id = auth.uid()
  );
$$;

-- partners
CREATE POLICY "partner_select_own" ON public.partners
  FOR SELECT TO authenticated
  USING (user_id = auth.uid() OR public.is_superadmin(auth.uid()));

CREATE POLICY "partner_update_own" ON public.partners
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_superadmin(auth.uid()));

CREATE POLICY "partner_insert_superadmin" ON public.partners
  FOR INSERT TO authenticated
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "partner_delete_superadmin" ON public.partners
  FOR DELETE TO authenticated
  USING (public.is_superadmin(auth.uid()));

-- partner_referrals
CREATE POLICY "referral_select" ON public.partner_referrals
  FOR SELECT TO authenticated
  USING (public.is_partner_owner(partner_id) OR public.is_superadmin(auth.uid()));

CREATE POLICY "referral_manage_superadmin" ON public.partner_referrals
  FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

-- partner_commissions
CREATE POLICY "commission_select" ON public.partner_commissions
  FOR SELECT TO authenticated
  USING (public.is_partner_owner(partner_id) OR public.is_superadmin(auth.uid()));

CREATE POLICY "commission_manage_superadmin" ON public.partner_commissions
  FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

-- partner_payout_requests
CREATE POLICY "payout_select" ON public.partner_payout_requests
  FOR SELECT TO authenticated
  USING (public.is_partner_owner(partner_id) OR public.is_superadmin(auth.uid()));

CREATE POLICY "payout_insert_own" ON public.partner_payout_requests
  FOR INSERT TO authenticated
  WITH CHECK (public.is_partner_owner(partner_id));

CREATE POLICY "payout_manage_superadmin" ON public.partner_payout_requests
  FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

-- ============================================================
-- 7) RPC: Superadmin partner management (SECURITY DEFINER)
-- ============================================================

-- 7a) Approve / Reject / Suspend partner
CREATE OR REPLACE FUNCTION public.manage_partner(
  _partner_id uuid,
  _action text, -- 'approve' | 'reject' | 'suspend' | 'unsuspend'
  _reason text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
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

  -- Audit log
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (_caller, 'partner.' || _action, 'partner', _partner_id::text,
    jsonb_build_object('partner_name', _partner.full_name, 'reason', _reason));

  RETURN jsonb_build_object('ok', true, 'action', _action, 'partner_id', _partner_id);
END;
$$;

-- 7b) Override partner rate
CREATE OR REPLACE FUNCTION public.set_partner_rate_override(
  _partner_id uuid,
  _rate numeric
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
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
  VALUES (_caller, 'partner.rate_override', 'partner', _partner_id::text,
    jsonb_build_object('old_rate', _old_rate, 'new_rate', _rate));

  RETURN jsonb_build_object('ok', true, 'new_rate', _rate);
END;
$$;

-- 7c) Transfer org attribution between partners (dispute resolution)
CREATE OR REPLACE FUNCTION public.transfer_partner_referral(
  _referral_id uuid,
  _new_partner_id uuid,
  _reason text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
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

  -- Check new partner exists
  IF NOT EXISTS (SELECT 1 FROM public.partners WHERE id = _new_partner_id) THEN
    RAISE EXCEPTION 'Target partner not found';
  END IF;

  -- Update attribution
  UPDATE public.partner_referrals
  SET partner_id = _new_partner_id, notes = COALESCE(notes, '') || E'\n[TRANSFER] ' || _reason
  WHERE id = _referral_id;

  -- Audit
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, metadata)
  VALUES (_caller, 'partner.transfer_referral', 'partner_referral', _referral_id::text,
    jsonb_build_object(
      'from_partner', _ref.partner_id,
      'to_partner', _new_partner_id,
      'org_id', _ref.organization_id,
      'reason', _reason
    ));

  RETURN jsonb_build_object('ok', true, 'transferred_to', _new_partner_id);
END;
$$;

-- 7d) Compute partner level based on active referrals
CREATE OR REPLACE FUNCTION public.compute_partner_level(_partner_id uuid)
RETURNS int
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _active_count int;
  _level int := 1;
BEGIN
  SELECT COUNT(*) INTO _active_count
  FROM public.partner_referrals
  WHERE partner_id = _partner_id AND status = 'active';

  IF _active_count >= 1000 THEN _level := 5;
  ELSIF _active_count >= 300 THEN _level := 4;
  ELSIF _active_count >= 150 THEN _level := 3;
  ELSIF _active_count >= 50 THEN _level := 2;
  ELSIF _active_count >= 10 THEN _level := 1;
  END IF;

  RETURN _level;
END;
$$;

-- 7e) Get effective partner rate (custom override > level-based)
CREATE OR REPLACE FUNCTION public.get_partner_rate(_partner_id uuid)
RETURNS numeric
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _partner record;
  _level int;
  _rate numeric;
BEGIN
  SELECT custom_rate_override, level INTO _partner FROM public.partners WHERE id = _partner_id;
  
  IF _partner.custom_rate_override IS NOT NULL THEN
    RETURN _partner.custom_rate_override;
  END IF;

  _level := public.compute_partner_level(_partner_id);
  
  CASE _level
    WHEN 5 THEN _rate := 15.00;
    WHEN 4 THEN _rate := 12.00;
    WHEN 3 THEN _rate := 10.00;
    WHEN 2 THEN _rate := 8.00;
    ELSE _rate := 5.00;
  END CASE;

  RETURN _rate;
END;
$$;

-- 7f) Register org attribution on org creation (called from app)
CREATE OR REPLACE FUNCTION public.attribute_org_to_partner(
  _org_id uuid,
  _partner_code text
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  _partner record;
BEGIN
  -- Find partner by invite_code
  SELECT id, status, user_id INTO _partner
  FROM public.partners
  WHERE invite_code = upper(trim(_partner_code)) AND status = 'approved';

  IF _partner IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'invalid_code');
  END IF;

  -- Anti self-referral: check if partner owns this org
  IF _partner.user_id IS NOT NULL AND _partner.user_id = (
    SELECT owner_id FROM public.organizations WHERE id = _org_id
  ) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'self_referral');
  END IF;

  -- Check if already attributed
  IF EXISTS (SELECT 1 FROM public.partner_referrals WHERE organization_id = _org_id) THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_attributed');
  END IF;

  -- Create referral
  INSERT INTO public.partner_referrals (partner_id, organization_id, status)
  VALUES (_partner.id, _org_id, 'pending');

  -- Increment uses
  UPDATE public.partners
  SET invite_uses_count = invite_uses_count + 1, last_invite_used_at = now()
  WHERE id = _partner.id;

  RETURN jsonb_build_object('ok', true, 'partner_id', _partner.id);
END;
$$;
