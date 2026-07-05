
-- ─────────────────────────────────────────────────────────────
-- ACCOUNT TRUST & VIOLATION SYSTEM (Phase 1 — Beauty)
-- ─────────────────────────────────────────────────────────────

-- 1) Trust profiles (one per user, lazy-created)
CREATE TABLE IF NOT EXISTS public.account_trust_profiles (
  user_id uuid PRIMARY KEY,
  trust_score integer NOT NULL DEFAULT 100,
  status text NOT NULL DEFAULT 'ok'
    CHECK (status IN ('ok','warned','chat_frozen','limited','hidden','suspended','banned')),
  restricted_until timestamptz,
  hidden_until timestamptz,
  suspended_until timestamptz,
  payout_hold boolean NOT NULL DEFAULT false,
  violations_24h integer NOT NULL DEFAULT 0,
  violations_7d integer NOT NULL DEFAULT 0,
  violations_total integer NOT NULL DEFAULT 0,
  last_violation_at timestamptz,
  admin_review_required boolean NOT NULL DEFAULT false,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.account_trust_profiles TO authenticated;
GRANT ALL ON public.account_trust_profiles TO service_role;

ALTER TABLE public.account_trust_profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own trust profile"
ON public.account_trust_profiles FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.user_platform_roles
             WHERE user_id = auth.uid() AND role::text = 'superadmin')
);

CREATE OR REPLACE FUNCTION public.touch_account_trust_profiles()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;
CREATE TRIGGER account_trust_profiles_touch
BEFORE UPDATE ON public.account_trust_profiles
FOR EACH ROW EXECUTE FUNCTION public.touch_account_trust_profiles();

-- 2) Extend beauty_chat_violations with analysis / action fields
ALTER TABLE public.beauty_chat_violations
  ADD COLUMN IF NOT EXISTS severity text CHECK (severity IN ('soft','hard','severe')),
  ADD COLUMN IF NOT EXISTS ai_category text,
  ADD COLUMN IF NOT EXISTS ai_confidence numeric,
  ADD COLUMN IF NOT EXISTS ai_recommended_action text,
  ADD COLUMN IF NOT EXISTS ai_admin_summary text,
  ADD COLUMN IF NOT EXISTS ai_user_message text,
  ADD COLUMN IF NOT EXISTS action_taken text,
  ADD COLUMN IF NOT EXISTS admin_review_required boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS admin_reviewed_by uuid,
  ADD COLUMN IF NOT EXISTS admin_reviewed_at timestamptz,
  ADD COLUMN IF NOT EXISTS admin_decision text,
  ADD COLUMN IF NOT EXISTS score_before integer,
  ADD COLUMN IF NOT EXISTS score_after integer,
  ADD COLUMN IF NOT EXISTS processed_at timestamptz;

CREATE INDEX IF NOT EXISTS idx_beauty_chat_violations_review
  ON public.beauty_chat_violations (admin_review_required, created_at DESC)
  WHERE admin_review_required = true;
CREATE INDEX IF NOT EXISTS idx_beauty_chat_violations_sender_time
  ON public.beauty_chat_violations (sender_id, created_at DESC);

-- 3) Notification log
CREATE TABLE IF NOT EXISTS public.trust_notifications_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  violation_id uuid REFERENCES public.beauty_chat_violations(id) ON DELETE SET NULL,
  notification_type text NOT NULL,
  channel text NOT NULL CHECK (channel IN ('in_app','email')),
  subject text,
  message text,
  delivery_status text NOT NULL DEFAULT 'pending'
    CHECK (delivery_status IN ('pending','sent','failed')),
  error_detail text,
  sent_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.trust_notifications_log TO authenticated;
GRANT ALL ON public.trust_notifications_log TO service_role;

ALTER TABLE public.trust_notifications_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own trust notifications"
ON public.trust_notifications_log FOR SELECT TO authenticated
USING (
  user_id = auth.uid()
  OR EXISTS (SELECT 1 FROM public.user_platform_roles
             WHERE user_id = auth.uid() AND role::text = 'superadmin')
);

CREATE INDEX IF NOT EXISTS idx_trust_notifications_user
  ON public.trust_notifications_log (user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_trust_notifications_violation
  ON public.trust_notifications_log (violation_id);

-- 4) Async trigger: after a violation is inserted, call edge function
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

CREATE OR REPLACE FUNCTION public.trigger_trust_process_violation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fn_url text;
  svc_key text;
BEGIN
  fn_url := 'https://xzgpzbrgsxtcsktiprik.supabase.co/functions/v1/trust-process-violation';
  -- Fire-and-forget async HTTP call
  PERFORM extensions.http_post(
    url := fn_url,
    body := jsonb_build_object('violation_id', NEW.id)::text,
    params := '{}'::jsonb,
    headers := jsonb_build_object('Content-Type', 'application/json'),
    timeout_milliseconds := 5000
  );
  RETURN NEW;
EXCEPTION WHEN OTHERS THEN
  -- Never break the parent transaction
  RETURN NEW;
END;
$$;

-- Note: pg_net function name is `net.http_post`; wrap it safely
CREATE OR REPLACE FUNCTION public.trigger_trust_process_violation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  fn_url text := 'https://xzgpzbrgsxtcsktiprik.supabase.co/functions/v1/trust-process-violation';
BEGIN
  BEGIN
    PERFORM net.http_post(
      url := fn_url,
      body := jsonb_build_object('violation_id', NEW.id),
      headers := jsonb_build_object('Content-Type', 'application/json')
    );
  EXCEPTION WHEN OTHERS THEN
    NULL;
  END;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trust_process_after_violation ON public.beauty_chat_violations;
CREATE TRIGGER trust_process_after_violation
AFTER INSERT ON public.beauty_chat_violations
FOR EACH ROW EXECUTE FUNCTION public.trigger_trust_process_violation();
