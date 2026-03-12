-- Phase 1: Add internationalization columns to profiles and digital_products

-- Add user preferences for language and currency
ALTER TABLE public.profiles 
  ADD COLUMN IF NOT EXISTS preferred_language text DEFAULT 'fr',
  ADD COLUMN IF NOT EXISTS preferred_currency text DEFAULT 'USD';

-- Add content language to digital products (what language is the book/content written in)
ALTER TABLE public.digital_products
  ADD COLUMN IF NOT EXISTS content_language text DEFAULT 'fr';

-- Add content language to AI projects (matches the language field that already exists but ensure default)
-- The column 'language' already exists on ai_content_projects, no change needed there.

-- Index for efficient language-based filtering on discover
CREATE INDEX IF NOT EXISTS idx_digital_products_content_language 
  ON public.digital_products (content_language) 
  WHERE is_published = true;

-- Comment for documentation
COMMENT ON COLUMN public.profiles.preferred_language IS 'User preferred UI language (en, fr, ar)';
COMMENT ON COLUMN public.profiles.preferred_currency IS 'User preferred display currency (USD, EUR, XOF, GHS, KES, etc.)';
COMMENT ON COLUMN public.digital_products.content_language IS 'Language the content is written in (en, fr, pt, sw, etc.)';