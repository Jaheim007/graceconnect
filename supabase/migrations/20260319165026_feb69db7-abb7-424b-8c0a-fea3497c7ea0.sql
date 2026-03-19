
-- Webhooks system for outgoing events (Pulse)
CREATE TABLE IF NOT EXISTS public.org_webhooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL DEFAULT 'Webhook',
  url text NOT NULL,
  secret text NOT NULL DEFAULT encode(gen_random_bytes(32), 'hex'),
  events text[] NOT NULL DEFAULT '{}',
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.webhook_deliveries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  webhook_id uuid NOT NULL REFERENCES public.org_webhooks(id) ON DELETE CASCADE,
  event text NOT NULL,
  payload jsonb NOT NULL DEFAULT '{}',
  status text NOT NULL DEFAULT 'pending',
  response_code int,
  response_body text,
  attempts int NOT NULL DEFAULT 0,
  max_attempts int NOT NULL DEFAULT 3,
  next_retry_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz
);

-- Popup / banner marketing tables
CREATE TABLE IF NOT EXISTS public.org_popups (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  popup_type text NOT NULL DEFAULT 'popup',
  title text NOT NULL,
  body text,
  cta_text text,
  cta_link text,
  image_url text,
  trigger_type text NOT NULL DEFAULT 'time',
  delay_seconds int NOT NULL DEFAULT 5,
  bg_color text,
  text_color text,
  is_active boolean NOT NULL DEFAULT false,
  show_once boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.org_banners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  text text NOT NULL,
  bg_color text NOT NULL DEFAULT '#d4920a',
  text_color text NOT NULL DEFAULT '#ffffff',
  link text,
  position text NOT NULL DEFAULT 'top',
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- SEO fields for products and orgs
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS seo_title text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS seo_description text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS seo_image text;

ALTER TABLE public.digital_products ADD COLUMN IF NOT EXISTS seo_title text;
ALTER TABLE public.digital_products ADD COLUMN IF NOT EXISTS seo_description text;

-- Product page sections (sales page builder)
CREATE TABLE IF NOT EXISTS public.product_page_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  section_type text NOT NULL,
  content_json jsonb NOT NULL DEFAULT '{}',
  display_order int NOT NULL DEFAULT 0,
  is_visible boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Promo code enhancements
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS product_ids text[];
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS min_amount numeric;
ALTER TABLE public.promo_codes ADD COLUMN IF NOT EXISTS first_purchase_only boolean DEFAULT false;

-- Exchange rates table for multi-currency
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency text NOT NULL DEFAULT 'XOF',
  target_currency text NOT NULL,
  rate numeric NOT NULL,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(base_currency, target_currency)
);

-- RLS policies
ALTER TABLE public.org_webhooks ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.webhook_deliveries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_popups ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_page_sections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Org webhooks: org members can manage
CREATE POLICY "org_webhooks_manage" ON public.org_webhooks
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id = org_id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin')));

-- Webhook deliveries: viewable by org admins
CREATE POLICY "webhook_deliveries_view" ON public.webhook_deliveries
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.org_webhooks w JOIN public.organization_members om ON om.organization_id = w.org_id WHERE w.id = webhook_id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin')));

-- Org popups: org admins
CREATE POLICY "org_popups_manage" ON public.org_popups
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id = org_id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin')));

-- Public read for active popups
CREATE POLICY "org_popups_public_read" ON public.org_popups
  FOR SELECT TO anon
  USING (is_active = true);

-- Org banners: org admins
CREATE POLICY "org_banners_manage" ON public.org_banners
  FOR ALL TO authenticated
  USING (EXISTS (SELECT 1 FROM public.organization_members om WHERE om.organization_id = org_id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin')));

-- Public read for active banners
CREATE POLICY "org_banners_public_read" ON public.org_banners
  FOR SELECT TO anon
  USING (is_active = true);

-- Product page sections: viewable publicly, managed by org admins
CREATE POLICY "product_sections_public" ON public.product_page_sections
  FOR SELECT TO anon USING (true);

CREATE POLICY "product_sections_manage" ON public.product_page_sections
  FOR ALL TO authenticated
  USING (EXISTS (
    SELECT 1 FROM public.digital_products dp
    JOIN public.organization_members om ON om.organization_id = dp.organization_id
    WHERE dp.id = product_id AND om.user_id = auth.uid() AND om.role IN ('owner', 'admin', 'editor')
  ));

-- Exchange rates: public read
CREATE POLICY "exchange_rates_public" ON public.exchange_rates
  FOR SELECT TO anon USING (true);

CREATE POLICY "exchange_rates_public_auth" ON public.exchange_rates
  FOR SELECT TO authenticated USING (true);
