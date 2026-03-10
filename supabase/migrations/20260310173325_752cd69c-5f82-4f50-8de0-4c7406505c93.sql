ALTER TABLE public.digital_products
  ADD COLUMN IF NOT EXISTS facebook_pixel_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS tiktok_pixel_id text DEFAULT NULL,
  ADD COLUMN IF NOT EXISTS google_tag_id text DEFAULT NULL;