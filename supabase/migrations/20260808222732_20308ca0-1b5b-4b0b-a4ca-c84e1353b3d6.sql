DROP FUNCTION IF EXISTS public.verify_program_certificate(text);

CREATE OR REPLACE FUNCTION public.verify_program_certificate(_certificate_number text)
RETURNS TABLE (
  certificate_number text,
  learner_name text,
  course_title text,
  organization_name text,
  organization_logo_url text,
  organization_slug text,
  issued_at timestamptz,
  assessment_score integer,
  assessment_total integer,
  program_id uuid,
  program_cover_url text,
  certificate_design jsonb,
  lesson_titles jsonb
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
         o.slug,
         c.issued_at,
         c.assessment_score,
         c.assessment_total,
         p.id,
         p.cover_image_url,
         COALESCE(p.certificate_design, '{}'::jsonb),
         COALESCE((
           SELECT jsonb_agg(t.title ORDER BY t.mo, t.lo)
             FROM (
               SELECT pl.title AS title, pm.order_index AS mo, pl.order_index AS lo
                 FROM public.program_lessons pl
                 JOIN public.program_modules pm ON pm.id = pl.module_id
                WHERE pm.program_id = p.id
                  AND COALESCE(NULLIF(trim(pl.title), ''), '') <> ''
             ) t
         ), '[]'::jsonb)
    FROM public.program_certificates c
    LEFT JOIN public.programs p      ON p.id = c.program_id
    LEFT JOIN public.organizations o ON o.id = c.organization_id
   WHERE c.certificate_number = _certificate_number
   LIMIT 1;
$$;

GRANT EXECUTE ON FUNCTION public.verify_program_certificate(text) TO anon, authenticated, service_role;