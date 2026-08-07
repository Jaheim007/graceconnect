-- ============================================================
-- Phase 6: completion + certificate (server-authoritative)
-- ============================================================

-- 1. Certificate detail columns used by the PDF renderer
ALTER TABLE public.program_certificates
  ADD COLUMN IF NOT EXISTS learner_name      text,
  ADD COLUMN IF NOT EXISTS course_title      text,
  ADD COLUMN IF NOT EXISTS stars_earned      integer NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS assessment_score  integer,
  ADD COLUMN IF NOT EXISTS assessment_total  integer,
  ADD COLUMN IF NOT EXISTS created_at        timestamptz NOT NULL DEFAULT now();

CREATE UNIQUE INDEX IF NOT EXISTS program_certificates_number_key
  ON public.program_certificates(certificate_number);
CREATE UNIQUE INDEX IF NOT EXISTS program_certificates_user_program_key
  ON public.program_certificates(user_id, program_id);

-- 2. Grants: read-only from the API. No INSERT/UPDATE/DELETE for browser roles,
--    so issuance can only happen through the SECURITY DEFINER function below.
REVOKE ALL ON public.program_certificates FROM anon, authenticated;
GRANT SELECT ON public.program_certificates TO authenticated;
GRANT ALL    ON public.program_certificates TO service_role;

-- 3. RLS: consolidate the duplicated read policies, and make sure no write
--    policy exists for browser roles.
ALTER TABLE public.program_certificates ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Org admins can read org certificates" ON public.program_certificates;
DROP POLICY IF EXISTS "Users can read own certificates"      ON public.program_certificates;
DROP POLICY IF EXISTS cert_select_admin                      ON public.program_certificates;
DROP POLICY IF EXISTS cert_select_own                        ON public.program_certificates;
DROP POLICY IF EXISTS cert_insert_own                        ON public.program_certificates;
DROP POLICY IF EXISTS "Users can insert own certificates"     ON public.program_certificates;
DROP POLICY IF EXISTS cert_update_own                        ON public.program_certificates;
DROP POLICY IF EXISTS cert_delete_own                        ON public.program_certificates;

CREATE POLICY cert_select_own ON public.program_certificates
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY cert_select_admin ON public.program_certificates
  FOR SELECT TO authenticated
  USING (public.can_admin_org(auth.uid(), organization_id));

COMMENT ON TABLE public.program_certificates IS
  'Course certificates. Insert-only via public.issue_program_certificate(); no INSERT grant or policy exists for anon/authenticated.';

-- 4. Unique certificate number generator
CREATE OR REPLACE FUNCTION public.generate_certificate_number()
RETURNS text
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  chars text := 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  candidate text;
  i int;
BEGIN
  LOOP
    candidate := 'SV-';
    FOR i IN 1..8 LOOP
      candidate := candidate || substr(chars, 1 + floor(random() * length(chars))::int, 1);
    END LOOP;
    EXIT WHEN NOT EXISTS (
      SELECT 1 FROM public.program_certificates WHERE certificate_number = candidate
    );
  END LOOP;
  RETURN candidate;
END;
$$;

REVOKE ALL ON FUNCTION public.generate_certificate_number() FROM PUBLIC, anon, authenticated;

-- 5. The single authoritative issuance path
-- The earlier version returned SETOF program_certificates; the return type
-- changes to jsonb, so it must be dropped first.
DROP FUNCTION IF EXISTS public.issue_program_certificate(uuid);

