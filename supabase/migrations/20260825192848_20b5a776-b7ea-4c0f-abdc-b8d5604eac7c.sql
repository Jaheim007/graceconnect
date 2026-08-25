REVOKE ALL ON FUNCTION public.track_program_click(uuid, text) FROM PUBLIC;
REVOKE ALL ON FUNCTION public.track_program_click(uuid, text) FROM anon;
REVOKE ALL ON FUNCTION public.track_program_click(uuid, text) FROM authenticated;
GRANT EXECUTE ON FUNCTION public.track_program_click(uuid, text) TO service_role;