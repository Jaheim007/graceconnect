
-- =====================================================
-- SiteViral Church — Phase 1 foundation
-- =====================================================

-- 1) church_providers
CREATE TABLE public.church_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  slug text NOT NULL UNIQUE,
  name text NOT NULL,
  bio text,
  denomination text,
  languages text[] NOT NULL DEFAULT ARRAY['fr']::text[],
  logo_url text,
  cover_url text,
  address text,
  city text,
  country text,
  lat double precision,
  lng double precision,
  phone text,
  email text,
  website text,
  service_times jsonb NOT NULL DEFAULT '[]'::jsonb,
  currency text NOT NULL DEFAULT 'XOF',
  status text NOT NULL DEFAULT 'draft', -- draft | active | suspended
  kyc_submission_id uuid,
  verified boolean NOT NULL DEFAULT false,
  socials jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.church_providers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.church_providers TO authenticated;
GRANT ALL ON public.church_providers TO service_role;

ALTER TABLE public.church_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active churches"
  ON public.church_providers FOR SELECT TO anon, authenticated
  USING (status = 'active');

CREATE POLICY "Owner can read own church"
  ON public.church_providers FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Owner can insert own church"
  ON public.church_providers FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner can update own church"
  ON public.church_providers FOR UPDATE TO authenticated
  USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner can delete own church"
  ON public.church_providers FOR DELETE TO authenticated
  USING (user_id = auth.uid());

-- 2) church_sermons
CREATE TABLE public.church_sermons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.church_providers(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  audio_url text,
  cover_url text,
  duration_s integer,
  transcript text,
  transcript_status text NOT NULL DEFAULT 'pending', -- pending | processing | ready | failed
  series text,
  preacher text,
  scripture_refs text[] NOT NULL DEFAULT '{}',
  is_free boolean NOT NULL DEFAULT true,
  price numeric,
  currency text NOT NULL DEFAULT 'XOF',
  published_at timestamptz,
  status text NOT NULL DEFAULT 'draft', -- draft | published | archived
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.church_sermons TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.church_sermons TO authenticated;
GRANT ALL ON public.church_sermons TO service_role;

ALTER TABLE public.church_sermons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published sermons of active churches"
  ON public.church_sermons FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    AND EXISTS (SELECT 1 FROM public.church_providers cp WHERE cp.id = church_sermons.church_id AND cp.status = 'active')
  );

CREATE POLICY "Owner manages own sermons"
  ON public.church_sermons FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.church_providers cp WHERE cp.id = church_sermons.church_id AND cp.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.church_providers cp WHERE cp.id = church_sermons.church_id AND cp.user_id = auth.uid()));

-- 3) church_sermon_variants (AI generated)
CREATE TABLE public.church_sermon_variants (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sermon_id uuid NOT NULL REFERENCES public.church_sermons(id) ON DELETE CASCADE,
  type text NOT NULL, -- ebook | blog | whatsapp | reel | notes_pdf
  content jsonb NOT NULL DEFAULT '{}'::jsonb,
  status text NOT NULL DEFAULT 'draft', -- draft | published
  generated_by_model text,
  cost_credits integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (sermon_id, type)
);

GRANT SELECT ON public.church_sermon_variants TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.church_sermon_variants TO authenticated;
GRANT ALL ON public.church_sermon_variants TO service_role;

ALTER TABLE public.church_sermon_variants ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published variants"
  ON public.church_sermon_variants FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    AND EXISTS (
      SELECT 1 FROM public.church_sermons s
      JOIN public.church_providers cp ON cp.id = s.church_id
      WHERE s.id = church_sermon_variants.sermon_id AND s.status = 'published' AND cp.status = 'active'
    )
  );

