
-- =============================================
-- 1. PRODUCT REVIEWS TABLE
-- =============================================
CREATE TABLE public.product_reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id uuid NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  rating smallint NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,
  is_verified_purchase boolean NOT NULL DEFAULT false,
  is_published boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(product_id, user_id)
);

ALTER TABLE public.product_reviews ENABLE ROW LEVEL SECURITY;

-- Public can read published reviews
CREATE POLICY "reviews_public_select" ON public.product_reviews
  FOR SELECT USING (is_published = true);

-- Authenticated users can insert their own review
CREATE POLICY "reviews_insert_own" ON public.product_reviews
  FOR INSERT WITH CHECK (user_id = auth.uid());

-- Users can update their own review
CREATE POLICY "reviews_update_own" ON public.product_reviews
  FOR UPDATE USING (user_id = auth.uid());

-- Users can delete their own review
CREATE POLICY "reviews_delete_own" ON public.product_reviews
  FOR DELETE USING (user_id = auth.uid());

-- Org admins can moderate reviews
CREATE POLICY "reviews_admin_select" ON public.product_reviews
  FOR SELECT USING (can_admin_org(auth.uid(), organization_id));

CREATE POLICY "reviews_admin_update" ON public.product_reviews
  FOR UPDATE USING (can_admin_org(auth.uid(), organization_id));

-- Superadmin full access
CREATE POLICY "reviews_superadmin_select" ON public.product_reviews
  FOR SELECT USING (is_superadmin(auth.uid()));

-- =============================================
-- 2. ABANDONED CARTS TABLE
-- =============================================
CREATE TABLE public.abandoned_carts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid,
  product_id uuid NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email text,
  buyer_name text,
  opened_at timestamptz NOT NULL DEFAULT now(),
  reminder_sent_count smallint NOT NULL DEFAULT 0,
  last_reminder_at timestamptz,
  converted boolean NOT NULL DEFAULT false,
  converted_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.abandoned_carts ENABLE ROW LEVEL SECURITY;

-- Users can see their own abandoned carts
CREATE POLICY "abandoned_carts_select_own" ON public.abandoned_carts
  FOR SELECT USING (user_id = auth.uid());

-- Authenticated can insert
CREATE POLICY "abandoned_carts_insert" ON public.abandoned_carts
  FOR INSERT WITH CHECK (true);

-- Org admins can view
CREATE POLICY "abandoned_carts_admin_select" ON public.abandoned_carts
  FOR SELECT USING (can_admin_org(auth.uid(), organization_id));

-- Superadmin access
CREATE POLICY "abandoned_carts_superadmin_select" ON public.abandoned_carts
  FOR SELECT USING (is_superadmin(auth.uid()));

-- Index for reminder processing
CREATE INDEX idx_abandoned_carts_reminder ON public.abandoned_carts (converted, reminder_sent_count, opened_at)
  WHERE converted = false;

-- =============================================
-- 3. TRACKING PIXELS ON ORG PAGE SETTINGS
-- =============================================
ALTER TABLE public.org_page_settings
  ADD COLUMN IF NOT EXISTS facebook_pixel_id text,
  ADD COLUMN IF NOT EXISTS tiktok_pixel_id text,
  ADD COLUMN IF NOT EXISTS google_tag_id text;

-- =============================================
-- 4. ADD average_rating AND review_count TO digital_products
-- =============================================
ALTER TABLE public.digital_products
  ADD COLUMN IF NOT EXISTS average_rating numeric DEFAULT 0,
  ADD COLUMN IF NOT EXISTS review_count integer DEFAULT 0;
