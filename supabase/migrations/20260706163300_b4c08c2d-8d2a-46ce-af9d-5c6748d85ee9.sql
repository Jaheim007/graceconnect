
-- SiteViral Events — Phase 1 schema (mirrors home_* / beauty_*)

-- Enums
CREATE TYPE public.events_provider_status AS ENUM ('pending','active','suspended');
CREATE TYPE public.events_offer_status AS ENUM ('draft','sent','accepted','declined','expired');
CREATE TYPE public.events_booking_status AS ENUM ('pending_payment','pending','confirmed','deposit_paid','in_progress','completed','cancelled','disputed','refunded');
CREATE TYPE public.events_extra_charge_status AS ENUM ('proposed','accepted','declined','paid');
CREATE TYPE public.events_message_kind AS ENUM ('text','offer','system','booking','extra_charge');

-- 1) events_providers
CREATE TABLE public.events_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  slug text UNIQUE NOT NULL,
  business_name text NOT NULL,
  categories text[] NOT NULL DEFAULT '{}',
  city text,
  country text,
  service_radius_km integer NOT NULL DEFAULT 50,
  bio text,
  cover_url text,
  avatar_url text,
  years_experience integer,
  languages text[] NOT NULL DEFAULT '{}',
  status public.events_provider_status NOT NULL DEFAULT 'pending',
  kyc_status text NOT NULL DEFAULT 'not_submitted',
  kyc_verified_at timestamptz,
  is_new boolean NOT NULL DEFAULT true,
  is_official boolean NOT NULL DEFAULT false,
  rating_avg numeric(3,2) NOT NULL DEFAULT 0,
  rating_count integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'XOF',
  min_deposit_pct integer NOT NULL DEFAULT 30,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events_providers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events_providers TO authenticated;
GRANT ALL ON public.events_providers TO service_role;
ALTER TABLE public.events_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active kyc vendors" ON public.events_providers
  FOR SELECT USING (status = 'active' AND kyc_verified_at IS NOT NULL);
CREATE POLICY "owner reads own" ON public.events_providers
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "owner inserts own" ON public.events_providers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner updates own" ON public.events_providers
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_events_providers_updated BEFORE UPDATE ON public.events_providers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) events_packages
CREATE TABLE public.events_packages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.events_providers(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text,
  price numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'XOF',
  duration_hours integer,
  guest_capacity integer,
  included jsonb NOT NULL DEFAULT '[]'::jsonb,
  cover_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events_packages TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events_packages TO authenticated;
GRANT ALL ON public.events_packages TO service_role;
ALTER TABLE public.events_packages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active packages" ON public.events_packages FOR SELECT USING (active = true);
CREATE POLICY "owner manages packages" ON public.events_packages
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events_providers p WHERE p.id = provider_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events_providers p WHERE p.id = provider_id AND p.user_id = auth.uid()));
CREATE TRIGGER trg_events_packages_updated BEFORE UPDATE ON public.events_packages
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) events_provider_media
CREATE TABLE public.events_provider_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.events_providers(id) ON DELETE CASCADE,
  url text NOT NULL,
  kind text NOT NULL DEFAULT 'photo',
  sort integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events_provider_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events_provider_media TO authenticated;
GRANT ALL ON public.events_provider_media TO service_role;
ALTER TABLE public.events_provider_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read events media" ON public.events_provider_media FOR SELECT USING (true);
CREATE POLICY "owner manages events media" ON public.events_provider_media
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events_providers p WHERE p.id = provider_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events_providers p WHERE p.id = provider_id AND p.user_id = auth.uid()));

-- 4) events_availability_blocks
CREATE TABLE public.events_availability_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.events_providers(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events_availability_blocks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events_availability_blocks TO authenticated;
GRANT ALL ON public.events_availability_blocks TO service_role;
ALTER TABLE public.events_availability_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads events blocks" ON public.events_availability_blocks FOR SELECT USING (true);
CREATE POLICY "owner manages events blocks" ON public.events_availability_blocks
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.events_providers p WHERE p.id = provider_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.events_providers p WHERE p.id = provider_id AND p.user_id = auth.uid()));

