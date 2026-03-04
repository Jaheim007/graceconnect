-- Accurate platform-wide totals (bypasses 1000-row limit)
CREATE OR REPLACE FUNCTION public.get_platform_totals()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _result jsonb;
  _don_gmv numeric;
  _don_fees numeric;
  _don_aff numeric;
  _don_org numeric;
  _don_count bigint;
  _don_all bigint;
  _pur_gmv numeric;
  _pur_fees numeric;
  _pur_aff numeric;
  _pur_org numeric;
  _pur_count bigint;
  _pur_all bigint;
  _total_orgs bigint;
  _active_orgs bigint;
  _suspended_orgs bigint;
  _total_users bigint;
  _total_members bigint;
  _total_products bigint;
  _published_products bigint;
  _total_campaigns bigint;
  _active_campaigns bigint;
  _total_media bigint;
  _total_views bigint;
  _total_likes bigint;
  _total_events bigint;
  _pending_kyc bigint;
  _approved_kyc bigint;
  _pending_payouts bigint;
  _pending_payout_amount numeric;
  _pending_reports bigint;
  _aff_commissions numeric;
  _new_users_7d bigint;
  _new_orgs_7d bigint;
  _campaign_goal numeric;
  _campaign_raised numeric;
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
    'conversion_rate', CASE WHEN _don_all > 0 
      THEN ROUND((_don_count::numeric / _don_all) * 100, 0) 
      ELSE 0 END
  );
  RETURN _result;
END;
$$;

-- Transaction stats with optional date range
CREATE OR REPLACE FUNCTION public.get_transaction_stats(
  _from timestamptz DEFAULT NULL,
  _to timestamptz DEFAULT NULL
)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
DECLARE
  _don_gmv numeric; _don_fees numeric; _don_aff numeric; _don_count bigint;
  _pur_gmv numeric; _pur_fees numeric; _pur_aff numeric; _pur_count bigint;
BEGIN
  SELECT COALESCE(SUM(amount), 0), COALESCE(SUM(platform_fee), 0),
         COALESCE(SUM(affiliate_commission), 0), COUNT(*)
  INTO _don_gmv, _don_fees, _don_aff, _don_count
  FROM donations WHERE status = 'completed'
    AND (_from IS NULL OR created_at >= _from)
    AND (_to IS NULL OR created_at <= _to);

  SELECT COALESCE(SUM(amount), 0), COALESCE(SUM(platform_fee), 0),
         COALESCE(SUM(affiliate_commission), 0), COUNT(*)
  INTO _pur_gmv, _pur_fees, _pur_aff, _pur_count
  FROM product_purchases WHERE status = 'completed'
    AND (_from IS NULL OR created_at >= _from)
    AND (_to IS NULL OR created_at <= _to);

  RETURN jsonb_build_object(
    'gmv', _don_gmv + _pur_gmv,
    'platform_fees', _don_fees + _pur_fees,
    'affiliate_commissions', _don_aff + _pur_aff,
    'total_count', _don_count + _pur_count
  );
END;
$$;

-- Top orgs by revenue
CREATE OR REPLACE FUNCTION public.get_top_orgs_by_revenue(_limit integer DEFAULT 8)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(jsonb_agg(row_data ORDER BY revenue DESC), '[]'::jsonb)
    FROM (
      SELECT jsonb_build_object(
        'name', o.name, 'revenue', COALESCE(d.t, 0) + COALESCE(p.t, 0),
        'donations', COALESCE(d.t, 0), 'sales', COALESCE(p.t, 0)
      ) as row_data, COALESCE(d.t, 0) + COALESCE(p.t, 0) as revenue
      FROM organizations o
      LEFT JOIN (SELECT organization_id, SUM(amount) as t FROM donations WHERE status = 'completed' GROUP BY organization_id) d ON d.organization_id = o.id
      LEFT JOIN (SELECT organization_id, SUM(amount) as t FROM product_purchases WHERE status = 'completed' GROUP BY organization_id) p ON p.organization_id = o.id
      WHERE COALESCE(d.t, 0) + COALESCE(p.t, 0) > 0
      ORDER BY revenue DESC LIMIT _limit
    ) sub
  );
END;
$$;

-- Org category breakdown
CREATE OR REPLACE FUNCTION public.get_org_category_breakdown()
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('name', cat, 'value', cnt) ORDER BY cnt DESC), '[]'::jsonb)
    FROM (SELECT COALESCE(category::text, 'other') as cat, COUNT(*) as cnt FROM organizations GROUP BY category) sub
  );
END;
$$;

-- Country breakdown
CREATE OR REPLACE FUNCTION public.get_org_country_breakdown(_limit integer DEFAULT 6)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = 'public'
AS $$
BEGIN
  RETURN (
    SELECT COALESCE(jsonb_agg(jsonb_build_object('name', country, 'value', cnt) ORDER BY cnt DESC), '[]'::jsonb)
    FROM (SELECT COALESCE(country, 'Unknown') as country, COUNT(*) as cnt FROM organizations GROUP BY country ORDER BY cnt DESC LIMIT _limit) sub
  );
END;
$$;