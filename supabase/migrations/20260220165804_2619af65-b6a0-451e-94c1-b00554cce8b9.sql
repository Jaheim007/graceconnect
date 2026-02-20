
-- ============================================================
-- GRACECONNECT - FULL PRODUCTION SCHEMA MIGRATION
-- Multi-tenant SaaS | Supabase Postgres | RLS + Security Definer
-- Country: CI | Currency: XOF
-- ============================================================

-- ============================================================
-- 1) EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ============================================================
-- 2) ENUMS
-- ============================================================
DO $$ BEGIN
  CREATE TYPE public.org_category AS ENUM ('church', 'ministry', 'leader', 'ngo', 'community', 'other');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.org_plan AS ENUM ('free', 'pro', 'growth', 'enterprise');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.kyc_status AS ENUM ('none', 'pending', 'level1', 'level2', 'rejected');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.org_member_role AS ENUM ('owner', 'admin', 'editor', 'member', 'affiliate');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.platform_role AS ENUM ('superadmin', 'user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.media_type AS ENUM ('video', 'audio', 'reel', 'live_replay');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.payment_status AS ENUM ('pending', 'completed', 'failed', 'refunded');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.purchase_status AS ENUM ('pending', 'completed', 'failed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.report_status AS ENUM ('pending', 'reviewed', 'resolved', 'dismissed');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TYPE public.affiliate_sale_status AS ENUM ('pending', 'payable', 'paid', 'cancelled');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 3) CORE MULTI-TENANT TABLES
-- ============================================================

-- A) organizations
CREATE TABLE IF NOT EXISTS public.organizations (
  id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name                        TEXT NOT NULL,
  slug                        TEXT UNIQUE NOT NULL,
  description                 TEXT,
  logo_url                    TEXT,
  banner_url                  TEXT,
  category                    public.org_category DEFAULT 'church',
  plan_type                   public.org_plan DEFAULT 'free',
  country                     TEXT DEFAULT 'CI',
  currency                    TEXT DEFAULT 'XOF',
  whatsapp                    TEXT,
  website                     TEXT,
  is_active                   BOOLEAN DEFAULT TRUE,
  is_verified                 BOOLEAN DEFAULT FALSE,
  owner_id                    UUID NOT NULL,
  kyc_status                  public.kyc_status DEFAULT 'none',
  monetization_enabled        BOOLEAN DEFAULT FALSE,
  affiliation_enabled         BOOLEAN DEFAULT FALSE,
  affiliation_commission_percent NUMERIC DEFAULT 10,
  platform_fee_percent        NUMERIC DEFAULT 10,
  paystack_subaccount_code    TEXT,
  created_at                  TIMESTAMPTZ DEFAULT now(),
  updated_at                  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_organizations_slug         ON public.organizations(slug);
CREATE INDEX IF NOT EXISTS idx_organizations_owner_id     ON public.organizations(owner_id);
CREATE INDEX IF NOT EXISTS idx_organizations_is_active    ON public.organizations(is_active);
CREATE INDEX IF NOT EXISTS idx_organizations_category     ON public.organizations(category);

-- B) organization_members
CREATE TABLE IF NOT EXISTS public.organization_members (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL,
  role            public.org_member_role DEFAULT 'member',
  invited_by      UUID,
  joined_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_user_org  ON public.organization_members(user_id, organization_id);
CREATE INDEX IF NOT EXISTS idx_org_members_org_role  ON public.organization_members(organization_id, role);

-- C) profiles
CREATE TABLE IF NOT EXISTS public.profiles (
  id           UUID PRIMARY KEY,
  display_name TEXT,
  avatar_url   TEXT,
  bio          TEXT,
  phone        TEXT,
  country      TEXT DEFAULT 'CI',
  created_at   TIMESTAMPTZ DEFAULT now(),
  updated_at   TIMESTAMPTZ DEFAULT now()
);

-- D) user_platform_roles
CREATE TABLE IF NOT EXISTS public.user_platform_roles (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID UNIQUE NOT NULL,
  role       public.platform_role DEFAULT 'user',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- ============================================================
-- 4) CONTENT MODULES
-- ============================================================

