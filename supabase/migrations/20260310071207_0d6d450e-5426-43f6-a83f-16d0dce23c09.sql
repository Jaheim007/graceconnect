
-- ============================================
-- CREDIT SYSTEM - SiteViral
-- ============================================

-- Types
CREATE TYPE public.credit_lot_type AS ENUM ('daily', 'bonus', 'purchased');
CREATE TYPE public.credit_tx_type AS ENUM ('daily_grant', 'bonus_grant', 'purchase', 'consumption', 'expiration', 'refund', 'cashback');

-- ============================================
-- TABLE: user_credits (main balance per user)
-- ============================================
CREATE TABLE public.user_credits (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  balance NUMERIC(12,2) NOT NULL DEFAULT 0,
  lifetime_earned NUMERIC(12,2) NOT NULL DEFAULT 0,
  lifetime_spent NUMERIC(12,2) NOT NULL DEFAULT 0,
  last_daily_grant DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_credits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own credits" ON public.user_credits FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ============================================
-- TABLE: credit_lots (FIFO expiration lots)
-- ============================================
CREATE TABLE public.credit_lots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  lot_type public.credit_lot_type NOT NULL,
  initial_amount NUMERIC(10,2) NOT NULL,
  remaining NUMERIC(10,2) NOT NULL DEFAULT 0,
  granted_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  source TEXT NOT NULL,
  is_expired BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_lots_user_active ON public.credit_lots (user_id, is_expired, expires_at)
  WHERE remaining > 0 AND is_expired = false;

ALTER TABLE public.credit_lots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own lots" ON public.credit_lots FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ============================================
-- TABLE: credit_transactions (full history)
-- ============================================
CREATE TABLE public.credit_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  tx_type public.credit_tx_type NOT NULL,
  amount NUMERIC(10,2) NOT NULL,
  balance_after NUMERIC(12,2) NOT NULL,
  action_key TEXT,
  action_label TEXT,
  metadata JSONB DEFAULT '{}',
  lot_id UUID REFERENCES public.credit_lots(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_credit_tx_user ON public.credit_transactions (user_id, created_at DESC);

ALTER TABLE public.credit_transactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own transactions" ON public.credit_transactions FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ============================================
-- TABLE: credit_purchases
-- ============================================
CREATE TABLE public.credit_purchases (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  pack_key TEXT NOT NULL,
  credits_amount NUMERIC(10,2) NOT NULL,
  price_amount INTEGER NOT NULL,
  price_currency TEXT NOT NULL DEFAULT 'XOF',
  payment_reference TEXT,
  payment_gateway TEXT DEFAULT 'paystack',
  status TEXT NOT NULL DEFAULT 'pending',
  completed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_purchases ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users read own purchases" ON public.credit_purchases FOR SELECT TO authenticated USING (user_id = auth.uid());

-- ============================================
-- TABLE: credit_action_pricing (superadmin configurable)
-- ============================================
CREATE TABLE public.credit_action_pricing (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  action_key TEXT NOT NULL UNIQUE,
  action_label TEXT NOT NULL,
  category TEXT NOT NULL,
  cost_standard NUMERIC(10,2) NOT NULL,
  cost_premium NUMERIC(10,2) NOT NULL,
  description TEXT,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_action_pricing ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read pricing" ON public.credit_action_pricing FOR SELECT USING (true);

-- ============================================
-- TABLE: credit_packs (purchasable packs)
-- ============================================
CREATE TABLE public.credit_packs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  pack_key TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  credits NUMERIC(10,2) NOT NULL,
  price_xof INTEGER NOT NULL,
  bonus_percent NUMERIC(5,2) DEFAULT 0,
  is_popular BOOLEAN DEFAULT false,
  is_active BOOLEAN NOT NULL DEFAULT true,
  display_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.credit_packs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read packs" ON public.credit_packs FOR SELECT USING (true);

-- ============================================
-- FUNCTION: expire_credit_lots
-- ============================================
CREATE OR REPLACE FUNCTION public.expire_credit_lots(_user_id UUID)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _expired_total NUMERIC := 0;
  _lot RECORD;
  _new_balance NUMERIC;
BEGIN
  FOR _lot IN
    SELECT id, remaining FROM credit_lots
    WHERE user_id = _user_id
      AND is_expired = false
      AND remaining > 0
      AND expires_at IS NOT NULL
      AND expires_at <= now()
    FOR UPDATE
  LOOP
    _expired_total := _expired_total + _lot.remaining;
    UPDATE credit_lots SET is_expired = true, remaining = 0 WHERE id = _lot.id;
  END LOOP;

  IF _expired_total > 0 THEN
    UPDATE user_credits
    SET balance = GREATEST(balance - _expired_total, 0), updated_at = now()
    WHERE user_id = _user_id;

    SELECT balance INTO _new_balance FROM user_credits WHERE user_id = _user_id;

    INSERT INTO credit_transactions (user_id, tx_type, amount, balance_after, action_key)
    VALUES (_user_id, 'expiration', -_expired_total, COALESCE(_new_balance, 0), 'lots_expired');
  END IF;

  RETURN _expired_total;
END;
$$;

-- ============================================
-- FUNCTION: consume_credits (FIFO)
-- ============================================
CREATE OR REPLACE FUNCTION public.consume_credits(
  _user_id UUID,
  _amount NUMERIC,
  _action_key TEXT,
  _action_label TEXT DEFAULT NULL,
  _metadata JSONB DEFAULT '{}'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _balance NUMERIC;
  _remaining NUMERIC;
  _lot RECORD;
  _to_debit NUMERIC;
  _new_balance NUMERIC;
BEGIN
  -- Ensure user_credits row exists
  INSERT INTO user_credits (user_id, balance) VALUES (_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  -- Expire old lots first
  PERFORM expire_credit_lots(_user_id);

  -- Lock and get balance
  SELECT balance INTO _balance
  FROM user_credits WHERE user_id = _user_id FOR UPDATE;

  IF _balance < _amount THEN
    RETURN jsonb_build_object(
      'ok', false,
      'reason', 'insufficient_credits',
      'balance', _balance,
      'required', _amount
    );
  END IF;

  -- FIFO: daily first (expire soonest), then bonus, then purchased
  _remaining := _amount;

  FOR _lot IN
    SELECT id, remaining, lot_type
    FROM credit_lots
    WHERE user_id = _user_id AND remaining > 0 AND is_expired = false
      AND (expires_at IS NULL OR expires_at > now())
    ORDER BY
      CASE lot_type WHEN 'daily' THEN 1 WHEN 'bonus' THEN 2 WHEN 'purchased' THEN 3 END,
      expires_at ASC NULLS LAST,
      granted_at ASC
    FOR UPDATE
  LOOP
    EXIT WHEN _remaining <= 0;
    _to_debit := LEAST(_remaining, _lot.remaining);
    UPDATE credit_lots SET remaining = remaining - _to_debit WHERE id = _lot.id;
    _remaining := _remaining - _to_debit;
  END LOOP;

  -- Update balance
  _new_balance := _balance - _amount;
  UPDATE user_credits
  SET balance = _new_balance,
      lifetime_spent = lifetime_spent + _amount,
      updated_at = now()
  WHERE user_id = _user_id;

  -- Record transaction
  INSERT INTO credit_transactions (user_id, tx_type, amount, balance_after, action_key, action_label, metadata)
  VALUES (_user_id, 'consumption', -_amount, _new_balance, _action_key, COALESCE(_action_label, _action_key), _metadata);

  RETURN jsonb_build_object('ok', true, 'debited', _amount, 'balance', _new_balance);
END;
$$;

-- ============================================
-- FUNCTION: grant_daily_credits
-- ============================================
CREATE OR REPLACE FUNCTION public.grant_daily_credits(_user_id UUID, _amount NUMERIC DEFAULT 38.5)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _last_grant DATE;
  _lot_id UUID;
  _new_balance NUMERIC;
BEGIN
  INSERT INTO user_credits (user_id, balance) VALUES (_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  SELECT last_daily_grant INTO _last_grant
  FROM user_credits WHERE user_id = _user_id FOR UPDATE;

  IF _last_grant IS NOT NULL AND _last_grant >= CURRENT_DATE THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_granted_today');
  END IF;

  -- Expire old lots
  PERFORM expire_credit_lots(_user_id);

  -- New daily lot (24h expiry)
  INSERT INTO credit_lots (user_id, lot_type, initial_amount, remaining, expires_at, source)
  VALUES (_user_id, 'daily', _amount, _amount, now() + interval '24 hours', 'daily_grant')
  RETURNING id INTO _lot_id;

  UPDATE user_credits SET
    balance = balance + _amount,
    lifetime_earned = lifetime_earned + _amount,
    last_daily_grant = CURRENT_DATE,
    updated_at = now()
  WHERE user_id = _user_id;

  SELECT balance INTO _new_balance FROM user_credits WHERE user_id = _user_id;

  INSERT INTO credit_transactions (user_id, tx_type, amount, balance_after, action_key, lot_id)
  VALUES (_user_id, 'daily_grant', _amount, _new_balance, 'daily_credits', _lot_id);

  RETURN jsonb_build_object('ok', true, 'granted', _amount, 'balance', _new_balance);
END;
$$;

-- ============================================
-- FUNCTION: grant_bonus_credits
-- ============================================
CREATE OR REPLACE FUNCTION public.grant_bonus_credits(
  _user_id UUID,
  _amount NUMERIC,
  _source TEXT,
  _expires_in_days INTEGER DEFAULT 7
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _lot_id UUID;
  _new_balance NUMERIC;
BEGIN
  INSERT INTO user_credits (user_id, balance) VALUES (_user_id, 0)
  ON CONFLICT (user_id) DO NOTHING;

  INSERT INTO credit_lots (user_id, lot_type, initial_amount, remaining, expires_at, source)
  VALUES (_user_id, 'bonus', _amount, _amount, now() + make_interval(days => _expires_in_days), _source)
  RETURNING id INTO _lot_id;

  UPDATE user_credits SET
    balance = balance + _amount,
    lifetime_earned = lifetime_earned + _amount,
    updated_at = now()
  WHERE user_id = _user_id;

  SELECT balance INTO _new_balance FROM user_credits WHERE user_id = _user_id;

  INSERT INTO credit_transactions (user_id, tx_type, amount, balance_after, action_key, lot_id)
  VALUES (_user_id, 'bonus_grant', _amount, _new_balance, _source, _lot_id);

  RETURN jsonb_build_object('ok', true, 'granted', _amount, 'balance', _new_balance, 'expires_in_days', _expires_in_days);
END;
$$;

-- ============================================
-- FUNCTION: complete_credit_purchase
-- ============================================
CREATE OR REPLACE FUNCTION public.complete_credit_purchase(
  _purchase_id UUID,
  _payment_reference TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _purchase RECORD;
  _lot_id UUID;
  _new_balance NUMERIC;
BEGIN
  SELECT * INTO _purchase FROM credit_purchases WHERE id = _purchase_id FOR UPDATE;

  IF _purchase IS NULL THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'purchase_not_found');
  END IF;
  IF _purchase.status = 'completed' THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'already_completed');
  END IF;

  UPDATE credit_purchases SET
    status = 'completed',
    payment_reference = _payment_reference,
    completed_at = now()
  WHERE id = _purchase_id;

  -- Purchased lots never expire
  INSERT INTO credit_lots (user_id, lot_type, initial_amount, remaining, expires_at, source)
  VALUES (_purchase.user_id, 'purchased', _purchase.credits_amount, _purchase.credits_amount, NULL, 'purchase_' || _purchase.pack_key)
  RETURNING id INTO _lot_id;

  INSERT INTO user_credits (user_id, balance, lifetime_earned)
  VALUES (_purchase.user_id, _purchase.credits_amount, _purchase.credits_amount)
  ON CONFLICT (user_id) DO UPDATE SET
    balance = user_credits.balance + _purchase.credits_amount,
    lifetime_earned = user_credits.lifetime_earned + _purchase.credits_amount,
    updated_at = now();

  SELECT balance INTO _new_balance FROM user_credits WHERE user_id = _purchase.user_id;

  INSERT INTO credit_transactions (user_id, tx_type, amount, balance_after, action_key, lot_id, metadata)
  VALUES (_purchase.user_id, 'purchase', _purchase.credits_amount, _new_balance, 'credit_purchase', _lot_id,
    jsonb_build_object('pack', _purchase.pack_key, 'price', _purchase.price_amount, 'currency', _purchase.price_currency));

  RETURN jsonb_build_object('ok', true, 'credits', _purchase.credits_amount, 'balance', _new_balance);
END;
$$;

-- ============================================
-- FUNCTION: grant_cashback_credits (1.5%)
-- ============================================
CREATE OR REPLACE FUNCTION public.grant_cashback_credits(
  _user_id UUID,
  _sale_amount NUMERIC,
  _currency TEXT DEFAULT 'XOF'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _cashback_rate NUMERIC := 0.015;
  _credit_value NUMERIC;
BEGIN
  IF _currency = 'XOF' THEN
    _credit_value := ROUND(_sale_amount * _cashback_rate / 10, 2);
  ELSE
    _credit_value := ROUND(_sale_amount * _cashback_rate * 80, 2);
  END IF;

  IF _credit_value < 0.1 THEN
    RETURN jsonb_build_object('ok', false, 'reason', 'amount_too_small');
  END IF;

  RETURN grant_bonus_credits(_user_id, _credit_value, 'cashback_sale', 30);
END;
$$;

-- ============================================
-- FUNCTION: get_credit_summary
-- ============================================
CREATE OR REPLACE FUNCTION public.get_credit_summary(_user_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _credits RECORD;
  _daily_remaining NUMERIC;
  _daily_expires TIMESTAMPTZ;
  _bonus_remaining NUMERIC;
  _purchased_remaining NUMERIC;
BEGIN
  PERFORM expire_credit_lots(_user_id);

  SELECT * INTO _credits FROM user_credits WHERE user_id = _user_id;

  IF _credits IS NULL THEN
    RETURN jsonb_build_object(
      'balance', 0, 'daily_remaining', 0, 'bonus_remaining', 0,
      'purchased_remaining', 0, 'lifetime_earned', 0, 'lifetime_spent', 0,
      'daily_expires_at', null, 'last_daily_grant', null
    );
  END IF;

  SELECT COALESCE(SUM(remaining), 0), MIN(expires_at)
  INTO _daily_remaining, _daily_expires
  FROM credit_lots
  WHERE user_id = _user_id AND lot_type = 'daily' AND remaining > 0 AND is_expired = false
    AND (expires_at IS NULL OR expires_at > now());

  SELECT COALESCE(SUM(remaining), 0) INTO _bonus_remaining
  FROM credit_lots
  WHERE user_id = _user_id AND lot_type = 'bonus' AND remaining > 0 AND is_expired = false
    AND (expires_at IS NULL OR expires_at > now());

  SELECT COALESCE(SUM(remaining), 0) INTO _purchased_remaining
  FROM credit_lots
  WHERE user_id = _user_id AND lot_type = 'purchased' AND remaining > 0 AND is_expired = false;

  RETURN jsonb_build_object(
    'balance', _credits.balance,
    'daily_remaining', _daily_remaining,
    'daily_expires_at', _daily_expires,
    'bonus_remaining', _bonus_remaining,
    'purchased_remaining', _purchased_remaining,
    'lifetime_earned', _credits.lifetime_earned,
    'lifetime_spent', _credits.lifetime_spent,
    'last_daily_grant', _credits.last_daily_grant
  );
END;
$$;

-- ============================================
-- SEED: Action pricing
-- ============================================
INSERT INTO public.credit_action_pricing (action_key, action_label, category, cost_standard, cost_premium, description, display_order) VALUES
('suggest_titles', 'Suggestion de titres', 'writing', 0.8, 1.5, 'Génère 3 titres créatifs pour votre livre', 1),
('generate_outline', 'Plan du livre', 'writing', 2.3, 4.0, 'Structure complète avec chapitres et sous-sections', 2),
('generate_chapter', 'Génération de chapitre', 'writing', 2.7, 5.2, 'Contenu complet d''un chapitre', 3),
('amplify_chapter', 'Amplifier un chapitre', 'writing', 4.5, 7.8, 'Enrichir et développer un chapitre existant', 4),
('write_content', 'Rédaction de contenu', 'marketing', 1.8, 3.2, 'Texte marketing ou descriptif personnalisé', 5),
('generate_description', 'Description produit IA', 'marketing', 1.3, 2.5, 'Description de vente optimisée et percutante', 6),
('generate_snippets', 'Extraits sociaux', 'marketing', 0.7, 1.4, 'Snippets optimisés pour réseaux sociaux', 7),
('translate_product', 'Traduction produit', 'marketing', 1.9, 3.4, 'Traduction complète d''un produit (titre, description, FAQ)', 8),
('generate_cover', 'Couverture IA', 'image', 7.5, 12.0, 'Image de couverture HD professionnelle', 9),
('generate_illustration', 'Illustration IA', 'image', 5.8, 9.5, 'Illustration pour chapitre ou contenu', 10),
('coloring_page', 'Page de coloriage', 'image', 4.7, 8.2, 'Page de coloriage line-art pour enfants', 11),
('transcribe_media', 'Transcription média', 'analysis', 4.5, 7.8, 'Transcription audio ou vidéo complète', 12),
('editorial_strategy', 'Stratégie éditoriale', 'analysis', 2.3, 3.9, 'Plan éditorial personnalisé avec recommandations', 13),
('seo_optimize', 'Optimisation SEO', 'marketing', 1.2, 2.4, 'Méta-données, mots-clés et optimisation', 14);

-- ============================================
-- SEED: Credit packs
-- ============================================
INSERT INTO public.credit_packs (pack_key, name, credits, price_xof, bonus_percent, is_popular, display_order) VALUES
('starter', 'Starter', 150, 2000, 0, false, 1),
('creator', 'Créateur', 330, 3000, 10, true, 2),
('pro', 'Pro', 690, 5000, 15, false, 3),
('business', 'Business', 1800, 10000, 20, false, 4),
('enterprise', 'Entreprise', 4375, 20000, 25, false, 5);

-- ============================================
-- TRIGGER: Auto-grant signup bonus (50 credits)
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_grant_signup_bonus()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Grant 50 bonus credits valid for 7 days on first profile creation
  PERFORM grant_bonus_credits(NEW.id, 50, 'signup_bonus', 7);
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_signup_bonus
  AFTER INSERT ON public.profiles
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_grant_signup_bonus();
