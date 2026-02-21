
-- Add leader biography fields to organizations
ALTER TABLE public.organizations
  ADD COLUMN IF NOT EXISTS leader_name text,
  ADD COLUMN IF NOT EXISTS leader_title text,
  ADD COLUMN IF NOT EXISTS leader_image_url text,
  ADD COLUMN IF NOT EXISTS leader_bio text;