-- A) media_content
CREATE TABLE IF NOT EXISTS public.media_content (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id  UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by       UUID NOT NULL,
  title            TEXT NOT NULL,
  description      TEXT,
  media_type       public.media_type DEFAULT 'video',
  media_url        TEXT,
  thumbnail_url    TEXT,
  duration_seconds INT,
  aspect_ratio     TEXT DEFAULT '16:9',
  tags             TEXT[],
  series           TEXT,
  speaker          TEXT,
  is_premium       BOOLEAN DEFAULT FALSE,
  is_featured      BOOLEAN DEFAULT FALSE,
  is_published     BOOLEAN DEFAULT FALSE,
  display_order    INT DEFAULT 0,
  view_count       INT DEFAULT 0,
  like_count       INT DEFAULT 0,
  created_at       TIMESTAMPTZ DEFAULT now(),
  updated_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_media_org         ON public.media_content(organization_id);
CREATE INDEX IF NOT EXISTS idx_media_published   ON public.media_content(is_published);
CREATE INDEX IF NOT EXISTS idx_media_type        ON public.media_content(media_type);
CREATE INDEX IF NOT EXISTS idx_media_created_at  ON public.media_content(created_at DESC);

-- B) media_likes
CREATE TABLE IF NOT EXISTS public.media_likes (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id        UUID NOT NULL REFERENCES public.media_content(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  user_id         UUID NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(media_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_media_likes_org     ON public.media_likes(organization_id);
CREATE INDEX IF NOT EXISTS idx_media_likes_user    ON public.media_likes(user_id);

-- C) media_saves
CREATE TABLE IF NOT EXISTS public.media_saves (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id        UUID NOT NULL REFERENCES public.media_content(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL,
  user_id         UUID NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(media_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_media_saves_org   ON public.media_saves(organization_id);
CREATE INDEX IF NOT EXISTS idx_media_saves_user  ON public.media_saves(user_id);

-- D) watch_history
CREATE TABLE IF NOT EXISTS public.watch_history (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  media_id         UUID NOT NULL REFERENCES public.media_content(id) ON DELETE CASCADE,
  organization_id  UUID NOT NULL,
  user_id          UUID NOT NULL,
  progress_seconds INT DEFAULT 0,
  completed        BOOLEAN DEFAULT FALSE,
  watched_at       TIMESTAMPTZ DEFAULT now(),
  UNIQUE(media_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_watch_history_user ON public.watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_watch_history_org  ON public.watch_history(organization_id);

-- E) announcements
CREATE TABLE IF NOT EXISTS public.announcements (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by      UUID,
  title           TEXT NOT NULL,
  body            TEXT NOT NULL,
  image_url       TEXT,
  image_position  TEXT DEFAULT 'center',
  is_pinned       BOOLEAN DEFAULT FALSE,
  published_at    TIMESTAMPTZ DEFAULT now(),
  expires_at      TIMESTAMPTZ,
  is_published    BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_announcements_org       ON public.announcements(organization_id);
CREATE INDEX IF NOT EXISTS idx_announcements_published ON public.announcements(is_published);

-- F) events
CREATE TABLE IF NOT EXISTS public.events (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by      UUID,
  title           TEXT NOT NULL,
  description     TEXT,
  image_url       TEXT,
  video_url       TEXT,
  location        TEXT,
  event_date      TIMESTAMPTZ,
  is_featured     BOOLEAN DEFAULT FALSE,
  is_published    BOOLEAN DEFAULT FALSE,
  display_order   INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_events_org       ON public.events(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_published ON public.events(is_published);
CREATE INDEX IF NOT EXISTS idx_events_date      ON public.events(event_date);

-- ============================================================
-- 5) MONETIZATION MODULES
-- ============================================================

-- A) donation_campaigns
CREATE TABLE IF NOT EXISTS public.donation_campaigns (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by      UUID,
  title           TEXT NOT NULL,
  description     TEXT,
  image_url       TEXT,
  goal_amount     NUMERIC,
  current_amount  NUMERIC DEFAULT 0,
  currency        TEXT DEFAULT 'XOF',
  is_active       BOOLEAN DEFAULT TRUE,
  is_featured     BOOLEAN DEFAULT FALSE,
  is_published    BOOLEAN DEFAULT TRUE,
  end_date        TIMESTAMPTZ,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_campaigns_org ON public.donation_campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_pub ON public.donation_campaigns(is_published, is_active);

-- B) donations
CREATE TABLE IF NOT EXISTS public.donations (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id      UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  campaign_id          UUID REFERENCES public.donation_campaigns(id),
  user_id              UUID,
  donor_name           TEXT,
  donor_email          TEXT,
  amount               NUMERIC NOT NULL,
  currency             TEXT DEFAULT 'XOF',
  paystack_reference   TEXT UNIQUE NOT NULL,
  status               public.payment_status DEFAULT 'pending',
  is_recurring         BOOLEAN DEFAULT FALSE,
  affiliate_link_id    UUID,
  platform_fee         NUMERIC,
  affiliate_commission NUMERIC,
  organization_amount  NUMERIC,
  completed_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_donations_org        ON public.donations(organization_id);
CREATE INDEX IF NOT EXISTS idx_donations_status     ON public.donations(status);
CREATE INDEX IF NOT EXISTS idx_donations_created_at ON public.donations(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_donations_user       ON public.donations(user_id);

-- C) digital_products
CREATE TABLE IF NOT EXISTS public.digital_products (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by      UUID,
  title           TEXT NOT NULL,
  description     TEXT,
  cover_image_url TEXT,
  file_url        TEXT,
  external_link   TEXT,
  product_type    TEXT DEFAULT 'pdf',
  price           NUMERIC DEFAULT 0,
  currency        TEXT DEFAULT 'XOF',
  is_free         BOOLEAN DEFAULT FALSE,
  is_featured     BOOLEAN DEFAULT FALSE,
  is_published    BOOLEAN DEFAULT FALSE,
  display_order   INT DEFAULT 0,
  sales_count     INT DEFAULT 0,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_products_org       ON public.digital_products(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_published ON public.digital_products(is_published);
CREATE INDEX IF NOT EXISTS idx_products_created   ON public.digital_products(created_at DESC);

-- D) product_purchases
CREATE TABLE IF NOT EXISTS public.product_purchases (
  id                   UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id           UUID NOT NULL REFERENCES public.digital_products(id) ON DELETE CASCADE,
  organization_id      UUID NOT NULL,
  user_id              UUID NOT NULL,
  amount               NUMERIC NOT NULL,
  currency             TEXT DEFAULT 'XOF',
  paystack_reference   TEXT UNIQUE NOT NULL,
  status               public.purchase_status DEFAULT 'pending',
  affiliate_link_id    UUID,
  platform_fee         NUMERIC,
  affiliate_commission NUMERIC,
  organization_amount  NUMERIC,
  completed_at         TIMESTAMPTZ,
  created_at           TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_purchases_org    ON public.product_purchases(organization_id);
CREATE INDEX IF NOT EXISTS idx_purchases_user   ON public.product_purchases(user_id);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON public.product_purchases(status);

-- ============================================================
-- 6) AFFILIATION MODULE
-- ============================================================

-- A) affiliate_links
CREATE TABLE IF NOT EXISTS public.affiliate_links (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id         UUID NOT NULL,
  code            TEXT UNIQUE NOT NULL,
  product_id      UUID REFERENCES public.digital_products(id),
  campaign_id     UUID REFERENCES public.donation_campaigns(id),
  link_type       TEXT DEFAULT 'org',
  clicks          INT DEFAULT 0,
  conversions     INT DEFAULT 0,
  total_earned    NUMERIC DEFAULT 0,
  is_active       BOOLEAN DEFAULT TRUE,
  created_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aff_links_org  ON public.affiliate_links(organization_id);
CREATE INDEX IF NOT EXISTS idx_aff_links_user ON public.affiliate_links(user_id);
CREATE INDEX IF NOT EXISTS idx_aff_links_code ON public.affiliate_links(code);

-- B) affiliate_sales
CREATE TABLE IF NOT EXISTS public.affiliate_sales (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  affiliate_link_id UUID NOT NULL REFERENCES public.affiliate_links(id),
  affiliate_user_id UUID NOT NULL,
  organization_id   UUID NOT NULL,
  transaction_type  TEXT NOT NULL CHECK (transaction_type IN ('donation', 'product')),
  transaction_id    UUID NOT NULL,
  gross_amount      NUMERIC NOT NULL,
  commission_amount NUMERIC NOT NULL,
  commission_percent NUMERIC NOT NULL,
  status            public.affiliate_sale_status DEFAULT 'pending',
  payable_at        TIMESTAMPTZ DEFAULT (now() + INTERVAL '72 hours'),
  paid_at           TIMESTAMPTZ,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_aff_sales_org   ON public.affiliate_sales(organization_id);
CREATE INDEX IF NOT EXISTS idx_aff_sales_user  ON public.affiliate_sales(affiliate_user_id);
CREATE INDEX IF NOT EXISTS idx_aff_sales_status ON public.affiliate_sales(status);

-- C) payout_requests
CREATE TABLE IF NOT EXISTS public.payout_requests (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  user_id      UUID NOT NULL,
  payout_type  TEXT NOT NULL,
  amount       NUMERIC NOT NULL,
  currency     TEXT DEFAULT 'XOF',
  status       TEXT DEFAULT 'requested',
  requested_at TIMESTAMPTZ DEFAULT now(),
  processed_at TIMESTAMPTZ,
  metadata     JSONB DEFAULT '{}'
);

CREATE INDEX IF NOT EXISTS idx_payouts_org    ON public.payout_requests(organization_id);
CREATE INDEX IF NOT EXISTS idx_payouts_user   ON public.payout_requests(user_id);
CREATE INDEX IF NOT EXISTS idx_payouts_status ON public.payout_requests(status);

-- ============================================================
-- 7) KYC MODULE
-- ============================================================

CREATE TABLE IF NOT EXISTS public.kyc_submissions (
  id                     UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id        UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  submitted_by           UUID NOT NULL,
  kyc_level              INT DEFAULT 1,
  id_document_url        TEXT,
  id_document_type       TEXT,
  phone_verified         BOOLEAN DEFAULT FALSE,
  bank_account_name      TEXT,
  bank_account_number    TEXT,
  bank_name              TEXT,
  paystack_recipient_code TEXT,
  org_document_url       TEXT,
  org_document_type      TEXT,
  status                 TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected')),
  reviewed_by            UUID,
  rejection_reason       TEXT,
  submitted_at           TIMESTAMPTZ DEFAULT now(),
  reviewed_at            TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_kyc_org    ON public.kyc_submissions(organization_id);
CREATE INDEX IF NOT EXISTS idx_kyc_status ON public.kyc_submissions(status);

-- ============================================================
-- 8) NOTIFICATIONS + PWA
-- ============================================================

-- A) push_subscriptions
CREATE TABLE IF NOT EXISTS public.push_subscriptions (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id         UUID NOT NULL,
  organization_id UUID,
  endpoint        TEXT NOT NULL,
  p256dh          TEXT NOT NULL,
  auth            TEXT NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_push_user ON public.push_subscriptions(user_id);
CREATE INDEX IF NOT EXISTS idx_push_org  ON public.push_subscriptions(organization_id);

-- B) user_notifications
CREATE TABLE IF NOT EXISTS public.user_notifications (
  id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id           UUID NOT NULL,
  organization_id   UUID,
  title             TEXT NOT NULL,
  body              TEXT NOT NULL,
  notification_type TEXT DEFAULT 'general',
  action_url        TEXT,
  image_url         TEXT,
  is_read           BOOLEAN DEFAULT FALSE,
  created_at        TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_notif_user    ON public.user_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_notif_is_read ON public.user_notifications(is_read);
CREATE INDEX IF NOT EXISTS idx_notif_org     ON public.user_notifications(organization_id);

-- ============================================================
-- 9) GOVERNANCE + AUDIT
-- ============================================================

-- A) audit_logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID,
  user_id       UUID,
  action        TEXT NOT NULL,
  resource_type TEXT,
  resource_id   UUID,
  metadata      JSONB DEFAULT '{}',
  ip_address    TEXT,
  created_at    TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_audit_org        ON public.audit_logs(organization_id);
CREATE INDEX IF NOT EXISTS idx_audit_created_at ON public.audit_logs(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_audit_user       ON public.audit_logs(user_id);

-- B) content_reports
CREATE TABLE IF NOT EXISTS public.content_reports (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  reporter_user_id UUID NOT NULL,
  content_type     TEXT NOT NULL,
  content_id       UUID NOT NULL,
  organization_id  UUID,
  reason           TEXT NOT NULL,
  status           public.report_status DEFAULT 'pending',
  created_at       TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_reports_org      ON public.content_reports(organization_id);
CREATE INDEX IF NOT EXISTS idx_reports_reporter ON public.content_reports(reporter_user_id);
CREATE INDEX IF NOT EXISTS idx_reports_status   ON public.content_reports(status);

-- ============================================================
-- 10) UPDATED_AT TRIGGER FUNCTION
-- ============================================================

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply triggers to all tables with updated_at
DO $$ BEGIN
  CREATE TRIGGER trg_organizations_updated_at
    BEFORE UPDATE ON public.organizations
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_profiles_updated_at
    BEFORE UPDATE ON public.profiles
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_media_content_updated_at
    BEFORE UPDATE ON public.media_content
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_announcements_updated_at
    BEFORE UPDATE ON public.announcements
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_events_updated_at
    BEFORE UPDATE ON public.events
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_donation_campaigns_updated_at
    BEFORE UPDATE ON public.donation_campaigns
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_digital_products_updated_at
    BEFORE UPDATE ON public.digital_products
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
  CREATE TRIGGER trg_push_subscriptions_updated_at
    BEFORE UPDATE ON public.push_subscriptions
    FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- ============================================================
-- 11) SECURITY DEFINER HELPER FUNCTIONS
-- ============================================================

-- is_superadmin
CREATE OR REPLACE FUNCTION public.is_superadmin(_user_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.user_platform_roles
    WHERE user_id = _user_id AND role = 'superadmin'
  );
$$;

-- get_org_role
CREATE OR REPLACE FUNCTION public.get_org_role(_user_id UUID, _org_id UUID)
RETURNS public.org_member_role
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.organization_members
  WHERE user_id = _user_id AND organization_id = _org_id
  LIMIT 1;
$$;

-- is_org_member
CREATE OR REPLACE FUNCTION public.is_org_member(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id AND organization_id = _org_id
  );
$$;

-- can_manage_org (owner/admin/editor)
CREATE OR REPLACE FUNCTION public.can_manage_org(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
      AND role IN ('owner', 'admin', 'editor')
  );
$$;

-- can_admin_org (owner/admin only)
CREATE OR REPLACE FUNCTION public.can_admin_org(_user_id UUID, _org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = _user_id
      AND organization_id = _org_id
      AND role IN ('owner', 'admin')
  );
$$;

-- org_monetization_allowed
CREATE OR REPLACE FUNCTION public.org_monetization_allowed(_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT monetization_enabled FROM public.organizations WHERE id = _org_id LIMIT 1),
    FALSE
  );
$$;

-- org_affiliation_allowed
CREATE OR REPLACE FUNCTION public.org_affiliation_allowed(_org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT affiliation_enabled FROM public.organizations WHERE id = _org_id LIMIT 1),
    FALSE
  );
