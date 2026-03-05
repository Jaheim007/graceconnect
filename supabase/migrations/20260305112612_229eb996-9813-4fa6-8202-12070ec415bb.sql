
-- ============================================================
-- AI STUDIO & CONTENT FACTORY — MIGRATION COMPLÈTE
-- ============================================================

-- ===================== 1. NEW TABLES ========================

-- 1a) ai_policy_profiles
CREATE TABLE IF NOT EXISTS public.ai_policy_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text UNIQUE NOT NULL,
  rules_json jsonb NOT NULL DEFAULT '{}',
  requires_human_review boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_policy_profiles ENABLE ROW LEVEL SECURITY;

-- 1b) ai_quality_scores
CREATE TABLE IF NOT EXISTS public.ai_quality_scores (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  job_id uuid NOT NULL REFERENCES public.ai_generation_jobs(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.ai_content_projects(id) ON DELETE CASCADE,
  score_overall numeric DEFAULT 0,
  scores_json jsonb NOT NULL DEFAULT '{}',
  flags_json jsonb NOT NULL DEFAULT '{}',
  review_required boolean NOT NULL DEFAULT true,
  review_status text NOT NULL DEFAULT 'pending',
  review_notes text,
  reviewed_by uuid REFERENCES auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.ai_quality_scores ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ai_quality_scores_org_status ON public.ai_quality_scores(org_id, review_status);
CREATE INDEX IF NOT EXISTS idx_ai_quality_scores_project ON public.ai_quality_scores(project_id);

-- 1c) kids_book_projects
CREATE TABLE IF NOT EXISTS public.kids_book_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.ai_content_projects(id) ON DELETE CASCADE,
  age_range text NOT NULL,
  style text,
  character_bible_json jsonb NOT NULL DEFAULT '{}',
  pages_json jsonb NOT NULL DEFAULT '{}',
  safety_status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.kids_book_projects ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_kids_book_org_safety ON public.kids_book_projects(org_id, safety_status);

-- 1d) coloring_book_projects
CREATE TABLE IF NOT EXISTS public.coloring_book_projects (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id uuid NOT NULL REFERENCES public.ai_content_projects(id) ON DELETE CASCADE,
  theme text NOT NULL,
  pages_count int NOT NULL DEFAULT 20,
  line_art_style text NOT NULL DEFAULT 'simple',
  pages_json jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.coloring_book_projects ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_coloring_book_org ON public.coloring_book_projects(org_id);

-- 1e) scripture_references
CREATE TABLE IF NOT EXISTS public.scripture_references (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  book text NOT NULL,
  chapter int NOT NULL,
  verse_start int NOT NULL,
  verse_end int NOT NULL,
  translation_code text,
  text text,
  source text NOT NULL DEFAULT 'reference_only',
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.scripture_references ENABLE ROW LEVEL SECURITY;

-- 1f) content_scripture_links
CREATE TABLE IF NOT EXISTS public.content_scripture_links (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  content_type text NOT NULL,
  content_id uuid NOT NULL,
  scripture_reference_id uuid NOT NULL REFERENCES public.scripture_references(id) ON DELETE CASCADE,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.content_scripture_links ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_content_scripture_org_type ON public.content_scripture_links(org_id, content_type, content_id);

-- 1g) ai_assets
CREATE TABLE IF NOT EXISTS public.ai_assets (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  job_id uuid REFERENCES public.ai_generation_jobs(id) ON DELETE CASCADE,
  project_id uuid REFERENCES public.ai_content_projects(id) ON DELETE CASCADE,
  asset_type text NOT NULL,
  storage_bucket text NOT NULL,
  storage_path text NOT NULL,
  mime_type text,
  metadata jsonb NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(storage_bucket, storage_path)
);
ALTER TABLE public.ai_assets ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS idx_ai_assets_org_type ON public.ai_assets(org_id, asset_type);

-- ===================== 2. ALTER EXISTING TABLES ==============

