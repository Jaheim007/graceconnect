
-- =============================================
-- PHASE 1: STORAGE SÉCURISÉ
-- =============================================

-- Bucket public pour logos, bannières, images publiques
INSERT INTO storage.buckets (id, name, public) VALUES ('public-assets', 'public-assets', true)
ON CONFLICT (id) DO NOTHING;

-- Bucket privé pour produits digitaux payants (signed URLs)
INSERT INTO storage.buckets (id, name, public) VALUES ('private-products', 'private-products', false)
ON CONFLICT (id) DO NOTHING;

-- Bucket pour avatars utilisateurs
INSERT INTO storage.buckets (id, name, public) VALUES ('user-avatars', 'user-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies: public-assets (lecture publique, écriture org managers)
CREATE POLICY "public_assets_read" ON storage.objects FOR SELECT USING (bucket_id = 'public-assets');
CREATE POLICY "public_assets_upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'public-assets' AND auth.uid() IS NOT NULL
);
CREATE POLICY "public_assets_update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'public-assets' AND auth.uid() IS NOT NULL
);
CREATE POLICY "public_assets_delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'public-assets' AND auth.uid() IS NOT NULL
);

-- Storage policies: private-products (lecture via signed URL uniquement, écriture org managers)
CREATE POLICY "private_products_upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'private-products' AND auth.uid() IS NOT NULL
);
CREATE POLICY "private_products_update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'private-products' AND auth.uid() IS NOT NULL
);
CREATE POLICY "private_products_delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'private-products' AND auth.uid() IS NOT NULL
);

-- Storage policies: user-avatars
CREATE POLICY "avatars_read" ON storage.objects FOR SELECT USING (bucket_id = 'user-avatars');
CREATE POLICY "avatars_upload" ON storage.objects FOR INSERT WITH CHECK (
  bucket_id = 'user-avatars' AND auth.uid() IS NOT NULL
);
CREATE POLICY "avatars_update" ON storage.objects FOR UPDATE USING (
  bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);
CREATE POLICY "avatars_delete" ON storage.objects FOR DELETE USING (
  bucket_id = 'user-avatars' AND auth.uid()::text = (storage.foldername(name))[1]
);

-- =============================================
-- PHASE 1: ANTI-FRAUDE AFFILIATION
-- =============================================

CREATE TABLE public.fraud_flags (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  reason TEXT NOT NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.fraud_flags ENABLE ROW LEVEL SECURITY;

CREATE POLICY "fraud_admin_select" ON public.fraud_flags FOR SELECT
  USING (can_admin_org(auth.uid(), organization_id) OR is_superadmin(auth.uid()));
CREATE POLICY "fraud_superadmin_update" ON public.fraud_flags FOR UPDATE
  USING (is_superadmin(auth.uid()));

CREATE INDEX idx_fraud_flags_user ON public.fraud_flags(user_id);
CREATE INDEX idx_fraud_flags_org ON public.fraud_flags(organization_id);

-- Add IP + device tracking to purchases and donations
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS buyer_ip TEXT;
ALTER TABLE public.donations ADD COLUMN IF NOT EXISTS device_hash TEXT;
ALTER TABLE public.product_purchases ADD COLUMN IF NOT EXISTS buyer_ip TEXT;
ALTER TABLE public.product_purchases ADD COLUMN IF NOT EXISTS device_hash TEXT;

-- =============================================
-- PHASE 2: ANALYTICS AVANCÉS
-- =============================================

CREATE TABLE public.org_daily_metrics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  metric_date DATE NOT NULL,
  revenue NUMERIC DEFAULT 0,
  transactions_count INTEGER DEFAULT 0,
  new_members INTEGER DEFAULT 0,
  affiliate_sales_count INTEGER DEFAULT 0,
  affiliate_commission_total NUMERIC DEFAULT 0,
  products_sold INTEGER DEFAULT 0,
  donations_count INTEGER DEFAULT 0,
  page_views INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, metric_date)
);

