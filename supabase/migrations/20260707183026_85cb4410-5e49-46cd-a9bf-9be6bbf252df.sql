-- Non-destructive: add nullable organization_id links to provider tables.
-- No backfill, no data mutation. RLS policies unchanged.

ALTER TABLE public.beauty_providers
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_beauty_providers_organization_id
  ON public.beauty_providers(organization_id);

ALTER TABLE public.church_providers
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_church_providers_organization_id
  ON public.church_providers(organization_id);

ALTER TABLE public.home_providers
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_home_providers_organization_id
  ON public.home_providers(organization_id);

ALTER TABLE public.events_providers
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_events_providers_organization_id
  ON public.events_providers(organization_id);

ALTER TABLE public.education_tutors
  ADD COLUMN IF NOT EXISTS organization_id uuid REFERENCES public.organizations(id) ON DELETE SET NULL;
CREATE INDEX IF NOT EXISTS idx_education_tutors_organization_id
  ON public.education_tutors(organization_id);