-- SiteViral Home — Phase 1 schema (mirrors beauty_* with home_* naming)

-- Enums
CREATE TYPE public.home_provider_status AS ENUM ('pending','active','suspended');
CREATE TYPE public.home_price_unit AS ENUM ('fixed','hourly','per_m2','quote');
CREATE TYPE public.home_offer_status AS ENUM ('draft','sent','accepted','declined','expired');
CREATE TYPE public.home_booking_status AS ENUM ('pending','confirmed','en_route','in_progress','completed','cancelled','disputed');
CREATE TYPE public.home_extra_charge_status AS ENUM ('proposed','accepted','declined','paid');
CREATE TYPE public.home_message_kind AS ENUM ('text','offer','system');

-- Reusable updated_at trigger fn (idempotent)
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- 1) home_providers
CREATE TABLE public.home_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  slug text UNIQUE NOT NULL,
  business_name text NOT NULL,
  categories text[] NOT NULL DEFAULT '{}',
  city text,
  country text,
  service_radius_km integer NOT NULL DEFAULT 15,
  bio text,
  cover_url text,
  avatar_url text,
  years_experience integer,
  languages text[] NOT NULL DEFAULT '{}',
  status public.home_provider_status NOT NULL DEFAULT 'pending',
  kyc_status text NOT NULL DEFAULT 'not_submitted',
  kyc_verified_at timestamptz,
  is_new boolean NOT NULL DEFAULT true,
  is_official boolean NOT NULL DEFAULT false,
  rating_avg numeric(3,2) NOT NULL DEFAULT 0,
  rating_count integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'XOF',
  base_call_out_fee numeric(12,2) NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.home_providers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_providers TO authenticated;
GRANT ALL ON public.home_providers TO service_role;
ALTER TABLE public.home_providers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active kyc providers" ON public.home_providers
  FOR SELECT USING (status = 'active' AND kyc_verified_at IS NOT NULL);
CREATE POLICY "owner reads own" ON public.home_providers
  FOR SELECT TO authenticated USING (auth.uid() = user_id);
CREATE POLICY "owner inserts own" ON public.home_providers
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "owner updates own" ON public.home_providers
  FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_home_providers_updated BEFORE UPDATE ON public.home_providers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 2) home_services
CREATE TABLE public.home_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.home_providers(id) ON DELETE CASCADE,
  title text NOT NULL,
  description text,
  category text,
  price_from numeric(12,2) NOT NULL DEFAULT 0,
  price_unit public.home_price_unit NOT NULL DEFAULT 'fixed',
  duration_minutes integer,
  cover_url text,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.home_services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_services TO authenticated;
GRANT ALL ON public.home_services TO service_role;
ALTER TABLE public.home_services ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read active services" ON public.home_services
  FOR SELECT USING (active = true);
CREATE POLICY "owner manages services" ON public.home_services
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.home_providers p WHERE p.id = provider_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.home_providers p WHERE p.id = provider_id AND p.user_id = auth.uid()));
CREATE TRIGGER trg_home_services_updated BEFORE UPDATE ON public.home_services
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 3) home_provider_media
CREATE TABLE public.home_provider_media (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.home_providers(id) ON DELETE CASCADE,
  url text NOT NULL,
  kind text NOT NULL DEFAULT 'photo',
  sort integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.home_provider_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_provider_media TO authenticated;
GRANT ALL ON public.home_provider_media TO service_role;
ALTER TABLE public.home_provider_media ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read media" ON public.home_provider_media FOR SELECT USING (true);
CREATE POLICY "owner manages media" ON public.home_provider_media
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.home_providers p WHERE p.id = provider_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.home_providers p WHERE p.id = provider_id AND p.user_id = auth.uid()));

-- 4) home_availability + blocks
CREATE TABLE public.home_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.home_providers(id) ON DELETE CASCADE,
  weekday smallint NOT NULL,
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.home_availability TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_availability TO authenticated;
GRANT ALL ON public.home_availability TO service_role;
ALTER TABLE public.home_availability ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public read availability" ON public.home_availability FOR SELECT USING (true);
CREATE POLICY "owner manages availability" ON public.home_availability
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.home_providers p WHERE p.id = provider_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.home_providers p WHERE p.id = provider_id AND p.user_id = auth.uid()));

