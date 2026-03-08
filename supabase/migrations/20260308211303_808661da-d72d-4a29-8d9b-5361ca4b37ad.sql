
-- ═══════════════════════════════════════════════════════════════
-- MASSIVE TRANSFORMATION MIGRATION
-- Covers: CRM auto-capture, badge attribution, testimonials table,
-- changelog entries table, featured_score rotation, webhook dispatch,
-- review request tracking, onboarding persistence
-- ═══════════════════════════════════════════════════════════════

-- 1. TESTIMONIALS TABLE (dynamic testimonials from DB)
CREATE TABLE IF NOT EXISTS public.testimonials (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  name text NOT NULL,
  role text,
  text text NOT NULL,
  flag text DEFAULT '🌍',
  category text DEFAULT 'Général',
  highlight text,
  rating integer DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  is_approved boolean DEFAULT false,
  source_review_id uuid,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.testimonials ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read approved testimonials" ON public.testimonials FOR SELECT USING (is_approved = true);
CREATE POLICY "Superadmin manages testimonials" ON public.testimonials FOR ALL TO authenticated USING (public.is_superadmin(auth.uid()));

-- 2. CHANGELOG ENTRIES TABLE (dynamic changelog from DB)
CREATE TABLE IF NOT EXISTS public.changelog_entries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  version text NOT NULL,
  release_date date NOT NULL DEFAULT CURRENT_DATE,
  entry_type text NOT NULL DEFAULT 'feature' CHECK (entry_type IN ('feature', 'improvement', 'fix', 'security', 'design')),
  text text NOT NULL,
  created_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz DEFAULT now()
);
ALTER TABLE public.changelog_entries ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Anyone can read changelog" ON public.changelog_entries FOR SELECT USING (true);
CREATE POLICY "Superadmin manages changelog" ON public.changelog_entries FOR ALL TO authenticated USING (public.is_superadmin(auth.uid()));

-- 3. USER BADGES TABLE (for auto-attribution)
CREATE TABLE IF NOT EXISTS public.user_badges (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  badge_key text NOT NULL,
  badge_label text NOT NULL,
  badge_icon text DEFAULT '🏆',
  awarded_at timestamptz DEFAULT now(),
  UNIQUE(user_id, badge_key)
);
ALTER TABLE public.user_badges ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users can read own badges" ON public.user_badges FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "System inserts badges" ON public.user_badges FOR INSERT WITH CHECK (true);

-- 4. CRM AUTO-CAPTURE TRIGGER
CREATE OR REPLACE FUNCTION public.auto_capture_crm_contact()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _email text;
  _name text;
  _org_id uuid;
  _source text;
BEGIN
  -- Determine source based on table
  IF TG_TABLE_NAME = 'product_purchases' THEN
    _email := NEW.buyer_email;
    _name := NEW.buyer_name;
    _org_id := NEW.organization_id;
    _source := 'purchase';
  ELSIF TG_TABLE_NAME = 'donations' THEN
    _email := NEW.donor_email;
    _name := NEW.donor_name;
    _org_id := NEW.organization_id;
    _source := 'donation';
  ELSE
    RETURN NEW;
  END IF;

  -- Skip if no email
  IF _email IS NULL OR _email = '' THEN RETURN NEW; END IF;

  -- Upsert into contacts
  INSERT INTO public.contacts (email, name, organization_id, source, tags, is_subscribed)
  VALUES (_email, _name, _org_id, _source, ARRAY[_source], true)
  ON CONFLICT (email, organization_id) DO UPDATE SET
    name = COALESCE(EXCLUDED.name, contacts.name),
    tags = CASE
      WHEN NOT (contacts.tags @> ARRAY[_source]) THEN contacts.tags || ARRAY[_source]
      ELSE contacts.tags
    END,
    updated_at = now();

  RETURN NEW;
END;
$$;

-- Add unique constraint if not exists (needed for upsert)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contacts_email_org_unique'
  ) THEN
    ALTER TABLE public.contacts ADD CONSTRAINT contacts_email_org_unique UNIQUE (email, organization_id);
  END IF;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

CREATE OR REPLACE TRIGGER trg_crm_capture_purchase
  AFTER INSERT ON public.product_purchases
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION public.auto_capture_crm_contact();

CREATE OR REPLACE TRIGGER trg_crm_capture_donation
  AFTER INSERT ON public.donations
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION public.auto_capture_crm_contact();

-- 5. BADGE AUTO-ATTRIBUTION TRIGGER
CREATE OR REPLACE FUNCTION public.auto_award_badge()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _user_id uuid;
  _count integer;
  _badge_key text;
  _badge_label text;
  _badge_icon text;