ALTER TABLE public.org_daily_metrics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "org_metrics_admin_select" ON public.org_daily_metrics FOR SELECT
  USING (can_admin_org(auth.uid(), organization_id));
CREATE POLICY "org_metrics_superadmin_select" ON public.org_daily_metrics FOR SELECT
  USING (is_superadmin(auth.uid()));

CREATE INDEX idx_org_metrics_org_date ON public.org_daily_metrics(organization_id, metric_date);

CREATE TABLE public.platform_metrics_daily (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  metric_date DATE NOT NULL UNIQUE,
  total_revenue NUMERIC DEFAULT 0,
  platform_fees NUMERIC DEFAULT 0,
  total_transactions INTEGER DEFAULT 0,
  active_orgs INTEGER DEFAULT 0,
  new_orgs INTEGER DEFAULT 0,
  active_affiliates INTEGER DEFAULT 0,
  new_users INTEGER DEFAULT 0,
  gmv NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.platform_metrics_daily ENABLE ROW LEVEL SECURITY;

CREATE POLICY "platform_metrics_superadmin" ON public.platform_metrics_daily FOR SELECT
  USING (is_superadmin(auth.uid()));

-- =============================================
-- PHASE 3: RECHERCHE GLOBALE (Full-Text Search)
-- =============================================

ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS fts_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('french', coalesce(name, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(description, '')), 'B')
  ) STORED;

ALTER TABLE public.digital_products ADD COLUMN IF NOT EXISTS fts_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('french', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(description, '')), 'B')
  ) STORED;

ALTER TABLE public.events ADD COLUMN IF NOT EXISTS fts_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('french', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(description, '')), 'B')
  ) STORED;

ALTER TABLE public.media_content ADD COLUMN IF NOT EXISTS fts_vector tsvector
  GENERATED ALWAYS AS (
    setweight(to_tsvector('french', coalesce(title, '')), 'A') ||
    setweight(to_tsvector('french', coalesce(description, '')), 'B')
  ) STORED;

CREATE INDEX IF NOT EXISTS idx_orgs_fts ON public.organizations USING GIN(fts_vector);
CREATE INDEX IF NOT EXISTS idx_products_fts ON public.digital_products USING GIN(fts_vector);
CREATE INDEX IF NOT EXISTS idx_events_fts ON public.events USING GIN(fts_vector);
CREATE INDEX IF NOT EXISTS idx_media_fts ON public.media_content USING GIN(fts_vector);

-- =============================================
-- PHASE 4: CRM COMMUNAUTAIRE
-- =============================================

CREATE TABLE public.contacts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  name TEXT,
  phone TEXT,
  tags TEXT[] DEFAULT '{}',
  source TEXT DEFAULT 'manual',
  metadata JSONB DEFAULT '{}'::jsonb,
  is_subscribed BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, email)
);

ALTER TABLE public.contacts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "contacts_manager_select" ON public.contacts FOR SELECT
  USING (can_manage_org(auth.uid(), organization_id));
CREATE POLICY "contacts_manager_insert" ON public.contacts FOR INSERT
  WITH CHECK (can_manage_org(auth.uid(), organization_id));
CREATE POLICY "contacts_manager_update" ON public.contacts FOR UPDATE
  USING (can_manage_org(auth.uid(), organization_id));
CREATE POLICY "contacts_admin_delete" ON public.contacts FOR DELETE
  USING (can_admin_org(auth.uid(), organization_id));

CREATE INDEX idx_contacts_org ON public.contacts(organization_id);