-- 2a) ai_templates: add missing columns
ALTER TABLE public.ai_templates ADD COLUMN IF NOT EXISTS template_type text;
ALTER TABLE public.ai_templates ADD COLUMN IF NOT EXISTS prompt_system text;
ALTER TABLE public.ai_templates ADD COLUMN IF NOT EXISTS prompt_user_pattern text;
ALTER TABLE public.ai_templates ADD COLUMN IF NOT EXISTS policy_profile_id uuid REFERENCES public.ai_policy_profiles(id);

CREATE INDEX IF NOT EXISTS idx_ai_templates_org ON public.ai_templates(organization_id);
CREATE INDEX IF NOT EXISTS idx_ai_templates_type ON public.ai_templates(template_type);
CREATE INDEX IF NOT EXISTS idx_ai_templates_active ON public.ai_templates(is_active);

-- 2b) ai_generation_jobs: add missing columns
ALTER TABLE public.ai_generation_jobs ADD COLUMN IF NOT EXISTS template_id uuid REFERENCES public.ai_templates(id);
ALTER TABLE public.ai_generation_jobs ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'gemini';
ALTER TABLE public.ai_generation_jobs ADD COLUMN IF NOT EXISTS estimated_cost_units int DEFAULT 0;
ALTER TABLE public.ai_generation_jobs ADD COLUMN IF NOT EXISTS result_summary jsonb NOT NULL DEFAULT '{}';

CREATE INDEX IF NOT EXISTS idx_ai_gen_jobs_org_status ON public.ai_generation_jobs(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_gen_jobs_project ON public.ai_generation_jobs(project_id);
CREATE INDEX IF NOT EXISTS idx_ai_gen_jobs_template ON public.ai_generation_jobs(template_id);

-- 2c) ai_content_projects: add linked_media_id + data_json
ALTER TABLE public.ai_content_projects ADD COLUMN IF NOT EXISTS linked_media_id uuid REFERENCES public.media_content(id) ON DELETE SET NULL;
ALTER TABLE public.ai_content_projects ADD COLUMN IF NOT EXISTS data_json jsonb NOT NULL DEFAULT '{}';
ALTER TABLE public.ai_content_projects ADD COLUMN IF NOT EXISTS description text;

CREATE INDEX IF NOT EXISTS idx_ai_projects_org_status ON public.ai_content_projects(organization_id, status);
CREATE INDEX IF NOT EXISTS idx_ai_projects_type ON public.ai_content_projects(project_type);
CREATE INDEX IF NOT EXISTS idx_ai_projects_creator ON public.ai_content_projects(created_by);

-- 2d) digital_products: AI traceability
ALTER TABLE public.digital_products ADD COLUMN IF NOT EXISTS ai_generated boolean NOT NULL DEFAULT false;
ALTER TABLE public.digital_products ADD COLUMN IF NOT EXISTS ai_project_id uuid REFERENCES public.ai_content_projects(id) ON DELETE SET NULL;

-- 2e) Governance columns on key tables
-- digital_products
ALTER TABLE public.digital_products ADD COLUMN IF NOT EXISTS publication_status text NOT NULL DEFAULT 'draft';
ALTER TABLE public.digital_products ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
ALTER TABLE public.digital_products ADD COLUMN IF NOT EXISTS submitted_for_review_at timestamptz;
ALTER TABLE public.digital_products ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE public.digital_products ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id);

-- media_content
ALTER TABLE public.media_content ADD COLUMN IF NOT EXISTS publication_status text NOT NULL DEFAULT 'draft';
ALTER TABLE public.media_content ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
ALTER TABLE public.media_content ADD COLUMN IF NOT EXISTS submitted_for_review_at timestamptz;
ALTER TABLE public.media_content ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE public.media_content ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id);

-- announcements
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS publication_status text NOT NULL DEFAULT 'draft';
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS submitted_for_review_at timestamptz;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE public.announcements ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id);

