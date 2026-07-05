
CREATE OR REPLACE FUNCTION public.beauty_set_updated_at() RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql SET search_path = public;

CREATE TABLE public.beauty_provider_media (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  provider_id UUID NOT NULL REFERENCES public.beauty_providers(id) ON DELETE CASCADE,
  kind TEXT NOT NULL CHECK (kind IN ('photo','video')),
  url TEXT,
  embed_url TEXT,
  caption TEXT,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_beauty_provider_media_provider ON public.beauty_provider_media(provider_id, position);

GRANT SELECT ON public.beauty_provider_media TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.beauty_provider_media TO authenticated;
GRANT ALL ON public.beauty_provider_media TO service_role;

ALTER TABLE public.beauty_provider_media ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view provider media" ON public.beauty_provider_media
  FOR SELECT USING (true);
CREATE POLICY "Providers manage own media" ON public.beauty_provider_media
  FOR ALL USING (EXISTS (SELECT 1 FROM public.beauty_providers p WHERE p.id = beauty_provider_media.provider_id AND p.user_id = auth.uid()))
  WITH CHECK (EXISTS (SELECT 1 FROM public.beauty_providers p WHERE p.id = beauty_provider_media.provider_id AND p.user_id = auth.uid()));

CREATE TABLE public.beauty_offers (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  conversation_id UUID NOT NULL REFERENCES public.beauty_conversations(id) ON DELETE CASCADE,
  provider_id UUID NOT NULL REFERENCES public.beauty_providers(id) ON DELETE CASCADE,
  client_id UUID NOT NULL,
  service_id UUID NOT NULL REFERENCES public.beauty_services(id) ON DELETE CASCADE,
  slot_start TIMESTAMPTZ NOT NULL,
  slot_end TIMESTAMPTZ NOT NULL,
  location_type TEXT NOT NULL CHECK (location_type IN ('salon','home')),
  address TEXT,
  note TEXT,
  price_amount INTEGER NOT NULL,
  currency TEXT NOT NULL DEFAULT 'XOF',
  status TEXT NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','accepted','declined','expired','cancelled')),
  booking_id UUID REFERENCES public.beauty_bookings(id) ON DELETE SET NULL,
  expires_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX idx_beauty_offers_conv ON public.beauty_offers(conversation_id, created_at DESC);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.beauty_offers TO authenticated;
GRANT ALL ON public.beauty_offers TO service_role;

ALTER TABLE public.beauty_offers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Participants view offers" ON public.beauty_offers FOR SELECT TO authenticated
  USING (client_id = auth.uid() OR EXISTS (SELECT 1 FROM public.beauty_providers p WHERE p.id = beauty_offers.provider_id AND p.user_id = auth.uid()));
CREATE POLICY "Provider creates offers" ON public.beauty_offers FOR INSERT TO authenticated
  WITH CHECK (EXISTS (SELECT 1 FROM public.beauty_providers p WHERE p.id = beauty_offers.provider_id AND p.user_id = auth.uid()));
CREATE POLICY "Participants update offers" ON public.beauty_offers FOR UPDATE TO authenticated
  USING (client_id = auth.uid() OR EXISTS (SELECT 1 FROM public.beauty_providers p WHERE p.id = beauty_offers.provider_id AND p.user_id = auth.uid()));

CREATE TRIGGER trg_beauty_offers_updated BEFORE UPDATE ON public.beauty_offers
  FOR EACH ROW EXECUTE FUNCTION public.beauty_set_updated_at();

ALTER TABLE public.beauty_messages
  ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'text',
  ADD COLUMN IF NOT EXISTS offer_id UUID REFERENCES public.beauty_offers(id) ON DELETE SET NULL;

ALTER PUBLICATION supabase_realtime ADD TABLE public.beauty_offers;
ALTER PUBLICATION supabase_realtime ADD TABLE public.beauty_provider_media;
