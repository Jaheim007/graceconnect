-- =============== PHASE 1: program_slides ===============
CREATE TABLE IF NOT EXISTS public.program_slides (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  lesson_id uuid NOT NULL REFERENCES public.program_lessons(id) ON DELETE CASCADE,
  display_order integer NOT NULL DEFAULT 0,
  slide_type text NOT NULL DEFAULT 'text',
  title text,
  body text,
  media_url text,
  caption text,
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  duration_seconds integer,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS program_slides_lesson_order_idx
  ON public.program_slides (lesson_id, display_order);

GRANT SELECT ON public.program_slides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_slides TO authenticated;
GRANT ALL ON public.program_slides TO service_role;

ALTER TABLE public.program_slides ENABLE ROW LEVEL SECURITY;

-- slide type guard (trigger, not check constraint)
CREATE OR REPLACE FUNCTION public.program_slides_validate()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  IF NEW.slide_type NOT IN ('text','image','video','quiz','flashcard','assessment') THEN
    RAISE EXCEPTION 'Invalid slide_type: %', NEW.slide_type;
  END IF;
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS program_slides_validate_trg ON public.program_slides;
CREATE TRIGGER program_slides_validate_trg
  BEFORE INSERT OR UPDATE ON public.program_slides
  FOR EACH ROW EXECUTE FUNCTION public.program_slides_validate();

-- helper: resolve the organization + published state of a slide's course
CREATE OR REPLACE FUNCTION public.slide_lesson_org(_lesson_id uuid)
RETURNS uuid
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT p.organization_id
  FROM public.program_lessons l
  JOIN public.program_modules m ON m.id = l.module_id
  JOIN public.programs p ON p.id = m.program_id
  WHERE l.id = _lesson_id
$$;

CREATE OR REPLACE FUNCTION public.slide_lesson_published(_lesson_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(p.is_published, false)
  FROM public.program_lessons l
  JOIN public.program_modules m ON m.id = l.module_id
  JOIN public.programs p ON p.id = m.program_id
  WHERE l.id = _lesson_id
$$;

DROP POLICY IF EXISTS "slides_public_read_published" ON public.program_slides;
CREATE POLICY "slides_public_read_published" ON public.program_slides
  FOR SELECT
  USING (public.slide_lesson_published(lesson_id));

DROP POLICY IF EXISTS "slides_manage_by_org" ON public.program_slides;
CREATE POLICY "slides_manage_by_org" ON public.program_slides
  FOR ALL
  TO authenticated
  USING (public.can_manage_org(auth.uid(), public.slide_lesson_org(lesson_id)))
  WITH CHECK (public.can_manage_org(auth.uid(), public.slide_lesson_org(lesson_id)));

-- =============== PHASE 4: progress columns ===============
ALTER TABLE public.program_enrollments
  ADD COLUMN IF NOT EXISTS current_lesson_id uuid,
  ADD COLUMN IF NOT EXISTS current_slide_id uuid,
  ADD COLUMN IF NOT EXISTS last_active_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS completed_slides uuid[] NOT NULL DEFAULT '{}'::uuid[];

-- =============== PHASE 6: server-issued certificates ===============
CREATE OR REPLACE FUNCTION public.issue_program_certificate(_program_id uuid)
RETURNS public.program_certificates
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _prog public.programs;
  _enr public.program_enrollments;
  _total_slides integer;
  _done_slides integer;
  _existing public.program_certificates;
  _row public.program_certificates;
  _name text;
BEGIN
  IF _uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO _prog FROM public.programs WHERE id = _program_id;
  IF _prog.id IS NULL THEN
    RAISE EXCEPTION 'Course not found';
  END IF;

  SELECT * INTO _existing FROM public.program_certificates
   WHERE program_id = _program_id AND user_id = _uid LIMIT 1;
  IF _existing.id IS NOT NULL THEN
    RETURN _existing;
  END IF;

  SELECT * INTO _enr FROM public.program_enrollments
   WHERE program_id = _program_id AND user_id = _uid LIMIT 1;
  IF _enr.id IS NULL THEN
    RAISE EXCEPTION 'Not enrolled in this course';
  END IF;

  -- slide-level completion (falls back to progress_percent for legacy courses)
  SELECT count(*) INTO _total_slides
    FROM public.program_slides s
    JOIN public.program_lessons l ON l.id = s.lesson_id
    JOIN public.program_modules m ON m.id = l.module_id
   WHERE m.program_id = _program_id;

  IF _total_slides > 0 THEN
    SELECT count(*) INTO _done_slides
      FROM public.program_slides s
      JOIN public.program_lessons l ON l.id = s.lesson_id
      JOIN public.program_modules m ON m.id = l.module_id
     WHERE m.program_id = _program_id
       AND s.id = ANY(COALESCE(_enr.completed_slides, '{}'::uuid[]));
    IF _done_slides < _total_slides THEN
      RAISE EXCEPTION 'Course not completed yet';
    END IF;
  ELSIF COALESCE(_enr.progress_percent, 0) < 100 THEN
    RAISE EXCEPTION 'Course not completed yet';
  END IF;

  -- assessment gate: only the course-level assessment score counts
  IF COALESCE(_prog.require_assessment_for_cert, false) THEN
    IF _enr.assessment_score IS NULL OR COALESCE(_enr.assessment_total, 0) = 0 THEN
      RAISE EXCEPTION 'Assessment required before certificate';
    END IF;
    IF (_enr.assessment_score::numeric / _enr.assessment_total::numeric) * 100
       < COALESCE(_prog.passing_score, 70) THEN
      RAISE EXCEPTION 'Assessment not passed';
    END IF;
  END IF;

  SELECT COALESCE(NULLIF(TRIM(display_name), ''), 'Learner') INTO _name
    FROM public.profiles WHERE id = _uid;

  INSERT INTO public.program_certificates (
    user_id, program_id, organization_id, certificate_number
  ) VALUES (
    _uid, _program_id, _prog.organization_id,
    'SV-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10))
  )
  RETURNING * INTO _row;

  RETURN _row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.issue_program_certificate(uuid) TO authenticated;

-- lock down direct client inserts
DROP POLICY IF EXISTS "cert_insert_own" ON public.program_certificates;
DROP POLICY IF EXISTS "Users can create own certificates" ON public.program_certificates;
