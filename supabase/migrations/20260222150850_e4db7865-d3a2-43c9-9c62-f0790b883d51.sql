
-- Create a comprehensive delete_organization function
-- that handles all FK constraints in the correct order,
-- notifies members, and records donation refund info.

CREATE OR REPLACE FUNCTION public.delete_organization(_org_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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

  -- Fetch org and verify ownership or superadmin
  SELECT * INTO _org FROM public.organizations WHERE id = _org_id;
  IF _org IS NULL THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;
  IF _org.owner_id != _caller AND NOT public.is_superadmin(_caller) THEN
    RAISE EXCEPTION 'Only the owner or superadmin can delete this organization';
  END IF;

  -- Collect member IDs for notifications (exclude owner)
  SELECT array_agg(user_id) INTO _member_ids
  FROM public.organization_members
  WHERE organization_id = _org_id AND user_id != _caller;

  -- Calculate totals for reporting
  SELECT COALESCE(SUM(amount), 0), COUNT(*)
  INTO _total_donations, _donor_count
  FROM public.donations
  WHERE organization_id = _org_id AND status = 'completed';

  SELECT COALESCE(SUM(amount), 0)
  INTO _total_purchases
  FROM public.product_purchases
  WHERE organization_id = _org_id AND status = 'completed';

  -- 1. Delete affiliate_sales FIRST (references affiliate_links)
  DELETE FROM public.affiliate_sales WHERE organization_id = _org_id;

  -- 2. Delete affiliate_links
  DELETE FROM public.affiliate_links WHERE organization_id = _org_id;

  -- 3. Delete payout_requests
  DELETE FROM public.payout_requests WHERE organization_id = _org_id;

  -- 4. Delete fraud_flags
  DELETE FROM public.fraud_flags WHERE organization_id = _org_id;

  -- 5. Delete KYC submissions
  DELETE FROM public.kyc_submissions WHERE organization_id = _org_id;

  -- 6. Delete promo codes
  DELETE FROM public.promo_codes WHERE organization_id = _org_id;

  -- 7. Delete product purchases (references digital_products & promo_codes)
  DELETE FROM public.product_purchases WHERE organization_id = _org_id;

  -- 8. Delete digital products
  DELETE FROM public.digital_products WHERE organization_id = _org_id;

  -- 9. Delete donations (references donation_campaigns & promo_codes)
  DELETE FROM public.donations WHERE organization_id = _org_id;

  -- 10. Delete donation campaigns
  DELETE FROM public.donation_campaigns WHERE organization_id = _org_id;

  -- 11. Delete lesson_progress for this org's programs
  DELETE FROM public.lesson_progress WHERE lesson_id IN (
    SELECT pl.id FROM public.program_lessons pl
    JOIN public.program_modules pm ON pm.id = pl.module_id
    JOIN public.programs p ON p.id = pm.program_id
    WHERE p.organization_id = _org_id
  );

  -- 12. Delete program enrollments
  DELETE FROM public.program_enrollments WHERE program_id IN (
    SELECT id FROM public.programs WHERE organization_id = _org_id
  );

  -- 13. Delete program lessons
  DELETE FROM public.program_lessons WHERE module_id IN (
    SELECT pm.id FROM public.program_modules pm
    JOIN public.programs p ON p.id = pm.program_id
    WHERE p.organization_id = _org_id
  );

  -- 14. Delete program modules
  DELETE FROM public.program_modules WHERE program_id IN (
    SELECT id FROM public.programs WHERE organization_id = _org_id
  );

  -- 15. Delete programs
  DELETE FROM public.programs WHERE organization_id = _org_id;

  -- 16. Delete media likes & saves
  DELETE FROM public.media_likes WHERE organization_id = _org_id;
  DELETE FROM public.media_saves WHERE organization_id = _org_id;

  -- 17. Delete media content
  DELETE FROM public.media_content WHERE organization_id = _org_id;

  -- 18. Delete org photos
  DELETE FROM public.org_photos WHERE organization_id = _org_id;

  -- 19. Delete events
  DELETE FROM public.events WHERE organization_id = _org_id;

  -- 20. Delete announcements
  DELETE FROM public.announcements WHERE organization_id = _org_id;

  -- 21. Delete contacts & email campaigns
  DELETE FROM public.contacts WHERE organization_id = _org_id;
  DELETE FROM public.email_campaigns WHERE organization_id = _org_id;

  -- 22. Delete content reports
  DELETE FROM public.content_reports WHERE organization_id = _org_id;

  -- 23. Delete push subscriptions
  DELETE FROM public.push_subscriptions WHERE organization_id = _org_id;

  -- 24. Delete notifications for this org
  DELETE FROM public.user_notifications WHERE organization_id = _org_id;

  -- 25. Delete org daily metrics
  DELETE FROM public.org_daily_metrics WHERE organization_id = _org_id;

  -- 26. Delete audit logs
  DELETE FROM public.audit_logs WHERE organization_id = _org_id;

  -- 27. Delete organization members
  DELETE FROM public.organization_members WHERE organization_id = _org_id;

  -- 28. Finally delete the organization itself
  DELETE FROM public.organizations WHERE id = _org_id;

  -- 29. Notify members that the org was deleted & about refunds
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

  -- Return summary
  RETURN jsonb_build_object(
    'deleted', true,
    'org_name', _org.name,
    'total_donations_amount', _total_donations,
    'donor_count', _donor_count,
    'total_purchases_amount', _total_purchases,
    'members_notified', COALESCE(array_length(_member_ids, 1), 0)
  );
END;
$$;
