
-- Extend church_events with ticketing fields
ALTER TABLE public.church_events
  ADD COLUMN IF NOT EXISTS price_cents integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS currency text NOT NULL DEFAULT 'XAF',
  ADD COLUMN IF NOT EXISTS capacity integer,
  ADD COLUMN IF NOT EXISTS tickets_sold integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS require_ticket boolean NOT NULL DEFAULT false;

-- Event tickets
CREATE TABLE IF NOT EXISTS public.church_event_tickets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.church_events(id) ON DELETE CASCADE,
  church_id uuid NOT NULL REFERENCES public.church_providers(id) ON DELETE CASCADE,
  buyer_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  buyer_name text NOT NULL,
  buyer_email text,
  buyer_phone text,
  qty integer NOT NULL DEFAULT 1 CHECK (qty > 0 AND qty <= 20),
  amount_cents integer NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'XAF',
  status text NOT NULL DEFAULT 'confirmed', -- pending | confirmed | cancelled | used
  payment_ref text,
  payment_provider text,
  ticket_code text NOT NULL DEFAULT gen_random_uuid()::text,
  checked_in_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS church_event_tickets_event_idx ON public.church_event_tickets(event_id);
CREATE INDEX IF NOT EXISTS church_event_tickets_church_idx ON public.church_event_tickets(church_id);
CREATE INDEX IF NOT EXISTS church_event_tickets_buyer_idx ON public.church_event_tickets(buyer_user_id);
CREATE UNIQUE INDEX IF NOT EXISTS church_event_tickets_code_uidx ON public.church_event_tickets(ticket_code);

GRANT SELECT, INSERT ON public.church_event_tickets TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.church_event_tickets TO authenticated;
GRANT ALL ON public.church_event_tickets TO service_role;

ALTER TABLE public.church_event_tickets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Church owner manages tickets"
  ON public.church_event_tickets FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.church_providers cp WHERE cp.id = church_event_tickets.church_id AND cp.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.church_providers cp WHERE cp.id = church_event_tickets.church_id AND cp.user_id = auth.uid()));

CREATE POLICY "Buyer reads own tickets"
  ON public.church_event_tickets FOR SELECT TO authenticated
  USING (buyer_user_id = auth.uid());

CREATE POLICY "Anyone can create ticket (free flow / init paid)"
  ON public.church_event_tickets FOR INSERT TO anon, authenticated
  WITH CHECK (true);

CREATE POLICY "Public can read confirmed ticket by code (for success page)"
  ON public.church_event_tickets FOR SELECT TO anon
  USING (status = 'confirmed');

-- Appointments with pastor
CREATE TABLE IF NOT EXISTS public.church_appointments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  church_id uuid NOT NULL REFERENCES public.church_providers(id) ON DELETE CASCADE,
  requester_user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  requester_name text NOT NULL,
  requester_phone text,
  requester_email text,
  subject text NOT NULL,
  message text,
  requested_at timestamptz NOT NULL,
  duration_min integer NOT NULL DEFAULT 30,
  status text NOT NULL DEFAULT 'new', -- new | confirmed | declined | done | cancelled
  staff_note text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS church_appointments_church_idx ON public.church_appointments(church_id, requested_at);
CREATE INDEX IF NOT EXISTS church_appointments_requester_idx ON public.church_appointments(requester_user_id);

GRANT SELECT, INSERT ON public.church_appointments TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.church_appointments TO authenticated;
GRANT ALL ON public.church_appointments TO service_role;

ALTER TABLE public.church_appointments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Church owner manages appointments"
  ON public.church_appointments FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.church_providers cp WHERE cp.id = church_appointments.church_id AND cp.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.church_providers cp WHERE cp.id = church_appointments.church_id AND cp.user_id = auth.uid()));

CREATE POLICY "Requester reads own appointments"
  ON public.church_appointments FOR SELECT TO authenticated
  USING (requester_user_id = auth.uid());

CREATE POLICY "Anyone can request an appointment"
  ON public.church_appointments FOR INSERT TO anon, authenticated
  WITH CHECK (true);

-- updated_at triggers
CREATE OR REPLACE FUNCTION public.church_touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

DROP TRIGGER IF EXISTS trg_church_event_tickets_updated ON public.church_event_tickets;
CREATE TRIGGER trg_church_event_tickets_updated
BEFORE UPDATE ON public.church_event_tickets
FOR EACH ROW EXECUTE FUNCTION public.church_touch_updated_at();

DROP TRIGGER IF EXISTS trg_church_appointments_updated ON public.church_appointments;
CREATE TRIGGER trg_church_appointments_updated
BEFORE UPDATE ON public.church_appointments
FOR EACH ROW EXECUTE FUNCTION public.church_touch_updated_at();