CREATE OR REPLACE FUNCTION public.issue_program_certificate(_program_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
VOLATILE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  uid              uuid := auth.uid();
  prog             record;
  enr              record;
  existing         record;
  required_slides  int;
  done_slides      int;
  best_score       int;
  best_total       int;
  score_pct        numeric;
  threshold        int;
  assessment_src   text;
  cert             record;
  learner          text;
BEGIN
  -- (1) authenticated caller
  IF uid IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_authenticated');
  END IF;

  -- (2) program exists and is published
  SELECT id, title, organization_id, is_published, certificate_enabled,
         require_assessment_for_cert, passing_score
    INTO prog
    FROM public.programs
   WHERE id = _program_id;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'program_not_found');
  END IF;
  IF COALESCE(prog.is_published, false) = false THEN
    RETURN jsonb_build_object('ok', false, 'error', 'program_not_published');
  END IF;

  -- (3) certificates enabled for this course
  IF COALESCE(prog.certificate_enabled, false) = false THEN
    RETURN jsonb_build_object('ok', false, 'error', 'certificates_disabled');
  END IF;

  -- (4) enrollment exists for the calling user
  SELECT * INTO enr
    FROM public.program_enrollments
   WHERE program_id = _program_id AND user_id = uid;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('ok', false, 'error', 'not_enrolled');
  END IF;

  -- (5) idempotency: an already-issued certificate is returned as-is
  SELECT * INTO existing
    FROM public.program_certificates
   WHERE program_id = _program_id AND user_id = uid;

  IF FOUND THEN
    RETURN jsonb_build_object(
      'ok', true, 'already_issued', true,
      'certificate_id', existing.id,
      'certificate_number', existing.certificate_number,
      'issued_at', existing.issued_at
    );
  END IF;

  -- (6) every required slide completed (Phase 4 completed_slides)
  SELECT count(*) INTO required_slides
    FROM public.program_slides ps
    JOIN public.program_lessons pl ON pl.id = ps.lesson_id
    JOIN public.program_modules pm ON pm.id = pl.module_id
   WHERE pm.program_id = _program_id;

  IF required_slides > 0 THEN
    SELECT count(*) INTO done_slides
      FROM public.program_slides ps
      JOIN public.program_lessons pl ON pl.id = ps.lesson_id
      JOIN public.program_modules pm ON pm.id = pl.module_id
     WHERE pm.program_id = _program_id
       AND ps.id = ANY (COALESCE(enr.completed_slides, '{}'::uuid[]));

    IF done_slides < required_slides THEN
      RETURN jsonb_build_object(
        'ok', false, 'error', 'slides_incomplete',
        'completed_slides', done_slides, 'required_slides', required_slides
      );
    END IF;
  ELSE
    -- Legacy HTML course with no slide rows: fall back to full progress
    IF COALESCE(enr.progress_percent, 0) < 100 THEN
      RETURN jsonb_build_object(
        'ok', false, 'error', 'slides_incomplete',
        'progress_percent', COALESCE(enr.progress_percent, 0)
      );
    END IF;
  END IF;

  -- (7) course-level assessment, only when the course requires it
  IF COALESCE(prog.require_assessment_for_cert, false) THEN
    threshold := COALESCE(prog.passing_score, 70);

    -- Primary source: real course-level quiz rows. Module quizzes
    -- ('module_end') and AI practice slide quizzes (program_slides.data
    -- with scored = false, which never produce quiz_attempts rows) are
    -- excluded by construction.
    SELECT qa.correct_count, qa.total_questions, COALESCE(pq.passing_score, threshold)
      INTO best_score, best_total, threshold
      FROM public.quiz_attempts qa
      JOIN public.program_quizzes pq ON pq.id = qa.quiz_id
      LEFT JOIN public.program_modules pmq ON pmq.id = pq.module_id
      LEFT JOIN public.program_lessons plq ON plq.id = pq.lesson_id
      LEFT JOIN public.program_modules pml ON pml.id = plq.module_id
     WHERE qa.user_id = uid
       AND pq.quiz_type IN ('course_end', 'final', 'final_assessment')
       AND COALESCE(pmq.program_id, pml.program_id) = _program_id
       AND COALESCE(qa.total_questions, 0) > 0
     ORDER BY (qa.correct_count::numeric / NULLIF(qa.total_questions, 0)) DESC NULLS LAST
     LIMIT 1;

    IF best_total IS NOT NULL AND best_total > 0 THEN
      assessment_src := 'quiz_attempts';
    ELSE
      -- Fallback: the score the final-assessment player recorded on the
      -- enrollment. Still server-side data, never client-asserted at issue time.
      best_score := enr.assessment_score;
      best_total := enr.assessment_total;
      assessment_src := 'enrollment';
    END IF;

    IF best_total IS NULL OR best_total = 0 OR best_score IS NULL THEN
      RETURN jsonb_build_object('ok', false, 'error', 'assessment_not_taken');
    END IF;

    score_pct := round((best_score::numeric / best_total) * 100);
    IF score_pct < threshold THEN
      RETURN jsonb_build_object(
        'ok', false, 'error', 'assessment_not_passed',
        'score_percent', score_pct, 'passing_score', threshold,
        'source', assessment_src
      );
    END IF;
  ELSE
    best_score := enr.assessment_score;
    best_total := enr.assessment_total;
  END IF;

  -- (8) issue
  SELECT COALESCE(NULLIF(trim(display_name), ''), 'Learner')
    INTO learner
    FROM public.profiles WHERE id = uid;

  INSERT INTO public.program_certificates (
    user_id, program_id, organization_id, certificate_number,
    learner_name, course_title, stars_earned, assessment_score, assessment_total
  ) VALUES (
    uid, _program_id, prog.organization_id, public.generate_certificate_number(),
    COALESCE(learner, 'Learner'), prog.title, COALESCE(enr.total_stars, 0),
    best_score, best_total
  )
  RETURNING * INTO cert;

  -- Mark the enrollment finished
  UPDATE public.program_enrollments
     SET status = 'completed',
         progress_percent = 100,
         completed_at = COALESCE(completed_at, now())
   WHERE id = enr.id;

  -- Confirmation notification (same pattern as booking/escrow completion)
  INSERT INTO public.user_notifications (
    user_id, organization_id, title, body, notification_type, action_url
  ) VALUES (
    uid, prog.organization_id,
    'Certificate issued',
    'Your certificate for "' || prog.title || '" is ready.',
    'certificate_issued',
    '/verify/' || cert.certificate_number
  );

  RETURN jsonb_build_object(
    'ok', true, 'already_issued', false,
    'certificate_id', cert.id,
    'certificate_number', cert.certificate_number,
    'issued_at', cert.issued_at
  );
END;
$$;

REVOKE ALL ON FUNCTION public.issue_program_certificate(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.issue_program_certificate(uuid) TO authenticated, service_role;

-- 6. Public verification: exposes only the public certificate fields
CREATE OR REPLACE FUNCTION public.verify_program_certificate(_certificate_number text)
RETURNS TABLE (
  certificate_number text,
  learner_name text,
  course_title text,
  organization_name text,
  organization_logo_url text,
  issued_at timestamptz,
  assessment_score integer,
  assessment_total integer
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT c.certificate_number,
         COALESCE(NULLIF(trim(c.learner_name), ''), 'Learner'),
         COALESCE(NULLIF(trim(c.course_title), ''), p.title),
         o.name,
         o.logo_url,
         c.issued_at,
         c.assessment_score,
         c.assessment_total
    FROM public.program_certificates c
    LEFT JOIN public.programs p      ON p.id = c.program_id
    LEFT JOIN public.organizations o ON o.id = c.organization_id
   WHERE c.certificate_number = _certificate_number
   LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.verify_program_certificate(text) TO anon, authenticated, service_role;