$$;

-- create_organization_with_owner (transactional helper)
CREATE OR REPLACE FUNCTION public.create_organization_with_owner(
  _name        TEXT,
  _slug        TEXT,
  _category    public.org_category DEFAULT 'church',
  _description TEXT DEFAULT NULL
)
RETURNS UUID
LANGUAGE plpgsql SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id UUID;
  _caller UUID;
BEGIN
  _caller := auth.uid();
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.organizations (name, slug, category, description, owner_id)
  VALUES (_name, _slug, _category, _description, _caller)
  RETURNING id INTO _org_id;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (_org_id, _caller, 'owner');

  RETURN _org_id;
END;
$$;

-- ============================================================
-- 12) ENABLE RLS ON ALL TABLES
-- ============================================================

ALTER TABLE public.organizations          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members   ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles               ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_platform_roles    ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_content          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_likes            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.media_saves            ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.watch_history          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.announcements          ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events                 ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donation_campaigns     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations              ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.digital_products       ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.product_purchases      ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_links        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.affiliate_sales        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.payout_requests        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kyc_submissions        ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.push_subscriptions     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_notifications     ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs             ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.content_reports        ENABLE ROW LEVEL SECURITY;

-- ============================================================
-- 13) RLS POLICIES
-- ============================================================

-- ---- ORGANIZATIONS ----

