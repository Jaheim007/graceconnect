DROP VIEW IF EXISTS public.showcase_top_creators;

CREATE VIEW public.showcase_top_creators
WITH (security_invoker = true)
AS
SELECT
  o.id AS organization_id,
  o.slug,
  o.name,
  o.logo_url,
  o.description,
  COUNT(DISTINCT pp.id) FILTER (WHERE pp.status='completed' AND pp.created_at >= date_trunc('month', now())) AS sales_this_month,
  COUNT(DISTINCT dp.id) FILTER (WHERE dp.is_published=true) AS active_products
FROM organizations o
LEFT JOIN digital_products dp ON dp.organization_id = o.id
LEFT JOIN product_purchases pp ON pp.organization_id = o.id
GROUP BY o.id
HAVING COUNT(DISTINCT pp.id) FILTER (WHERE pp.status='completed' AND pp.created_at >= date_trunc('month', now())) > 0
ORDER BY sales_this_month DESC
LIMIT 24;

GRANT SELECT ON public.showcase_top_creators TO anon, authenticated;