-- events
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS publication_status text NOT NULL DEFAULT 'draft';
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS submitted_for_review_at timestamptz;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE public.events ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id);

-- programs
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS publication_status text NOT NULL DEFAULT 'draft';
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS submitted_for_review_at timestamptz;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id);

-- program_lessons
ALTER TABLE public.program_lessons ADD COLUMN IF NOT EXISTS publication_status text NOT NULL DEFAULT 'draft';
ALTER TABLE public.program_lessons ADD COLUMN IF NOT EXISTS scheduled_at timestamptz;
ALTER TABLE public.program_lessons ADD COLUMN IF NOT EXISTS submitted_for_review_at timestamptz;
ALTER TABLE public.program_lessons ADD COLUMN IF NOT EXISTS reviewed_at timestamptz;
ALTER TABLE public.program_lessons ADD COLUMN IF NOT EXISTS reviewed_by uuid REFERENCES auth.users(id);


-- ===================== 3. SECURITY DEFINER FUNCTIONS =========

-- 3a) can_use_studio
CREATE OR REPLACE FUNCTION public.can_use_studio(_org_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_members
    WHERE user_id = auth.uid()
      AND organization_id = _org_id
      AND role IN ('owner', 'admin', 'editor')
  );
$$;

-- 3b) create_ai_project
CREATE OR REPLACE FUNCTION public.create_ai_project(
  _org_id uuid,
  _project_type text,
  _title text,
  _description text DEFAULT NULL,
  _data_json jsonb DEFAULT '{}',
  _template_id uuid DEFAULT NULL,
  _params_json jsonb DEFAULT '{}'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid;
  _project_id uuid;
  _job_id uuid;
BEGIN
  _caller := auth.uid();
  IF _caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.can_use_studio(_org_id) THEN RAISE EXCEPTION 'Not authorized for studio'; END IF;

  INSERT INTO public.ai_content_projects (
    organization_id, created_by, project_type, title, objective, data_json, status
  ) VALUES (
    _org_id, _caller, _project_type::public.ai_project_type, _title, _description, _data_json, 'draft'
  ) RETURNING id INTO _project_id;

  INSERT INTO public.ai_generation_jobs (
    organization_id, created_by, project_id, template_id, job_type, input_params, status, provider
  ) VALUES (
    _org_id, _caller, _project_id, _template_id, 'generate_outline', _params_json, 'queued', 'gemini'
  ) RETURNING id INTO _job_id;

  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, organization_id, metadata)
  VALUES (_caller, 'studio.project_created', 'ai_content_project', _project_id, _org_id,
    jsonb_build_object('title', _title, 'type', _project_type, 'initial_job', _job_id));

  RETURN _project_id;
END;
$$;

-- 3c) approve_ai_quality
CREATE OR REPLACE FUNCTION public.approve_ai_quality(
  _org_id uuid,
  _quality_score_id uuid,
  _notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid;
  _qs record;
BEGIN
  _caller := auth.uid();
  IF _caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.can_admin_org(_caller, _org_id) AND NOT public.is_superadmin(_caller) THEN
    RAISE EXCEPTION 'Only owner/admin or superadmin can approve quality';
  END IF;

  SELECT * INTO _qs FROM public.ai_quality_scores WHERE id = _quality_score_id AND org_id = _org_id;
  IF _qs IS NULL THEN RAISE EXCEPTION 'Quality score not found'; END IF;

  UPDATE public.ai_quality_scores SET
    review_status = 'approved',
    review_notes = _notes,
    reviewed_by = _caller,
    reviewed_at = now()
  WHERE id = _quality_score_id;

  -- Update project status if linked
  IF _qs.project_id IS NOT NULL THEN
    UPDATE public.ai_content_projects SET status = 'ready_to_publish' WHERE id = _qs.project_id;
  END IF;

  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, organization_id, metadata)
  VALUES (_caller, 'studio.quality_approved', 'ai_quality_score', _quality_score_id, _org_id,
    jsonb_build_object('project_id', _qs.project_id, 'score', _qs.score_overall));

  RETURN jsonb_build_object('ok', true, 'status', 'approved');
