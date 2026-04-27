-- 1) Table des filleuls
CREATE TABLE IF NOT EXISTS public.user_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  referrer_id uuid NOT NULL,
  referred_id uuid NOT NULL UNIQUE,
  referral_code text NOT NULL,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending','active','rewarded')),
  activated_at timestamptz,
  rewarded_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_referrals ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see referrals they made"
  ON public.user_referrals FOR SELECT
  USING (auth.uid() = referrer_id);

CREATE POLICY "Service role manages user_referrals"
  ON public.user_referrals FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

CREATE INDEX IF NOT EXISTS idx_user_referrals_referrer ON public.user_referrals(referrer_id);
CREATE INDEX IF NOT EXISTS idx_user_referrals_status ON public.user_referrals(status);

-- 2) Récompenses
CREATE TABLE IF NOT EXISTS public.referral_rewards (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  reward_type text NOT NULL,
  reward_value text,
  granted_at timestamptz NOT NULL DEFAULT now(),
  notes text
);

ALTER TABLE public.referral_rewards ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own rewards"
  ON public.referral_rewards FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Service role manages rewards"
  ON public.referral_rewards FOR ALL
  USING (auth.role() = 'service_role')
  WITH CHECK (auth.role() = 'service_role');

-- 3) RPC: register referral
CREATE OR REPLACE FUNCTION public.register_referral(_referred_id uuid, _code text)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _referrer uuid; _existing uuid; _id uuid;
BEGIN
  SELECT id INTO _referrer FROM profiles WHERE referral_code = _code LIMIT 1;
  IF _referrer IS NULL OR _referrer = _referred_id THEN RETURN NULL; END IF;
  SELECT id INTO _existing FROM user_referrals WHERE referred_id = _referred_id;
  IF _existing IS NOT NULL THEN RETURN _existing; END IF;
  INSERT INTO user_referrals (referrer_id, referred_id, referral_code, status)
  VALUES (_referrer, _referred_id, _code, 'pending')
  RETURNING id INTO _id;
  RETURN _id;
END;
$$;
GRANT EXECUTE ON FUNCTION public.register_referral(uuid, text) TO authenticated, anon;

-- 4) RPC: activate referral
CREATE OR REPLACE FUNCTION public.activate_referral(_referred_id uuid)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  UPDATE user_referrals SET status='active', activated_at=now()
   WHERE referred_id=_referred_id AND status='pending';
END;
$$;
GRANT EXECUTE ON FUNCTION public.activate_referral(uuid) TO authenticated, service_role;

-- 5) RPC: check & grant reward
CREATE OR REPLACE FUNCTION public.check_referral_reward(_referrer_id uuid)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE _active int; _rewarded int; _new int;
BEGIN
  SELECT COUNT(*) INTO _active FROM user_referrals
   WHERE referrer_id=_referrer_id AND status IN ('active','rewarded');
  SELECT COUNT(*) INTO _rewarded FROM referral_rewards
   WHERE user_id=_referrer_id AND reward_type='pro_month';
  _new := (_active / 3) - _rewarded;
  IF _new <= 0 THEN RETURN false; END IF;

  FOR i IN 1.._new LOOP
    INSERT INTO referral_rewards (user_id, reward_type, reward_value, notes)
    VALUES (_referrer_id, 'pro_month', '30', 'Auto-granted: 3 active referrals');
  END LOOP;

  UPDATE user_referrals SET status='rewarded', rewarded_at=now()
   WHERE id IN (
     SELECT id FROM user_referrals
      WHERE referrer_id=_referrer_id AND status='active'
      ORDER BY activated_at ASC LIMIT _new * 3
   );

  -- Extend existing trial/subscription if any, else create
  IF EXISTS (SELECT 1 FROM platform_subscriptions WHERE user_id=_referrer_id AND status IN ('active','trialing')) THEN
    UPDATE platform_subscriptions
       SET trial_end = COALESCE(trial_end, now()) + (_new || ' months')::interval,
           current_period_end = COALESCE(current_period_end, now()) + (_new || ' months')::interval
     WHERE user_id=_referrer_id AND status IN ('active','trialing');
  ELSE
    INSERT INTO platform_subscriptions (user_id, plan, status, provider, trial_end, current_period_start, current_period_end)
    VALUES (_referrer_id, 'pro', 'trialing', 'referral',
            now() + (_new || ' months')::interval,
            now(),
            now() + (_new || ' months')::interval);
  END IF;

  RETURN true;
END;
$$;
GRANT EXECUTE ON FUNCTION public.check_referral_reward(uuid) TO authenticated, service_role;

-- 6) Vue showcase (corrigée: digital_products + sans is_published sur organizations)
CREATE OR REPLACE VIEW public.showcase_top_creators AS
SELECT
  o.id AS organization_id,
  o.slug,
  o.name,
  o.logo_url,
  o.description,
  COUNT(DISTINCT pp.id) FILTER (WHERE pp.status='completed' AND pp.created_at >= date_trunc('month', now())) AS sales_this_month,
  COUNT(DISTINCT dp.id) FILTER (WHERE dp.is_published=true) AS active_products
FROM organizations o
LEFT JOIN digital_products dp ON dp.organization_id = o.id
LEFT JOIN product_purchases pp ON pp.organization_id = o.id
GROUP BY o.id
HAVING COUNT(DISTINCT pp.id) FILTER (WHERE pp.status='completed' AND pp.created_at >= date_trunc('month', now())) > 0
ORDER BY sales_this_month DESC
LIMIT 24;

GRANT SELECT ON public.showcase_top_creators TO anon, authenticated;