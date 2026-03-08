-- Fix get_platform_totals: better conversion rate + add program/subscription stats
CREATE OR REPLACE FUNCTION public.get_platform_totals()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _result jsonb;
  _don_gmv numeric; _don_fees numeric; _don_aff numeric; _don_org numeric; _don_count bigint; _don_all bigint;
  _pur_gmv numeric; _pur_fees numeric; _pur_aff numeric; _pur_org numeric; _pur_count bigint; _pur_all bigint;
  _total_orgs bigint; _active_orgs bigint; _suspended_orgs bigint;
  _total_users bigint; _total_members bigint;
  _total_products bigint; _published_products bigint;
  _total_campaigns bigint; _active_campaigns bigint;
  _total_media bigint; _total_views bigint; _total_likes bigint; _total_events bigint;
  _pending_kyc bigint; _approved_kyc bigint;
  _pending_payouts bigint; _pending_payout_amount numeric;
  _pending_reports bigint; _aff_commissions numeric;
  _new_users_7d bigint; _new_orgs_7d bigint;
  _campaign_goal numeric; _campaign_raised numeric;
  _total_enrollments bigint; _active_programs bigint;
  _total_push_subs bigint; _total_contacts bigint;
  _total_affiliate_links bigint; _active_affiliate_links bigint;
  _total_email_campaigns bigint;
BEGIN
  SELECT COALESCE(SUM(amount), 0), COALESCE(SUM(platform_fee), 0),
         COALESCE(SUM(affiliate_commission), 0), COALESCE(SUM(organization_amount), 0), COUNT(*)
  INTO _don_gmv, _don_fees, _don_aff, _don_org, _don_count
  FROM donations WHERE status = 'completed';
  SELECT COUNT(*) INTO _don_all FROM donations;

  SELECT COALESCE(SUM(amount), 0), COALESCE(SUM(platform_fee), 0),
         COALESCE(SUM(affiliate_commission), 0), COALESCE(SUM(organization_amount), 0), COUNT(*)
  INTO _pur_gmv, _pur_fees, _pur_aff, _pur_org, _pur_count
  FROM product_purchases WHERE status = 'completed';
  SELECT COUNT(*) INTO _pur_all FROM product_purchases;

  SELECT COUNT(*) INTO _total_orgs FROM organizations;
  SELECT COUNT(*) INTO _active_orgs FROM organizations WHERE is_active = true AND (is_suspended IS NULL OR is_suspended = false);
  SELECT COUNT(*) INTO _suspended_orgs FROM organizations WHERE is_suspended = true;
  SELECT COUNT(*) INTO _total_users FROM profiles;
  SELECT COUNT(*) INTO _total_members FROM organization_members;
  SELECT COUNT(*) INTO _total_products FROM digital_products;
  SELECT COUNT(*) INTO _published_products FROM digital_products WHERE is_published = true;
  SELECT COUNT(*) INTO _total_campaigns FROM donation_campaigns;
  SELECT COUNT(*), COALESCE(SUM(goal_amount), 0), COALESCE(SUM(current_amount), 0)
  INTO _active_campaigns, _campaign_goal, _campaign_raised
  FROM donation_campaigns WHERE is_active = true;
  SELECT COUNT(*), COALESCE(SUM(view_count), 0), COALESCE(SUM(like_count), 0)
  INTO _total_media, _total_views, _total_likes FROM media_content;
  SELECT COUNT(*) INTO _total_events FROM events;
  SELECT COUNT(*) INTO _pending_kyc FROM kyc_submissions WHERE status = 'pending';
  SELECT COUNT(*) INTO _approved_kyc FROM kyc_submissions WHERE status = 'approved';
  SELECT COUNT(*), COALESCE(SUM(amount), 0) INTO _pending_payouts, _pending_payout_amount
  FROM payout_requests WHERE status = 'requested';
  SELECT COUNT(*) INTO _pending_reports FROM content_reports WHERE status = 'pending';
  SELECT COALESCE(SUM(commission_amount), 0) INTO _aff_commissions FROM affiliate_sales;
  SELECT COUNT(*) INTO _new_users_7d FROM profiles WHERE created_at >= (now() - interval '7 days');
  SELECT COUNT(*) INTO _new_orgs_7d FROM organizations WHERE created_at >= (now() - interval '7 days');
  
  -- New stats
  SELECT COUNT(*) INTO _total_enrollments FROM program_enrollments;
  SELECT COUNT(*) INTO _active_programs FROM programs WHERE is_published = true;
  SELECT COUNT(*) INTO _total_push_subs FROM push_subscriptions;
  SELECT COUNT(*) INTO _total_contacts FROM contacts WHERE is_subscribed = true;
  SELECT COUNT(*), COUNT(*) FILTER (WHERE is_active = true)
  INTO _total_affiliate_links, _active_affiliate_links FROM affiliate_links;
  SELECT COUNT(*) INTO _total_email_campaigns FROM email_campaigns;

  _result := jsonb_build_object(
    'gmv', _don_gmv + _pur_gmv,
    'donation_gmv', _don_gmv,
    'purchase_gmv', _pur_gmv,
    'platform_fees', _don_fees + _pur_fees,
    'affiliate_commissions', _aff_commissions,
    'org_received', _don_org + _pur_org,
    'total_transactions', _don_count + _pur_count,
    'all_transactions', _don_all + _pur_all,
    'total_orgs', _total_orgs,
    'active_orgs', _active_orgs,
    'suspended_orgs', _suspended_orgs,
    'total_users', _total_users,
    'total_members', _total_members,
    'total_products', _total_products,
    'published_products', _published_products,
    'total_campaigns', _total_campaigns,
    'active_campaigns', _active_campaigns,
    'total_media', _total_media,
    'total_views', _total_views,
    'total_likes', _total_likes,
    'total_events', _total_events,
    'pending_kyc', _pending_kyc,
    'approved_kyc', _approved_kyc,
    'pending_payouts', _pending_payouts,
    'pending_payout_amount', _pending_payout_amount,
    'pending_reports', _pending_reports,
    'new_users_7d', _new_users_7d,
    'new_orgs_7d', _new_orgs_7d,
    'campaign_goal', _campaign_goal,
    'campaign_raised', _campaign_raised,
    'take_rate', CASE WHEN (_don_gmv + _pur_gmv) > 0 
      THEN ROUND(((_don_fees + _pur_fees) / (_don_gmv + _pur_gmv)) * 100, 1) 
      ELSE 0 END,
    'conversion_rate', CASE WHEN (_don_all + _pur_all) > 0 
      THEN ROUND(((_don_count + _pur_count)::numeric / (_don_all + _pur_all)) * 100, 0) 
      ELSE 0 END,
    'total_enrollments', _total_enrollments,
    'active_programs', _active_programs,
    'total_push_subs', _total_push_subs,
    'total_contacts', _total_contacts,
    'total_affiliate_links', _total_affiliate_links,
    'active_affiliate_links', _active_affiliate_links,
    'total_email_campaigns', _total_email_campaigns
  );
  RETURN _result;
END;
$$;

-- Weekly user cohorts for the last 8 weeks
CREATE OR REPLACE FUNCTION public.get_weekly_user_cohorts(_weeks integer DEFAULT 8)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('week', week_start, 'users', cnt) ORDER BY week_start), '[]'::jsonb)
    FROM (
      SELECT date_trunc('week', created_at)::date as week_start, COUNT(*) as cnt
      FROM profiles
      WHERE created_at >= (now() - (_weeks || ' weeks')::interval)
      GROUP BY week_start
      ORDER BY week_start
    ) sub
  );
END;
$$;