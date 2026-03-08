-- ═══════════════════════════════════════════════════════════
-- 1. Auto-capture contacts from purchases and donations
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.auto_capture_contact_on_purchase()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _email text;
  _name text;
BEGIN
  IF NEW.status != 'completed' THEN RETURN NEW; END IF;
  
  _email := COALESCE(NEW.buyer_email, '');
  _name := COALESCE(NEW.buyer_name, '');
  
  IF _email = '' THEN RETURN NEW; END IF;

  INSERT INTO public.contacts (organization_id, email, name, source, tags)
  VALUES (
    NEW.organization_id,
    _email,
    NULLIF(_name, ''),
    'purchase',
    ARRAY['buyer']
  )
  ON CONFLICT (organization_id, email) DO UPDATE SET
    name = COALESCE(NULLIF(EXCLUDED.name, ''), contacts.name),
    tags = CASE
      WHEN NOT (contacts.tags @> ARRAY['buyer']) THEN contacts.tags || ARRAY['buyer']
      ELSE contacts.tags
    END,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_capture_contact_purchase ON product_purchases;
CREATE TRIGGER trg_auto_capture_contact_purchase
  AFTER INSERT OR UPDATE ON product_purchases
  FOR EACH ROW
  EXECUTE FUNCTION auto_capture_contact_on_purchase();

CREATE OR REPLACE FUNCTION public.auto_capture_contact_on_donation()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _email text;
  _name text;
BEGIN
  IF NEW.status != 'completed' THEN RETURN NEW; END IF;
  
  _email := COALESCE(NEW.donor_email, '');
  _name := COALESCE(NEW.donor_name, '');
  
  IF _email = '' THEN RETURN NEW; END IF;

  INSERT INTO public.contacts (organization_id, email, name, source, tags)
  VALUES (
    NEW.organization_id,
    _email,
    NULLIF(_name, ''),
    'donation',
    ARRAY['donor']
  )
  ON CONFLICT (organization_id, email) DO UPDATE SET
    name = COALESCE(NULLIF(EXCLUDED.name, ''), contacts.name),
    tags = CASE
      WHEN NOT (contacts.tags @> ARRAY['donor']) THEN contacts.tags || ARRAY['donor']
      ELSE contacts.tags
    END,
    updated_at = now();

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_capture_contact_donation ON donations;
CREATE TRIGGER trg_auto_capture_contact_donation
  AFTER INSERT OR UPDATE ON donations
  FOR EACH ROW
  EXECUTE FUNCTION auto_capture_contact_on_donation();

-- ═══════════════════════════════════════════════════════════
-- 2. Auto badge attribution on sales milestones
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.auto_award_badges_on_sale()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _badge record;
  _count bigint;
BEGIN
  IF NEW.status != 'completed' THEN RETURN NEW; END IF;

  -- Count total completed sales for this org
  SELECT COUNT(*) INTO _count
  FROM product_purchases
  WHERE organization_id = NEW.organization_id AND status = 'completed';

  -- Check all active badges for this org with condition_type = 'sales_count'
  FOR _badge IN
    SELECT id, condition_value FROM badges
    WHERE organization_id = NEW.organization_id
      AND is_active = true
      AND condition_type = 'sales_count'
      AND condition_value <= _count
  LOOP
    -- Award to org owner if not already awarded
    INSERT INTO user_badges (user_id, badge_id, organization_id)
    SELECT o.owner_id, _badge.id, NEW.organization_id
    FROM organizations o
    WHERE o.id = NEW.organization_id
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_award_badges_on_sale ON product_purchases;
CREATE TRIGGER trg_auto_award_badges_on_sale
  AFTER INSERT OR UPDATE ON product_purchases
  FOR EACH ROW
  EXECUTE FUNCTION auto_award_badges_on_sale();

-- ═══════════════════════════════════════════════════════════  
-- 3. Auto badge for affiliate milestones
-- ═══════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION public.auto_award_badges_on_affiliate()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _badge record;
  _count bigint;
BEGIN
  -- Count conversions for this affiliate
  SELECT COALESCE(SUM(conversions), 0) INTO _count
  FROM affiliate_links
  WHERE user_id = NEW.affiliate_user_id AND organization_id = NEW.organization_id;

  FOR _badge IN
    SELECT id, condition_value FROM badges
    WHERE organization_id = NEW.organization_id
      AND is_active = true
      AND condition_type = 'affiliate_conversions'
      AND condition_value <= _count
  LOOP
    INSERT INTO user_badges (user_id, badge_id, organization_id)
    VALUES (NEW.affiliate_user_id, _badge.id, NEW.organization_id)
    ON CONFLICT DO NOTHING;
  END LOOP;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_auto_award_badges_on_affiliate ON affiliate_sales;
CREATE TRIGGER trg_auto_award_badges_on_affiliate
  AFTER INSERT ON affiliate_sales
  FOR EACH ROW
  EXECUTE FUNCTION auto_award_badges_on_affiliate();

-- ═══════════════════════════════════════════════════════════
-- 4. Unique constraint on contacts for upsert
-- ═══════════════════════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contacts_org_email_unique'
  ) THEN
    ALTER TABLE public.contacts ADD CONSTRAINT contacts_org_email_unique UNIQUE (organization_id, email);
  END IF;
END $$;

-- ═══════════════════════════════════════════════════════════
-- 5. Review request email — add J+3 flag column to purchases
-- ═══════════════════════════════════════════════════════════
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_schema = 'public' AND table_name = 'product_purchases' AND column_name = 'review_request_sent'
  ) THEN
    ALTER TABLE public.product_purchases ADD COLUMN review_request_sent boolean DEFAULT false;
  END IF;
END $$;