CREATE TABLE public.home_availability_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.home_providers(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_availability_blocks TO authenticated;
GRANT ALL ON public.home_availability_blocks TO service_role;
ALTER TABLE public.home_availability_blocks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "owner manages blocks" ON public.home_availability_blocks
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.home_providers p WHERE p.id = provider_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.home_providers p WHERE p.id = provider_id AND p.user_id = auth.uid()));

-- 5) home_conversations
CREATE TABLE public.home_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  client_id uuid NOT NULL,
  provider_id uuid NOT NULL REFERENCES public.home_providers(id) ON DELETE CASCADE,
  last_message_at timestamptz NOT NULL DEFAULT now(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (client_id, provider_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_conversations TO authenticated;
GRANT ALL ON public.home_conversations TO service_role;
ALTER TABLE public.home_conversations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants read conv" ON public.home_conversations
  FOR SELECT TO authenticated USING (
    auth.uid() = client_id
    OR EXISTS (SELECT 1 FROM public.home_providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
  );
CREATE POLICY "client inserts conv" ON public.home_conversations
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE POLICY "participants update conv" ON public.home_conversations
  FOR UPDATE TO authenticated USING (
    auth.uid() = client_id
    OR EXISTS (SELECT 1 FROM public.home_providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
  );
CREATE TRIGGER trg_home_conv_updated BEFORE UPDATE ON public.home_conversations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 6) home_messages
CREATE TABLE public.home_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.home_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text,
  kind public.home_message_kind NOT NULL DEFAULT 'text',
  attachments jsonb NOT NULL DEFAULT '[]'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_messages TO authenticated;
GRANT ALL ON public.home_messages TO service_role;
ALTER TABLE public.home_messages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants read msgs" ON public.home_messages
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.home_conversations c
      LEFT JOIN public.home_providers p ON p.id = c.provider_id
      WHERE c.id = conversation_id
        AND (c.client_id = auth.uid() OR p.user_id = auth.uid())
    )
  );
CREATE POLICY "participants send msgs" ON public.home_messages
  FOR INSERT TO authenticated WITH CHECK (
    sender_id = auth.uid() AND EXISTS (
      SELECT 1 FROM public.home_conversations c
      LEFT JOIN public.home_providers p ON p.id = c.provider_id
      WHERE c.id = conversation_id
        AND (c.client_id = auth.uid() OR p.user_id = auth.uid())
    )
  );

-- 7) home_chat_violations
CREATE TABLE public.home_chat_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.home_conversations(id) ON DELETE CASCADE,
  message_id uuid REFERENCES public.home_messages(id) ON DELETE SET NULL,
  sender_id uuid NOT NULL,
  category text NOT NULL,
  severity text NOT NULL DEFAULT 'low',
  original_text text,
  redacted_text text,
  ai_analysis jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT ALL ON public.home_chat_violations TO service_role;
ALTER TABLE public.home_chat_violations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "service manages violations" ON public.home_chat_violations FOR ALL TO service_role USING (true) WITH CHECK (true);

