ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS is_internal boolean NOT NULL DEFAULT false;

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS first_touch_source text,
  ADD COLUMN IF NOT EXISTS first_touch_medium text,
  ADD COLUMN IF NOT EXISTS first_touch_campaign text,
  ADD COLUMN IF NOT EXISTS first_touch_page text,
  ADD COLUMN IF NOT EXISTS first_touch_referrer text;

CREATE TABLE IF NOT EXISTS public.marketing_spend (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  spend_date date NOT NULL DEFAULT current_date,
  channel text NOT NULL,
  campaign text,
  amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'XOF',
  note text,
  created_by uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.marketing_spend TO authenticated;
GRANT ALL ON public.marketing_spend TO service_role;

ALTER TABLE public.marketing_spend ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins manage marketing spend"
ON public.marketing_spend FOR ALL TO authenticated
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

CREATE INDEX IF NOT EXISTS marketing_spend_date_idx ON public.marketing_spend (spend_date DESC);