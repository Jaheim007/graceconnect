
CREATE TABLE IF NOT EXISTS public.beauty_extra_charges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  booking_id uuid NOT NULL REFERENCES public.beauty_bookings(id) ON DELETE CASCADE,
  provider_id uuid NOT NULL REFERENCES public.beauty_providers(id) ON DELETE CASCADE,
  client_id uuid NOT NULL,
  amount integer NOT NULL CHECK (amount >= 100),
  currency text NOT NULL DEFAULT 'XOF',
  description text NOT NULL,
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','accepted','declined','expired','paid','cancelled')),
  payment_intent_id text,
  gateway text,
  paid_at timestamptz,
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '30 minutes'),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.beauty_extra_charges TO authenticated;
GRANT ALL ON public.beauty_extra_charges TO service_role;

ALTER TABLE public.beauty_extra_charges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants can read extra charges"
ON public.beauty_extra_charges FOR SELECT TO authenticated
USING (
  client_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.beauty_providers bp
    WHERE bp.id = beauty_extra_charges.provider_id AND bp.user_id = auth.uid()
  )
);

CREATE POLICY "Provider can create extra charge"
ON public.beauty_extra_charges FOR INSERT TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.beauty_providers bp
    WHERE bp.id = beauty_extra_charges.provider_id AND bp.user_id = auth.uid()
  )
);

CREATE POLICY "Participants can update extra charge"
ON public.beauty_extra_charges FOR UPDATE TO authenticated
USING (
  client_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.beauty_providers bp
    WHERE bp.id = beauty_extra_charges.provider_id AND bp.user_id = auth.uid()
  )
);

-- Link chat messages to an extra-charge request (so the message renders as a card)
ALTER TABLE public.beauty_messages
  ADD COLUMN IF NOT EXISTS extra_charge_id uuid REFERENCES public.beauty_extra_charges(id) ON DELETE SET NULL;

-- Also widen 'kind' check if it's constrained
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conname = 'beauty_messages_kind_check'
       AND conrelid = 'public.beauty_messages'::regclass
  ) THEN
    ALTER TABLE public.beauty_messages DROP CONSTRAINT beauty_messages_kind_check;
  END IF;
  ALTER TABLE public.beauty_messages
    ADD CONSTRAINT beauty_messages_kind_check
    CHECK (kind IN ('text','offer','extra_charge','system'));
EXCEPTION WHEN undefined_column THEN
  NULL;
END $$;

-- Updated-at trigger
CREATE OR REPLACE FUNCTION public._beauty_extra_charges_touch()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;
DROP TRIGGER IF EXISTS beauty_extra_charges_touch ON public.beauty_extra_charges;
CREATE TRIGGER beauty_extra_charges_touch
  BEFORE UPDATE ON public.beauty_extra_charges
  FOR EACH ROW EXECUTE FUNCTION public._beauty_extra_charges_touch();

ALTER PUBLICATION supabase_realtime ADD TABLE public.beauty_extra_charges;
