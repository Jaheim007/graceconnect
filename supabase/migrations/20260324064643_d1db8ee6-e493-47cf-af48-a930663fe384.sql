DROP FUNCTION IF EXISTS public.get_platform_totals();

CREATE FUNCTION public.get_platform_totals()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'total_orgs', (SELECT count(*) FROM organizations),
    'active_orgs', (SELECT count(*) FROM organizations WHERE NOT (is_suspended IS TRUE)),
    'suspended_orgs', (SELECT count(*) FROM organizations WHERE is_suspended IS TRUE),
    'total_members', (SELECT count(*) FROM organization_members),
    'total_users', (SELECT count(*) FROM profiles),
    'gmv', (
      COALESCE((SELECT sum(amount) FROM donations WHERE status = 'completed'), 0) +
      COALESCE((SELECT sum(amount) FROM product_purchases WHERE status = 'completed'), 0) +
      COALESCE((SELECT sum(price_amount) FROM credit_purchases WHERE status = 'completed'), 0)
    ),
    'donation_gmv', COALESCE((SELECT sum(amount) FROM donations WHERE status = 'completed'), 0),
    'purchase_gmv', COALESCE((SELECT sum(amount) FROM product_purchases WHERE status = 'completed'), 0),
    'credit_gmv', COALESCE((SELECT sum(price_amount) FROM credit_purchases WHERE status = 'completed'), 0),
    'credit_count', (SELECT count(*) FROM credit_purchases WHERE status = 'completed'),
    'platform_fees_sales', (
      COALESCE((SELECT sum(COALESCE(platform_fee, 0)) FROM donations WHERE status = 'completed'), 0) +
      COALESCE((SELECT sum(COALESCE(platform_fee, 0)) FROM product_purchases WHERE status = 'completed'), 0)
    ),
    'platform_fees', (
      COALESCE((SELECT sum(COALESCE(platform_fee, 0)) FROM donations WHERE status = 'completed'), 0) +
      COALESCE((SELECT sum(COALESCE(platform_fee, 0)) FROM product_purchases WHERE status = 'completed'), 0) +
      COALESCE((SELECT sum(price_amount) FROM credit_purchases WHERE status = 'completed'), 0)
    ),
    'affiliate_commissions', (
      COALESCE((SELECT sum(COALESCE(affiliate_commission, 0)) FROM product_purchases WHERE status = 'completed'), 0) +
      COALESCE((SELECT sum(COALESCE(affiliate_commission, 0)) FROM donations WHERE status = 'completed'), 0)
    ),
    'org_received', (
      COALESCE((SELECT sum(COALESCE(organization_amount, 0)) FROM donations WHERE status = 'completed'), 0) +
      COALESCE((SELECT sum(COALESCE(organization_amount, 0)) FROM product_purchases WHERE status = 'completed'), 0)
    ),
    'take_rate', CASE
      WHEN (COALESCE((SELECT sum(amount) FROM donations WHERE status = 'completed'), 0) +
            COALESCE((SELECT sum(amount) FROM product_purchases WHERE status = 'completed'), 0)) > 0
      THEN round(
        (COALESCE((SELECT sum(COALESCE(platform_fee, 0)) FROM donations WHERE status = 'completed'), 0) +
         COALESCE((SELECT sum(COALESCE(platform_fee, 0)) FROM product_purchases WHERE status = 'completed'), 0))::numeric /
        (COALESCE((SELECT sum(amount) FROM donations WHERE status = 'completed'), 0) +
         COALESCE((SELECT sum(amount) FROM product_purchases WHERE status = 'completed'), 0))::numeric * 100, 1
      )
      ELSE 0
    END,
    'total_transactions', (
      (SELECT count(*) FROM donations WHERE status = 'completed') +
      (SELECT count(*) FROM product_purchases WHERE status = 'completed') +
      (SELECT count(*) FROM credit_purchases WHERE status = 'completed')
    ),
    'all_transactions', (
      (SELECT count(*) FROM donations) + (SELECT count(*) FROM product_purchases) + (SELECT count(*) FROM credit_purchases)
    ),
    'conversion_rate', CASE
      WHEN (SELECT count(*) FROM donations) + (SELECT count(*) FROM product_purchases) > 0
      THEN round(
        ((SELECT count(*) FROM donations WHERE status = 'completed') + (SELECT count(*) FROM product_purchases WHERE status = 'completed'))::numeric /
        ((SELECT count(*) FROM donations) + (SELECT count(*) FROM product_purchases))::numeric * 100, 1
      )
      ELSE 0
    END,
    'pending_kyc', (SELECT count(*) FROM kyc_submissions WHERE status = 'pending'),
    'approved_kyc', (SELECT count(*) FROM kyc_submissions WHERE status = 'approved'),
    'pending_reports', (SELECT count(*) FROM content_reports WHERE status = 'pending'),
    'pending_payouts', (SELECT count(*) FROM payout_requests WHERE status = 'pending'),
    'pending_payout_amount', COALESCE((SELECT sum(amount) FROM payout_requests WHERE status = 'pending'), 0),
    'new_orgs_7d', (SELECT count(*) FROM organizations WHERE created_at >= now() - interval '7 days'),
    'new_users_7d', (SELECT count(*) FROM profiles WHERE created_at >= now() - interval '7 days'),
    'total_products', (SELECT count(*) FROM digital_products),
    'published_products', (SELECT count(*) FROM digital_products WHERE is_published = true),
    'total_campaigns', (SELECT count(*) FROM donation_campaigns),
    'active_campaigns', (SELECT count(*) FROM donation_campaigns WHERE is_active = true),
    'total_media', (SELECT count(*) FROM media_content),
    'total_views', COALESCE((SELECT sum(view_count) FROM media_content), 0),
    'total_likes', COALESCE((SELECT sum(like_count) FROM media_content), 0),
    'total_events', (SELECT count(*) FROM events),
    'campaign_goal', COALESCE((SELECT sum(COALESCE(goal_amount, 0)) FROM donation_campaigns WHERE is_active = true), 0),
    'campaign_raised', COALESCE((SELECT sum(COALESCE(current_amount, 0)) FROM donation_campaigns WHERE is_active = true), 0),
    'total_enrollments', (SELECT count(*) FROM program_enrollments),
    'active_programs', (SELECT count(*) FROM programs WHERE is_published = true),
    'total_push_subs', (SELECT count(*) FROM push_subscriptions),
    'total_contacts', (SELECT count(*) FROM contacts),
    'total_affiliate_links', (SELECT count(*) FROM affiliate_links),
    'active_affiliate_links', (SELECT count(*) FROM affiliate_links WHERE is_active = true),
    'total_email_campaigns', (SELECT count(*) FROM email_campaigns)
  ) INTO result;

  RETURN result;
END;
$$;