-- 5) events_conversations
CREATE TABLE public.events_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  provider_id uuid NOT NULL REFERENCES public.events_providers(id) ON DELETE CASCADE,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, provider_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events_conversations TO authenticated;
GRANT ALL ON public.events_conversations TO service_role;
ALTER TABLE public.events_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events participants read conv" ON public.events_conversations
  FOR SELECT TO authenticated USING (
    auth.uid() = client_id
    OR EXISTS (SELECT 1 FROM public.events_providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
  );
CREATE POLICY "events client inserts conv" ON public.events_conversations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE POLICY "events participants update conv" ON public.events_conversations
  FOR UPDATE TO authenticated USING (
    auth.uid() = client_id
    OR EXISTS (SELECT 1 FROM public.events_providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
  );
CREATE TRIGGER trg_events_conv_updated BEFORE UPDATE ON public.events_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6) events_messages
CREATE TABLE public.events_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.events_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text,
  kind public.events_message_kind NOT NULL DEFAULT 'text',
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  offer_id uuid,
  booking_id uuid,
  extra_charge_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events_messages TO authenticated;
GRANT ALL ON public.events_messages TO service_role;
ALTER TABLE public.events_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events participants read msgs" ON public.events_messages
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.events_conversations c
      LEFT JOIN public.events_providers p ON p.id = c.provider_id
      WHERE c.id = conversation_id
        AND (c.client_id = auth.uid() OR p.user_id = auth.uid())
    )
  );
CREATE POLICY "events participants send msgs" ON public.events_messages
  FOR INSERT TO authenticated WITH CHECK (
    sender_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.events_conversations c
      LEFT JOIN public.events_providers p ON p.id = c.provider_id
      WHERE c.id = conversation_id
        AND (c.client_id = auth.uid() OR p.user_id = auth.uid())
    )
  );