-- 8) home_offers
CREATE TABLE public.home_offers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.home_conversations(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.home_providers(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  title text NOT NULL,
  description text,
  price numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'XOF',
  scheduled_for timestamptz,
  address text,
  status public.home_offer_status NOT NULL DEFAULT 'sent',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_offers TO authenticated;
GRANT ALL ON public.home_offers TO service_role;
ALTER TABLE public.home_offers ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants read offers" ON public.home_offers
  FOR SELECT TO authenticated USING (
    auth.uid() = client_id
    OR EXISTS (SELECT 1 FROM public.home_providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
  );
CREATE POLICY "provider creates offers" ON public.home_offers
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (SELECT 1 FROM public.home_providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
  );
CREATE POLICY "participants update offers" ON public.home_offers
  FOR UPDATE TO authenticated USING (
    auth.uid() = client_id
    OR EXISTS (SELECT 1 FROM public.home_providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
  );
CREATE TRIGGER trg_home_offers_updated BEFORE UPDATE ON public.home_offers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 9) home_bookings
CREATE TABLE public.home_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  offer_id uuid REFERENCES public.home_offers(id) ON DELETE SET NULL,
  provider_id uuid NOT NULL REFERENCES public.home_providers(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  service_id uuid REFERENCES public.home_services(id) ON DELETE SET NULL,
  address text,
  scheduled_for timestamptz,
  price numeric(12,2) NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'XOF',
  status public.home_booking_status NOT NULL DEFAULT 'pending',
  start_otp text,
  end_otp text,
  start_otp_verified_at timestamptz,
  end_otp_verified_at timestamptz,
  escrow_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_bookings TO authenticated;
GRANT ALL ON public.home_bookings TO service_role;
ALTER TABLE public.home_bookings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants read bookings" ON public.home_bookings
  FOR SELECT TO authenticated USING (
    auth.uid() = client_id
    OR EXISTS (SELECT 1 FROM public.home_providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
  );
CREATE POLICY "client creates booking" ON public.home_bookings
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE POLICY "participants update booking" ON public.home_bookings
  FOR UPDATE TO authenticated USING (
    auth.uid() = client_id
    OR EXISTS (SELECT 1 FROM public.home_providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
  );
CREATE TRIGGER trg_home_bookings_updated BEFORE UPDATE ON public.home_bookings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 10) home_extra_charges
CREATE TABLE public.home_extra_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.home_bookings(id) ON DELETE CASCADE,
  label text NOT NULL,
  amount numeric(12,2) NOT NULL,
  currency text NOT NULL DEFAULT 'XOF',
  status public.home_extra_charge_status NOT NULL DEFAULT 'proposed',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_extra_charges TO authenticated;
GRANT ALL ON public.home_extra_charges TO service_role;
ALTER TABLE public.home_extra_charges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants read extras" ON public.home_extra_charges
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.home_bookings b
      LEFT JOIN public.home_providers p ON p.id = b.provider_id
      WHERE b.id = booking_id AND (b.client_id = auth.uid() OR p.user_id = auth.uid())
    )
  );
CREATE POLICY "provider creates extras" ON public.home_extra_charges
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.home_bookings b
      JOIN public.home_providers p ON p.id = b.provider_id
      WHERE b.id = booking_id AND p.user_id = auth.uid()
    )
  );
CREATE POLICY "participants update extras" ON public.home_extra_charges
  FOR UPDATE TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.home_bookings b
      LEFT JOIN public.home_providers p ON p.id = b.provider_id
      WHERE b.id = booking_id AND (b.client_id = auth.uid() OR p.user_id = auth.uid())
    )
  );
CREATE TRIGGER trg_home_extras_updated BEFORE UPDATE ON public.home_extra_charges
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 11) home_booking_events
CREATE TABLE public.home_booking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.home_bookings(id) ON DELETE CASCADE,
  kind text NOT NULL,
  meta jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.home_booking_events TO authenticated;
GRANT ALL ON public.home_booking_events TO service_role;
ALTER TABLE public.home_booking_events ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants read events" ON public.home_booking_events
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.home_bookings b
      LEFT JOIN public.home_providers p ON p.id = b.provider_id
      WHERE b.id = booking_id AND (b.client_id = auth.uid() OR p.user_id = auth.uid())
    )
  );
CREATE POLICY "participants insert events" ON public.home_booking_events
  FOR INSERT TO authenticated WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.home_bookings b
      LEFT JOIN public.home_providers p ON p.id = b.provider_id
      WHERE b.id = booking_id AND (b.client_id = auth.uid() OR p.user_id = auth.uid())
    )
  );

