
-- Table de log + dédup
CREATE TABLE public.proactive_alerts_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  alert_type text NOT NULL,
  week_bucket date NOT NULL DEFAULT date_trunc('week', now())::date,
  metadata jsonb NOT NULL DEFAULT '{}'::jsonb,
  notification_id uuid,
  email_sent boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE UNIQUE INDEX uq_proactive_alerts_dedup
  ON public.proactive_alerts_log(organization_id, alert_type, week_bucket);

CREATE INDEX idx_proactive_alerts_org ON public.proactive_alerts_log(organization_id, created_at DESC);

ALTER TABLE public.proactive_alerts_log ENABLE ROW LEVEL SECURITY;

-- Lecture: owner de l'org seulement
CREATE POLICY "Owners can view their alerts"
ON public.proactive_alerts_log
FOR SELECT TO authenticated
USING (
  EXISTS (SELECT 1 FROM organizations o WHERE o.id = organization_id AND o.owner_id = auth.uid())
);

-- service_role gère tout (insert via edge function)
CREATE POLICY "Service role manages alerts"
ON public.proactive_alerts_log
FOR ALL TO service_role
USING (true) WITH CHECK (true);

-- RPC: orgs nécessitant une alerte (service_role only)
CREATE OR REPLACE FUNCTION public.get_orgs_needing_alerts()
RETURNS TABLE(
  organization_id uuid,
  org_name text,
  owner_id uuid,
  owner_email text,
  alert_type text,
  churn_rate numeric,
  at_risk_count integer,
  active_buyers integer
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- Restreint au service_role pour éviter exposition
  IF current_setting('request.jwt.claims', true)::jsonb ->> 'role' <> 'service_role' THEN
    RAISE EXCEPTION 'Service role only';
  END IF;

  RETURN QUERY
  WITH last_activity AS (
    SELECT
      pp.organization_id,
      pp.user_id,
      MAX(pp.completed_at) AS last_purchase
    FROM product_purchases pp
    WHERE pp.status = 'completed' AND pp.user_id IS NOT NULL
    GROUP BY pp.organization_id, pp.user_id
  ),
  org_metrics AS (
    SELECT
      la.organization_id,
      COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE last_purchase >= now() - INTERVAL '30 days')::int AS active,
      COUNT(*) FILTER (WHERE last_purchase < now() - INTERVAL '60 days' AND last_purchase >= now() - INTERVAL '90 days')::int AS at_risk,
      COUNT(*) FILTER (WHERE last_purchase < now() - INTERVAL '90 days')::int AS churned
    FROM last_activity la
    GROUP BY la.organization_id
    HAVING COUNT(*) >= 10  -- au moins 10 acheteurs pour des stats utiles
  ),
  scored AS (
    SELECT
      om.organization_id,
      om.active,
      om.at_risk,
      CASE WHEN om.total > 0 THEN ROUND((om.churned::numeric / om.total) * 100, 2) ELSE 0 END AS churn_rate,
      CASE
        WHEN om.total > 0 AND (om.churned::numeric / om.total) > 0.30 THEN 'churn_high'
        WHEN om.at_risk >= 5 THEN 'at_risk_buyers'
        ELSE NULL
      END AS alert_type
    FROM org_metrics om
  )
  SELECT
    s.organization_id,
    o.name,
    o.owner_id,
    au.email,
    s.alert_type,
    s.churn_rate,
    s.at_risk,
    s.active
  FROM scored s
  JOIN organizations o ON o.id = s.organization_id
  LEFT JOIN auth.users au ON au.id = o.owner_id
  WHERE s.alert_type IS NOT NULL
    AND o.is_active = true
    -- exclure orgs déjà alertées cette semaine
    AND NOT EXISTS (
      SELECT 1 FROM proactive_alerts_log pal
      WHERE pal.organization_id = s.organization_id
        AND pal.alert_type = s.alert_type
        AND pal.week_bucket = date_trunc('week', now())::date
    );
END;
$$;

-- Cron quotidien 09:00 UTC
SELECT cron.schedule(
  'proactive-creator-alerts-daily',
  '0 9 * * *',
  $$
  SELECT net.http_post(
    url := 'https://xzgpzbrgsxtcsktiprik.supabase.co/functions/v1/proactive-creator-alerts',
    headers := jsonb_build_object('Content-Type', 'application/json', 'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)),
    body := jsonb_build_object('time', now()::text)
  );
  $$
);
