
-- 1. Add first_action_at to profiles for TTFV tracking
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS first_action_at timestamptz;

-- 2. Add k_factor to platform_metrics_daily
ALTER TABLE public.platform_metrics_daily ADD COLUMN IF NOT EXISTS k_factor numeric DEFAULT 0;

-- 3. Create trigger function for auto badge attribution
CREATE OR REPLACE FUNCTION public.auto_award_badges()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid;
  _org_id uuid;
  _badge record;
  _current_value numeric;
BEGIN
  -- Determine user and org based on trigger source
  IF TG_TABLE_NAME = 'product_purchases' THEN
    _user_id := NEW.user_id;
    _org_id := NEW.organization_id;
  ELSIF TG_TABLE_NAME = 'affiliate_sales' THEN
    _user_id := NEW.affiliate_user_id;
    _org_id := NEW.organization_id;
  ELSIF TG_TABLE_NAME = 'donations' THEN
    _user_id := NEW.user_id;
    _org_id := NEW.organization_id;
  ELSE
    RETURN NEW;
  END IF;

  IF _user_id IS NULL OR _org_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- Check all active badges for this org
  FOR _badge IN
    SELECT * FROM public.badges
    WHERE organization_id = _org_id AND is_active = true
  LOOP
    -- Skip if already awarded
    IF EXISTS (
      SELECT 1 FROM public.user_badges
      WHERE user_id = _user_id AND badge_id = _badge.id
    ) THEN
      CONTINUE;
    END IF;

    -- Calculate current value based on condition_type
    CASE _badge.condition_type
      WHEN 'purchases' THEN
        SELECT COUNT(*) INTO _current_value
        FROM public.product_purchases
        WHERE user_id = _user_id AND organization_id = _org_id AND status = 'completed';
      WHEN 'donations' THEN
        SELECT COUNT(*) INTO _current_value
        FROM public.donations
        WHERE user_id = _user_id AND organization_id = _org_id AND status = 'completed';
      WHEN 'affiliate_sales' THEN
        SELECT COUNT(*) INTO _current_value
        FROM public.affiliate_sales
        WHERE affiliate_user_id = _user_id AND organization_id = _org_id;
      WHEN 'total_spent' THEN
        SELECT COALESCE(SUM(amount), 0) INTO _current_value
        FROM public.product_purchases
        WHERE user_id = _user_id AND organization_id = _org_id AND status = 'completed';
      WHEN 'total_donated' THEN
        SELECT COALESCE(SUM(amount), 0) INTO _current_value
        FROM public.donations
        WHERE user_id = _user_id AND organization_id = _org_id AND status = 'completed';
      ELSE
        CONTINUE;
    END CASE;

    -- Check if threshold met
    IF _current_value >= _badge.condition_value THEN
      INSERT INTO public.user_badges (user_id, badge_id)
      VALUES (_user_id, _badge.id)
      ON CONFLICT DO NOTHING;

      -- Notify user
      INSERT INTO public.user_notifications (user_id, organization_id, title, body, notification_type, action_url)
      VALUES (
        _user_id, _org_id,
        '🏅 Nouveau badge obtenu !',
        'Félicitations ! Vous avez obtenu le badge "' || _badge.name || '" !',
        'badge_earned',
        '/leaderboard'
      );
    END IF;
  END LOOP;

  RETURN NEW;
END;
$$;

-- 4. Create user_badges table if not exists
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_id uuid NOT NULL REFERENCES public.badges(id) ON DELETE CASCADE,
  awarded_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(user_id, badge_id)
);

ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own badges" ON public.user_badges
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Anyone can view badges" ON public.user_badges
  FOR SELECT USING (true);

-- 5. Attach badge trigger to relevant tables
DROP TRIGGER IF EXISTS trg_auto_badge_on_purchase ON public.product_purchases;
CREATE TRIGGER trg_auto_badge_on_purchase
  AFTER INSERT ON public.product_purchases
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION public.auto_award_badges();

DROP TRIGGER IF EXISTS trg_auto_badge_on_donation ON public.donations;
CREATE TRIGGER trg_auto_badge_on_donation
  AFTER INSERT ON public.donations
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION public.auto_award_badges();

DROP TRIGGER IF EXISTS trg_auto_badge_on_affiliate_sale ON public.affiliate_sales;
CREATE TRIGGER trg_auto_badge_on_affiliate_sale
  AFTER INSERT ON public.affiliate_sales
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_award_badges();

-- 6. Trigger to track first_action_at on profiles
CREATE OR REPLACE FUNCTION public.track_first_action()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  UPDATE public.profiles
  SET first_action_at = now()
  WHERE id = NEW.user_id
    AND first_action_at IS NULL;
  RETURN NEW;
END;
$$;

-- Track first action when user creates a product
DROP TRIGGER IF EXISTS trg_first_action_product ON public.digital_products;
CREATE TRIGGER trg_first_action_product
  AFTER INSERT ON public.digital_products
  FOR EACH ROW
  EXECUTE FUNCTION public.track_first_action();

-- Track first action when user makes a purchase
DROP TRIGGER IF EXISTS trg_first_action_purchase ON public.product_purchases;
CREATE TRIGGER trg_first_action_purchase
  AFTER INSERT ON public.product_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.track_first_action();

-- Track first action when user creates a donation
DROP TRIGGER IF EXISTS trg_first_action_donation ON public.donations;
CREATE TRIGGER trg_first_action_donation
  AFTER INSERT ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.track_first_action();
