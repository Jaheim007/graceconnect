
CREATE OR REPLACE FUNCTION public.notify_ambassadors_on_product_publish()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _org record;
  _commission integer;
  _potential_earning numeric;
  _is_high_value boolean := false;
BEGIN
  IF NOT (NEW.is_published = true AND (OLD IS NULL OR OLD.is_published IS DISTINCT FROM true)) THEN
    RETURN NEW;
  END IF;

  SELECT id, name, slug, affiliation_enabled, affiliation_commission_percent
  INTO _org
  FROM public.organizations
  WHERE id = NEW.organization_id;

  IF NOT COALESCE(_org.affiliation_enabled, false) THEN
    RETURN NEW;
  END IF;

  _commission := COALESCE(_org.affiliation_commission_percent, 10);
  _potential_earning := COALESCE(NEW.price, 0) * _commission / 100;

  _is_high_value := _commission >= 20 
    OR (_potential_earning >= 1000 AND COALESCE(NEW.currency, 'XOF') = 'XOF')
    OR (_potential_earning >= 2 AND COALESCE(NEW.currency, 'XOF') != 'XOF');

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

  IF _is_high_value THEN
    INSERT INTO public.user_notifications (user_id, title, body, notification_type, action_url)
    SELECT DISTINCT al.user_id,
      '💰 Produit à forte commission !',
      '"' || NEW.title || '" par ' || _org.name || ' — ' || _commission || '% de commission ! Tu peux gagner ' || 
        CASE WHEN COALESCE(NEW.currency, 'XOF') = 'XOF' THEN round(_potential_earning) || ' FCFA'
             ELSE round(_potential_earning, 2) || ' ' || COALESCE(NEW.currency, 'XOF')
        END || ' par vente.',
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
$function$;
