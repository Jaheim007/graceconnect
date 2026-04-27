
-- ============ MONTHLY CREDIT GRANT BY TIER ============
CREATE OR REPLACE FUNCTION public.grant_monthly_platform_credits(_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _tier text;
  _amount numeric := 0;
  _existing_lot_id uuid;
  _lot_id uuid;
  _new_balance numeric;
  _month_key text := to_char(CURRENT_DATE, 'YYYY-MM');
  _expires timestamptz := (date_trunc('month', CURRENT_DATE) + INTERVAL '1 month')::timestamptz;
BEGIN
  -- Determine tier
  BEGIN
    _tier := public.get_user_platform_tier(_user_id);
  EXCEPTION WHEN OTHERS THEN
    _tier := 'free';
  END;

  _amount := CASE
    WHEN _tier = 'org' THEN 2000
    WHEN _tier = 'pro' THEN 500
    WHEN _tier = 'founder' THEN 1000
    ELSE 50
  END;

  -- Ensure user_credits row exists
  INSERT INTO user_credits (user_id, balance, lifetime_earned, lifetime_spent)
  VALUES (_user_id, 0, 0, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Idempotency: check for existing monthly lot this calendar month
  SELECT id INTO _existing_lot_id
  FROM credit_lots
  WHERE user_id = _user_id
    AND lot_type = 'monthly_tier'
    AND source = 'monthly_tier_' || _month_key
    AND is_expired = false
  LIMIT 1;

  IF _existing_lot_id IS NOT NULL THEN
    SELECT COALESCE(SUM(remaining), 0) INTO _new_balance
    FROM credit_lots
    WHERE user_id = _user_id AND is_expired = false
      AND (expires_at IS NULL OR expires_at > now());
    RETURN jsonb_build_object('ok', false, 'reason', 'already_granted_this_month', 'tier', _tier, 'balance', _new_balance);
  END IF;

  -- Expire previous monthly_tier lot
  UPDATE credit_lots
  SET is_expired = true
  WHERE user_id = _user_id
    AND lot_type = 'monthly_tier'
    AND is_expired = false;

  -- Insert this month's lot
  INSERT INTO credit_lots (user_id, lot_type, initial_amount, remaining, source, granted_at, expires_at)
  VALUES (
    _user_id, 'monthly_tier', _amount, _amount,
    'monthly_tier_' || _month_key,
    now(),
    CASE WHEN _tier = 'founder' THEN NULL ELSE _expires END
  )
  RETURNING id INTO _lot_id;

  -- Recompute balance
  SELECT COALESCE(SUM(remaining), 0) INTO _new_balance
  FROM credit_lots
  WHERE user_id = _user_id AND is_expired = false
    AND (expires_at IS NULL OR expires_at > now());

  UPDATE user_credits
     SET balance = _new_balance,
         lifetime_earned = COALESCE(lifetime_earned, 0) + _amount,
         updated_at = now()
   WHERE user_id = _user_id;

  INSERT INTO credit_transactions (user_id, tx_type, amount, balance_after, action_key, lot_id)
  VALUES (_user_id, 'monthly_grant', _amount, _new_balance, 'monthly_tier_credits_' || _tier, _lot_id);

  RETURN jsonb_build_object('ok', true, 'tier', _tier, 'granted', _amount, 'balance', _new_balance, 'month', _month_key);
END;
$$;

-- Allow authenticated users to call for themselves
GRANT EXECUTE ON FUNCTION public.grant_monthly_platform_credits(uuid) TO authenticated;

-- ============ COMMISSION SAVINGS LEDGER ============
CREATE TABLE IF NOT EXISTS public.platform_commission_savings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid,
  transaction_id uuid,
  saved_amount_cents bigint NOT NULL DEFAULT 0,
  paid_amount_cents bigint NOT NULL DEFAULT 0,
  currency text NOT NULL DEFAULT 'XOF',
  tier text NOT NULL,
  month_key text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pcs_user_month ON public.platform_commission_savings(user_id, month_key);
CREATE INDEX IF NOT EXISTS idx_pcs_org_month ON public.platform_commission_savings(organization_id, month_key);

ALTER TABLE public.platform_commission_savings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users see own savings" ON public.platform_commission_savings;
CREATE POLICY "Users see own savings"
  ON public.platform_commission_savings
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Only service role can insert (no INSERT policy = block anon/authenticated)

-- ============ MONTHLY RECAP RPC ============
CREATE OR REPLACE FUNCTION public.get_monthly_commission_recap(_user_id uuid, _month_key text DEFAULT NULL)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _mk text := COALESCE(_month_key, to_char(CURRENT_DATE - INTERVAL '1 month', 'YYYY-MM'));
  _saved bigint := 0;
  _paid bigint := 0;
  _currency text := 'XOF';
  _tier text;
BEGIN
  BEGIN
    _tier := public.get_user_platform_tier(_user_id);
  EXCEPTION WHEN OTHERS THEN
    _tier := 'free';
  END;

  SELECT
    COALESCE(SUM(saved_amount_cents), 0),
    COALESCE(SUM(paid_amount_cents), 0),
    COALESCE(MAX(currency), 'XOF')
  INTO _saved, _paid, _currency
  FROM public.platform_commission_savings
  WHERE user_id = _user_id AND month_key = _mk;

  RETURN jsonb_build_object(
    'month', _mk,
    'tier', _tier,
    'saved_cents', _saved,
    'paid_cents', _paid,
    'currency', _currency
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.get_monthly_commission_recap(uuid, text) TO authenticated;
