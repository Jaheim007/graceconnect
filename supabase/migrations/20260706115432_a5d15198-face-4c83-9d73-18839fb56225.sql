
CREATE TABLE IF NOT EXISTS public.church_donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.church_providers(id) ON DELETE CASCADE,
  campaign_id uuid REFERENCES public.church_campaigns(id) ON DELETE SET NULL,
  donor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  donor_name text,
  donor_email text,
  donor_phone text,
  giving_type text NOT NULL DEFAULT 'offering',
  amount numeric NOT NULL CHECK (amount > 0),
  currency text NOT NULL DEFAULT 'XOF',
  gateway text NOT NULL,
  reference text NOT NULL UNIQUE,
  status text NOT NULL DEFAULT 'pending',
  is_anonymous boolean NOT NULL DEFAULT false,
  message text,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS church_donations_church_idx ON public.church_donations(church_id, created_at DESC);
CREATE INDEX IF NOT EXISTS church_donations_campaign_idx ON public.church_donations(campaign_id) WHERE campaign_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS church_donations_status_idx ON public.church_donations(status);

GRANT SELECT, INSERT ON public.church_donations TO anon;
GRANT SELECT, INSERT, UPDATE ON public.church_donations TO authenticated;
GRANT ALL ON public.church_donations TO service_role;

ALTER TABLE public.church_donations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Church owner reads own donations"
ON public.church_donations FOR SELECT TO authenticated
USING (
  EXISTS (
    SELECT 1 FROM public.church_providers c
    WHERE c.id = church_donations.church_id AND c.user_id = auth.uid()
  )
);

CREATE POLICY "Donor reads own donations"
ON public.church_donations FOR SELECT TO authenticated
USING (donor_user_id = auth.uid());

CREATE POLICY "Public creates pending donation"
ON public.church_donations FOR INSERT TO anon, authenticated
WITH CHECK (status = 'pending');

CREATE TRIGGER trg_church_donations_updated_at
BEFORE UPDATE ON public.church_donations
FOR EACH ROW EXECUTE FUNCTION public.church_touch_updated_at();

DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE tablename='church_campaigns' AND policyname='Public reads active campaigns'
  ) THEN
    CREATE POLICY "Public reads active campaigns"
    ON public.church_campaigns FOR SELECT TO anon, authenticated
    USING (status IN ('active','published') OR EXISTS (
      SELECT 1 FROM public.church_providers c
      WHERE c.id = church_campaigns.church_id AND c.user_id = auth.uid()
    ));
  END IF;
END $$;

GRANT SELECT ON public.church_campaigns TO anon;
