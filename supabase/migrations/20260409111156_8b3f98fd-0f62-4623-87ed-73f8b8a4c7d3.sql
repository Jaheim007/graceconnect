
CREATE OR REPLACE FUNCTION public.expire_stale_credit_purchases()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  affected integer;
BEGIN
  UPDATE credit_purchases
  SET status = 'expired'
  WHERE status = 'pending'
    AND created_at < now() - interval '24 hours';
  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;