-- 7) events_chat_violations
CREATE TABLE public.events_chat_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.events_conversations(id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.events_messages(id) ON DELETE SET NULL,
  sender_id uuid NOT NULL,
  category text NOT NULL,
  severity text NOT NULL DEFAULT 'low',
  original_text text,
  redacted_text text,
  ai_analysis jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.events_chat_violations TO service_role;
ALTER TABLE public.events_chat_violations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service manages events violations" ON public.events_chat_violations FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 8) events_offers
CREATE TABLE public.events_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.events_conversations(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.events_providers(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  price numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'XOF',
  deposit_amount numeric(12,2),
  event_date timestamptz,
  venue_address text,
  guest_count integer,
  status public.events_offer_status NOT NULL DEFAULT 'sent',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events_offers TO authenticated;
GRANT ALL ON public.events_offers TO service_role;
ALTER TABLE public.events_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events participants read offers" ON public.events_offers
  FOR SELECT TO authenticated USING (
    auth.uid() = client_id
    OR EXISTS (SELECT 1 FROM public.events_providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
  );
CREATE POLICY "events vendor creates offers" ON public.events_offers
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.events_providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
  );
CREATE POLICY "events participants update offers" ON public.events_offers
  FOR UPDATE TO authenticated USING (
    auth.uid() = client_id
    OR EXISTS (SELECT 1 FROM public.events_providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
  );
CREATE TRIGGER trg_events_offers_updated BEFORE UPDATE ON public.events_offers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 9) events_bookings
CREATE TABLE public.events_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid REFERENCES public.events_offers(id) ON DELETE SET NULL,
  provider_id uuid NOT NULL REFERENCES public.events_providers(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  package_id uuid REFERENCES public.events_packages(id) ON DELETE SET NULL,
  event_date timestamptz,
  venue_address text,
  guest_count integer,
  price numeric(12,2) NOT NULL DEFAULT 0,
  deposit_paid numeric(12,2) NOT NULL DEFAULT 0,
  balance_due numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'XOF',
  status public.events_booking_status NOT NULL DEFAULT 'pending_payment',
  start_otp text,
  end_otp text,
  start_otp_verified_at timestamptz,
  end_otp_verified_at timestamptz,
  escrow_status text NOT NULL DEFAULT 'pending',
  gateway text,
  payment_intent_id text,
  notes text,
  confirmed_at timestamptz,
  started_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  auto_release_at timestamptz,
  commission numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events_bookings TO authenticated;
GRANT ALL ON public.events_bookings TO service_role;
ALTER TABLE public.events_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events participants read bookings" ON public.events_bookings
  FOR SELECT TO authenticated USING (
    auth.uid() = client_id
    OR EXISTS (SELECT 1 FROM public.events_providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
  );
CREATE POLICY "events client creates booking" ON public.events_bookings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE POLICY "events participants update booking" ON public.events_bookings
  FOR UPDATE TO authenticated USING (
    auth.uid() = client_id
    OR EXISTS (SELECT 1 FROM public.events_providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
  );
CREATE TRIGGER trg_events_bookings_updated BEFORE UPDATE ON public.events_bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 10) events_extra_charges
CREATE TABLE public.events_extra_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.events_bookings(id) ON DELETE CASCADE,
  provider_id uuid REFERENCES public.events_providers(id) ON DELETE CASCADE,
  client_id uuid,
  label text NOT NULL,
  description text,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'XOF',
  status public.events_extra_charge_status NOT NULL DEFAULT 'proposed',
  gateway text,
  payment_intent_id text,
  paid_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events_extra_charges TO authenticated;
GRANT ALL ON public.events_extra_charges TO service_role;
ALTER TABLE public.events_extra_charges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events participants read extras" ON public.events_extra_charges
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.events_bookings b
      LEFT JOIN public.events_providers p ON p.id = b.provider_id
      WHERE b.id = booking_id AND (b.client_id = auth.uid() OR p.user_id = auth.uid())
    )
  );
CREATE POLICY "events vendor creates extras" ON public.events_extra_charges
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events_bookings b
      JOIN public.events_providers p ON p.id = b.provider_id
      WHERE b.id = booking_id AND p.user_id = auth.uid()
    )
  );
CREATE POLICY "events participants update extras" ON public.events_extra_charges
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.events_bookings b
      LEFT JOIN public.events_providers p ON p.id = b.provider_id
      WHERE b.id = booking_id AND (b.client_id = auth.uid() OR p.user_id = auth.uid())
    )
  );
CREATE TRIGGER trg_events_extras_updated BEFORE UPDATE ON public.events_extra_charges
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 11) events_booking_events
CREATE TABLE public.events_booking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.events_bookings(id) ON DELETE CASCADE,
  kind text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.events_booking_events TO authenticated;
GRANT ALL ON public.events_booking_events TO service_role;
ALTER TABLE public.events_booking_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events participants read events" ON public.events_booking_events
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.events_bookings b
      LEFT JOIN public.events_providers p ON p.id = b.provider_id
      WHERE b.id = booking_id AND (b.client_id = auth.uid() OR p.user_id = auth.uid())
    )
  );
CREATE POLICY "events participants insert events" ON public.events_booking_events
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.events_bookings b
      LEFT JOIN public.events_providers p ON p.id = b.provider_id
      WHERE b.id = booking_id AND (b.client_id = auth.uid() OR p.user_id = auth.uid())
    )
  );

-- 12) events_reviews
CREATE TABLE public.events_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.events_bookings(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  provider_id uuid NOT NULL REFERENCES public.events_providers(id) ON DELETE CASCADE,
  rating smallint NOT NULL,
  comment text,
  provider_reply text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id)
);
GRANT SELECT ON public.events_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.events_reviews TO authenticated;
GRANT ALL ON public.events_reviews TO service_role;
ALTER TABLE public.events_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads events reviews" ON public.events_reviews FOR SELECT USING (true);
CREATE POLICY "events client writes review" ON public.events_reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE POLICY "events author or vendor updates review" ON public.events_reviews
  FOR UPDATE TO authenticated USING (
    auth.uid() = client_id
    OR EXISTS (SELECT 1 FROM public.events_providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
  );
CREATE TRIGGER trg_events_reviews_updated BEFORE UPDATE ON public.events_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 13) events_disputes
CREATE TABLE public.events_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.events_bookings(id) ON DELETE CASCADE,
  opened_by uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.events_disputes TO authenticated;
