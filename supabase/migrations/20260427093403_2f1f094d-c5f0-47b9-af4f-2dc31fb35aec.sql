ALTER TABLE public.platform_subscriptions
  ADD COLUMN IF NOT EXISTS paystack_authorization_code TEXT,
  ADD COLUMN IF NOT EXISTS failed_payment_count INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_payment_at TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS last_payment_error TEXT;

CREATE INDEX IF NOT EXISTS idx_platform_subs_period_end
  ON public.platform_subscriptions (current_period_end)
  WHERE status IN ('active', 'trialing', 'past_due');

CREATE INDEX IF NOT EXISTS idx_platform_subs_trial_end
  ON public.platform_subscriptions (trial_end)
  WHERE status = 'trialing';

-- View MRR (USD-equivalent via simple FX = 600 XOF/USD baseline)
CREATE OR REPLACE VIEW public.platform_billing_metrics AS
WITH base AS (
  SELECT
    plan,
    provider,
    status,
    billing_interval,
    amount_xof,
    trial_end,
    canceled_at,
    created_at
  FROM public.platform_subscriptions
)
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
FROM base;

GRANT SELECT ON public.platform_billing_metrics TO authenticated;

-- RPC for admins
CREATE OR REPLACE FUNCTION public.get_platform_billing_metrics()
RETURNS TABLE (
  active_monthly int,
  active_yearly int,
  trialing int,
  past_due int,
  canceled int,
  grandfather_active int,
  pro_total int,
  org_total int,
  mrr_xof numeric,
  arr_xof numeric,
  founders_used int,
  founders_remaining int
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT public.is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  RETURN QUERY
  SELECT
    m.active_monthly,
    m.active_yearly,
    m.trialing,
    m.past_due,
    m.canceled,
    m.grandfather_active,
    m.pro_total,
    m.org_total,
    m.mrr_xof + m.mrr_yearly_xof AS mrr_xof,
    m.arr_xof_monthly + m.arr_xof_yearly AS arr_xof,
    (SELECT COUNT(*)::int FROM public.founders_lifetime),
    GREATEST(0, 50 - (SELECT COUNT(*)::int FROM public.founders_lifetime))
  FROM public.platform_billing_metrics m;
END;
$$;