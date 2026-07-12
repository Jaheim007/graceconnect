ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS provider_profile jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN public.organizations.provider_profile IS
  'SiteViral provider taxonomy snapshot from onboarding: { specialties: string[], starter_services: string[], service_mode: string|null, custom_profession: string|null, name_mode: "business"|"personal" }';