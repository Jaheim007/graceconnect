DROP VIEW IF EXISTS public.platform_billing_metrics;

CREATE VIEW public.platform_billing_metrics
WITH (security_invoker = on)
AS
SELECT
  COUNT(*) FILTER (WHERE status = 'active' AND billing_interval = 'month')::int AS active_monthly,
  COUNT(*) FILTER (WHERE status = 'active' AND billing_interval = 'year')::int  AS active_yearly,
  COUNT(*) FILTER (WHERE status = 'trialing')::int                                AS trialing,
  COUNT(*) FILTER (WHERE status = 'past_due')::int                                AS past_due,
  COUNT(*) FILTER (WHERE status = 'canceled')::int                                AS canceled,
  COUNT(*) FILTER (WHERE provider = 'grandfather' AND status = 'trialing')::int   AS grandfather_active,
  COUNT(*) FILTER (WHERE plan = 'pro' AND status IN ('active','trialing'))::int   AS pro_total,
  COUNT(*) FILTER (WHERE plan = 'org' AND status IN ('active','trialing'))::int   AS org_total,
  COALESCE(SUM(amount_xof) FILTER (
    WHERE status = 'active' AND billing_interval = 'month'
  ), 0)::numeric AS mrr_xof,
  COALESCE(SUM(amount_xof / 12.0) FILTER (
    WHERE status = 'active' AND billing_interval = 'year'
  ), 0)::numeric AS mrr_yearly_xof,
  COALESCE(SUM(amount_xof) FILTER (
    WHERE status = 'active' AND billing_interval = 'month'
  ), 0)::numeric * 12 AS arr_xof_monthly,
  COALESCE(SUM(amount_xof) FILTER (
    WHERE status = 'active' AND billing_interval = 'year'
  ), 0)::numeric AS arr_xof_yearly
FROM public.platform_subscriptions;

REVOKE ALL ON public.platform_billing_metrics FROM PUBLIC;
GRANT SELECT ON public.platform_billing_metrics TO authenticated;