-- Fix inflated total_earned and conversions on affiliate_links
-- Reconcile with actual affiliate_sales data
UPDATE public.affiliate_links al
SET 
  total_earned = COALESCE(sub.actual_total, 0),
  conversions = COALESCE(sub.actual_count, 0)
FROM (
  SELECT 
    affiliate_link_id,
    SUM(commission_amount) as actual_total,
    COUNT(*) as actual_count
  FROM public.affiliate_sales
  GROUP BY affiliate_link_id
) sub
WHERE al.id = sub.affiliate_link_id
  AND (al.total_earned != sub.actual_total OR al.conversions != sub.actual_count);