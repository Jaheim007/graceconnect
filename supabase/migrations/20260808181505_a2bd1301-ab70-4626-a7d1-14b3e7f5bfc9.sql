CREATE TABLE public.credit_alert_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  alert_type text NOT NULL,
  alert_day date NOT NULL DEFAULT CURRENT_DATE,
  balance numeric NOT NULL DEFAULT 0,
  emailed boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, alert_type, alert_day)
);

GRANT SELECT ON public.credit_alert_log TO authenticated;
GRANT ALL ON public.credit_alert_log TO service_role;

ALTER TABLE public.credit_alert_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own credit alerts"
ON public.credit_alert_log FOR SELECT TO authenticated
USING (user_id = auth.uid());