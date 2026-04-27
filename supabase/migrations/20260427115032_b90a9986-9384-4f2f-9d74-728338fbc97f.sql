-- ============================================
-- SPRINT 9 — Dunning Stripe & Billing Usage
-- ============================================

-- 1) Table de suivi des relances dunning
CREATE TABLE IF NOT EXISTS public.dunning_attempts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  subscription_id uuid NOT NULL,
  user_id uuid NOT NULL,
  provider text NOT NULL,
  step text NOT NULL CHECK (step IN ('d1','d3','d7','final')),
  invoice_id text,
  amount_due numeric,
  currency text,
  sent_at timestamptz NOT NULL DEFAULT now(),
  recovered_at timestamptz,
  UNIQUE (subscription_id, step)
);

ALTER TABLE public.dunning_attempts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own dunning attempts"
  ON public.dunning_attempts FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages dunning attempts"
  ON public.dunning_attempts FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_dunning_subscription
  ON public.dunning_attempts(subscription_id);

-- 2) RPC : statistiques d'usage pour la page /billing/usage
-- Retourne : crédits utilisés ce mois, produits vendus, revenu net, commission économisée
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
  -- Caller must be the user themselves
  IF auth.uid() IS NULL OR auth.uid() <> _user_id THEN
    RAISE EXCEPTION 'Unauthorized';
  END IF;

  -- Determine if user has Pro/Org status this month (for commission computation)
  SELECT EXISTS (
    SELECT 1 FROM platform_subscriptions
    WHERE user_id = _user_id
      AND status IN ('active','trialing')
      AND plan IN ('pro','org')
  ) INTO _is_pro;

  RETURN QUERY
  SELECT
    -- AI credits used this month (from credit_transactions where amount < 0)
    COALESCE((
      SELECT ABS(SUM(amount))::int
      FROM credit_transactions
      WHERE user_id = _user_id
        AND amount < 0
        AND created_at >= _month_start
    ), 0) AS ai_credits_used_month,

    -- Products sold this month (count of completed purchases on user's products)
    COALESCE((
      SELECT COUNT(*)::int
      FROM product_purchases pp
      JOIN products p ON p.id = pp.product_id
      JOIN organizations o ON o.id = p.organization_id
      WHERE o.created_by = _user_id
        AND pp.status = 'completed'
        AND pp.created_at >= _month_start
    ), 0) AS products_sold_month,

    -- Net revenue this month (sum of net_to_org)
    COALESCE((
      SELECT SUM(pp.net_to_org)::numeric
      FROM product_purchases pp
      JOIN products p ON p.id = pp.product_id
      JOIN organizations o ON o.id = p.organization_id
      WHERE o.created_by = _user_id
        AND pp.status = 'completed'
        AND pp.created_at >= _month_start
    ), 0) AS revenue_net_month,

    -- Commission saved this month if Pro (10% of gross would have been taken on free plan)
    CASE WHEN _is_pro THEN
      COALESCE((
        SELECT (SUM(pp.amount) * 0.10)::numeric
        FROM product_purchases pp
        JOIN products p ON p.id = pp.product_id
        JOIN organizations o ON o.id = p.organization_id
        WHERE o.created_by = _user_id
          AND pp.status = 'completed'
          AND pp.created_at >= _month_start
      ), 0)
    ELSE 0 END AS commission_saved_month,

    -- Active published products
    COALESCE((
      SELECT COUNT(*)::int
      FROM products p
      JOIN organizations o ON o.id = p.organization_id
      WHERE o.created_by = _user_id
        AND p.is_published = true
    ), 0) AS active_products,

    -- Total organizations owned
    COALESCE((
      SELECT COUNT(*)::int
      FROM organizations
      WHERE created_by = _user_id
    ), 0) AS total_organizations;
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_billing_usage_stats(uuid) TO authenticated;