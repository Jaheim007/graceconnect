-- Enable monetization for ALL organizations (KYC only required for payouts, not selling)
UPDATE public.organizations SET monetization_enabled = true WHERE monetization_enabled = false;

-- Change default so new orgs can sell immediately
ALTER TABLE public.organizations ALTER COLUMN monetization_enabled SET DEFAULT true;