-- 1) Enum additions
ALTER TYPE public.home_booking_status ADD VALUE IF NOT EXISTS 'pending_payment' BEFORE 'pending';
ALTER TYPE public.home_booking_status ADD VALUE IF NOT EXISTS 'refunded';
ALTER TYPE public.home_message_kind ADD VALUE IF NOT EXISTS 'extra_charge';
ALTER TYPE public.home_message_kind ADD VALUE IF NOT EXISTS 'booking';

-- 2) home_bookings — new columns for payment + lifecycle
ALTER TABLE public.home_bookings
  ADD COLUMN IF NOT EXISTS notes text,
  ADD COLUMN IF NOT EXISTS gateway text,
  ADD COLUMN IF NOT EXISTS payment_intent_id text,
  ADD COLUMN IF NOT EXISTS confirmed_at timestamptz,
  ADD COLUMN IF NOT EXISTS started_at timestamptz,
  ADD COLUMN IF NOT EXISTS completed_at timestamptz,
  ADD COLUMN IF NOT EXISTS cancelled_at timestamptz,
  ADD COLUMN IF NOT EXISTS auto_release_at timestamptz,
  ADD COLUMN IF NOT EXISTS commission numeric(12,2) NOT NULL DEFAULT 0;

CREATE INDEX IF NOT EXISTS idx_home_bookings_status ON public.home_bookings(status);
CREATE INDEX IF NOT EXISTS idx_home_bookings_payment_intent ON public.home_bookings(payment_intent_id);

-- 3) home_extra_charges — align with beauty_extra_charges shape
ALTER TABLE public.home_extra_charges
  ADD COLUMN IF NOT EXISTS provider_id uuid REFERENCES public.home_providers(id) ON DELETE CASCADE,
  ADD COLUMN IF NOT EXISTS client_id uuid,
  ADD COLUMN IF NOT EXISTS description text,
  ADD COLUMN IF NOT EXISTS gateway text,
  ADD COLUMN IF NOT EXISTS payment_intent_id text,
  ADD COLUMN IF NOT EXISTS paid_at timestamptz,
  ADD COLUMN IF NOT EXISTS expires_at timestamptz NOT NULL DEFAULT (now() + interval '24 hours');

-- 4) home_messages — link to offer / extra charge / booking rows
ALTER TABLE public.home_messages
  ADD COLUMN IF NOT EXISTS offer_id uuid REFERENCES public.home_offers(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS extra_charge_id uuid REFERENCES public.home_extra_charges(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS booking_id uuid REFERENCES public.home_bookings(id) ON DELETE SET NULL;

-- 5) Ratings maintenance — recompute provider rating cache after a review write
CREATE OR REPLACE FUNCTION public.recompute_home_provider_rating()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _pid uuid := COALESCE(NEW.provider_id, OLD.provider_id);
  _avg numeric;
  _cnt integer;
BEGIN
  SELECT COALESCE(ROUND(AVG(rating)::numeric, 2), 0), COUNT(*)
    INTO _avg, _cnt
  FROM public.home_reviews
  WHERE provider_id = _pid;

  UPDATE public.home_providers
     SET rating_avg = _avg,
         rating_count = _cnt
   WHERE id = _pid;

  RETURN NULL;
END;
$$;

DROP TRIGGER IF EXISTS trg_home_reviews_rating ON public.home_reviews;
CREATE TRIGGER trg_home_reviews_rating
AFTER INSERT OR UPDATE OR DELETE ON public.home_reviews
FOR EACH ROW EXECUTE FUNCTION public.recompute_home_provider_rating();
