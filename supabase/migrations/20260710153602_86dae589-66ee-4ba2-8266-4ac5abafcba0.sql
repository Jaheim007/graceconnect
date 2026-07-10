ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS extra_worlds public.siteviral_world[] NOT NULL DEFAULT '{}'::public.siteviral_world[];