GRANT ALL ON public.events_disputes TO service_role;
ALTER TABLE public.events_disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "events participants read disputes" ON public.events_disputes
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.events_bookings b
      LEFT JOIN public.events_providers p ON p.id = b.provider_id
      WHERE b.id = booking_id AND (b.client_id = auth.uid() OR p.user_id = auth.uid())
    )
  );
CREATE POLICY "events participants open disputes" ON public.events_disputes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = opened_by);
CREATE TRIGGER trg_events_disputes_updated BEFORE UPDATE ON public.events_disputes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 14) events_provider_stats
CREATE TABLE public.events_provider_stats (
  provider_id uuid PRIMARY KEY REFERENCES public.events_providers(id) ON DELETE CASCADE,
  events_completed integer NOT NULL DEFAULT 0,
  events_cancelled integer NOT NULL DEFAULT 0,
  upcoming_count integer NOT NULL DEFAULT 0,
  revenue_30d numeric(14,2) NOT NULL DEFAULT 0,
  revenue_all_time numeric(14,2) NOT NULL DEFAULT 0,
  response_rate numeric(5,2) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.events_provider_stats TO anon;
GRANT SELECT ON public.events_provider_stats TO authenticated;
GRANT ALL ON public.events_provider_stats TO service_role;
ALTER TABLE public.events_provider_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads events stats" ON public.events_provider_stats FOR SELECT USING (true);

-- FKs for events_messages relation columns
ALTER TABLE public.events_messages
  ADD CONSTRAINT events_messages_offer_fk FOREIGN KEY (offer_id) REFERENCES public.events_offers(id) ON DELETE SET NULL,
  ADD CONSTRAINT events_messages_booking_fk FOREIGN KEY (booking_id) REFERENCES public.events_bookings(id) ON DELETE SET NULL,
  ADD CONSTRAINT events_messages_extra_fk FOREIGN KEY (extra_charge_id) REFERENCES public.events_extra_charges(id) ON DELETE SET NULL;

-- Rating recompute trigger
CREATE OR REPLACE FUNCTION public.recompute_events_provider_rating()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  _pid uuid := COALESCE(NEW.provider_id, OLD.provider_id);
  _avg numeric; _cnt integer;
BEGIN
  SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0), COUNT(*)
    INTO _avg, _cnt FROM public.events_reviews WHERE provider_id = _pid;
  UPDATE public.events_providers SET rating_avg = _avg, rating_count = _cnt WHERE id = _pid;
  RETURN COALESCE(NEW, OLD);
END; $$;
CREATE TRIGGER trg_events_reviews_recompute
  AFTER INSERT OR UPDATE OR DELETE ON public.events_reviews
  FOR EACH ROW EXECUTE FUNCTION public.recompute_events_provider_rating();

-- Realtime
ALTER PUBLICATION supabase_realtime ADD TABLE public.events_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events_bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events_offers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.events_conversations;

-- Indexes
CREATE INDEX idx_events_providers_status ON public.events_providers(status) WHERE status = 'active';
CREATE INDEX idx_events_providers_city ON public.events_providers(city);
CREATE INDEX idx_events_providers_categories ON public.events_providers USING gin(categories);
CREATE INDEX idx_events_packages_provider ON public.events_packages(provider_id);
CREATE INDEX idx_events_messages_conv ON public.events_messages(conversation_id, created_at DESC);
CREATE INDEX idx_events_conv_client ON public.events_conversations(client_id, last_message_at DESC);
CREATE INDEX idx_events_conv_provider ON public.events_conversations(provider_id, last_message_at DESC);
CREATE INDEX idx_events_bookings_provider ON public.events_bookings(provider_id, event_date);
CREATE INDEX idx_events_bookings_client ON public.events_bookings(client_id, event_date);
CREATE INDEX idx_events_bookings_status ON public.events_bookings(status);
CREATE INDEX idx_events_bookings_payment_intent ON public.events_bookings(payment_intent_id);
