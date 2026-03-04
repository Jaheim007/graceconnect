ALTER TABLE public.partners
  ADD COLUMN IF NOT EXISTS city text,
  ADD COLUMN IF NOT EXISTS profession text,
  ADD COLUMN IF NOT EXISTS organization_name text,
  ADD COLUMN IF NOT EXISTS organization_type text,
  ADD COLUMN IF NOT EXISTS website_url text,
  ADD COLUMN IF NOT EXISTS social_media_url text,
  ADD COLUMN IF NOT EXISTS network_size text,
  ADD COLUMN IF NOT EXISTS target_audience text,
  ADD COLUMN IF NOT EXISTS experience_description text,
  ADD COLUMN IF NOT EXISTS how_heard_about_us text,
  ADD COLUMN IF NOT EXISTS motivation text;