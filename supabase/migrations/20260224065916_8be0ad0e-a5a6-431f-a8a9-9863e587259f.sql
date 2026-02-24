
-- 1. Enhanced promo codes: add discount_type and discount_amount
ALTER TABLE public.promo_codes
  ADD COLUMN IF NOT EXISTS discount_type text NOT NULL DEFAULT 'percent',
  ADD COLUMN IF NOT EXISTS discount_amount numeric DEFAULT 0;

-- Add constraint for discount_type
ALTER TABLE public.promo_codes
  ADD CONSTRAINT promo_codes_discount_type_check CHECK (discount_type IN ('percent', 'fixed'));

-- 2. Product bundles: a product can be a bundle containing other products
CREATE TABLE public.bundle_items (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  bundle_product_id uuid NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  included_product_id uuid NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(bundle_product_id, included_product_id)
);

ALTER TABLE public.bundle_items ENABLE ROW LEVEL SECURITY;

-- Managers can manage bundle items for their org's products
CREATE POLICY "bundle_items_manager_select" ON public.bundle_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.digital_products dp WHERE dp.id = bundle_product_id AND can_manage_org(auth.uid(), dp.organization_id)));

CREATE POLICY "bundle_items_manager_insert" ON public.bundle_items FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.digital_products dp WHERE dp.id = bundle_product_id AND can_manage_org(auth.uid(), dp.organization_id)));

CREATE POLICY "bundle_items_manager_delete" ON public.bundle_items FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.digital_products dp WHERE dp.id = bundle_product_id AND can_manage_org(auth.uid(), dp.organization_id)));

-- Public can see bundle items for published products
CREATE POLICY "bundle_items_public_select" ON public.bundle_items FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.digital_products dp WHERE dp.id = bundle_product_id AND dp.is_published = true));

-- 3. Product recommendations (upsell/cross-sell)
CREATE TABLE public.product_recommendations (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id uuid NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  recommended_product_id uuid NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  recommendation_type text NOT NULL DEFAULT 'related' CHECK (recommendation_type IN ('upsell', 'cross_sell', 'related')),
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, recommended_product_id)
);

ALTER TABLE public.product_recommendations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "recommendations_manager_select" ON public.product_recommendations FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.digital_products dp WHERE dp.id = product_id AND can_manage_org(auth.uid(), dp.organization_id)));

CREATE POLICY "recommendations_manager_insert" ON public.product_recommendations FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.digital_products dp WHERE dp.id = product_id AND can_manage_org(auth.uid(), dp.organization_id)));

CREATE POLICY "recommendations_manager_delete" ON public.product_recommendations FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.digital_products dp WHERE dp.id = product_id AND can_manage_org(auth.uid(), dp.organization_id)));

CREATE POLICY "recommendations_public_select" ON public.product_recommendations FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.digital_products dp WHERE dp.id = product_id AND dp.is_published = true));

-- 4. Enhanced sales page fields on digital_products
ALTER TABLE public.digital_products
  ADD COLUMN IF NOT EXISTS faq_json jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS guarantee_text text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS testimonials_json jsonb DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS is_bundle boolean DEFAULT false;
