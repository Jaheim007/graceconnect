
-- Add progress tracking fields to program_enrollments
ALTER TABLE public.program_enrollments 
  ADD COLUMN IF NOT EXISTS progress_percent integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_slide_index integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS quiz_score integer,
  ADD COLUMN IF NOT EXISTS total_stars integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS assessment_score integer,
  ADD COLUMN IF NOT EXISTS assessment_total integer;

-- Create certificates table
CREATE TABLE IF NOT EXISTS public.program_certificates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  program_id uuid NOT NULL REFERENCES public.programs(id) ON DELETE CASCADE,
  enrollment_id uuid REFERENCES public.program_enrollments(id) ON DELETE SET NULL,
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  certificate_number text NOT NULL DEFAULT ('CERT-' || upper(substr(gen_random_uuid()::text, 1, 8))),
  learner_name text NOT NULL,
  course_title text NOT NULL,
  stars_earned integer NOT NULL DEFAULT 0,
  assessment_score integer,
  assessment_total integer,
  issued_at timestamptz NOT NULL DEFAULT now(),
  pdf_url text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, program_id)
);

ALTER TABLE public.program_certificates ENABLE ROW LEVEL SECURITY;

-- Users can read their own certificates
CREATE POLICY "Users can read own certificates" ON public.program_certificates
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

-- Org admins can read certificates for their org
CREATE POLICY "Org admins can read org certificates" ON public.program_certificates
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.organization_members 
      WHERE organization_id = program_certificates.organization_id 
      AND user_id = auth.uid() 
      AND role IN ('owner', 'admin')
    )
  );

-- Users can insert their own certificates
CREATE POLICY "Users can create own certificates" ON public.program_certificates
  FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Update policy for enrollment progress
CREATE POLICY "Users can update own enrollment progress" ON public.program_enrollments
  FOR UPDATE TO authenticated
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());