-- Public can read active orgs
CREATE POLICY "org_public_select"
  ON public.organizations FOR SELECT
  USING (is_active = TRUE);

-- Members can see their org even if inactive
CREATE POLICY "org_member_select"
  ON public.organizations FOR SELECT
  USING (public.is_org_member(auth.uid(), id));

-- Superadmin sees all
CREATE POLICY "org_superadmin_select"
  ON public.organizations FOR SELECT
  USING (public.is_superadmin(auth.uid()));

-- Owner can insert (via create_organization_with_owner RPC usually, but also direct)
CREATE POLICY "org_insert_authenticated"
  ON public.organizations FOR INSERT
  WITH CHECK (auth.uid() = owner_id);

-- Editor/admin/owner can update
CREATE POLICY "org_manager_update"
  ON public.organizations FOR UPDATE
  USING (public.can_manage_org(auth.uid(), id));

-- Superadmin can update anything
CREATE POLICY "org_superadmin_update"
  ON public.organizations FOR UPDATE
  USING (public.is_superadmin(auth.uid()));

-- Only owner or superadmin can delete/deactivate
CREATE POLICY "org_owner_delete"
  ON public.organizations FOR DELETE
  USING (
    auth.uid() = owner_id
    OR public.is_superadmin(auth.uid())
  );

