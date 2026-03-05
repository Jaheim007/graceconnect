
-- AI Studio: Project types enum
CREATE TYPE public.ai_project_type AS ENUM (
  'ebook', 'kids_book', 'coloring_book', 'course_pack', 
  'sermon_pack', 'bible_pack', 'marketing_pack'
);

-- AI Studio: Project status enum
CREATE TYPE public.ai_project_status AS ENUM (
  'draft', 'generating', 'review', 'ready_to_publish', 'published', 'archived'
);

-- AI Studio: Job status enum
CREATE TYPE public.ai_job_status AS ENUM (
  'queued', 'running', 'completed', 'failed', 'cancelled'
);

-- AI Studio: Job type enum  
CREATE TYPE public.ai_job_type AS ENUM (
  'generate_outline', 'generate_chapter', 'generate_cover', 
  'generate_page_images', 'generate_audio', 'generate_pdf',
  'generate_description', 'generate_full', 'quality_check'
);

-- AI Studio: Asset type enum
CREATE TYPE public.ai_asset_type AS ENUM (
  'image', 'audio', 'pdf', 'text', 'cover', 'preview'
);

-- ══════════════════════════════════════════════
-- 1. AI Content Projects
-- ══════════════════════════════════════════════
CREATE TABLE public.ai_content_projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  title TEXT NOT NULL,
  project_type public.ai_project_type NOT NULL DEFAULT 'ebook',
  status public.ai_project_status NOT NULL DEFAULT 'draft',
  -- Project params
  language TEXT NOT NULL DEFAULT 'fr',
  tone TEXT DEFAULT 'professional',
  target_audience TEXT,
  objective TEXT,
  target_length INTEGER, -- pages or chapters
  style_notes TEXT,
  keywords TEXT[],
  -- Structure
  structure_json JSONB DEFAULT '[]'::jsonb, -- chapters/pages outline
  -- Links to published content
  linked_product_id UUID REFERENCES public.digital_products(id) ON DELETE SET NULL,
  linked_program_id UUID REFERENCES public.programs(id) ON DELETE SET NULL,
  -- Template used
  template_id UUID,
  -- Quality
  quality_score NUMERIC(3,1),
  quality_flags TEXT[],
  requires_human_review BOOLEAN DEFAULT false,
  reviewed_by UUID,
  reviewed_at TIMESTAMPTZ,
  review_notes TEXT,
  -- Kids/Coloring specific
  age_range TEXT,
  art_style TEXT,
  characters TEXT,
  moral TEXT,
  line_art_style TEXT, -- simple/medium/detailed
  -- Sermon/Bible specific
  sermon_theme TEXT,
  sermon_text TEXT,
  sermon_points JSONB,
  -- Timestamps
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes
CREATE INDEX idx_ai_projects_org ON public.ai_content_projects(organization_id);
CREATE INDEX idx_ai_projects_status ON public.ai_content_projects(status);
CREATE INDEX idx_ai_projects_type ON public.ai_content_projects(project_type);

-- RLS
ALTER TABLE public.ai_content_projects ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org managers can manage projects"
  ON public.ai_content_projects FOR ALL TO authenticated
  USING (public.can_manage_org(auth.uid(), organization_id))
  WITH CHECK (public.can_manage_org(auth.uid(), organization_id));

-- Updated_at trigger
CREATE TRIGGER set_ai_projects_updated_at
  BEFORE UPDATE ON public.ai_content_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ══════════════════════════════════════════════
-- 2. AI Generation Jobs
-- ══════════════════════════════════════════════
CREATE TABLE public.ai_generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.ai_content_projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  created_by UUID NOT NULL REFERENCES auth.users(id),
  job_type public.ai_job_type NOT NULL,
  status public.ai_job_status NOT NULL DEFAULT 'queued',
  -- Progress
  progress INTEGER DEFAULT 0, -- 0-100
  -- Input/Output
  input_params JSONB DEFAULT '{}'::jsonb,
  output_data JSONB,
  error_message TEXT,
  -- Timing
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_jobs_project ON public.ai_generation_jobs(project_id);
CREATE INDEX idx_ai_jobs_status ON public.ai_generation_jobs(status);
CREATE INDEX idx_ai_jobs_org ON public.ai_generation_jobs(organization_id);

