
-- Fix existing affiliates who have links but their role is still 'member'
UPDATE public.organization_members om
SET role = 'affiliate'
FROM public.affiliate_links al
WHERE al.user_id = om.user_id
  AND al.organization_id = om.organization_id
  AND al.is_active = true
  AND om.role = 'member';