-- ---- ORGANIZATION_MEMBERS ----

-- Members can see the member list of their org
CREATE POLICY "orgmem_select_member"
  ON public.organization_members FOR SELECT
  USING (public.is_org_member(auth.uid(), organization_id));

-- Superadmin
CREATE POLICY "orgmem_superadmin_select"
  ON public.organization_members FOR SELECT
  USING (public.is_superadmin(auth.uid()));

-- Admin/owner can invite
CREATE POLICY "orgmem_admin_insert"
  ON public.organization_members FOR INSERT
  WITH CHECK (public.can_admin_org(auth.uid(), organization_id));

-- Users can leave (delete own membership)
CREATE POLICY "orgmem_self_delete"
  ON public.organization_members FOR DELETE
  USING (user_id = auth.uid());

-- Admin/owner can remove members
CREATE POLICY "orgmem_admin_delete"
  ON public.organization_members FOR DELETE
  USING (public.can_admin_org(auth.uid(), organization_id));

-- Admin/owner can update roles
CREATE POLICY "orgmem_admin_update"
  ON public.organization_members FOR UPDATE
  USING (public.can_admin_org(auth.uid(), organization_id));

-- ---- PROFILES ----

CREATE POLICY "profiles_select_own"
  ON public.profiles FOR SELECT
  USING (id = auth.uid());

