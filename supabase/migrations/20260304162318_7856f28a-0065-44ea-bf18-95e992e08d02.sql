
-- Manually attribute "Jahjah Studios" to partner SV-JAHE-9WHW (Jaheim Manolo)
-- This org was created via the partner's referral but attribution was lost during auth redirect
INSERT INTO public.partner_referrals (partner_id, organization_id, status)
VALUES (
  '5e59afbd-d8ba-4bbf-aa9c-7bad43fc7bed', -- Jaheim Manolo partner ID
  'c93a8030-882b-446b-b432-5b2fcd2a6543', -- Jahjah Studios org ID
  'pending'
)
ON CONFLICT DO NOTHING;

-- Update invite uses count
UPDATE public.partners
SET invite_uses_count = invite_uses_count + 1, last_invite_used_at = now()
WHERE id = '5e59afbd-d8ba-4bbf-aa9c-7bad43fc7bed';
