
ALTER TABLE public.church_providers
  ADD COLUMN IF NOT EXISTS payout_verified boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS is_official boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS default_language text;
UPDATE public.church_providers SET status = 'pending' WHERE status = 'draft';
ALTER TABLE public.church_providers ALTER COLUMN status SET DEFAULT 'pending';
UPDATE public.church_providers SET payout_verified = true WHERE verified = true OR status = 'active';

CREATE OR REPLACE FUNCTION public.church_kyc_status_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF NEW.church_provider_id IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'approved' THEN
      UPDATE public.church_providers
         SET payout_verified = true, verified = true,
             status = CASE WHEN status = 'suspended' THEN status ELSE 'active' END,
             updated_at = now()
       WHERE id = NEW.church_provider_id;
    END IF;
  END IF;
  RETURN NEW;
END; $$;

ALTER TABLE public.church_sermons
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS transcript_language text,
  ADD COLUMN IF NOT EXISTS unclear_sections jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS rights_confirmed_at timestamptz;

ALTER TABLE public.church_sermon_variants
  ADD COLUMN IF NOT EXISTS approval_status text NOT NULL DEFAULT 'draft',
  ADD COLUMN IF NOT EXISTS edited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS edited_at timestamptz;

ALTER TABLE public.offering_transactions
  ADD COLUMN IF NOT EXISTS church_id uuid REFERENCES public.church_providers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS giving_type text;
CREATE INDEX IF NOT EXISTS idx_offering_transactions_church
  ON public.offering_transactions(church_id) WHERE church_id IS NOT NULL;

CREATE TABLE IF NOT EXISTS public.church_team_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.church_providers(id) ON DELETE CASCADE,
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  invited_email text,
  role text NOT NULL DEFAULT 'admin' CHECK (role IN ('owner','admin')),
  invited_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  invited_at timestamptz NOT NULL DEFAULT now(),
  accepted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (church_id, user_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.church_team_members TO authenticated;
GRANT ALL ON public.church_team_members TO service_role;
ALTER TABLE public.church_team_members ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.is_church_team_member(_church_id uuid, _user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.church_providers WHERE id = _church_id AND user_id = _user_id)
      OR EXISTS (SELECT 1 FROM public.church_team_members
                 WHERE church_id = _church_id AND user_id = _user_id AND accepted_at IS NOT NULL);
$$;

CREATE POLICY "Team visible to owner + team" ON public.church_team_members
  FOR SELECT TO authenticated USING (
    EXISTS (SELECT 1 FROM public.church_providers cp WHERE cp.id = church_id AND cp.user_id = auth.uid())
    OR user_id = auth.uid()
    OR public.is_superadmin(auth.uid())
  );
CREATE POLICY "Owner manages team" ON public.church_team_members
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.church_providers cp WHERE cp.id = church_id AND cp.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.church_providers cp WHERE cp.id = church_id AND cp.user_id = auth.uid()));
CREATE POLICY "Invitee accepts own" ON public.church_team_members
  FOR UPDATE TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE TABLE IF NOT EXISTS public.church_announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.church_providers(id) ON DELETE CASCADE,
  title text NOT NULL,
  body text NOT NULL,
  cover_url text,
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft','published','archived')),
  pinned boolean NOT NULL DEFAULT false,
  published_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.church_announcements TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.church_announcements TO authenticated;
GRANT ALL ON public.church_announcements TO service_role;
ALTER TABLE public.church_announcements ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Published announcements are public" ON public.church_announcements
  FOR SELECT USING (status = 'published');
CREATE POLICY "Team manages announcements" ON public.church_announcements
  FOR ALL TO authenticated
  USING (public.is_church_team_member(church_id, auth.uid()) OR public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_church_team_member(church_id, auth.uid()) OR public.is_superadmin(auth.uid()));
CREATE TRIGGER trg_church_announcements_updated BEFORE UPDATE ON public.church_announcements
  FOR EACH ROW EXECUTE FUNCTION public.church_touch_updated_at();

CREATE TABLE IF NOT EXISTS public.church_content_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.church_providers(id) ON DELETE CASCADE,
  sermon_id uuid REFERENCES public.church_sermons(id) ON DELETE CASCADE,
  reporter_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_email text,
  reason text NOT NULL CHECK (reason IN ('fake_church','wrong_info','abusive','payment_issue','inappropriate','other')),
  message text,
  status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','actioned','dismissed')),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT INSERT ON public.church_content_reports TO anon, authenticated;
GRANT SELECT, UPDATE ON public.church_content_reports TO authenticated;
GRANT ALL ON public.church_content_reports TO service_role;
ALTER TABLE public.church_content_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can file a report" ON public.church_content_reports
  FOR INSERT WITH CHECK (true);
CREATE POLICY "Reporter sees own reports" ON public.church_content_reports
  FOR SELECT TO authenticated USING (reporter_user_id = auth.uid());
CREATE POLICY "Superadmins see all reports" ON public.church_content_reports
  FOR SELECT TO authenticated USING (public.is_superadmin(auth.uid()));
CREATE POLICY "Superadmins manage reports" ON public.church_content_reports
  FOR UPDATE TO authenticated USING (public.is_superadmin(auth.uid())) WITH CHECK (public.is_superadmin(auth.uid()));

CREATE TABLE IF NOT EXISTS public.church_receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.church_providers(id) ON DELETE CASCADE,
  transaction_id uuid REFERENCES public.offering_transactions(id) ON DELETE SET NULL,
  donor_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  donor_email text NOT NULL,
  donor_name text,
  amount integer NOT NULL,
  currency text NOT NULL,
  giving_type text NOT NULL,
  reference text,
  pdf_url text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.church_receipts TO authenticated;
GRANT ALL ON public.church_receipts TO service_role;
ALTER TABLE public.church_receipts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Donor sees own receipts" ON public.church_receipts
  FOR SELECT TO authenticated USING (donor_user_id = auth.uid());
CREATE POLICY "Church team sees receipts" ON public.church_receipts
  FOR SELECT TO authenticated
  USING (public.is_church_team_member(church_id, auth.uid()) OR public.is_superadmin(auth.uid()));