CREATE POLICY "profiles_select_superadmin"
  ON public.profiles FOR SELECT
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "profiles_insert_own"
  ON public.profiles FOR INSERT
  WITH CHECK (id = auth.uid());

CREATE POLICY "profiles_update_own"
  ON public.profiles FOR UPDATE
  USING (id = auth.uid());

-- ---- USER_PLATFORM_ROLES ----

CREATE POLICY "platform_roles_superadmin_all"
  ON public.user_platform_roles FOR ALL
  USING (public.is_superadmin(auth.uid()));

-- ---- MEDIA_CONTENT ----

-- Public sees published content
CREATE POLICY "media_public_select"
  ON public.media_content FOR SELECT
  USING (is_published = TRUE);

-- Managers see all org content (including unpublished)
CREATE POLICY "media_manager_select"
  ON public.media_content FOR SELECT
  USING (public.can_manage_org(auth.uid(), organization_id));

-- Superadmin sees all
CREATE POLICY "media_superadmin_select"
  ON public.media_content FOR SELECT
  USING (public.is_superadmin(auth.uid()));

-- Editor+ can insert
CREATE POLICY "media_manager_insert"
  ON public.media_content FOR INSERT
  WITH CHECK (public.can_manage_org(auth.uid(), organization_id));

-- Editor+ can update
CREATE POLICY "media_manager_update"
  ON public.media_content FOR UPDATE
  USING (public.can_manage_org(auth.uid(), organization_id));

-- Admin+ can delete
CREATE POLICY "media_admin_delete"
  ON public.media_content FOR DELETE
  USING (public.can_admin_org(auth.uid(), organization_id));

-- ---- MEDIA_LIKES ----
CREATE POLICY "media_likes_select_auth"
  ON public.media_likes FOR SELECT
  USING (user_id = auth.uid() OR public.can_admin_org(auth.uid(), organization_id));

CREATE POLICY "media_likes_insert_auth"
  ON public.media_likes FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "media_likes_delete_own"
  ON public.media_likes FOR DELETE
  USING (user_id = auth.uid());

-- ---- MEDIA_SAVES ----
CREATE POLICY "media_saves_select_own"
  ON public.media_saves FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "media_saves_insert_auth"
  ON public.media_saves FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "media_saves_delete_own"
  ON public.media_saves FOR DELETE
  USING (user_id = auth.uid());

-- ---- WATCH_HISTORY ----
CREATE POLICY "watch_history_select_own"
  ON public.watch_history FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "watch_history_upsert_own"
  ON public.watch_history FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "watch_history_update_own"
  ON public.watch_history FOR UPDATE
  USING (user_id = auth.uid());

