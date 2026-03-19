-- Atomic increment for affiliate link stats to prevent race conditions
CREATE OR REPLACE FUNCTION public.increment_affiliate_link_stats(_link_id uuid, _earned numeric)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.affiliate_links
  SET conversions = COALESCE(conversions, 0) + 1,
      total_earned = COALESCE(total_earned, 0) + _earned
  WHERE id = _link_id;
END;
$$;