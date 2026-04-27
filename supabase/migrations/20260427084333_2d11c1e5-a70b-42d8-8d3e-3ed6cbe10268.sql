CREATE TABLE IF NOT EXISTS public.pro_upsell_email_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL,
  user_id UUID NOT NULL,
  commission_amount_xof_30d NUMERIC NOT NULL DEFAULT 0,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS pro_upsell_email_log_org_idx
  ON public.pro_upsell_email_log (organization_id, sent_at DESC);

CREATE INDEX IF NOT EXISTS pro_upsell_email_log_user_idx
  ON public.pro_upsell_email_log (user_id, sent_at DESC);

ALTER TABLE public.pro_upsell_email_log ENABLE ROW LEVEL SECURITY;

-- Superadmin read access only; backend uses service role and bypasses RLS.
CREATE POLICY "pro_upsell_email_log_superadmin_select"
  ON public.pro_upsell_email_log
  FOR SELECT
  TO authenticated
  USING (public.is_superadmin(auth.uid()));