-- ---- ANNOUNCEMENTS ----
CREATE POLICY "announcements_public_select"
  ON public.announcements FOR SELECT
  USING (is_published = TRUE);

CREATE POLICY "announcements_manager_select"
  ON public.announcements FOR SELECT
  USING (public.can_manage_org(auth.uid(), organization_id));

CREATE POLICY "announcements_manager_insert"
  ON public.announcements FOR INSERT
  WITH CHECK (public.can_manage_org(auth.uid(), organization_id));

CREATE POLICY "announcements_manager_update"
  ON public.announcements FOR UPDATE
  USING (public.can_manage_org(auth.uid(), organization_id));

CREATE POLICY "announcements_admin_delete"
  ON public.announcements FOR DELETE
  USING (public.can_admin_org(auth.uid(), organization_id));

-- ---- EVENTS ----
CREATE POLICY "events_public_select"
  ON public.events FOR SELECT
  USING (is_published = TRUE);

CREATE POLICY "events_manager_select"
  ON public.events FOR SELECT
  USING (public.can_manage_org(auth.uid(), organization_id));

CREATE POLICY "events_manager_insert"
  ON public.events FOR INSERT
  WITH CHECK (public.can_manage_org(auth.uid(), organization_id));

CREATE POLICY "events_manager_update"
  ON public.events FOR UPDATE
  USING (public.can_manage_org(auth.uid(), organization_id));

CREATE POLICY "events_admin_delete"
  ON public.events FOR DELETE
  USING (public.can_admin_org(auth.uid(), organization_id));

-- ---- DONATION_CAMPAIGNS ----
CREATE POLICY "campaigns_public_select"
  ON public.donation_campaigns FOR SELECT
  USING (is_published = TRUE AND is_active = TRUE);

CREATE POLICY "campaigns_manager_select"
  ON public.donation_campaigns FOR SELECT
  USING (public.can_manage_org(auth.uid(), organization_id));

CREATE POLICY "campaigns_manager_insert"
  ON public.donation_campaigns FOR INSERT
  WITH CHECK (
    public.can_manage_org(auth.uid(), organization_id)
    AND public.org_monetization_allowed(organization_id)
  );

CREATE POLICY "campaigns_manager_update"
  ON public.donation_campaigns FOR UPDATE
  USING (public.can_manage_org(auth.uid(), organization_id));

CREATE POLICY "campaigns_admin_delete"
  ON public.donation_campaigns FOR DELETE
  USING (public.can_admin_org(auth.uid(), organization_id));

-- ---- DONATIONS ----
CREATE POLICY "donations_select_own"
  ON public.donations FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "donations_admin_select"
  ON public.donations FOR SELECT
  USING (public.can_admin_org(auth.uid(), organization_id));

CREATE POLICY "donations_superadmin_select"
  ON public.donations FOR SELECT
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "donations_insert_monetized"
  ON public.donations FOR INSERT
  WITH CHECK (
    public.org_monetization_allowed(organization_id)
    OR public.is_superadmin(auth.uid())
  );

-- ---- DIGITAL_PRODUCTS ----
CREATE POLICY "products_public_select"
  ON public.digital_products FOR SELECT
  USING (is_published = TRUE);

CREATE POLICY "products_manager_select"
  ON public.digital_products FOR SELECT
  USING (public.can_manage_org(auth.uid(), organization_id));

CREATE POLICY "products_superadmin_select"
  ON public.digital_products FOR SELECT
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "products_manager_insert"
  ON public.digital_products FOR INSERT
  WITH CHECK (
    public.can_manage_org(auth.uid(), organization_id)
    AND public.org_monetization_allowed(organization_id)
  );

CREATE POLICY "products_manager_update"
  ON public.digital_products FOR UPDATE
  USING (public.can_manage_org(auth.uid(), organization_id));

CREATE POLICY "products_admin_delete"
  ON public.digital_products FOR DELETE
  USING (public.can_admin_org(auth.uid(), organization_id));

-- ---- PRODUCT_PURCHASES ----
CREATE POLICY "purchases_select_own"
  ON public.product_purchases FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "purchases_admin_select"
  ON public.product_purchases FOR SELECT
  USING (public.can_admin_org(auth.uid(), organization_id));

