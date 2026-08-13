
CREATE TABLE IF NOT EXISTS public.seller_surveys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL,
  main_goal text,
  content_type text,
  audience_size text,
  biggest_blocker text,
  found_via text,
  price_expectation text,
  note text,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT ON public.seller_surveys TO authenticated;
GRANT ALL ON public.seller_surveys TO service_role;

ALTER TABLE public.seller_surveys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users insert their own survey"
  ON public.seller_surveys FOR INSERT TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users read their own survey"
  ON public.seller_surveys FOR SELECT TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "Superadmins read all surveys"
  ON public.seller_surveys FOR SELECT TO authenticated
  USING (public.is_superadmin(auth.uid()));

CREATE INDEX IF NOT EXISTS seller_surveys_user_idx ON public.seller_surveys(user_id);

-- ============ Acquisition overview ============
CREATE OR REPLACE FUNCTION public.get_acquisition_overview(p_days integer DEFAULT 30, p_exclude_internal boolean DEFAULT true)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from timestamptz := now() - (greatest(p_days,1) || ' days')::interval;
  v_result jsonb;
BEGIN
  IF NOT public.is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  WITH internal_users AS (
    SELECT DISTINCT owner_id FROM public.organizations WHERE is_internal = true
  ),
  ev AS (
    SELECT ce.* FROM public.client_events ce
    WHERE ce.created_at >= v_from
      AND ce.event_name = 'page_view'
      AND (NOT p_exclude_internal OR ce.user_id IS NULL OR ce.user_id NOT IN (SELECT owner_id FROM internal_users))
  ),
  sign AS (
    SELECT p.* FROM public.profiles p
    WHERE p.created_at >= v_from
      AND (NOT p_exclude_internal OR p.id NOT IN (SELECT owner_id FROM internal_users))
  )
  SELECT jsonb_build_object(
    'page_views', (SELECT count(*) FROM ev),
    'visitors', (SELECT count(DISTINCT coalesce(session_id, user_id::text)) FROM ev),
    'signups', (SELECT count(*) FROM sign),
    'by_source', (
      SELECT coalesce(jsonb_agg(x), '[]'::jsonb) FROM (
        SELECT coalesce(nullif(event_data->>'first_touch_source',''), 'direct') AS source, count(*) AS views
        FROM ev GROUP BY 1 ORDER BY views DESC LIMIT 12
      ) x
    ),
    'signup_sources', (
      SELECT coalesce(jsonb_agg(x), '[]'::jsonb) FROM (
        SELECT coalesce(nullif(first_touch_source,''), 'direct') AS source, count(*) AS signups
        FROM sign GROUP BY 1 ORDER BY signups DESC LIMIT 12
      ) x
    ),
    'by_device', (
      SELECT coalesce(jsonb_agg(x), '[]'::jsonb) FROM (
        SELECT coalesce(device_type,'unknown') AS device, count(*) AS views
        FROM ev GROUP BY 1 ORDER BY views DESC
      ) x
    ),
    'by_hour', (
      SELECT coalesce(jsonb_agg(x ORDER BY (x->>'hour')::int), '[]'::jsonb) FROM (
        SELECT jsonb_build_object('hour', h, 'views', c) AS x FROM (
          SELECT coalesce((event_data->>'hour')::int, extract(hour FROM created_at)::int) AS h, count(*) AS c
          FROM ev GROUP BY 1
        ) y
      ) z
    ),
    'top_pages', (
      SELECT coalesce(jsonb_agg(x), '[]'::jsonb) FROM (
        SELECT coalesce(event_data->>'path','/') AS path, count(*) AS views
        FROM ev GROUP BY 1 ORDER BY views DESC LIMIT 15
      ) x
    ),
    'by_day', (
      SELECT coalesce(jsonb_agg(x ORDER BY (x->>'day')), '[]'::jsonb) FROM (
        SELECT jsonb_build_object('day', d::text, 'views', c) AS x FROM (
          SELECT date_trunc('day', created_at)::date AS d, count(*) AS c FROM ev GROUP BY 1
        ) y
      ) z
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============ Seller funnel ============
CREATE OR REPLACE FUNCTION public.get_seller_funnel(p_days integer DEFAULT 90, p_exclude_internal boolean DEFAULT true)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from timestamptz := now() - (greatest(p_days,1) || ' days')::interval;
  v_result jsonb;
BEGIN
  IF NOT public.is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  WITH orgs AS (
    SELECT o.* FROM public.organizations o
    WHERE o.created_at >= v_from AND (NOT p_exclude_internal OR coalesce(o.is_internal,false) = false)
  ),
  with_product AS (
    SELECT o.id, min(d.created_at) AS first_product_at
    FROM orgs o JOIN public.digital_products d ON d.organization_id = o.id
    GROUP BY o.id
  ),
  with_published AS (
    SELECT o.id, min(d.created_at) AS first_published_at
    FROM orgs o JOIN public.digital_products d ON d.organization_id = o.id AND d.is_published = true
    GROUP BY o.id
  ),
  with_sale AS (
    SELECT o.id, min(pp.created_at) AS first_sale_at
    FROM orgs o JOIN public.product_purchases pp ON pp.organization_id = o.id AND pp.status = 'completed'
    GROUP BY o.id
  )
  SELECT jsonb_build_object(
    'workspaces', (SELECT count(*) FROM orgs),
    'with_product', (SELECT count(*) FROM with_product),
    'with_published', (SELECT count(*) FROM with_published),
    'with_sale', (SELECT count(*) FROM with_sale),
    'median_hours_to_product', (
      SELECT round(percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM (wp.first_product_at - o.created_at))/3600)::numeric, 1)
      FROM with_product wp JOIN orgs o ON o.id = wp.id
    ),
    'median_hours_to_publish', (
      SELECT round(percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM (wpu.first_published_at - o.created_at))/3600)::numeric, 1)
      FROM with_published wpu JOIN orgs o ON o.id = wpu.id
    ),
    'median_hours_to_sale', (
      SELECT round(percentile_cont(0.5) WITHIN GROUP (ORDER BY extract(epoch FROM (ws.first_sale_at - o.created_at))/3600)::numeric, 1)
      FROM with_sale ws JOIN orgs o ON o.id = ws.id
    ),
    'by_type', (
      SELECT coalesce(jsonb_agg(x), '[]'::jsonb) FROM (
        SELECT coalesce(siteviral_type,'unknown') AS type, count(*) AS workspaces FROM orgs GROUP BY 1 ORDER BY workspaces DESC
      ) x
    ),
    'by_country', (
      SELECT coalesce(jsonb_agg(x), '[]'::jsonb) FROM (
        SELECT coalesce(nullif(country,''),'unknown') AS country, count(*) AS workspaces FROM orgs GROUP BY 1 ORDER BY workspaces DESC LIMIT 12
      ) x
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============ First-sale health ============
CREATE OR REPLACE FUNCTION public.get_first_sale_health(p_exclude_internal boolean DEFAULT true, p_limit integer DEFAULT 50)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_result jsonb;
BEGIN
  IF NOT public.is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  WITH prods AS (
    SELECT d.id, d.title, d.price, d.currency, d.created_at, d.cover_image_url, d.description,
           d.sales_count, d.commission_rate, o.id AS org_id, o.name AS org_name, o.slug AS org_slug
    FROM public.digital_products d
    JOIN public.organizations o ON o.id = d.organization_id
    WHERE d.is_published = true
      AND (NOT p_exclude_internal OR coalesce(o.is_internal,false) = false)
  )
  SELECT jsonb_build_object(
    'published_total', (SELECT count(*) FROM prods),
    'never_sold_total', (SELECT count(*) FROM prods WHERE coalesce(sales_count,0) = 0),
    'never_sold', (
      SELECT coalesce(jsonb_agg(x ORDER BY (x->>'created_at')), '[]'::jsonb) FROM (
        SELECT jsonb_build_object(
          'product_id', id, 'title', title, 'org_name', org_name, 'org_slug', org_slug,
          'price', price, 'currency', currency, 'created_at', created_at,
          'days_live', floor(extract(epoch FROM (now() - created_at))/86400),
          'missing_cover', cover_image_url IS NULL,
          'missing_description', coalesce(length(description),0) < 60,
          'no_commission', coalesce(commission_rate,0) = 0
        ) AS x
        FROM prods WHERE coalesce(sales_count,0) = 0
        ORDER BY created_at LIMIT greatest(p_limit,1)
      ) y
    ),
    'dormant_sellers', (
      SELECT coalesce(jsonb_agg(x), '[]'::jsonb) FROM (
        SELECT jsonb_build_object(
          'org_id', o.id, 'org_name', o.name, 'org_slug', o.slug,
          'created_at', o.created_at,
          'days_since_last_sale', (SELECT floor(extract(epoch FROM (now() - max(pp.created_at)))/86400)
                                   FROM public.product_purchases pp WHERE pp.organization_id = o.id AND pp.status = 'completed')
        ) AS x
        FROM public.organizations o
        WHERE (NOT p_exclude_internal OR coalesce(o.is_internal,false) = false)
          AND EXISTS (SELECT 1 FROM public.digital_products d WHERE d.organization_id = o.id AND d.is_published = true)
          AND NOT EXISTS (
            SELECT 1 FROM public.product_purchases pp
            WHERE pp.organization_id = o.id AND pp.status = 'completed' AND pp.created_at > now() - interval '30 days'
          )
        ORDER BY o.created_at DESC LIMIT greatest(p_limit,1)
      ) y
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============ Affiliate performance ============
CREATE OR REPLACE FUNCTION public.get_affiliate_performance(p_days integer DEFAULT 30, p_exclude_internal boolean DEFAULT true)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from timestamptz := now() - (greatest(p_days,1) || ' days')::interval;
  v_result jsonb;
BEGIN
  IF NOT public.is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  WITH internal_users AS (
    SELECT DISTINCT owner_id FROM public.organizations WHERE is_internal = true
  ),
  links AS (
    SELECT l.* FROM public.affiliate_links l
    WHERE (NOT p_exclude_internal OR l.user_id NOT IN (SELECT owner_id FROM internal_users))
  ),
  sales AS (
    SELECT s.* FROM public.affiliate_sales s
    WHERE s.created_at >= v_from
      AND (NOT p_exclude_internal OR s.affiliate_user_id NOT IN (SELECT owner_id FROM internal_users))
  )
  SELECT jsonb_build_object(
    'ambassadors', (SELECT count(DISTINCT user_id) FROM links),
    'active_ambassadors', (SELECT count(DISTINCT affiliate_user_id) FROM sales),
    'links', (SELECT count(*) FROM links),
    'clicks', (SELECT coalesce(sum(clicks),0) FROM links),
    'conversions', (SELECT count(*) FROM sales),
    'commission_total', (SELECT coalesce(sum(commission_amount),0) FROM sales),
    'gross_total', (SELECT coalesce(sum(gross_amount),0) FROM sales),
    'top_ambassadors', (
      SELECT coalesce(jsonb_agg(x), '[]'::jsonb) FROM (
        SELECT jsonb_build_object(
          'user_id', s.affiliate_user_id,
          'name', coalesce(p.display_name, 'Ambassador'),
          'conversions', count(*),
          'commission', coalesce(sum(s.commission_amount),0)
        ) AS x
        FROM sales s LEFT JOIN public.profiles p ON p.id = s.affiliate_user_id
        GROUP BY s.affiliate_user_id, p.display_name
        ORDER BY coalesce(sum(s.commission_amount),0) DESC LIMIT 10
      ) y
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

-- ============ Money overview ============
CREATE OR REPLACE FUNCTION public.get_money_overview(p_days integer DEFAULT 30, p_exclude_internal boolean DEFAULT true)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_from timestamptz := now() - (greatest(p_days,1) || ' days')::interval;
  v_result jsonb;
BEGIN
  IF NOT public.is_superadmin(auth.uid()) THEN
    RAISE EXCEPTION 'forbidden';
  END IF;

  WITH tx AS (
    SELECT pp.* FROM public.product_purchases pp
    JOIN public.organizations o ON o.id = pp.organization_id
    WHERE pp.status = 'completed' AND pp.created_at >= v_from
      AND (NOT p_exclude_internal OR coalesce(o.is_internal,false) = false)
  ),
  spend AS (
    SELECT * FROM public.marketing_spend WHERE spend_date >= v_from::date
  )
  SELECT jsonb_build_object(
    'orders', (SELECT count(*) FROM tx),
    'gmv', (SELECT coalesce(sum(amount),0) FROM tx),
    'platform_fees', (SELECT coalesce(sum(platform_fee),0) FROM tx),
    'affiliate_commissions', (SELECT coalesce(sum(affiliate_commission),0) FROM tx),
    'seller_payouts', (SELECT coalesce(sum(organization_amount),0) FROM tx),
    'paying_sellers', (SELECT count(DISTINCT organization_id) FROM tx),
    'by_currency', (
      SELECT coalesce(jsonb_agg(x), '[]'::jsonb) FROM (
        SELECT coalesce(currency,'XOF') AS currency, count(*) AS orders,
               coalesce(sum(amount),0) AS gmv, coalesce(sum(platform_fee),0) AS fees
        FROM tx GROUP BY 1 ORDER BY gmv DESC
      ) x
    ),
    'by_gateway', (
      SELECT coalesce(jsonb_agg(x), '[]'::jsonb) FROM (
        SELECT coalesce(gateway,'unknown') AS gateway, count(*) AS orders, coalesce(sum(amount),0) AS gmv
        FROM tx GROUP BY 1 ORDER BY gmv DESC
      ) x
    ),
    'marketing_spend', (SELECT coalesce(sum(amount),0) FROM spend),
    'spend_by_channel', (
      SELECT coalesce(jsonb_agg(x), '[]'::jsonb) FROM (
        SELECT channel, coalesce(sum(amount),0) AS amount, coalesce(min(currency),'XOF') AS currency
        FROM spend GROUP BY 1 ORDER BY amount DESC
      ) x
    ),
    'cost_per_paying_seller', (
      SELECT CASE WHEN (SELECT count(DISTINCT organization_id) FROM tx) > 0
        THEN round((SELECT coalesce(sum(amount),0) FROM spend) / (SELECT count(DISTINCT organization_id) FROM tx)::numeric, 2)
        ELSE NULL END
    )
  ) INTO v_result;

  RETURN v_result;
END;
$$;

REVOKE ALL ON FUNCTION public.get_acquisition_overview(integer, boolean) FROM anon;
REVOKE ALL ON FUNCTION public.get_seller_funnel(integer, boolean) FROM anon;
REVOKE ALL ON FUNCTION public.get_first_sale_health(boolean, integer) FROM anon;
REVOKE ALL ON FUNCTION public.get_affiliate_performance(integer, boolean) FROM anon;
REVOKE ALL ON FUNCTION public.get_money_overview(integer, boolean) FROM anon;
GRANT EXECUTE ON FUNCTION public.get_acquisition_overview(integer, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_seller_funnel(integer, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_first_sale_health(boolean, integer) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_affiliate_performance(integer, boolean) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_money_overview(integer, boolean) TO authenticated;