ALTER TABLE public.ai_generation_jobs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org managers can manage jobs"
  ON public.ai_generation_jobs FOR ALL TO authenticated
  USING (public.can_manage_org(auth.uid(), organization_id))
  WITH CHECK (public.can_manage_org(auth.uid(), organization_id));

-- ══════════════════════════════════════════════
-- 3. AI Project Assets
-- ══════════════════════════════════════════════
CREATE TABLE public.ai_project_assets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.ai_content_projects(id) ON DELETE CASCADE,
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  asset_type public.ai_asset_type NOT NULL DEFAULT 'image',
  label TEXT, -- 'cover', 'chapter_1_image', etc.
  file_url TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  is_cover BOOLEAN DEFAULT false,
  is_preview BOOLEAN DEFAULT false,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_assets_project ON public.ai_project_assets(project_id);

ALTER TABLE public.ai_project_assets ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Org managers can manage assets"
  ON public.ai_project_assets FOR ALL TO authenticated
  USING (public.can_manage_org(auth.uid(), organization_id))
  WITH CHECK (public.can_manage_org(auth.uid(), organization_id));

-- ══════════════════════════════════════════════
-- 4. AI Templates
-- ══════════════════════════════════════════════
CREATE TABLE public.ai_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE, -- NULL = global
  created_by UUID REFERENCES auth.users(id),
  name TEXT NOT NULL,
  description TEXT,
  project_type public.ai_project_type NOT NULL,
  default_params JSONB DEFAULT '{}'::jsonb, -- tone, audience, style, etc.
  prompt_template TEXT,
  is_global BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ai_templates_org ON public.ai_templates(organization_id);
CREATE INDEX idx_ai_templates_type ON public.ai_templates(project_type);

ALTER TABLE public.ai_templates ENABLE ROW LEVEL SECURITY;

-- Global templates visible to all authenticated users
CREATE POLICY "Anyone can read global templates"
  ON public.ai_templates FOR SELECT TO authenticated
  USING (is_global = true);

-- Org templates visible to org managers
CREATE POLICY "Org managers can manage org templates"
  ON public.ai_templates FOR ALL TO authenticated
  USING (
    (organization_id IS NOT NULL AND public.can_manage_org(auth.uid(), organization_id))
    OR public.is_superadmin(auth.uid())
  )
  WITH CHECK (
    (organization_id IS NOT NULL AND public.can_manage_org(auth.uid(), organization_id))
    OR public.is_superadmin(auth.uid())
  );

-- Superadmin can manage global templates
CREATE POLICY "Superadmin manages global templates"
  ON public.ai_templates FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE TRIGGER set_ai_templates_updated_at
  BEFORE UPDATE ON public.ai_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ══════════════════════════════════════════════
-- 5. AI Policies (content safety)
-- ══════════════════════════════════════════════
CREATE TABLE public.ai_policies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  rules JSONB NOT NULL DEFAULT '{}'::jsonb, -- banned_words, required_disclaimers, etc.
  applies_to public.ai_project_type[], -- which project types
  requires_human_review BOOLEAN DEFAULT false,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_policies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmin manages policies"
  ON public.ai_policies FOR ALL TO authenticated
  USING (public.is_superadmin(auth.uid()))
  WITH CHECK (public.is_superadmin(auth.uid()));

CREATE POLICY "Anyone can read active policies"
  ON public.ai_policies FOR SELECT TO authenticated
  USING (is_active = true);

CREATE TRIGGER set_ai_policies_updated_at
  BEFORE UPDATE ON public.ai_policies
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
