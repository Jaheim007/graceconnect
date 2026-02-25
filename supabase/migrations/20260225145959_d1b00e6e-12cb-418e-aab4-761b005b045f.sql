-- Update delete_organization function to remove org_messages reference
CREATE OR REPLACE FUNCTION public.delete_organization(_org_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  _caller uuid;
  _org record;
  _total_donations numeric := 0;
  _total_purchases numeric := 0;
  _donor_count integer := 0;
  _member_ids uuid[];
  _member_id uuid;
BEGIN
  _caller := auth.uid();
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  SELECT * INTO _org FROM public.organizations WHERE id = _org_id;
  IF _org IS NULL THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;
  IF _org.owner_id != _caller AND NOT public.is_superadmin(_caller) THEN
    RAISE EXCEPTION 'Only the owner or superadmin can delete this organization';
  END IF;

  SELECT array_agg(user_id) INTO _member_ids
  FROM public.organization_members
  WHERE organization_id = _org_id AND user_id != _caller;

  SELECT COALESCE(SUM(amount), 0), COUNT(*)
  INTO _total_donations, _donor_count
  FROM public.donations
  WHERE organization_id = _org_id AND status = 'completed';

  SELECT COALESCE(SUM(amount), 0)
  INTO _total_purchases
  FROM public.product_purchases
  WHERE organization_id = _org_id AND status = 'completed';

  DELETE FROM public.affiliate_sales WHERE organization_id = _org_id;
  DELETE FROM public.affiliate_links WHERE organization_id = _org_id;
  DELETE FROM public.payout_requests WHERE organization_id = _org_id;
  DELETE FROM public.fraud_flags WHERE organization_id = _org_id;
  DELETE FROM public.kyc_submissions WHERE organization_id = _org_id;
  DELETE FROM public.promo_codes WHERE organization_id = _org_id;
  DELETE FROM public.product_purchases WHERE organization_id = _org_id;
  DELETE FROM public.digital_products WHERE organization_id = _org_id;
  DELETE FROM public.donations WHERE organization_id = _org_id;
  DELETE FROM public.donation_campaigns WHERE organization_id = _org_id;

  DELETE FROM public.lesson_progress WHERE lesson_id IN (
    SELECT pl.id FROM public.program_lessons pl
    JOIN public.program_modules pm ON pm.id = pl.module_id
    JOIN public.programs p ON p.id = pm.program_id
    WHERE p.organization_id = _org_id
  );
  DELETE FROM public.program_enrollments WHERE program_id IN (
    SELECT id FROM public.programs WHERE organization_id = _org_id
  );
  DELETE FROM public.program_lessons WHERE module_id IN (
    SELECT pm.id FROM public.program_modules pm
    JOIN public.programs p ON p.id = pm.program_id
    WHERE p.organization_id = _org_id
  );
  DELETE FROM public.program_modules WHERE program_id IN (
    SELECT id FROM public.programs WHERE organization_id = _org_id
  );
  DELETE FROM public.programs WHERE organization_id = _org_id;

  DELETE FROM public.media_likes WHERE organization_id = _org_id;
  DELETE FROM public.media_saves WHERE organization_id = _org_id;
  DELETE FROM public.media_content WHERE organization_id = _org_id;
  DELETE FROM public.org_photos WHERE organization_id = _org_id;
  DELETE FROM public.events WHERE organization_id = _org_id;
  DELETE FROM public.announcements WHERE organization_id = _org_id;
  DELETE FROM public.contacts WHERE organization_id = _org_id;
  DELETE FROM public.email_campaigns WHERE organization_id = _org_id;
  DELETE FROM public.content_reports WHERE organization_id = _org_id;
  DELETE FROM public.push_subscriptions WHERE organization_id = _org_id;
  DELETE FROM public.user_notifications WHERE organization_id = _org_id;
  DELETE FROM public.org_daily_metrics WHERE organization_id = _org_id;
  DELETE FROM public.audit_logs WHERE organization_id = _org_id;
  DELETE FROM public.organization_members WHERE organization_id = _org_id;
  DELETE FROM public.organizations WHERE id = _org_id;

  IF _member_ids IS NOT NULL THEN
    FOREACH _member_id IN ARRAY _member_ids LOOP
      INSERT INTO public.user_notifications (user_id, title, body, notification_type)
      VALUES (
        _member_id,
        '🏢 Organisation supprimée',
        'L''organisation "' || _org.name || '" a été supprimée par son propriétaire. Si vous aviez des dons ou achats en cours, vous serez contacté pour un éventuel remboursement.',
        'system'
      );
    END LOOP;
  END IF;

  RETURN jsonb_build_object(
    'deleted', true,
    'org_name', _org.name,
    'total_donations_amount', _total_donations,
    'donor_count', _donor_count,
    'total_purchases_amount', _total_purchases,
    'members_notified', COALESCE(array_length(_member_ids, 1), 0)
  );
END;
$function$;