-- 12) home_reviews
CREATE TABLE public.home_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.home_bookings(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  provider_id uuid NOT NULL REFERENCES public.home_providers(id) ON DELETE CASCADE,
  rating smallint NOT NULL,
  comment text,
  provider_reply text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (booking_id)
);
GRANT SELECT ON public.home_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.home_reviews TO authenticated;
GRANT ALL ON public.home_reviews TO service_role;
ALTER TABLE public.home_reviews ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads reviews" ON public.home_reviews FOR SELECT USING (true);
CREATE POLICY "client writes review" ON public.home_reviews
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = client_id);
CREATE POLICY "author or provider updates review" ON public.home_reviews
  FOR UPDATE TO authenticated USING (
    auth.uid() = client_id
    OR EXISTS (SELECT 1 FROM public.home_providers p WHERE p.id = provider_id AND p.user_id = auth.uid())
  );
CREATE TRIGGER trg_home_reviews_updated BEFORE UPDATE ON public.home_reviews
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 13) home_disputes
CREATE TABLE public.home_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.home_bookings(id) ON DELETE CASCADE,
  opened_by uuid NOT NULL,
  reason text NOT NULL,
  status text NOT NULL DEFAULT 'open',
  resolution text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.home_disputes TO authenticated;
GRANT ALL ON public.home_disputes TO service_role;
ALTER TABLE public.home_disputes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "participants read disputes" ON public.home_disputes
  FOR SELECT TO authenticated USING (
    EXISTS (
      SELECT 1 FROM public.home_bookings b
      LEFT JOIN public.home_providers p ON p.id = b.provider_id
      WHERE b.id = booking_id AND (b.client_id = auth.uid() OR p.user_id = auth.uid())
    )
  );
CREATE POLICY "participants open disputes" ON public.home_disputes
  FOR INSERT TO authenticated WITH CHECK (auth.uid() = opened_by);
CREATE TRIGGER trg_home_disputes_updated BEFORE UPDATE ON public.home_disputes
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- 14) home_provider_stats (denormalized cache)
CREATE TABLE public.home_provider_stats (
  provider_id uuid PRIMARY KEY REFERENCES public.home_providers(id) ON DELETE CASCADE,
  jobs_completed integer NOT NULL DEFAULT 0,
  jobs_cancelled integer NOT NULL DEFAULT 0,
  revenue_30d numeric(14,2) NOT NULL DEFAULT 0,
  revenue_all_time numeric(14,2) NOT NULL DEFAULT 0,
  response_rate numeric(5,2) NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.home_provider_stats TO anon;
GRANT SELECT ON public.home_provider_stats TO authenticated;
GRANT ALL ON public.home_provider_stats TO service_role;
ALTER TABLE public.home_provider_stats ENABLE ROW LEVEL SECURITY;
CREATE POLICY "public reads stats" ON public.home_provider_stats FOR SELECT USING (true);

-- Realtime for messages + bookings + offers
ALTER PUBLICATION supabase_realtime ADD TABLE public.home_messages;
ALTER PUBLICATION supabase_realtime ADD TABLE public.home_bookings;
ALTER PUBLICATION supabase_realtime ADD TABLE public.home_offers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.home_conversations;

-- Indexes
CREATE INDEX idx_home_providers_status ON public.home_providers(status) WHERE status = 'active';
CREATE INDEX idx_home_providers_city ON public.home_providers(city);
CREATE INDEX idx_home_providers_categories ON public.home_providers USING gin(categories);
CREATE INDEX idx_home_services_provider ON public.home_services(provider_id);
CREATE INDEX idx_home_messages_conv ON public.home_messages(conversation_id, created_at DESC);
CREATE INDEX idx_home_conv_client ON public.home_conversations(client_id, last_message_at DESC);
CREATE INDEX idx_home_conv_provider ON public.home_conversations(provider_id, last_message_at DESC);
CREATE INDEX idx_home_bookings_provider ON public.home_bookings(provider_id, scheduled_for);
CREATE INDEX idx_home_bookings_client ON public.home_bookings(client_id, scheduled_for);