END;
$$;

-- 3d) reject_ai_quality
CREATE OR REPLACE FUNCTION public.reject_ai_quality(
  _org_id uuid,
  _quality_score_id uuid,
  _notes text DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid;
  _qs record;
BEGIN
  _caller := auth.uid();
  IF _caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.can_admin_org(_caller, _org_id) AND NOT public.is_superadmin(_caller) THEN
    RAISE EXCEPTION 'Only owner/admin or superadmin can reject quality';
  END IF;

  SELECT * INTO _qs FROM public.ai_quality_scores WHERE id = _quality_score_id AND org_id = _org_id;
  IF _qs IS NULL THEN RAISE EXCEPTION 'Quality score not found'; END IF;

  UPDATE public.ai_quality_scores SET
    review_status = 'rejected',
    review_notes = _notes,
    reviewed_by = _caller,
    reviewed_at = now()
  WHERE id = _quality_score_id;

  IF _qs.project_id IS NOT NULL THEN
    UPDATE public.ai_content_projects SET status = 'draft' WHERE id = _qs.project_id;
  END IF;

  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, organization_id, metadata)
  VALUES (_caller, 'studio.quality_rejected', 'ai_quality_score', _quality_score_id, _org_id,
    jsonb_build_object('project_id', _qs.project_id, 'notes', _notes));

  RETURN jsonb_build_object('ok', true, 'status', 'rejected');
END;
$$;

-- 3e) link_project_to_product
CREATE OR REPLACE FUNCTION public.link_project_to_product(
  _org_id uuid,
  _project_id uuid,
  _product_id uuid
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid;
BEGIN
  _caller := auth.uid();
  IF _caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.can_use_studio(_org_id) THEN RAISE EXCEPTION 'Not authorized'; END IF;

  -- Verify project belongs to org
  IF NOT EXISTS (SELECT 1 FROM public.ai_content_projects WHERE id = _project_id AND organization_id = _org_id) THEN
    RAISE EXCEPTION 'Project not found in this org';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM public.digital_products WHERE id = _product_id AND organization_id = _org_id) THEN
    RAISE EXCEPTION 'Product not found in this org';
  END IF;

  UPDATE public.ai_content_projects SET linked_product_id = _product_id WHERE id = _project_id;
  UPDATE public.digital_products SET ai_generated = true, ai_project_id = _project_id WHERE id = _product_id;

  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, organization_id, metadata)
  VALUES (_caller, 'studio.project_linked_product', 'ai_content_project', _project_id, _org_id,
    jsonb_build_object('product_id', _product_id));

  RETURN jsonb_build_object('ok', true);
END;
$$;

