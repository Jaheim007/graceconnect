
-- C3: Atomic promo code increment to prevent race conditions
CREATE OR REPLACE FUNCTION public.increment_promo_uses(_promo_id uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _current integer;
  _max integer;
BEGIN
  SELECT current_uses, max_uses INTO _current, _max
  FROM public.promo_codes
  WHERE id = _promo_id
  FOR UPDATE;

  IF NOT FOUND THEN RETURN false; END IF;

  -- Check limit
  IF _max IS NOT NULL AND _current >= _max THEN
    RETURN false;
  END IF;

  UPDATE public.promo_codes
  SET current_uses = current_uses + 1
  WHERE id = _promo_id;

  RETURN true;
END;
$$;
