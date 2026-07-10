DO $$ BEGIN
  CREATE TYPE public.siteviral_world AS ENUM ('digital','beauty','church','home','events','education');
EXCEPTION WHEN duplicate_object THEN null; END $$;

ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS primary_world public.siteviral_world;

UPDATE public.organizations SET primary_world = 'church'
  WHERE primary_world IS NULL AND category IN ('church','ministry');
UPDATE public.organizations SET primary_world = 'digital'
  WHERE primary_world IS NULL;

ALTER TABLE public.feature_activations
  ADD COLUMN IF NOT EXISTS world public.siteviral_world;