-- 3f) upsert_scripture_reference
CREATE OR REPLACE FUNCTION public.upsert_scripture_reference(
  _book text,
  _chapter int,
  _verse_start int,
  _verse_end int,
  _translation_code text DEFAULT NULL,
  _text text DEFAULT NULL,
  _source text DEFAULT 'reference_only'
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _id uuid;
BEGIN
  SELECT id INTO _id FROM public.scripture_references
  WHERE book = _book AND chapter = _chapter AND verse_start = _verse_start AND verse_end = _verse_end
    AND COALESCE(translation_code, '') = COALESCE(_translation_code, '');

  IF _id IS NOT NULL THEN
    UPDATE public.scripture_references SET text = COALESCE(_text, text), source = _source WHERE id = _id;
    RETURN _id;
  END IF;

  INSERT INTO public.scripture_references (book, chapter, verse_start, verse_end, translation_code, text, source)
  VALUES (_book, _chapter, _verse_start, _verse_end, _translation_code, _text, _source)
  RETURNING id INTO _id;

  RETURN _id;
END;
$$;

-- 3g) link_scripture_to_content
CREATE OR REPLACE FUNCTION public.link_scripture_to_content(
  _org_id uuid,
  _content_type text,
  _content_id uuid,
  _scripture_reference_id uuid,
  _note text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid;
  _link_id uuid;
BEGIN
  _caller := auth.uid();
  IF _caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;
  IF NOT public.can_use_studio(_org_id) THEN RAISE EXCEPTION 'Not authorized'; END IF;

  INSERT INTO public.content_scripture_links (org_id, content_type, content_id, scripture_reference_id, note)
  VALUES (_org_id, _content_type, _content_id, _scripture_reference_id, _note)
  RETURNING id INTO _link_id;

  RETURN _link_id;
END;
$$;


-- ===================== 4. TRIGGERS ==========================

-- 4a) updated_at on ai_content_projects (may already exist via set_updated_at)
DROP TRIGGER IF EXISTS set_ai_content_projects_updated_at ON public.ai_content_projects;
CREATE TRIGGER set_ai_content_projects_updated_at
  BEFORE UPDATE ON public.ai_content_projects
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();


-- ===================== 5. RLS POLICIES ======================

-- ai_policy_profiles: superadmin full, authenticated select
CREATE POLICY "superadmin_full_ai_policy_profiles" ON public.ai_policy_profiles
  FOR ALL TO authenticated USING (public.is_superadmin(auth.uid()));
CREATE POLICY "authenticated_select_ai_policy_profiles" ON public.ai_policy_profiles
  FOR SELECT TO authenticated USING (true);

-- ai_quality_scores
CREATE POLICY "superadmin_full_ai_quality_scores" ON public.ai_quality_scores
  FOR ALL TO authenticated USING (public.is_superadmin(auth.uid()));
CREATE POLICY "studio_access_ai_quality_scores" ON public.ai_quality_scores
  FOR SELECT TO authenticated USING (public.can_use_studio(org_id));
CREATE POLICY "studio_insert_ai_quality_scores" ON public.ai_quality_scores
  FOR INSERT TO authenticated WITH CHECK (public.can_use_studio(org_id));
CREATE POLICY "studio_update_ai_quality_scores" ON public.ai_quality_scores
  FOR UPDATE TO authenticated USING (public.can_admin_org(auth.uid(), org_id));

-- kids_book_projects
CREATE POLICY "superadmin_full_kids_book" ON public.kids_book_projects
  FOR ALL TO authenticated USING (public.is_superadmin(auth.uid()));
CREATE POLICY "studio_select_kids_book" ON public.kids_book_projects
  FOR SELECT TO authenticated USING (public.can_use_studio(org_id));
CREATE POLICY "studio_insert_kids_book" ON public.kids_book_projects
  FOR INSERT TO authenticated WITH CHECK (public.can_use_studio(org_id));
CREATE POLICY "studio_update_kids_book" ON public.kids_book_projects
  FOR UPDATE TO authenticated USING (public.can_use_studio(org_id));
CREATE POLICY "studio_delete_kids_book" ON public.kids_book_projects
  FOR DELETE TO authenticated USING (public.can_use_studio(org_id));

-- coloring_book_projects
CREATE POLICY "superadmin_full_coloring_book" ON public.coloring_book_projects
  FOR ALL TO authenticated USING (public.is_superadmin(auth.uid()));
CREATE POLICY "studio_select_coloring_book" ON public.coloring_book_projects
  FOR SELECT TO authenticated USING (public.can_use_studio(org_id));
CREATE POLICY "studio_insert_coloring_book" ON public.coloring_book_projects
  FOR INSERT TO authenticated WITH CHECK (public.can_use_studio(org_id));
CREATE POLICY "studio_update_coloring_book" ON public.coloring_book_projects
  FOR UPDATE TO authenticated USING (public.can_use_studio(org_id));
