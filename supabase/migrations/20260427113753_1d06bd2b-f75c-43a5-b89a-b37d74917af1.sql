-- ============================================
-- SPRINT 8 — Activation Pro (facturation)
-- ============================================

-- 1) Étendre platform_subscriptions
ALTER TABLE public.platform_subscriptions
  ADD COLUMN IF NOT EXISTS stripe_price_id text,
  ADD COLUMN IF NOT EXISTS coupon_code text;

CREATE INDEX IF NOT EXISTS idx_platform_subs_stripe_sub
  ON public.platform_subscriptions(stripe_subscription_id)
  WHERE stripe_subscription_id IS NOT NULL;

-- 2) Coupons waitlist (-20% à vie)
CREATE TABLE IF NOT EXISTS public.waitlist_coupons (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  code text NOT NULL UNIQUE,
  stripe_coupon_id text,
  discount_percent int NOT NULL DEFAULT 20,
  source text NOT NULL DEFAULT 'pro_waitlist',
  redeemed_at timestamptz,
  expires_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.waitlist_coupons ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own waitlist coupons"
  ON public.waitlist_coupons FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages waitlist coupons"
  ON public.waitlist_coupons FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_waitlist_coupons_user ON public.waitlist_coupons(user_id);
CREATE INDEX IF NOT EXISTS idx_waitlist_coupons_email ON public.waitlist_coupons(email);

-- 3) Invitations envoyées depuis la waitlist
CREATE TABLE IF NOT EXISTS public.waitlist_invitations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  email text NOT NULL,
  tier text NOT NULL CHECK (tier IN ('pro','org')),
  invited_at timestamptz NOT NULL DEFAULT now(),
  converted_at timestamptz,
  coupon_code text
);

ALTER TABLE public.waitlist_invitations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own invitations"
  ON public.waitlist_invitations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages invitations"
  ON public.waitlist_invitations FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_waitlist_invitations_user_tier
  ON public.waitlist_invitations(user_id, tier);

-- 4) Audit log Stripe (idempotence webhook)
CREATE TABLE IF NOT EXISTS public.stripe_webhook_events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  stripe_event_id text NOT NULL UNIQUE,
  event_type text NOT NULL,
  payload jsonb NOT NULL,
  processed_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.stripe_webhook_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Service role manages stripe events"
  ON public.stripe_webhook_events FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_stripe_events_type
  ON public.stripe_webhook_events(event_type, processed_at DESC);

-- 5) RPC : générer un coupon waitlist
CREATE OR REPLACE FUNCTION public.issue_waitlist_coupon(
  _user_id uuid,
  _email text,
  _source text DEFAULT 'pro_waitlist',
  _discount_percent int DEFAULT 20
)
RETURNS text
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _code text;
  _existing text;
BEGIN
  SELECT code INTO _existing
  FROM public.waitlist_coupons
  WHERE user_id = _user_id AND source = _source AND redeemed_at IS NULL
  LIMIT 1;

  IF _existing IS NOT NULL THEN
    RETURN _existing;
  END IF;

  _code := 'EARLY-' || upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 8));

  INSERT INTO public.waitlist_coupons (user_id, email, code, discount_percent, source)
  VALUES (_user_id, _email, _code, _discount_percent, _source);

  RETURN _code;
END;
$$;

GRANT EXECUTE ON FUNCTION public.issue_waitlist_coupon(uuid, text, text, int) TO service_role;