CREATE POLICY "Owner manages own variants"
  ON public.church_sermon_variants FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.church_sermons s
    JOIN public.church_providers cp ON cp.id = s.church_id
    WHERE s.id = church_sermon_variants.sermon_id AND cp.user_id = auth.uid()
  ))
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.church_sermons s
    JOIN public.church_providers cp ON cp.id = s.church_id
    WHERE s.id = church_sermon_variants.sermon_id AND cp.user_id = auth.uid()
  ));

-- 4) church_campaigns
CREATE TABLE public.church_campaigns (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.church_providers(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  cover_url text,
  goal_amount numeric,
  raised_amount numeric NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'XOF',
  starts_at timestamptz,
  ends_at timestamptz,
  status text NOT NULL DEFAULT 'active', -- active | closed | draft
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.church_campaigns TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.church_campaigns TO authenticated;
GRANT ALL ON public.church_campaigns TO service_role;

ALTER TABLE public.church_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read active campaigns of active churches"
  ON public.church_campaigns FOR SELECT TO anon, authenticated
  USING (
    status IN ('active', 'closed')
    AND EXISTS (SELECT 1 FROM public.church_providers cp WHERE cp.id = church_campaigns.church_id AND cp.status = 'active')
  );

CREATE POLICY "Owner manages own campaigns"
  ON public.church_campaigns FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.church_providers cp WHERE cp.id = church_campaigns.church_id AND cp.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.church_providers cp WHERE cp.id = church_campaigns.church_id AND cp.user_id = auth.uid()));

-- 5) church_events
CREATE TABLE public.church_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.church_providers(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz,
  location text,
  stream_url text,
  is_recurring boolean NOT NULL DEFAULT false,
  recurrence_rule text,
  cover_url text,
  status text NOT NULL DEFAULT 'published',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.church_events TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.church_events TO authenticated;
GRANT ALL ON public.church_events TO service_role;

ALTER TABLE public.church_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public can read published events of active churches"
  ON public.church_events FOR SELECT TO anon, authenticated
  USING (
    status = 'published'
    AND EXISTS (SELECT 1 FROM public.church_providers cp WHERE cp.id = church_events.church_id AND cp.status = 'active')
  );

CREATE POLICY "Owner manages own events"
  ON public.church_events FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.church_providers cp WHERE cp.id = church_events.church_id AND cp.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.church_providers cp WHERE cp.id = church_events.church_id AND cp.user_id = auth.uid()));

-- 6) church_prayer_requests
CREATE TABLE public.church_prayer_requests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.church_providers(id) ON DELETE CASCADE,
  requester_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  requester_name text,
  requester_contact text,
  message text NOT NULL,
  is_private boolean NOT NULL DEFAULT true,
  status text NOT NULL DEFAULT 'new', -- new | reading | prayed | closed
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.church_prayer_requests TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.church_prayer_requests TO authenticated;
GRANT ALL ON public.church_prayer_requests TO service_role;

ALTER TABLE public.church_prayer_requests ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a prayer request to an active church
CREATE POLICY "Anyone can submit prayer request"
  ON public.church_prayer_requests FOR INSERT TO anon, authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.church_providers cp WHERE cp.id = church_prayer_requests.church_id AND cp.status = 'active')
  );

-- Public wall: only non-private ones visible publicly
CREATE POLICY "Public reads non-private prayer requests"
  ON public.church_prayer_requests FOR SELECT TO anon, authenticated
  USING (is_private = false);

CREATE POLICY "Owner reads own church prayer requests"
  ON public.church_prayer_requests FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.church_providers cp WHERE cp.id = church_prayer_requests.church_id AND cp.user_id = auth.uid()));

CREATE POLICY "Owner updates own church prayer requests"
  ON public.church_prayer_requests FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.church_providers cp WHERE cp.id = church_prayer_requests.church_id AND cp.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.church_providers cp WHERE cp.id = church_prayer_requests.church_id AND cp.user_id = auth.uid()));