CREATE POLICY "studio_delete_coloring_book" ON public.coloring_book_projects
  FOR DELETE TO authenticated USING (public.can_use_studio(org_id));

-- scripture_references (global read, superadmin write)
CREATE POLICY "authenticated_select_scriptures" ON public.scripture_references
  FOR SELECT TO authenticated USING (true);
CREATE POLICY "superadmin_full_scriptures" ON public.scripture_references
  FOR ALL TO authenticated USING (public.is_superadmin(auth.uid()));
CREATE POLICY "studio_insert_scriptures" ON public.scripture_references
  FOR INSERT TO authenticated WITH CHECK (true);

-- content_scripture_links
CREATE POLICY "superadmin_full_scripture_links" ON public.content_scripture_links
  FOR ALL TO authenticated USING (public.is_superadmin(auth.uid()));
CREATE POLICY "studio_select_scripture_links" ON public.content_scripture_links
  FOR SELECT TO authenticated USING (public.can_use_studio(org_id));
CREATE POLICY "studio_insert_scripture_links" ON public.content_scripture_links
  FOR INSERT TO authenticated WITH CHECK (public.can_use_studio(org_id));
CREATE POLICY "studio_delete_scripture_links" ON public.content_scripture_links
  FOR DELETE TO authenticated USING (public.can_use_studio(org_id));

-- ai_assets
CREATE POLICY "superadmin_full_ai_assets" ON public.ai_assets
  FOR ALL TO authenticated USING (public.is_superadmin(auth.uid()));
CREATE POLICY "studio_select_ai_assets" ON public.ai_assets
  FOR SELECT TO authenticated USING (public.can_use_studio(org_id));
CREATE POLICY "studio_insert_ai_assets" ON public.ai_assets
  FOR INSERT TO authenticated WITH CHECK (public.can_use_studio(org_id));
CREATE POLICY "studio_update_ai_assets" ON public.ai_assets
  FOR UPDATE TO authenticated USING (public.can_use_studio(org_id));
CREATE POLICY "studio_delete_ai_assets" ON public.ai_assets
  FOR DELETE TO authenticated USING (public.can_use_studio(org_id));


-- ===================== 6. SEEDS =============================

-- 6a) Policy profiles
INSERT INTO public.ai_policy_profiles (name, rules_json, requires_human_review) VALUES
  ('kids_safe', '{"max_violence":0,"max_sexual":0,"max_horror":0,"require_positive_moral":true,"age_appropriate_language":true,"no_religious_controversy":true}', true),
  ('religious_safe', '{"respect_denominations":true,"no_blasphemy":true,"scripture_accuracy":true,"theological_sensitivity":"high"}', true),
  ('general_safe', '{"no_hate_speech":true,"no_explicit_content":true,"fact_check_recommended":false}', false)
ON CONFLICT (name) DO NOTHING;

