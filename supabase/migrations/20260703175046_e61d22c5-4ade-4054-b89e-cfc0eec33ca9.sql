
-- Enums
DO $$ BEGIN
  CREATE TYPE public.beauty_provider_status AS ENUM ('pending','active','suspended');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.beauty_booking_status AS ENUM (
    'pending_payment','confirmed','in_progress','completed',
    'cancelled','no_show','disputed','refunded'
  );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.beauty_booking_mode AS ENUM ('escrow','deposit','cash');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.beauty_location_type AS ENUM ('salon','home');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.beauty_dispute_status AS ENUM ('open','investigating','resolved','rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE OR REPLACE FUNCTION public.beauty_touch_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

-- beauty_providers
CREATE TABLE public.beauty_providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE,
  business_name text NOT NULL,
  slug text NOT NULL UNIQUE,
  bio text,
  avatar_url text,
  cover_url text,
  phone text,
  city text DEFAULT 'Abidjan',
  zones text[] NOT NULL DEFAULT '{}',
  home_service_ok boolean NOT NULL DEFAULT false,
  at_salon_ok boolean NOT NULL DEFAULT true,
  trust_score numeric NOT NULL DEFAULT 0,
  response_time_avg_min integer NOT NULL DEFAULT 0,
  avg_rating numeric NOT NULL DEFAULT 0,
  total_reviews integer NOT NULL DEFAULT 0,
  total_bookings integer NOT NULL DEFAULT 0,
  status public.beauty_provider_status NOT NULL DEFAULT 'pending',
  kyc_submission_id uuid,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.beauty_providers TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.beauty_providers TO authenticated;
GRANT ALL ON public.beauty_providers TO service_role;
ALTER TABLE public.beauty_providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active providers are public"
  ON public.beauty_providers FOR SELECT
  USING (status = 'active' OR user_id = auth.uid() OR public.is_superadmin(auth.uid()));

CREATE POLICY "Provider creates own profile"
  ON public.beauty_providers FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Provider updates own profile"
  ON public.beauty_providers FOR UPDATE TO authenticated
  USING (user_id = auth.uid() OR public.is_superadmin(auth.uid()))
  WITH CHECK (user_id = auth.uid() OR public.is_superadmin(auth.uid()));

CREATE POLICY "Admin deletes providers"
  ON public.beauty_providers FOR DELETE TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE TRIGGER trg_beauty_providers_updated
  BEFORE UPDATE ON public.beauty_providers
  FOR EACH ROW EXECUTE FUNCTION public.beauty_touch_updated_at();

-- beauty_services
CREATE TABLE public.beauty_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.beauty_providers(id) ON DELETE CASCADE,
  category text NOT NULL,
  title text NOT NULL,
  description text,
  duration_min integer NOT NULL DEFAULT 60,
  price_xof integer NOT NULL,
  allow_full_escrow boolean NOT NULL DEFAULT true,
  allow_deposit boolean NOT NULL DEFAULT true,
  deposit_pct integer NOT NULL DEFAULT 20,
  allow_cash boolean NOT NULL DEFAULT false,
  at_salon boolean NOT NULL DEFAULT true,
  at_home boolean NOT NULL DEFAULT false,
  images text[] NOT NULL DEFAULT '{}',
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.beauty_services TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.beauty_services TO authenticated;
GRANT ALL ON public.beauty_services TO service_role;
ALTER TABLE public.beauty_services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Active services are public"
  ON public.beauty_services FOR SELECT
  USING (
    active = true
    OR provider_id IN (SELECT id FROM public.beauty_providers WHERE user_id = auth.uid())
    OR public.is_superadmin(auth.uid())
  );

CREATE POLICY "Provider manages own services"
  ON public.beauty_services FOR ALL TO authenticated
  USING (provider_id IN (SELECT id FROM public.beauty_providers WHERE user_id = auth.uid())
         OR public.is_superadmin(auth.uid()))
  WITH CHECK (provider_id IN (SELECT id FROM public.beauty_providers WHERE user_id = auth.uid())
              OR public.is_superadmin(auth.uid()));

CREATE TRIGGER trg_beauty_services_updated
  BEFORE UPDATE ON public.beauty_services
  FOR EACH ROW EXECUTE FUNCTION public.beauty_touch_updated_at();

-- beauty_availability
CREATE TABLE public.beauty_availability (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.beauty_providers(id) ON DELETE CASCADE,
  weekday smallint NOT NULL CHECK (weekday BETWEEN 0 AND 6),
  start_time time NOT NULL,
  end_time time NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.beauty_availability TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.beauty_availability TO authenticated;
GRANT ALL ON public.beauty_availability TO service_role;
ALTER TABLE public.beauty_availability ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Availability public read" ON public.beauty_availability FOR SELECT USING (true);
CREATE POLICY "Provider manages availability"
  ON public.beauty_availability FOR ALL TO authenticated
  USING (provider_id IN (SELECT id FROM public.beauty_providers WHERE user_id = auth.uid())
         OR public.is_superadmin(auth.uid()))
  WITH CHECK (provider_id IN (SELECT id FROM public.beauty_providers WHERE user_id = auth.uid())
              OR public.is_superadmin(auth.uid()));

-- beauty_availability_blocks
CREATE TABLE public.beauty_availability_blocks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_id uuid NOT NULL REFERENCES public.beauty_providers(id) ON DELETE CASCADE,
  starts_at timestamptz NOT NULL,
  ends_at timestamptz NOT NULL,
  reason text,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.beauty_availability_blocks TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.beauty_availability_blocks TO authenticated;
GRANT ALL ON public.beauty_availability_blocks TO service_role;
ALTER TABLE public.beauty_availability_blocks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Blocks public read" ON public.beauty_availability_blocks FOR SELECT USING (true);
CREATE POLICY "Provider manages blocks"
  ON public.beauty_availability_blocks FOR ALL TO authenticated
  USING (provider_id IN (SELECT id FROM public.beauty_providers WHERE user_id = auth.uid())
         OR public.is_superadmin(auth.uid()))
  WITH CHECK (provider_id IN (SELECT id FROM public.beauty_providers WHERE user_id = auth.uid())
              OR public.is_superadmin(auth.uid()));

-- beauty_bookings
CREATE TABLE public.beauty_bookings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.beauty_services(id) ON DELETE RESTRICT,
  provider_id uuid NOT NULL REFERENCES public.beauty_providers(id) ON DELETE RESTRICT,
  client_id uuid NOT NULL,
  slot_start timestamptz NOT NULL,
  slot_end timestamptz NOT NULL,
  location_type public.beauty_location_type NOT NULL DEFAULT 'salon',
  address text,
  mode public.beauty_booking_mode NOT NULL,
  price_xof integer NOT NULL,
  deposit_xof integer NOT NULL DEFAULT 0,
  commission_xof integer NOT NULL DEFAULT 0,
  tip_xof integer NOT NULL DEFAULT 0,
  status public.beauty_booking_status NOT NULL DEFAULT 'pending_payment',
  payment_intent_id text,
  gateway text,
  auto_release_at timestamptz,
  confirmed_at timestamptz,
  completed_at timestamptz,
  cancelled_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_beauty_bookings_client ON public.beauty_bookings(client_id);
CREATE INDEX idx_beauty_bookings_provider ON public.beauty_bookings(provider_id);
CREATE INDEX idx_beauty_bookings_status ON public.beauty_bookings(status);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.beauty_bookings TO authenticated;
GRANT ALL ON public.beauty_bookings TO service_role;
ALTER TABLE public.beauty_bookings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Booking parties read"
  ON public.beauty_bookings FOR SELECT TO authenticated
  USING (
    client_id = auth.uid()
    OR provider_id IN (SELECT id FROM public.beauty_providers WHERE user_id = auth.uid())
    OR public.is_superadmin(auth.uid())
  );

CREATE POLICY "Client creates booking"
  ON public.beauty_bookings FOR INSERT TO authenticated
  WITH CHECK (client_id = auth.uid());

CREATE POLICY "Parties update booking"
  ON public.beauty_bookings FOR UPDATE TO authenticated
  USING (
    client_id = auth.uid()
    OR provider_id IN (SELECT id FROM public.beauty_providers WHERE user_id = auth.uid())
    OR public.is_superadmin(auth.uid())
  );

CREATE TRIGGER trg_beauty_bookings_updated
  BEFORE UPDATE ON public.beauty_bookings
  FOR EACH ROW EXECUTE FUNCTION public.beauty_touch_updated_at();

-- beauty_booking_events
CREATE TABLE public.beauty_booking_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.beauty_bookings(id) ON DELETE CASCADE,
  actor_id uuid,
  event_type text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT ON public.beauty_booking_events TO authenticated;
GRANT ALL ON public.beauty_booking_events TO service_role;
ALTER TABLE public.beauty_booking_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties read events"
  ON public.beauty_booking_events FOR SELECT TO authenticated
  USING (
    booking_id IN (
      SELECT id FROM public.beauty_bookings
      WHERE client_id = auth.uid()
         OR provider_id IN (SELECT id FROM public.beauty_providers WHERE user_id = auth.uid())
    ) OR public.is_superadmin(auth.uid())
  );

CREATE POLICY "Parties add events"
  ON public.beauty_booking_events FOR INSERT TO authenticated
  WITH CHECK (
    booking_id IN (
      SELECT id FROM public.beauty_bookings
      WHERE client_id = auth.uid()
         OR provider_id IN (SELECT id FROM public.beauty_providers WHERE user_id = auth.uid())
    ) OR public.is_superadmin(auth.uid())
  );

-- beauty_conversations
CREATE TABLE public.beauty_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid REFERENCES public.beauty_bookings(id) ON DELETE SET NULL,
  provider_id uuid NOT NULL REFERENCES public.beauty_providers(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  last_message_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (provider_id, client_id, booking_id)
);
GRANT SELECT, INSERT, UPDATE ON public.beauty_conversations TO authenticated;
GRANT ALL ON public.beauty_conversations TO service_role;
ALTER TABLE public.beauty_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties read conversations"
  ON public.beauty_conversations FOR SELECT TO authenticated
  USING (
    client_id = auth.uid()
    OR provider_id IN (SELECT id FROM public.beauty_providers WHERE user_id = auth.uid())
    OR public.is_superadmin(auth.uid())
  );

CREATE POLICY "Parties create conversation"
  ON public.beauty_conversations FOR INSERT TO authenticated
  WITH CHECK (
    client_id = auth.uid()
    OR provider_id IN (SELECT id FROM public.beauty_providers WHERE user_id = auth.uid())
  );

CREATE POLICY "Parties update conversation"
  ON public.beauty_conversations FOR UPDATE TO authenticated
  USING (
    client_id = auth.uid()
    OR provider_id IN (SELECT id FROM public.beauty_providers WHERE user_id = auth.uid())
    OR public.is_superadmin(auth.uid())
  );

-- beauty_messages
CREATE TABLE public.beauty_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.beauty_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  body text NOT NULL,
  redacted_body text NOT NULL,
  contains_contact_attempt boolean NOT NULL DEFAULT false,
  read_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX idx_beauty_messages_conv ON public.beauty_messages(conversation_id, created_at);
GRANT SELECT, INSERT, UPDATE ON public.beauty_messages TO authenticated;
GRANT ALL ON public.beauty_messages TO service_role;
ALTER TABLE public.beauty_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties read messages"
  ON public.beauty_messages FOR SELECT TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM public.beauty_conversations
      WHERE client_id = auth.uid()
         OR provider_id IN (SELECT id FROM public.beauty_providers WHERE user_id = auth.uid())
    ) OR public.is_superadmin(auth.uid())
  );