CREATE POLICY "purchases_superadmin_select"
  ON public.product_purchases FOR SELECT
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "purchases_insert_monetized"
  ON public.product_purchases FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND (
      public.org_monetization_allowed(organization_id)
      OR public.is_superadmin(auth.uid())
    )
  );

-- ---- AFFILIATE_LINKS ----
CREATE POLICY "aff_links_select_own"
  ON public.affiliate_links FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "aff_links_admin_select"
  ON public.affiliate_links FOR SELECT
  USING (public.can_admin_org(auth.uid(), organization_id));

CREATE POLICY "aff_links_superadmin_select"
  ON public.affiliate_links FOR SELECT
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "aff_links_insert"
  ON public.affiliate_links FOR INSERT
  WITH CHECK (
    user_id = auth.uid()
    AND public.is_org_member(auth.uid(), organization_id)
    AND public.org_affiliation_allowed(organization_id)
  );

CREATE POLICY "aff_links_update_own"
  ON public.affiliate_links FOR UPDATE
  USING (
    user_id = auth.uid()
    OR public.can_admin_org(auth.uid(), organization_id)
  );

-- ---- AFFILIATE_SALES ----
CREATE POLICY "aff_sales_select_own"
  ON public.affiliate_sales FOR SELECT
  USING (affiliate_user_id = auth.uid());

CREATE POLICY "aff_sales_admin_select"
  ON public.affiliate_sales FOR SELECT
  USING (public.can_admin_org(auth.uid(), organization_id));

CREATE POLICY "aff_sales_superadmin_select"
  ON public.affiliate_sales FOR SELECT
  USING (public.is_superadmin(auth.uid()));

-- ---- PAYOUT_REQUESTS ----
CREATE POLICY "payouts_select_own"
  ON public.payout_requests FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "payouts_admin_select"
  ON public.payout_requests FOR SELECT
  USING (
    public.can_admin_org(auth.uid(), organization_id)
    OR public.is_superadmin(auth.uid())
  );

CREATE POLICY "payouts_insert_own"
  ON public.payout_requests FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "payouts_superadmin_update"
  ON public.payout_requests FOR UPDATE
  USING (public.is_superadmin(auth.uid()));

-- ---- KYC_SUBMISSIONS ----
CREATE POLICY "kyc_select_org_admin"
  ON public.kyc_submissions FOR SELECT
  USING (
    public.can_admin_org(auth.uid(), organization_id)
    OR public.is_superadmin(auth.uid())
  );

CREATE POLICY "kyc_insert_org_admin"
  ON public.kyc_submissions FOR INSERT
  WITH CHECK (
    submitted_by = auth.uid()
    AND public.can_admin_org(auth.uid(), organization_id)
  );

CREATE POLICY "kyc_update_superadmin"
  ON public.kyc_submissions FOR UPDATE
  USING (public.is_superadmin(auth.uid()));

-- ---- PUSH_SUBSCRIPTIONS ----
CREATE POLICY "push_select_own"
  ON public.push_subscriptions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "push_insert_own"
  ON public.push_subscriptions FOR INSERT
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "push_update_own"
  ON public.push_subscriptions FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "push_delete_own"
  ON public.push_subscriptions FOR DELETE
  USING (user_id = auth.uid());

-- ---- USER_NOTIFICATIONS ----
CREATE POLICY "notif_select_own"
  ON public.user_notifications FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "notif_update_own"
  ON public.user_notifications FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "notif_superadmin_all"
  ON public.user_notifications FOR ALL
  USING (public.is_superadmin(auth.uid()));

-- ---- AUDIT_LOGS ----
CREATE POLICY "audit_select_org_admin"
  ON public.audit_logs FOR SELECT
  USING (
    public.can_admin_org(auth.uid(), organization_id)
    OR public.is_superadmin(auth.uid())
  );

-- Insert via service role / edge functions only; no user insert RLS needed
-- (service role bypasses RLS)

-- ---- CONTENT_REPORTS ----
CREATE POLICY "reports_select_own"
  ON public.content_reports FOR SELECT
  USING (reporter_user_id = auth.uid());

CREATE POLICY "reports_superadmin_select"
  ON public.content_reports FOR SELECT
  USING (public.is_superadmin(auth.uid()));

CREATE POLICY "reports_insert_auth"
  ON public.content_reports FOR INSERT
  WITH CHECK (reporter_user_id = auth.uid());

CREATE POLICY "reports_superadmin_update"
  ON public.content_reports FOR UPDATE
  USING (public.is_superadmin(auth.uid()));
