ALTER TABLE public.product_purchases ALTER COLUMN user_id DROP NOT NULL;

CREATE INDEX IF NOT EXISTS idx_product_purchases_buyer_email_lower
  ON public.product_purchases (lower(buyer_email))
  WHERE user_id IS NULL;

CREATE OR REPLACE FUNCTION public.claim_guest_purchases()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _uid uuid := auth.uid();
  _email text;
  _claimed integer := 0;
BEGIN
  IF _uid IS NULL THEN
    RETURN 0;
  END IF;

  SELECT lower(email) INTO _email FROM auth.users WHERE id = _uid;
  IF _email IS NULL OR _email = '' THEN
    RETURN 0;
  END IF;

  UPDATE public.product_purchases
     SET user_id = _uid
   WHERE user_id IS NULL
     AND lower(buyer_email) = _email;

  GET DIAGNOSTICS _claimed = ROW_COUNT;
  RETURN _claimed;
END;
$$;

REVOKE ALL ON FUNCTION public.claim_guest_purchases() FROM public;
GRANT EXECUTE ON FUNCTION public.claim_guest_purchases() TO authenticated;