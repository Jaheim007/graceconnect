
CREATE OR REPLACE FUNCTION public.get_founders_wall()
RETURNS TABLE (
  slot_number integer,
  display_name text,
  avatar_url text,
  claimed_at timestamptz
)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
  SELECT
    fl.slot_number,
    COALESCE(NULLIF(p.display_name, ''), 'Founder #' || fl.slot_number::text) AS display_name,
    p.avatar_url,
    fl.claimed_at
  FROM public.founders_lifetime fl
  LEFT JOIN public.profiles p ON p.id = fl.user_id
  ORDER BY fl.slot_number ASC;
$$;

GRANT EXECUTE ON FUNCTION public.get_founders_wall() TO anon, authenticated;
