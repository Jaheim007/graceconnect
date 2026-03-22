
-- Add LMS settings columns to programs table
ALTER TABLE public.programs 
  ADD COLUMN IF NOT EXISTS passing_score integer DEFAULT 70,
  ADD COLUMN IF NOT EXISTS require_sequential_lessons boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS require_assessment_for_cert boolean DEFAULT false,
  ADD COLUMN IF NOT EXISTS certificate_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS assessment_enabled boolean DEFAULT true,
  ADD COLUMN IF NOT EXISTS gamification_enabled boolean DEFAULT true;

-- Add lesson completion tracking improvements to program_enrollments
ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS completed_lessons text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS completed_modules text[] DEFAULT '{}';
