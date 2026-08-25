CREATE TABLE public.affiliate_programs (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  owner_org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  platform_url text,
  currency text NOT NULL DEFAULT 'XOF',
  default_commission_percent numeric NOT NULL DEFAULT 10,
  hold_days integer NOT NULL DEFAULT 15,
  payout_mode text NOT NULL DEFAULT 'reporting',
  wallet_balance numeric NOT NULL DEFAULT 0,
  allowed_origins text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.affiliate_programs TO authenticated;
GRANT ALL ON public.affiliate_programs TO service_role;
ALTER TABLE public.affiliate_programs ENABLE ROW LEVEL SECURITY;

ALTER TABLE public.affiliate_links
  ADD COLUMN IF NOT EXISTS program_id uuid REFERENCES public.affiliate_programs(id) ON DELETE CASCADE;

CREATE INDEX IF NOT EXISTS affiliate_links_program_idx ON public.affiliate_links(program_id);

CREATE POLICY "Org admins manage their affiliate programs"
ON public.affiliate_programs FOR ALL TO authenticated
USING (public.can_admin_org(auth.uid(), owner_org_id))
WITH CHECK (public.can_admin_org(auth.uid(), owner_org_id));

CREATE POLICY "Ambassadors can read programs they promote"
ON public.affiliate_programs FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.affiliate_links l
  WHERE l.program_id = affiliate_programs.id AND l.user_id = auth.uid()
));

CREATE OR REPLACE FUNCTION public.affiliate_programs_validate()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.payout_mode NOT IN ('reporting', 'wallet') THEN
    RAISE EXCEPTION 'payout_mode must be reporting or wallet';
  END IF;
  IF NEW.default_commission_percent < 0 OR NEW.default_commission_percent > 90 THEN
    RAISE EXCEPTION 'default_commission_percent must be between 0 and 90';
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

CREATE TRIGGER affiliate_programs_validate_trg
BEFORE INSERT OR UPDATE ON public.affiliate_programs
FOR EACH ROW EXECUTE FUNCTION public.affiliate_programs_validate();

CREATE TABLE public.affiliate_conversions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id uuid NOT NULL REFERENCES public.affiliate_programs(id) ON DELETE CASCADE,
  affiliate_link_id uuid REFERENCES public.affiliate_links(id) ON DELETE SET NULL,
  affiliate_user_id uuid,
  external_reference text NOT NULL,
  external_customer_ref text,
  amount numeric NOT NULL,
  currency text NOT NULL,
  commission_percent numeric NOT NULL DEFAULT 0,
  commission_amount numeric NOT NULL DEFAULT 0,
  status text NOT NULL DEFAULT 'pending',
  affiliate_sale_id uuid REFERENCES public.affiliate_sales(id) ON DELETE SET NULL,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  payable_at timestamptz,
  reversed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (program_id, external_reference)
);

GRANT SELECT ON public.affiliate_conversions TO authenticated;
GRANT ALL ON public.affiliate_conversions TO service_role;
ALTER TABLE public.affiliate_conversions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins read program conversions"
ON public.affiliate_conversions FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.affiliate_programs p
  WHERE p.id = affiliate_conversions.program_id AND public.can_admin_org(auth.uid(), p.owner_org_id)
));

CREATE POLICY "Ambassadors read their own conversions"
ON public.affiliate_conversions FOR SELECT TO authenticated
USING (affiliate_user_id = auth.uid());

CREATE INDEX affiliate_conversions_program_idx ON public.affiliate_conversions(program_id, created_at DESC);
CREATE INDEX affiliate_conversions_user_idx ON public.affiliate_conversions(affiliate_user_id);

CREATE TABLE public.affiliate_program_wallet_ledger (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id uuid NOT NULL REFERENCES public.affiliate_programs(id) ON DELETE CASCADE,
  direction text NOT NULL,
  amount numeric NOT NULL,
  currency text NOT NULL,
  balance_after numeric NOT NULL DEFAULT 0,
  reference text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.affiliate_program_wallet_ledger TO authenticated;
GRANT ALL ON public.affiliate_program_wallet_ledger TO service_role;
ALTER TABLE public.affiliate_program_wallet_ledger ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org admins read their wallet ledger"
ON public.affiliate_program_wallet_ledger FOR SELECT TO authenticated
USING (EXISTS (
  SELECT 1 FROM public.affiliate_programs p
  WHERE p.id = affiliate_program_wallet_ledger.program_id AND public.can_admin_org(auth.uid(), p.owner_org_id)
));

CREATE OR REPLACE FUNCTION public.track_program_click(_program_id uuid, _code text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _updated integer;
BEGIN
  UPDATE public.affiliate_links
  SET clicks = COALESCE(clicks, 0) + 1
  WHERE program_id = _program_id AND code = _code AND is_active = true;
  GET DIAGNOSTICS _updated = ROW_COUNT;
  RETURN _updated > 0;
END;
$$;

GRANT EXECUTE ON FUNCTION public.track_program_click(uuid, text) TO service_role;