
-- Add preview columns to digital_products
ALTER TABLE public.digital_products
  ADD COLUMN IF NOT EXISTS preview_images text[] DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS page_count integer,
  ADD COLUMN IF NOT EXISTS preview_page_count integer;

-- Create public bucket for preview images
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-previews', 'product-previews', true)
ON CONFLICT (id) DO NOTHING;

-- Allow anyone to view preview images
CREATE POLICY "Preview images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'product-previews');

-- Allow authenticated users to upload preview images
CREATE POLICY "Authenticated users can upload preview images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'product-previews' AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their preview images
CREATE POLICY "Authenticated users can delete preview images"
ON storage.objects FOR DELETE
USING (bucket_id = 'product-previews' AND auth.role() = 'authenticated');
