ALTER TABLE public.programs
  ADD COLUMN IF NOT EXISTS max_quiz_attempts integer NOT NULL DEFAULT 3;