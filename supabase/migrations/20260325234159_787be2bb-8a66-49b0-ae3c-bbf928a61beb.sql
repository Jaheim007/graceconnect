
-- Allow quizzes to be module-level (not just lesson-level)
ALTER TABLE public.program_quizzes ALTER COLUMN lesson_id DROP NOT NULL;
ALTER TABLE public.program_quizzes ADD COLUMN IF NOT EXISTS module_id uuid REFERENCES public.program_modules(id) ON DELETE CASCADE;
ALTER TABLE public.program_quizzes ADD COLUMN IF NOT EXISTS max_attempts integer DEFAULT NULL;
ALTER TABLE public.program_quizzes ADD COLUMN IF NOT EXISTS quiz_type text NOT NULL DEFAULT 'module_end';

-- Add question type support (mcq, true_false, fill_blank)
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS question_type text NOT NULL DEFAULT 'mcq';
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS explanation text;
ALTER TABLE public.quiz_questions ADD COLUMN IF NOT EXISTS correct_text text;

-- Add pass percentage per module
ALTER TABLE public.program_modules ADD COLUMN IF NOT EXISTS pass_percentage integer DEFAULT 60;
ALTER TABLE public.program_modules ADD COLUMN IF NOT EXISTS max_quiz_attempts integer DEFAULT NULL;

-- Add attempt_number to quiz_attempts
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS attempt_number integer DEFAULT 1;
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS total_questions integer;
ALTER TABLE public.quiz_attempts ADD COLUMN IF NOT EXISTS correct_count integer;

-- Module flashcards table
CREATE TABLE IF NOT EXISTS public.module_flashcards (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  module_id uuid NOT NULL REFERENCES public.program_modules(id) ON DELETE CASCADE,
  front_text text NOT NULL,
  back_text text NOT NULL,
  display_order integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.module_flashcards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "flashcards_public_select" ON public.module_flashcards FOR SELECT USING (true);
CREATE POLICY "flashcards_manager_all" ON public.module_flashcards FOR ALL USING (
  EXISTS (SELECT 1 FROM public.program_modules pm JOIN public.programs p ON p.id = pm.program_id WHERE pm.id = module_id AND can_manage_org(auth.uid(), p.organization_id))
) WITH CHECK (
  EXISTS (SELECT 1 FROM public.program_modules pm JOIN public.programs p ON p.id = pm.program_id WHERE pm.id = module_id AND can_manage_org(auth.uid(), p.organization_id))
);

CREATE INDEX IF NOT EXISTS idx_program_quizzes_module ON public.program_quizzes(module_id);
CREATE INDEX IF NOT EXISTS idx_module_flashcards_module ON public.module_flashcards(module_id);