BEGIN
  -- Determine user and count based on source
  IF TG_TABLE_NAME = 'affiliate_sales' THEN
    _user_id := NEW.affiliate_user_id;
    SELECT COUNT(*) INTO _count FROM public.affiliate_sales WHERE affiliate_user_id = _user_id;
    
    IF _count = 1 THEN _badge_key := 'first_sale'; _badge_label := 'Première vente'; _badge_icon := '🎯';
    ELSIF _count = 5 THEN _badge_key := '5_sales'; _badge_label := '5 ventes'; _badge_icon := '🔥';
    ELSIF _count = 10 THEN _badge_key := '10_sales'; _badge_label := '10 ventes'; _badge_icon := '⚡';
    ELSIF _count = 50 THEN _badge_key := '50_sales'; _badge_label := '50 ventes'; _badge_icon := '💎';
    ELSIF _count = 100 THEN _badge_key := '100_sales'; _badge_label := '100 ventes'; _badge_icon := '👑';
    ELSE RETURN NEW;
    END IF;
  ELSIF TG_TABLE_NAME = 'product_purchases' THEN
    _user_id := NEW.user_id;
    IF _user_id IS NULL THEN RETURN NEW; END IF;
    SELECT COUNT(*) INTO _count FROM public.product_purchases WHERE user_id = _user_id AND status = 'completed';
    
    IF _count = 1 THEN _badge_key := 'first_purchase'; _badge_label := 'Premier achat'; _badge_icon := '🛒';
    ELSIF _count = 5 THEN _badge_key := '5_purchases'; _badge_label := '5 achats'; _badge_icon := '🎁';
    ELSIF _count = 10 THEN _badge_key := '10_purchases'; _badge_label := '10 achats'; _badge_icon := '🌟';
    ELSE RETURN NEW;
    END IF;
  ELSE
    RETURN NEW;
  END IF;

  -- Insert badge (ignore if already exists)
  INSERT INTO public.user_badges (user_id, badge_key, badge_label, badge_icon)
  VALUES (_user_id, _badge_key, _badge_label, _badge_icon)
  ON CONFLICT (user_id, badge_key) DO NOTHING;

  -- Notify user
  INSERT INTO public.user_notifications (user_id, title, body, notification_type, action_url)
  VALUES (
    _user_id,
    _badge_icon || ' Badge débloqué !',
    'Félicitations ! Tu as obtenu le badge "' || _badge_label || '" 🎉',
    'badge_awarded',
    '/feed'
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_badge_affiliate_sale
  AFTER INSERT ON public.affiliate_sales
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_award_badge();

CREATE OR REPLACE TRIGGER trg_badge_purchase
  AFTER INSERT ON public.product_purchases
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION public.auto_award_badge();

-- 6. FEATURED SCORE ROTATION FUNCTION
CREATE OR REPLACE FUNCTION public.recalculate_featured_scores()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _count integer := 0;
BEGIN
  -- Score = (sales_count * 3) + (review_count * 2) + (average_rating * 10) + recency bonus
  UPDATE public.digital_products
  SET featured_score = (
    COALESCE(sales_count, 0) * 3 +
    COALESCE(review_count, 0) * 2 +
    COALESCE(average_rating, 0) * 10 +
    GREATEST(0, 30 - EXTRACT(DAY FROM now() - COALESCE(updated_at, created_at)))
  )
  WHERE is_published = true;
  
  GET DIAGNOSTICS _count = ROW_COUNT;
  RETURN _count;
END;
$$;

-- 7. WEBHOOK DISPATCH FUNCTION  
CREATE OR REPLACE FUNCTION public.dispatch_org_webhook()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _webhook_url text;
  _event_type text;
  _payload jsonb;
BEGIN
  -- Get org webhook URL
  SELECT webhook_url INTO _webhook_url 
  FROM public.organizations 
  WHERE id = NEW.organization_id AND webhook_url IS NOT NULL AND webhook_url != '';
  
  IF _webhook_url IS NULL THEN RETURN NEW; END IF;

  -- Determine event type
  IF TG_TABLE_NAME = 'product_purchases' THEN
    _event_type := 'purchase.completed';
    _payload := jsonb_build_object(
      'event', _event_type,
      'data', jsonb_build_object(
        'id', NEW.id, 'amount', NEW.amount, 'currency', NEW.currency,
        'product_id', NEW.product_id, 'buyer_email', NEW.buyer_email,
        'status', NEW.status, 'created_at', NEW.created_at
      )
    );
  ELSIF TG_TABLE_NAME = 'donations' THEN
    _event_type := 'donation.completed';
    _payload := jsonb_build_object(
      'event', _event_type,
      'data', jsonb_build_object(
        'id', NEW.id, 'amount', NEW.amount, 'currency', NEW.currency,
        'campaign_id', NEW.campaign_id, 'donor_email', NEW.donor_email,
        'status', NEW.status, 'created_at', NEW.created_at
      )
    );
  ELSIF TG_TABLE_NAME = 'organization_members' THEN
    _event_type := 'member.joined';
    _payload := jsonb_build_object(
      'event', _event_type,
      'data', jsonb_build_object(
        'user_id', NEW.user_id, 'role', NEW.role, 'organization_id', NEW.organization_id
      )
    );
  ELSE
    RETURN NEW;
  END IF;

  -- Fire and forget via pg_net
  PERFORM net.http_post(
    url := _webhook_url,
    headers := '{"Content-Type": "application/json"}'::jsonb,
    body := _payload
  );

  RETURN NEW;
END;
$$;

CREATE OR REPLACE TRIGGER trg_webhook_purchase
  AFTER INSERT ON public.product_purchases
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION public.dispatch_org_webhook();

CREATE OR REPLACE TRIGGER trg_webhook_donation
  AFTER INSERT ON public.donations
  FOR EACH ROW
  WHEN (NEW.status = 'completed')
  EXECUTE FUNCTION public.dispatch_org_webhook();

CREATE OR REPLACE TRIGGER trg_webhook_member
  AFTER INSERT ON public.organization_members
  FOR EACH ROW
  EXECUTE FUNCTION public.dispatch_org_webhook();

-- 8. EMAIL REVIEW REQUEST TRACKING
CREATE TABLE IF NOT EXISTS public.review_request_sent (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  purchase_id uuid NOT NULL UNIQUE,
  sent_at timestamptz DEFAULT now()
);
ALTER TABLE public.review_request_sent ENABLE ROW LEVEL SECURITY;
CREATE POLICY "System only" ON public.review_request_sent FOR ALL USING (false);