CREATE POLICY "Sender inserts message"
  ON public.beauty_messages FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid() AND
    conversation_id IN (
      SELECT id FROM public.beauty_conversations
      WHERE client_id = auth.uid()
         OR provider_id IN (SELECT id FROM public.beauty_providers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Recipient marks read"
  ON public.beauty_messages FOR UPDATE TO authenticated
  USING (
    conversation_id IN (
      SELECT id FROM public.beauty_conversations
      WHERE client_id = auth.uid()
         OR provider_id IN (SELECT id FROM public.beauty_providers WHERE user_id = auth.uid())
    )
  );

-- beauty_reviews
CREATE TABLE public.beauty_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL UNIQUE REFERENCES public.beauty_bookings(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  provider_id uuid NOT NULL REFERENCES public.beauty_providers(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating BETWEEN 1 AND 5),
  title text,
  body text,
  tip_xof integer NOT NULL DEFAULT 0,
  provider_reply text,
  provider_reply_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.beauty_reviews TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.beauty_reviews TO authenticated;
GRANT ALL ON public.beauty_reviews TO service_role;
ALTER TABLE public.beauty_reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Reviews public read" ON public.beauty_reviews FOR SELECT USING (true);
CREATE POLICY "Client writes review"
  ON public.beauty_reviews FOR INSERT TO authenticated
  WITH CHECK (client_id = auth.uid());
CREATE POLICY "Client edits or provider replies"
  ON public.beauty_reviews FOR UPDATE TO authenticated
  USING (
    client_id = auth.uid()
    OR provider_id IN (SELECT id FROM public.beauty_providers WHERE user_id = auth.uid())
    OR public.is_superadmin(auth.uid())
  );

CREATE TRIGGER trg_beauty_reviews_updated
  BEFORE UPDATE ON public.beauty_reviews
  FOR EACH ROW EXECUTE FUNCTION public.beauty_touch_updated_at();

-- beauty_disputes
CREATE TABLE public.beauty_disputes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.beauty_bookings(id) ON DELETE CASCADE,
  opened_by uuid NOT NULL,
  reason text NOT NULL,
  evidence text[] NOT NULL DEFAULT '{}',
  status public.beauty_dispute_status NOT NULL DEFAULT 'open',
  resolution text,
  resolved_by uuid,
  resolved_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.beauty_disputes TO authenticated;
GRANT ALL ON public.beauty_disputes TO service_role;
ALTER TABLE public.beauty_disputes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Parties read disputes"
  ON public.beauty_disputes FOR SELECT TO authenticated
  USING (
    booking_id IN (
      SELECT id FROM public.beauty_bookings
      WHERE client_id = auth.uid()
         OR provider_id IN (SELECT id FROM public.beauty_providers WHERE user_id = auth.uid())
    ) OR public.is_superadmin(auth.uid())
  );

CREATE POLICY "Party opens dispute"
  ON public.beauty_disputes FOR INSERT TO authenticated
  WITH CHECK (
    opened_by = auth.uid() AND
    booking_id IN (
      SELECT id FROM public.beauty_bookings
      WHERE client_id = auth.uid()
         OR provider_id IN (SELECT id FROM public.beauty_providers WHERE user_id = auth.uid())
    )
  );

CREATE POLICY "Admin resolves dispute"
  ON public.beauty_disputes FOR UPDATE TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE TRIGGER trg_beauty_disputes_updated
  BEFORE UPDATE ON public.beauty_disputes
  FOR EACH ROW EXECUTE FUNCTION public.beauty_touch_updated_at();
