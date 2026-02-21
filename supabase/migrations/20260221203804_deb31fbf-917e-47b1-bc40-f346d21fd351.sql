
-- Add slug column to digital_products
ALTER TABLE public.digital_products ADD COLUMN IF NOT EXISTS slug text;

-- Create a function to auto-generate slug from title
CREATE OR REPLACE FUNCTION public.generate_product_slug()
RETURNS TRIGGER AS $$
DECLARE
  base_slug text;
  final_slug text;
  counter integer := 0;
BEGIN
  -- Generate base slug from title: lowercase, replace spaces/special chars with hyphens
  base_slug := lower(trim(NEW.title));
  -- Remove accents (basic transliteration)
  base_slug := translate(base_slug, 
    'àáâãäåèéêëìíîïòóôõöùúûüýÿñçÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝŸÑÇ',
    'aaaaaaeeeeiiiioooooouuuuyyncAAAAAAEEEEIIIIOOOOOUUUUYYNC');
  -- Replace non-alphanumeric with hyphens
  base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
  -- Trim leading/trailing hyphens
  base_slug := trim(both '-' from base_slug);
  -- Limit length
  base_slug := left(base_slug, 80);
  
  -- If empty, use a fallback
  IF base_slug = '' OR base_slug IS NULL THEN
    base_slug := 'produit';
  END IF;
  
  final_slug := base_slug;
  
  -- Ensure uniqueness within the same organization
  LOOP
    IF NOT EXISTS (
      SELECT 1 FROM public.digital_products 
      WHERE slug = final_slug 
        AND organization_id = NEW.organization_id 
        AND id != COALESCE(NEW.id, '00000000-0000-0000-0000-000000000000'::uuid)
    ) THEN
      EXIT;
    END IF;
    counter := counter + 1;
    final_slug := base_slug || '-' || counter;
  END LOOP;
  
  NEW.slug := final_slug;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create trigger to auto-generate slug on insert/update of title
CREATE TRIGGER generate_product_slug_trigger
BEFORE INSERT OR UPDATE OF title ON public.digital_products
FOR EACH ROW
EXECUTE FUNCTION public.generate_product_slug();

-- Backfill existing products with slugs
DO $$
DECLARE
  r RECORD;
  base_slug text;
  final_slug text;
  counter integer;
BEGIN
  FOR r IN SELECT id, title, organization_id FROM public.digital_products WHERE slug IS NULL LOOP
    base_slug := lower(trim(r.title));
    base_slug := translate(base_slug, 
      'àáâãäåèéêëìíîïòóôõöùúûüýÿñçÀÁÂÃÄÅÈÉÊËÌÍÎÏÒÓÔÕÖÙÚÛÜÝŸÑÇ',
      'aaaaaaeeeeiiiioooooouuuuyyncAAAAAAEEEEIIIIOOOOOUUUUYYNC');
    base_slug := regexp_replace(base_slug, '[^a-z0-9]+', '-', 'g');
    base_slug := trim(both '-' from base_slug);
    base_slug := left(base_slug, 80);
    IF base_slug = '' OR base_slug IS NULL THEN base_slug := 'produit'; END IF;
    
    final_slug := base_slug;
    counter := 0;
    LOOP
      IF NOT EXISTS (
        SELECT 1 FROM public.digital_products 
        WHERE slug = final_slug AND organization_id = r.organization_id AND id != r.id
      ) THEN EXIT; END IF;
      counter := counter + 1;
      final_slug := base_slug || '-' || counter;
    END LOOP;
    
    UPDATE public.digital_products SET slug = final_slug WHERE id = r.id;
  END LOOP;
END;
$$;

-- Add unique constraint per org
CREATE UNIQUE INDEX IF NOT EXISTS idx_digital_products_org_slug 
ON public.digital_products (organization_id, slug);