CREATE TABLE public.email_campaigns (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID,
  subject TEXT NOT NULL,
  body TEXT NOT NULL,
  recipient_tags TEXT[] DEFAULT '{}',
  recipient_count INTEGER DEFAULT 0,
  sent_count INTEGER DEFAULT 0,
  open_count INTEGER DEFAULT 0,
  click_count INTEGER DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'draft',
  scheduled_at TIMESTAMPTZ,
  sent_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.email_campaigns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "email_campaigns_manager_select" ON public.email_campaigns FOR SELECT
  USING (can_manage_org(auth.uid(), organization_id));
CREATE POLICY "email_campaigns_manager_insert" ON public.email_campaigns FOR INSERT
  WITH CHECK (can_manage_org(auth.uid(), organization_id));
CREATE POLICY "email_campaigns_manager_update" ON public.email_campaigns FOR UPDATE
  USING (can_manage_org(auth.uid(), organization_id));
CREATE POLICY "email_campaigns_admin_delete" ON public.email_campaigns FOR DELETE
  USING (can_admin_org(auth.uid(), organization_id));

-- =============================================
-- PHASE 5: PROGRAMMES / FORMATION
-- =============================================

CREATE TABLE public.programs (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID,
  title TEXT NOT NULL,
  description TEXT,
  cover_image_url TEXT,
  price NUMERIC DEFAULT 0,
  currency TEXT DEFAULT 'XOF',
  is_free BOOLEAN DEFAULT false,
  is_published BOOLEAN DEFAULT false,
  is_featured BOOLEAN DEFAULT false,
  enrollment_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.programs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "programs_public_select" ON public.programs FOR SELECT
  USING (is_published = true);
CREATE POLICY "programs_manager_select" ON public.programs FOR SELECT
  USING (can_manage_org(auth.uid(), organization_id));
CREATE POLICY "programs_manager_insert" ON public.programs FOR INSERT
  WITH CHECK (can_manage_org(auth.uid(), organization_id));
CREATE POLICY "programs_manager_update" ON public.programs FOR UPDATE
  USING (can_manage_org(auth.uid(), organization_id));
CREATE POLICY "programs_admin_delete" ON public.programs FOR DELETE
  USING (can_admin_org(auth.uid(), organization_id));

CREATE TABLE public.program_modules (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.program_modules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "modules_public_select" ON public.program_modules FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.programs WHERE id = program_id AND is_published = true));
CREATE POLICY "modules_manager_select" ON public.program_modules FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.programs p WHERE p.id = program_id AND can_manage_org(auth.uid(), p.organization_id)));
CREATE POLICY "modules_manager_insert" ON public.program_modules FOR INSERT
  WITH CHECK (EXISTS (SELECT 1 FROM public.programs p WHERE p.id = program_id AND can_manage_org(auth.uid(), p.organization_id)));
CREATE POLICY "modules_manager_update" ON public.program_modules FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.programs p WHERE p.id = program_id AND can_manage_org(auth.uid(), p.organization_id)));
CREATE POLICY "modules_admin_delete" ON public.program_modules FOR DELETE
  USING (EXISTS (SELECT 1 FROM public.programs p WHERE p.id = program_id AND can_admin_org(auth.uid(), p.organization_id)));

CREATE TABLE public.program_lessons (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id UUID NOT NULL REFERENCES public.program_modules(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT,
  video_url TEXT,
  duration_minutes INTEGER,
  order_index INTEGER NOT NULL DEFAULT 0,
  is_free_preview BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.program_lessons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "lessons_public_select" ON public.program_lessons FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.program_modules m
    JOIN public.programs p ON p.id = m.program_id
    WHERE m.id = module_id AND p.is_published = true
  ));
CREATE POLICY "lessons_manager_select" ON public.program_lessons FOR SELECT
  USING (EXISTS (
    SELECT 1 FROM public.program_modules m
    JOIN public.programs p ON p.id = m.program_id
    WHERE m.id = module_id AND can_manage_org(auth.uid(), p.organization_id)
  ));
CREATE POLICY "lessons_manager_insert" ON public.program_lessons FOR INSERT
  WITH CHECK (EXISTS (
    SELECT 1 FROM public.program_modules m
    JOIN public.programs p ON p.id = m.program_id
    WHERE m.id = module_id AND can_manage_org(auth.uid(), p.organization_id)
  ));
CREATE POLICY "lessons_manager_update" ON public.program_lessons FOR UPDATE
  USING (EXISTS (
    SELECT 1 FROM public.program_modules m
    JOIN public.programs p ON p.id = m.program_id
    WHERE m.id = module_id AND can_manage_org(auth.uid(), p.organization_id)
  ));
