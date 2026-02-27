-- DB function to increment short_link clicks atomically
CREATE OR REPLACE FUNCTION public.increment_short_link_clicks(_code text)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.short_links
  SET clicks = clicks + 1
  WHERE id = _code;
END;
$$;