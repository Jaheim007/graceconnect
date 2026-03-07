
-- Notify all active ambassadors when a high-commission product is published
CREATE OR REPLACE FUNCTION public.notify_ambassadors_on_product_publish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _org record;
  _commission integer;
BEGIN
  -- Only fire when is_published changes to true
  IF NOT (NEW.is_published = true AND (OLD IS NULL OR OLD.is_published IS DISTINCT FROM true)) THEN
    RETURN NEW;
  END IF;

  -- Get org info
  SELECT id, name, slug, affiliation_enabled, affiliation_commission_percent
  INTO _org
  FROM public.organizations
  WHERE id = NEW.organization_id;

  -- Only if affiliation is enabled
  IF NOT COALESCE(_org.affiliation_enabled, false) THEN
    RETURN NEW;
  END IF;

  _commission := COALESCE(_org.affiliation_commission_percent, 10);

  -- Notify all active ambassadors of this org
  INSERT INTO public.user_notifications (user_id, title, body, notification_type, action_url, organization_id)
  SELECT DISTINCT al.user_id,
    '🆕 Nouveau produit à promouvoir !',
    '"' || NEW.title || '" — ' || _commission || '% de commission. Partage-le maintenant !',
    'new_product_affiliate',
    '/gagner',
    NEW.organization_id
  FROM public.affiliate_links al
  WHERE al.organization_id = NEW.organization_id
    AND al.is_active = true
    AND al.user_id != COALESCE(NEW.created_by, '00000000-0000-0000-0000-000000000000'::uuid);

  -- If commission >= 15%, also notify ALL ambassadors platform-wide (not just this org's)
  IF _commission >= 15 THEN
    INSERT INTO public.user_notifications (user_id, title, body, notification_type, action_url)
    SELECT DISTINCT al.user_id,
      '💰 Produit à forte commission !',
      '"' || NEW.title || '" par ' || _org.name || ' — ' || _commission || '% de commission !',
      'high_commission_product',
      '/gagner'
    FROM public.affiliate_links al
    WHERE al.organization_id != NEW.organization_id
      AND al.is_active = true
      AND al.user_id != COALESCE(NEW.created_by, '00000000-0000-0000-0000-000000000000'::uuid)
      AND NOT EXISTS (
        SELECT 1 FROM public.user_notifications un
        WHERE un.user_id = al.user_id
          AND un.notification_type = 'high_commission_product'
          AND un.created_at > now() - interval '1 hour'
      );
  END IF;

  RETURN NEW;
END;
$$;

-- Attach trigger
DROP TRIGGER IF EXISTS trg_notify_ambassadors_product_publish ON public.digital_products;
CREATE TRIGGER trg_notify_ambassadors_product_publish
  AFTER UPDATE ON public.digital_products
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_ambassadors_on_product_publish();
