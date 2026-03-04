
CREATE OR REPLACE FUNCTION public.get_transaction_stats(_from timestamp with time zone DEFAULT NULL, _to timestamp with time zone DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _don_gmv numeric; _don_fees numeric; _don_aff numeric; _don_count bigint;
  _pur_gmv numeric; _pur_fees numeric; _pur_aff numeric; _pur_count bigint;
BEGIN
  SELECT COALESCE(SUM(amount), 0), COALESCE(SUM(platform_fee), 0),
         COALESCE(SUM(affiliate_commission), 0), COUNT(*)
  INTO _don_gmv, _don_fees, _don_aff, _don_count
  FROM donations WHERE status = 'completed'
    AND (_from IS NULL OR COALESCE(completed_at, created_at) >= _from)
    AND (_to IS NULL OR COALESCE(completed_at, created_at) <= _to);

  SELECT COALESCE(SUM(amount), 0), COALESCE(SUM(platform_fee), 0),
         COALESCE(SUM(affiliate_commission), 0), COUNT(*)
  INTO _pur_gmv, _pur_fees, _pur_aff, _pur_count
  FROM product_purchases WHERE status = 'completed'
    AND (_from IS NULL OR COALESCE(completed_at, created_at) >= _from)
    AND (_to IS NULL OR COALESCE(completed_at, created_at) <= _to);

  RETURN jsonb_build_object(
    'gmv', _don_gmv + _pur_gmv,
    'donation_gmv', _don_gmv,
    'purchase_gmv', _pur_gmv,
    'platform_fees', _don_fees + _pur_fees,
    'affiliate_commissions', _don_aff + _pur_aff,
    'total_count', _don_count + _pur_count,
    'donation_count', _don_count,
    'purchase_count', _pur_count
  );
END;
$$;
