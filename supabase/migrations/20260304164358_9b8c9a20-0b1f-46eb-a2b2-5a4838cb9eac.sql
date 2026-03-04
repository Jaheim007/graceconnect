-- Function to automatically release matured partner commissions (held -> payable after 15 days)
CREATE OR REPLACE FUNCTION public.release_matured_partner_commissions()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _count integer;
BEGIN
  UPDATE public.partner_commissions
  SET status = 'payable'
  WHERE status = 'held'
    AND payable_at IS NOT NULL
    AND payable_at <= now();
  
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

-- Same for affiliate sales
CREATE OR REPLACE FUNCTION public.release_matured_affiliate_sales()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _count integer;
BEGIN
  UPDATE public.affiliate_sales
  SET status = 'payable'
  WHERE status = 'pending'
    AND payable_at IS NOT NULL
    AND payable_at <= now();
  
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;