CREATE POLICY "lessons_admin_delete" ON public.program_lessons FOR DELETE
  USING (EXISTS (
    SELECT 1 FROM public.program_modules m
    JOIN public.programs p ON p.id = m.program_id
    WHERE m.id = module_id AND can_admin_org(auth.uid(), p.organization_id)
  ));

-- Enrollments & progression
CREATE TABLE public.program_enrollments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  program_id UUID NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'active',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(program_id, user_id)
);

ALTER TABLE public.program_enrollments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "enrollments_select_own" ON public.program_enrollments FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "enrollments_insert_own" ON public.program_enrollments FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "enrollments_update_own" ON public.program_enrollments FOR UPDATE
  USING (user_id = auth.uid());
CREATE POLICY "enrollments_admin_select" ON public.program_enrollments FOR SELECT
  USING (EXISTS (SELECT 1 FROM public.programs p WHERE p.id = program_id AND can_admin_org(auth.uid(), p.organization_id)));

CREATE TABLE public.lesson_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id UUID NOT NULL REFERENCES public.program_lessons(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  completed BOOLEAN NOT NULL DEFAULT false,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(lesson_id, user_id)
);

ALTER TABLE public.lesson_progress ENABLE ROW LEVEL SECURITY;

CREATE POLICY "progress_select_own" ON public.lesson_progress FOR SELECT
  USING (user_id = auth.uid());
CREATE POLICY "progress_upsert_own" ON public.lesson_progress FOR INSERT
  WITH CHECK (user_id = auth.uid());
CREATE POLICY "progress_update_own" ON public.lesson_progress FOR UPDATE
  USING (user_id = auth.uid());

-- =============================================
-- PHASE 6: GOUVERNANCE - Suspension org
-- =============================================

ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS is_suspended BOOLEAN DEFAULT false;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS suspension_reason TEXT;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS suspended_until TIMESTAMPTZ;

-- Marketplace featured score
ALTER TABLE public.digital_products ADD COLUMN IF NOT EXISTS featured_score NUMERIC DEFAULT 0;
ALTER TABLE public.donation_campaigns ADD COLUMN IF NOT EXISTS featured_score NUMERIC DEFAULT 0;

-- =============================================
-- PHASE 7: PERFORMANCE INDEXES
-- =============================================

CREATE INDEX IF NOT EXISTS idx_donations_org_created ON public.donations(organization_id, created_at);
CREATE INDEX IF NOT EXISTS idx_donations_status ON public.donations(status);
CREATE INDEX IF NOT EXISTS idx_purchases_org_created ON public.product_purchases(organization_id, created_at);
CREATE INDEX IF NOT EXISTS idx_purchases_status ON public.product_purchases(status);
CREATE INDEX IF NOT EXISTS idx_members_org ON public.organization_members(organization_id);
CREATE INDEX IF NOT EXISTS idx_members_user ON public.organization_members(user_id);
CREATE INDEX IF NOT EXISTS idx_media_org_type ON public.media_content(organization_id, media_type);
CREATE INDEX IF NOT EXISTS idx_announcements_org ON public.announcements(organization_id);
CREATE INDEX IF NOT EXISTS idx_events_org ON public.events(organization_id);
CREATE INDEX IF NOT EXISTS idx_products_org ON public.digital_products(organization_id);
CREATE INDEX IF NOT EXISTS idx_campaigns_org ON public.donation_campaigns(organization_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_links_org ON public.affiliate_links(organization_id);
CREATE INDEX IF NOT EXISTS idx_affiliate_sales_org ON public.affiliate_sales(organization_id);
CREATE INDEX IF NOT EXISTS idx_notifications_user ON public.user_notifications(user_id, is_read);
CREATE INDEX IF NOT EXISTS idx_watch_history_user ON public.watch_history(user_id);
CREATE INDEX IF NOT EXISTS idx_photos_org ON public.org_photos(organization_id);