-- 7) church_members
CREATE TABLE public.church_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.church_providers(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role text NOT NULL DEFAULT 'member', -- member | leader | pastor
  country text,
  joined_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (church_id, user_id)
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.church_members TO authenticated;
GRANT ALL ON public.church_members TO service_role;

ALTER TABLE public.church_members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members and owner read"
  ON public.church_members FOR SELECT TO authenticated
  USING (
    user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.church_providers cp WHERE cp.id = church_members.church_id AND cp.user_id = auth.uid())
  );

CREATE POLICY "User can join a church"
  ON public.church_members FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Owner manages roles"
  ON public.church_members FOR UPDATE TO authenticated
  USING (EXISTS (SELECT 1 FROM public.church_providers cp WHERE cp.id = church_members.church_id AND cp.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.church_providers cp WHERE cp.id = church_members.church_id AND cp.user_id = auth.uid()));

CREATE POLICY "User can leave"
  ON public.church_members FOR DELETE TO authenticated
  USING (user_id = auth.uid()
    OR EXISTS (SELECT 1 FROM public.church_providers cp WHERE cp.id = church_members.church_id AND cp.user_id = auth.uid()));

-- 8) Extend kyc_submissions to also cover churches
ALTER TABLE public.kyc_submissions
  ADD COLUMN IF NOT EXISTS church_provider_id uuid
    REFERENCES public.church_providers(id) ON DELETE CASCADE;

CREATE UNIQUE INDEX IF NOT EXISTS kyc_submissions_church_provider_id_key
  ON public.kyc_submissions(church_provider_id)
  WHERE church_provider_id IS NOT NULL;

ALTER TABLE public.kyc_submissions
  DROP CONSTRAINT IF EXISTS kyc_submissions_owner_check;
ALTER TABLE public.kyc_submissions
  ADD CONSTRAINT kyc_submissions_owner_check
  CHECK (
    (organization_id IS NOT NULL AND beauty_provider_id IS NULL AND church_provider_id IS NULL)
    OR (organization_id IS NULL AND beauty_provider_id IS NOT NULL AND church_provider_id IS NULL)
    OR (organization_id IS NULL AND beauty_provider_id IS NULL AND church_provider_id IS NOT NULL)
  );

CREATE POLICY "Church provider owner can view own kyc submission"
  ON public.kyc_submissions FOR SELECT TO authenticated
  USING (
    church_provider_id IS NOT NULL
    AND EXISTS (
      SELECT 1 FROM public.church_providers cp
      WHERE cp.id = kyc_submissions.church_provider_id
        AND cp.user_id = auth.uid()
    )
  );

-- 9) submit_church_kyc RPC
CREATE OR REPLACE FUNCTION public.submit_church_kyc(
  _provider_id uuid,
  _id_document_url text,
  _id_document_type text,
  _id_document_back_url text,
  _selfie_url text,
  _selfie_with_doc_url text,
  _bank_account_name text,
  _bank_account_number text,
  _bank_name text,
  _payout_method text,
  _payout_phone text,
  _payout_provider text
) RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
DECLARE
  v_user uuid := auth.uid();
  v_existing uuid;
  v_submission_id uuid;
