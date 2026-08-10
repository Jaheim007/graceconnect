UPDATE public.programs p
SET content_language = lower(left(coalesce(ap.language, 'fr'), 2))
FROM public.ai_content_projects ap
WHERE ap.linked_program_id = p.id
  AND coalesce(lower(left(ap.language,2)), 'fr') <> coalesce(p.content_language, '');

UPDATE public.digital_products d
SET content_language = lower(left(coalesce(ap.language, 'fr'), 2))
FROM public.ai_content_projects ap
WHERE d.ai_project_id = ap.id
  AND coalesce(lower(left(ap.language,2)), 'fr') <> coalesce(d.content_language, '');