-- 1. Private payout account details for organizations
CREATE TABLE IF NOT EXISTS public.org_payout_accounts (
  organization_id UUID PRIMARY KEY REFERENCES public.organizations(id) ON DELETE CASCADE,
  momo_provider TEXT,
  momo_number TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.org_payout_accounts TO authenticated;
GRANT ALL ON public.org_payout_accounts TO service_role;

ALTER TABLE public.org_payout_accounts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Owner or superadmin can view payout account"
  ON public.org_payout_accounts FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = organization_id AND o.owner_id = auth.uid())
    OR public.is_superadmin(auth.uid())
  );

CREATE POLICY "Owner or superadmin can insert payout account"
  ON public.org_payout_accounts FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = organization_id AND o.owner_id = auth.uid())
    OR public.is_superadmin(auth.uid())
  );

CREATE POLICY "Owner or superadmin can update payout account"
  ON public.org_payout_accounts FOR UPDATE TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = organization_id AND o.owner_id = auth.uid())
    OR public.is_superadmin(auth.uid())
  )
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.organizations o WHERE o.id = organization_id AND o.owner_id = auth.uid())
    OR public.is_superadmin(auth.uid())
  );

CREATE POLICY "Superadmin can delete payout account"
  ON public.org_payout_accounts FOR DELETE TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE OR REPLACE FUNCTION public.touch_org_payout_accounts()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$ BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER org_payout_accounts_updated_at
  BEFORE UPDATE ON public.org_payout_accounts
  FOR EACH ROW EXECUTE FUNCTION public.touch_org_payout_accounts();

-- 2. Migrate existing values then drop the publicly readable columns
INSERT INTO public.org_payout_accounts (organization_id, momo_provider, momo_number)
SELECT id, momo_provider, momo_number
FROM public.organizations
WHERE momo_number IS NOT NULL OR momo_provider IS NOT NULL
ON CONFLICT (organization_id) DO NOTHING;

ALTER TABLE public.organizations DROP COLUMN IF EXISTS momo_number;
ALTER TABLE public.organizations DROP COLUMN IF EXISTS momo_provider;

-- 3. KYC submissions: owner-only (was any org admin)
DROP POLICY IF EXISTS "kyc_select_org_admin" ON public.kyc_submissions;
CREATE POLICY "kyc_select_owner_or_superadmin"
  ON public.kyc_submissions FOR SELECT TO authenticated
  USING (
    (organization_id IS NOT NULL AND EXISTS (
      SELECT 1 FROM public.organizations o
      WHERE o.id = kyc_submissions.organization_id AND o.owner_id = auth.uid()
    ))
    OR public.is_superadmin(auth.uid())
  );