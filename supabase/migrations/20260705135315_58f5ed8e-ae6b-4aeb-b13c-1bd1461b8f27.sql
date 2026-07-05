
ALTER TABLE public.beauty_services
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'XOF',
  ADD COLUMN IF NOT EXISTS price_amount INTEGER;

UPDATE public.beauty_services SET price_amount = COALESCE(price_amount, price_xof) WHERE price_amount IS NULL;

ALTER TABLE public.beauty_bookings
  ADD COLUMN IF NOT EXISTS currency TEXT NOT NULL DEFAULT 'XOF',
  ADD COLUMN IF NOT EXISTS price_amount INTEGER,
  ADD COLUMN IF NOT EXISTS commission_amount INTEGER;

UPDATE public.beauty_bookings SET price_amount = COALESCE(price_amount, price_xof) WHERE price_amount IS NULL;
UPDATE public.beauty_bookings SET commission_amount = COALESCE(commission_amount, commission_xof) WHERE commission_amount IS NULL;

CREATE INDEX IF NOT EXISTS idx_beauty_providers_status_city ON public.beauty_providers(status, city);
CREATE INDEX IF NOT EXISTS idx_beauty_services_provider_active ON public.beauty_services(provider_id, active);
CREATE INDEX IF NOT EXISTS idx_beauty_bookings_provider_start ON public.beauty_bookings(provider_id, slot_start);
CREATE INDEX IF NOT EXISTS idx_beauty_bookings_client_start ON public.beauty_bookings(client_id, slot_start);
