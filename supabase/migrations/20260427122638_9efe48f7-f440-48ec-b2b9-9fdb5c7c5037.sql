
-- Helper: check ownership
CREATE OR REPLACE FUNCTION public.is_org_owner(_org_id uuid, _user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM organizations WHERE id = _org_id AND owner_id = _user_id
  );
$$;

-- 1) Buyer cohorts: monthly acquisition + retention rates
CREATE OR REPLACE FUNCTION public.get_buyer_cohorts(_org_id uuid)
RETURNS TABLE(
  cohort_month date,
  buyers_count integer,
  m1_retained integer,
  m2_retained integer,
  m3_retained integer,
  m6_retained integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_org_owner(_org_id, auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  WITH first_purchase AS (
    SELECT user_id, date_trunc('month', MIN(completed_at))::date AS cohort
    FROM product_purchases
    WHERE organization_id = _org_id AND status = 'completed' AND user_id IS NOT NULL
    GROUP BY user_id
  ),
  all_purchases AS (
    SELECT user_id, date_trunc('month', completed_at)::date AS purchase_month
    FROM product_purchases
    WHERE organization_id = _org_id AND status = 'completed' AND user_id IS NOT NULL
  )
  SELECT
    fp.cohort,
    COUNT(DISTINCT fp.user_id)::int AS buyers_count,
    COUNT(DISTINCT CASE WHEN ap.purchase_month = fp.cohort + INTERVAL '1 month' THEN fp.user_id END)::int,
    COUNT(DISTINCT CASE WHEN ap.purchase_month = fp.cohort + INTERVAL '2 month' THEN fp.user_id END)::int,
    COUNT(DISTINCT CASE WHEN ap.purchase_month = fp.cohort + INTERVAL '3 month' THEN fp.user_id END)::int,
    COUNT(DISTINCT CASE WHEN ap.purchase_month = fp.cohort + INTERVAL '6 month' THEN fp.user_id END)::int
  FROM first_purchase fp
  LEFT JOIN all_purchases ap ON ap.user_id = fp.user_id
  GROUP BY fp.cohort
  ORDER BY fp.cohort DESC
  LIMIT 12;
END;
$$;

-- 2) Churn metrics (90-day window)
CREATE OR REPLACE FUNCTION public.get_org_churn_metrics(_org_id uuid)
RETURNS TABLE(
  total_buyers integer,
  active_buyers integer,
  churned_buyers integer,
  churn_rate numeric,
  at_risk_buyers integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_org_owner(_org_id, auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  WITH last_activity AS (
    SELECT user_id, MAX(completed_at) AS last_purchase
    FROM product_purchases
    WHERE organization_id = _org_id AND status = 'completed' AND user_id IS NOT NULL
    GROUP BY user_id
  ),
  buckets AS (
    SELECT
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE last_purchase >= now() - INTERVAL '30 days')::int AS active,
      COUNT(*) FILTER (WHERE last_purchase < now() - INTERVAL '90 days')::int AS churned,
      COUNT(*) FILTER (WHERE last_purchase < now() - INTERVAL '60 days' AND last_purchase >= now() - INTERVAL '90 days')::int AS at_risk
    FROM last_activity
  )
  SELECT
    total,
    active,
    churned,
    CASE WHEN total > 0 THEN ROUND((churned::numeric / total) * 100, 2) ELSE 0 END,
    at_risk
  FROM buckets;
END;
$$;

-- 3) Top customers by lifetime value
CREATE OR REPLACE FUNCTION public.get_top_customers(_org_id uuid, _limit integer DEFAULT 20)
RETURNS TABLE(
  user_id uuid,
  buyer_email text,
  buyer_name text,
  total_spent numeric,
  purchase_count integer,
  last_purchase_at timestamptz,
  first_purchase_at timestamptz
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_org_owner(_org_id, auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    pp.user_id,
    MAX(pp.buyer_email),
    MAX(pp.buyer_name),
    SUM(pp.amount)::numeric,
    COUNT(*)::int,
    MAX(pp.completed_at),
    MIN(pp.completed_at)
  FROM product_purchases pp
  WHERE pp.organization_id = _org_id AND pp.status = 'completed'
  GROUP BY pp.user_id
  ORDER BY SUM(pp.amount) DESC
  LIMIT _limit;
END;
$$;

-- 4) Revenue breakdown by product + weekly trend
CREATE OR REPLACE FUNCTION public.get_revenue_breakdown(_org_id uuid, _days integer DEFAULT 90)
RETURNS TABLE(
  product_id uuid,
  product_title text,
  revenue numeric,
  units_sold integer,
  unique_buyers integer
)
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_org_owner(_org_id, auth.uid()) THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  RETURN QUERY
  SELECT
    dp.id,
    dp.title,
    COALESCE(SUM(pp.amount), 0)::numeric,
    COUNT(pp.id)::int,
    COUNT(DISTINCT pp.user_id)::int
  FROM digital_products dp
  LEFT JOIN product_purchases pp
    ON pp.product_id = dp.id
    AND pp.status = 'completed'
    AND pp.completed_at >= now() - (_days || ' days')::interval
  WHERE dp.organization_id = _org_id
  GROUP BY dp.id, dp.title
  ORDER BY SUM(pp.amount) DESC NULLS LAST
  LIMIT 50;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_buyer_cohorts(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_org_churn_metrics(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_top_customers(uuid, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_revenue_breakdown(uuid, integer) TO authenticated;
