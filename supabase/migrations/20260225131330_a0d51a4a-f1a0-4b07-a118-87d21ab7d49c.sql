
-- Add Stripe Connect account ID and onboarding status to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS stripe_account_id text,
  ADD COLUMN IF NOT EXISTS stripe_onboarding_complete boolean NOT NULL DEFAULT false;

-- Index for quick lookup
CREATE INDEX IF NOT EXISTS idx_organizations_stripe_account_id ON public.organizations (stripe_account_id) WHERE stripe_account_id IS NOT NULL;
