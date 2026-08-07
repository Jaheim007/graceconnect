GRANT SELECT ON public.program_slides TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.program_slides TO authenticated;
GRANT ALL ON public.program_slides TO service_role;