CREATE TYPE public.platform_plan AS ENUM ('free', 'pro', 'org');
CREATE TYPE public.subscription_status AS ENUM ('trialing', 'active', 'past_due', 'canceled', 'incomplete', 'expired');
CREATE TYPE public.subscription_provider AS ENUM ('stripe', 'paystack', 'manual', 'grandfather', 'founder');

CREATE OR REPLACE FUNCTION public.set_updated_at_now()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$;

CREATE TABLE public.platform_subscriptions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  plan public.platform_plan NOT NULL DEFAULT 'free',
  status public.subscription_status NOT NULL DEFAULT 'active',
  provider public.subscription_provider,
  stripe_customer_id TEXT,
  stripe_subscription_id TEXT,
  paystack_customer_code TEXT,
  paystack_subscription_code TEXT,
  current_period_start TIMESTAMPTZ,
  current_period_end TIMESTAMPTZ,
  cancel_at_period_end BOOLEAN NOT NULL DEFAULT false,
  canceled_at TIMESTAMPTZ,
  trial_start TIMESTAMPTZ,
  trial_end TIMESTAMPTZ,
  amount_xof INTEGER,
  currency TEXT DEFAULT 'XOF',
  billing_interval TEXT DEFAULT 'month',
  is_grandfather BOOLEAN NOT NULL DEFAULT false,
  grandfather_until TIMESTAMPTZ,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_platform_subs_user ON public.platform_subscriptions(user_id);
CREATE INDEX idx_platform_subs_stripe_sub ON public.platform_subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;
CREATE INDEX idx_platform_subs_paystack_sub ON public.platform_subscriptions(paystack_subscription_code) WHERE paystack_subscription_code IS NOT NULL;
CREATE INDEX idx_platform_subs_status ON public.platform_subscriptions(status, plan);

ALTER TABLE public.platform_subscriptions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own subscription"
ON public.platform_subscriptions FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Superadmins view all subscriptions"
ON public.platform_subscriptions FOR SELECT
USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Service role manages subscriptions"
ON public.platform_subscriptions FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE TRIGGER trg_platform_subs_updated_at
BEFORE UPDATE ON public.platform_subscriptions
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at_now();

CREATE TABLE public.platform_subscription_events (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  subscription_id UUID REFERENCES public.platform_subscriptions(id) ON DELETE SET NULL,
  user_id UUID,
  provider public.subscription_provider NOT NULL,
  event_type TEXT NOT NULL,
  external_event_id TEXT,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  processed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_platform_sub_events_sub ON public.platform_subscription_events(subscription_id);
CREATE INDEX idx_platform_sub_events_user ON public.platform_subscription_events(user_id);
CREATE INDEX idx_platform_sub_events_external ON public.platform_subscription_events(external_event_id);

ALTER TABLE public.platform_subscription_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins view all events"
ON public.platform_subscription_events FOR SELECT
USING (public.is_superadmin(auth.uid()));

CREATE POLICY "Service role manages events"
ON public.platform_subscription_events FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE TABLE public.founders_lifetime (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL UNIQUE,
  slot_number INTEGER NOT NULL UNIQUE CHECK (slot_number BETWEEN 1 AND 50),
  amount_paid_xof INTEGER NOT NULL DEFAULT 49000,
  provider public.subscription_provider NOT NULL,
  external_payment_id TEXT,
  claimed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_founders_user ON public.founders_lifetime(user_id);

ALTER TABLE public.founders_lifetime ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone view founders roster"
ON public.founders_lifetime FOR SELECT
USING (true);

CREATE POLICY "Service role manages founders"
ON public.founders_lifetime FOR ALL
USING (auth.jwt() ->> 'role' = 'service_role')
WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

CREATE OR REPLACE FUNCTION public.get_user_platform_tier(_user_id UUID)
RETURNS public.platform_plan
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _tier public.platform_plan;
  _user_created TIMESTAMPTZ;
  _grandfather_cutoff TIMESTAMPTZ := '2026-04-27 00:00:00+00'::TIMESTAMPTZ;
  _grandfather_duration INTERVAL := '60 days'::INTERVAL;
BEGIN
  IF _user_id IS NULL THEN RETURN 'free'::public.platform_plan; END IF;
  
  IF EXISTS (SELECT 1 FROM public.founders_lifetime WHERE user_id = _user_id) THEN
    RETURN 'pro'::public.platform_plan;
  END IF;
  
  SELECT plan INTO _tier FROM public.platform_subscriptions
  WHERE user_id = _user_id AND status IN ('trialing', 'active')
    AND (current_period_end IS NULL OR current_period_end > now())
  LIMIT 1;
  
  IF _tier IS NOT NULL AND _tier != 'free' THEN RETURN _tier; END IF;
  
  SELECT created_at INTO _user_created FROM auth.users WHERE id = _user_id;
  
  IF _user_created IS NOT NULL 
     AND _user_created < _grandfather_cutoff 
     AND now() < (_grandfather_cutoff + _grandfather_duration) THEN
    RETURN 'pro'::public.platform_plan;
  END IF;
  
  RETURN 'free'::public.platform_plan;
END;
$$;

CREATE OR REPLACE FUNCTION public.claim_founder_slot(
  _user_id UUID,
  _provider public.subscription_provider,
  _external_payment_id TEXT,
  _amount_xof INTEGER DEFAULT 49000
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE _next_slot INTEGER;
BEGIN
  SELECT slot_number INTO _next_slot FROM public.founders_lifetime WHERE user_id = _user_id;
  IF _next_slot IS NOT NULL THEN RETURN _next_slot; END IF;
  
  SELECT COALESCE(MAX(slot_number), 0) + 1 INTO _next_slot FROM public.founders_lifetime;
  IF _next_slot > 50 THEN RETURN NULL; END IF;
  
  INSERT INTO public.founders_lifetime (user_id, slot_number, amount_paid_xof, provider, external_payment_id)
  VALUES (_user_id, _next_slot, _amount_xof, _provider, _external_payment_id);
  
  RETURN _next_slot;
END;
$$;

CREATE OR REPLACE FUNCTION public.founders_remaining()
RETURNS INTEGER LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public
AS $$
  SELECT GREATEST(0, 50 - (SELECT COUNT(*)::INTEGER FROM public.founders_lifetime));
$$;