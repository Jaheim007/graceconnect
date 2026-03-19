-- Backfill KYC notifications for existing pending submissions that superadmins never saw
INSERT INTO public.user_notifications (user_id, title, body, notification_type, action_url, organization_id)
SELECT 
  upr.user_id,
  '📄 Soumission KYC en attente',
  'L''organisation "' || COALESCE(o.name, 'Inconnue') || '" a une soumission KYC (Niveau ' || ks.kyc_level || ') en attente de vérification.',
  'kyc_submitted',
  '/superadmin/kyc',
  ks.organization_id
FROM public.kyc_submissions ks
JOIN public.organizations o ON o.id = ks.organization_id
CROSS JOIN public.user_platform_roles upr
WHERE upr.role = 'superadmin'
  AND ks.status = 'pending';