-- 6b) Global templates
INSERT INTO public.ai_templates (name, project_type, is_global, is_active, organization_id, template_type, prompt_system, prompt_user_pattern, default_params, policy_profile_id) VALUES
  ('Ebook FR', 'ebook', true, true, NULL, 'ebook',
   'Tu es un rédacteur professionnel expert en ebooks numériques. Tu rédiges en français avec un ton engageant.',
   'Rédige un ebook complet sur le sujet: {{title}}. Objectif: {{objective}}. Public: {{audience}}.',
   '{"language":"fr","tone":"professionnel","target_length":10}',
   (SELECT id FROM public.ai_policy_profiles WHERE name = 'general_safe')),

  ('Ebook EN', 'ebook', true, true, NULL, 'ebook',
   'You are a professional ebook writer. Write engaging, well-structured content in English.',
   'Write a complete ebook on: {{title}}. Goal: {{objective}}. Audience: {{audience}}.',
   '{"language":"en","tone":"professional","target_length":10}',
   (SELECT id FROM public.ai_policy_profiles WHERE name = 'general_safe')),

  ('Histoire Enfants FR', 'kids_book', true, true, NULL, 'kids_book',
   'Tu es un auteur de livres pour enfants. Tu écris des histoires joyeuses, éducatives et adaptées à l''âge cible. JAMAIS de violence ni de contenu inapproprié.',
   'Écris une histoire pour enfants ({{age_range}}) sur: {{title}}. Morale: {{moral}}. Personnages: {{characters}}.',
   '{"language":"fr","age_range":"4-8 ans","style":"coloré et joyeux"}',
   (SELECT id FROM public.ai_policy_profiles WHERE name = 'kids_safe')),

  ('Kids Story EN', 'kids_book', true, true, NULL, 'kids_book',
   'You are a children''s book author. Write joyful, educational stories appropriate for the target age. NEVER include violence or inappropriate content.',
   'Write a children''s story ({{age_range}}) about: {{title}}. Moral: {{moral}}. Characters: {{characters}}.',
   '{"language":"en","age_range":"4-8","style":"colorful and joyful"}',
   (SELECT id FROM public.ai_policy_profiles WHERE name = 'kids_safe')),

  ('Coloriage Thématique', 'coloring_book', true, true, NULL, 'coloring_book',
   'Tu es un créateur de livres de coloriage. Tu génères des descriptions de pages de coloriage avec des traits nets et simples.',
   'Génère {{pages_count}} pages de coloriage sur le thème: {{theme}}. Style de trait: {{line_art_style}}.',
   '{"language":"fr","pages_count":20,"line_art_style":"simple"}',
   (SELECT id FROM public.ai_policy_profiles WHERE name = 'kids_safe')),

  ('Pack Prédication', 'sermon_pack', true, true, NULL, 'sermon_pack',
   'Tu es un rédacteur spécialisé en contenu de prédication chrétienne. Tu rédiges des sermons profonds, inspirants et ancrés dans les Écritures.',
   'Rédige un pack de prédication sur: {{title}}. Thème: {{sermon_theme}}. Texte de base: {{sermon_text}}. Points clés: {{sermon_points}}.',
   '{"language":"fr","tone":"inspirant","scripture_required":true}',
   (SELECT id FROM public.ai_policy_profiles WHERE name = 'religious_safe')),

  ('Pack Bible Référence', 'bible_pack', true, true, NULL, 'bible_pack',
   'Tu es un compilateur de références bibliques. Tu organises des versets par thème avec des notes d''étude. Tu ne modifies JAMAIS le texte des Écritures.',
   'Compile des références bibliques sur: {{title}}. Thèmes: {{keywords}}. Format: références avec notes d''étude.',
   '{"language":"fr","source":"reference_only","format":"study_notes"}',
   (SELECT id FROM public.ai_policy_profiles WHERE name = 'religious_safe')),

  ('Pack Formation', 'course_pack', true, true, NULL, 'course_pack',
   'Tu es un concepteur pédagogique expert. Tu crées des parcours de formation structurés avec modules, leçons et exercices.',
   'Crée un cours complet sur: {{title}}. Objectif: {{objective}}. Public: {{audience}}. Nombre de modules: {{target_length}}.',
   '{"language":"fr","tone":"pédagogique","target_length":5}',
   (SELECT id FROM public.ai_policy_profiles WHERE name = 'general_safe')),

  ('Pack Marketing', 'marketing_pack', true, true, NULL, 'marketing_pack',
   'Tu es un expert en copywriting et marketing digital. Tu crées des contenus de vente percutants: landing pages, emails, publicités.',
   'Crée un pack marketing complet pour: {{title}}. Produit/service: {{objective}}. Cible: {{audience}}.',
   '{"language":"fr","tone":"persuasif","include":["landing_page","email_sequence","ad_copy"]}',
   (SELECT id FROM public.ai_policy_profiles WHERE name = 'general_safe'))
ON CONFLICT DO NOTHING;
