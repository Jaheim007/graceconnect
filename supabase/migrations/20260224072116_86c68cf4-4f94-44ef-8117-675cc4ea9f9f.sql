
-- =============================================
-- WAVE 3: Remaining strategic features
-- =============================================

-- 1. Webhooks: add webhook_url to organizations
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS webhook_url text;
ALTER TABLE public.organizations ADD COLUMN IF NOT EXISTS webhook_events text[] DEFAULT '{}'::text[];

-- 2. Upsells: add upsell/order-bump fields to digital_products
ALTER TABLE public.digital_products ADD COLUMN IF NOT EXISTS upsell_product_ids uuid[] DEFAULT '{}'::uuid[];
ALTER TABLE public.digital_products ADD COLUMN IF NOT EXISTS order_bump_product_id uuid;
ALTER TABLE public.digital_products ADD COLUMN IF NOT EXISTS order_bump_discount_percent numeric DEFAULT 0;

-- 3. Waitlist / Pre-launch table
CREATE TABLE IF NOT EXISTS public.waitlists (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  product_id uuid REFERENCES public.digital_products(id) ON DELETE SET NULL,
  title text NOT NULL,
  description text,
  launch_date timestamp with time zone,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.waitlist_entries (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  waitlist_id uuid NOT NULL REFERENCES public.waitlists(id) ON DELETE CASCADE,
  email text NOT NULL,
  name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(waitlist_id, email)
);

ALTER TABLE public.waitlists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.waitlist_entries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "waitlists_manager_all" ON public.waitlists FOR ALL USING (can_manage_org(auth.uid(), organization_id)) WITH CHECK (can_manage_org(auth.uid(), organization_id));
CREATE POLICY "waitlists_public_select" ON public.waitlists FOR SELECT USING (is_active = true);
CREATE POLICY "waitlist_entries_manager_select" ON public.waitlist_entries FOR SELECT USING (EXISTS (SELECT 1 FROM public.waitlists w WHERE w.id = waitlist_id AND can_manage_org(auth.uid(), w.organization_id)));
CREATE POLICY "waitlist_entries_public_insert" ON public.waitlist_entries FOR INSERT WITH CHECK (true);

-- 4. Quiz / Evaluations for programs
CREATE TABLE IF NOT EXISTS public.program_quizzes (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid NOT NULL REFERENCES public.program_lessons(id) ON DELETE CASCADE,
  title text NOT NULL,
  passing_score integer NOT NULL DEFAULT 70,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quiz_questions (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id uuid NOT NULL REFERENCES public.program_quizzes(id) ON DELETE CASCADE,
  question text NOT NULL,
  options jsonb NOT NULL DEFAULT '[]'::jsonb,
  correct_index integer NOT NULL DEFAULT 0,
  display_order integer DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.quiz_attempts (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  quiz_id uuid NOT NULL REFERENCES public.program_quizzes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  score integer NOT NULL DEFAULT 0,
  passed boolean NOT NULL DEFAULT false,
  answers jsonb DEFAULT '[]'::jsonb,
  completed_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.program_quizzes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_questions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.quiz_attempts ENABLE ROW LEVEL SECURITY;

-- Quiz RLS: anyone enrolled can see quizzes, managers can CRUD
CREATE POLICY "quizzes_public_select" ON public.program_quizzes FOR SELECT USING (true);
CREATE POLICY "quizzes_manager_all" ON public.program_quizzes FOR ALL USING (
  EXISTS (SELECT 1 FROM public.program_lessons pl JOIN public.program_modules pm ON pm.id = pl.module_id JOIN public.programs p ON p.id = pm.program_id WHERE pl.id = lesson_id AND can_manage_org(auth.uid(), p.organization_id))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.program_lessons pl JOIN public.program_modules pm ON pm.id = pl.module_id JOIN public.programs p ON p.id = pm.program_id WHERE pl.id = lesson_id AND can_manage_org(auth.uid(), p.organization_id))
);

CREATE POLICY "questions_public_select" ON public.quiz_questions FOR SELECT USING (true);
CREATE POLICY "questions_manager_all" ON public.quiz_questions FOR ALL USING (
  EXISTS (SELECT 1 FROM public.program_quizzes pq JOIN public.program_lessons pl ON pl.id = pq.lesson_id JOIN public.program_modules pm ON pm.id = pl.module_id JOIN public.programs p ON p.id = pm.program_id WHERE pq.id = quiz_id AND can_manage_org(auth.uid(), p.organization_id))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.program_quizzes pq JOIN public.program_lessons pl ON pl.id = pq.lesson_id JOIN public.program_modules pm ON pm.id = pl.module_id JOIN public.programs p ON p.id = pm.program_id WHERE pq.id = quiz_id AND can_manage_org(auth.uid(), p.organization_id))
);

CREATE POLICY "attempts_own_select" ON public.quiz_attempts FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "attempts_own_insert" ON public.quiz_attempts FOR INSERT WITH CHECK (user_id = auth.uid());

-- 5. Org popups config
ALTER TABLE public.org_page_settings ADD COLUMN IF NOT EXISTS popup_config jsonb DEFAULT '{"enabled":false}'::jsonb;

-- 6. Certificates: add certificate fields to programs
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS certificate_enabled boolean DEFAULT false;
ALTER TABLE public.programs ADD COLUMN IF NOT EXISTS certificate_template text DEFAULT 'default';

-- 7. Invoice number sequence for product_purchases
ALTER TABLE public.product_purchases ADD COLUMN IF NOT EXISTS invoice_number text;

-- 8. Indexes
CREATE INDEX IF NOT EXISTS idx_waitlist_entries_waitlist ON public.waitlist_entries(waitlist_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_user ON public.quiz_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_quiz_attempts_quiz ON public.quiz_attempts(quiz_id);
CREATE INDEX IF NOT EXISTS idx_quiz_questions_quiz ON public.quiz_questions(quiz_id);
