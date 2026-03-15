
-- Lesson attachments for PDF/documents
CREATE TABLE IF NOT EXISTS public.lesson_attachments (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid NOT NULL REFERENCES public.program_lessons(id) ON DELETE CASCADE,
  file_url text NOT NULL,
  file_name text NOT NULL,
  file_size integer,
  mime_type text,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.lesson_attachments ENABLE ROW LEVEL SECURITY;

-- Public read for enrolled users
CREATE POLICY "attachments_public_select" ON public.lesson_attachments FOR SELECT USING (true);

-- Managers can CRUD
CREATE POLICY "attachments_manager_all" ON public.lesson_attachments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM public.program_lessons pl
    JOIN public.program_modules pm ON pm.id = pl.module_id
    JOIN public.programs p ON p.id = pm.program_id
    WHERE pl.id = lesson_id
    AND can_manage_org(auth.uid(), p.organization_id)
  )
) WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.program_lessons pl
    JOIN public.program_modules pm ON pm.id = pl.module_id
    JOIN public.programs p ON p.id = pm.program_id
    WHERE pl.id = lesson_id
    AND can_manage_org(auth.uid(), p.organization_id)
  )
);

-- Ensure content_type column exists on program_lessons (may already exist from earlier migration)
DO $$ BEGIN
  ALTER TABLE public.program_lessons ADD COLUMN IF NOT EXISTS content_type text DEFAULT 'text';
  ALTER TABLE public.program_lessons ADD COLUMN IF NOT EXISTS content_url text;
  ALTER TABLE public.program_lessons ADD COLUMN IF NOT EXISTS display_order integer DEFAULT 0;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;
