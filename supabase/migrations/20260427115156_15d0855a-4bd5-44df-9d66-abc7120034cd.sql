CREATE OR REPLACE FUNCTION public.get_billing_usage_stats(_user_id uuid)
RETURNS TABLE (
  ai_credits_used_month int,
  products_sold_month int,
  revenue_net_month numeric,
  commission_saved_month numeric,
  active_products int,
  total_organizations int
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _month_start timestamptz := date_trunc('month', now());
  _is_pro boolean;
BEGIN
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM platform_subscriptions
    WHERE user_id = _user_id
      AND status IN ('active','trialing')
      AND plan IN ('pro','org')
  ) INTO _is_pro;

  RETURN QUERY
  SELECT
    COALESCE((
      SELECT ABS(SUM(amount))::int
      FROM credit_transactions
      WHERE user_id = _user_id
        AND amount < 0
        AND created_at >= _month_start
    ), 0) AS ai_credits_used_month,

    COALESCE((
      SELECT COUNT(*)::int
      FROM product_purchases pp
      JOIN organizations o ON o.id = pp.organization_id
      WHERE o.owner_id = _user_id
        AND pp.status = 'completed'
        AND pp.created_at >= _month_start
    ), 0) AS products_sold_month,

    COALESCE((
      SELECT SUM(pp.organization_amount)::numeric
      FROM product_purchases pp
      JOIN organizations o ON o.id = pp.organization_id
      WHERE o.owner_id = _user_id
        AND pp.status = 'completed'
        AND pp.created_at >= _month_start
    ), 0) AS revenue_net_month,

    -- Commission "saved" = platform_fee that would normally have applied;
    -- on Pro/Org plans, fee is reduced/zeroed so we report it as savings.
    CASE WHEN _is_pro THEN
      COALESCE((
        SELECT SUM(pp.platform_fee)::numeric
        FROM product_purchases pp
        JOIN organizations o ON o.id = pp.organization_id
        WHERE o.owner_id = _user_id
          AND pp.status = 'completed'
          AND pp.created_at >= _month_start
      ), 0)
    ELSE 0 END AS commission_saved_month,

    COALESCE((
      SELECT COUNT(*)::int
      FROM products p
      JOIN organizations o ON o.id = p.organization_id
      WHERE o.owner_id = _user_id
        AND p.is_published = true
    ), 0) AS active_products,

    COALESCE((
      SELECT COUNT(*)::int
      FROM organizations
      WHERE owner_id = _user_id
    ), 0) AS total_organizations;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_billing_usage_stats(uuid) TO authenticated;