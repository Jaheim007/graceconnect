
-- Delete affiliate links where the user is the owner of the organization
DELETE FROM public.affiliate_links
WHERE id IN (
  SELECT al.id FROM public.affiliate_links al
  JOIN public.organizations o ON o.id = al.organization_id
  WHERE al.user_id = o.owner_id
);

-- Ensure all org owners have 'owner' role (fix any that were changed)
UPDATE public.organization_members om
SET role = 'owner'
FROM public.organizations o
WHERE om.organization_id = o.id
  AND om.user_id = o.owner_id
  AND om.role != 'owner';
