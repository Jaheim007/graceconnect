-- Fix existing new_product_affiliate notifications: link to org page instead of /gagner
UPDATE user_notifications un
SET action_url = '/org/' || COALESCE(o.slug, un.organization_id::text)
FROM organizations o
WHERE o.id = un.organization_id
  AND un.notification_type IN ('new_product_affiliate', 'high_commission_product', 'trending_suggestion')
  AND un.action_url = '/gagner'
  AND un.organization_id IS NOT NULL;