BEGIN
  IF v_user IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT EXISTS (SELECT 1 FROM public.church_providers WHERE id = _provider_id AND user_id = v_user) THEN
    RAISE EXCEPTION 'Not authorized for this provider';
  END IF;

  SELECT id INTO v_existing FROM public.kyc_submissions WHERE church_provider_id = _provider_id;

  IF v_existing IS NOT NULL THEN
    UPDATE public.kyc_submissions SET
      id_document_url = _id_document_url,
      id_document_type = _id_document_type,
      id_document_back_url = _id_document_back_url,
      selfie_url = _selfie_url,
      selfie_with_doc_url = _selfie_with_doc_url,
      bank_account_name = _bank_account_name,
      bank_account_number = _bank_account_number,
      bank_name = _bank_name,
      payout_method = _payout_method,
      payout_phone = _payout_phone,
      payout_provider = _payout_provider,
      verification_type = 'individual',
      kyc_level = 1,
      status = 'pending',
      rejection_reason = NULL,
      submitted_by = v_user,
      submitted_at = now()
    WHERE id = v_existing
    RETURNING id INTO v_submission_id;
  ELSE
    INSERT INTO public.kyc_submissions (
      church_provider_id, submitted_by, status, verification_type, kyc_level,
      id_document_url, id_document_type, id_document_back_url,
      selfie_url, selfie_with_doc_url,
      bank_account_name, bank_account_number, bank_name,
      payout_method, payout_phone, payout_provider,
      submitted_at
    ) VALUES (
      _provider_id, v_user, 'pending', 'individual', 1,
      _id_document_url, _id_document_type, _id_document_back_url,
      _selfie_url, _selfie_with_doc_url,
      _bank_account_name, _bank_account_number, _bank_name,
      _payout_method, _payout_phone, _payout_provider,
      now()
    ) RETURNING id INTO v_submission_id;
  END IF;

  UPDATE public.church_providers
     SET kyc_submission_id = v_submission_id, updated_at = now()
   WHERE id = _provider_id;

  RETURN jsonb_build_object('submission_id', v_submission_id);
END;
$$;

GRANT EXECUTE ON FUNCTION public.submit_church_kyc(
  uuid, text, text, text, text, text, text, text, text, text, text, text
) TO authenticated;

-- 10) Trigger to flip church status on KYC approval
CREATE OR REPLACE FUNCTION public.church_kyc_status_sync()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public
AS $$
BEGIN
  IF NEW.church_provider_id IS NULL THEN RETURN NEW; END IF;
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    IF NEW.status = 'approved' THEN
      UPDATE public.church_providers
         SET status = 'active', verified = true, updated_at = now()
       WHERE id = NEW.church_provider_id;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_church_kyc_status_sync ON public.kyc_submissions;
CREATE TRIGGER trg_church_kyc_status_sync
  AFTER UPDATE ON public.kyc_submissions
  FOR EACH ROW EXECUTE FUNCTION public.church_kyc_status_sync();

-- 11) updated_at trigger for church tables
CREATE OR REPLACE FUNCTION public.church_touch_updated_at()
RETURNS trigger LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TRIGGER trg_church_providers_touch BEFORE UPDATE ON public.church_providers
  FOR EACH ROW EXECUTE FUNCTION public.church_touch_updated_at();
CREATE TRIGGER trg_church_sermons_touch BEFORE UPDATE ON public.church_sermons
  FOR EACH ROW EXECUTE FUNCTION public.church_touch_updated_at();
CREATE TRIGGER trg_church_sermon_variants_touch BEFORE UPDATE ON public.church_sermon_variants
  FOR EACH ROW EXECUTE FUNCTION public.church_touch_updated_at();
CREATE TRIGGER trg_church_campaigns_touch BEFORE UPDATE ON public.church_campaigns
  FOR EACH ROW EXECUTE FUNCTION public.church_touch_updated_at();
CREATE TRIGGER trg_church_events_touch BEFORE UPDATE ON public.church_events
  FOR EACH ROW EXECUTE FUNCTION public.church_touch_updated_at();
CREATE TRIGGER trg_church_prayer_touch BEFORE UPDATE ON public.church_prayer_requests
  FOR EACH ROW EXECUTE FUNCTION public.church_touch_updated_at();

-- 12) Indexes
CREATE INDEX church_sermons_church_idx ON public.church_sermons(church_id, published_at DESC);
CREATE INDEX church_campaigns_church_idx ON public.church_campaigns(church_id);
CREATE INDEX church_events_church_starts_idx ON public.church_events(church_id, starts_at);
CREATE INDEX church_prayer_church_idx ON public.church_prayer_requests(church_id, created_at DESC);
CREATE INDEX church_providers_country_idx ON public.church_providers(country, city);
