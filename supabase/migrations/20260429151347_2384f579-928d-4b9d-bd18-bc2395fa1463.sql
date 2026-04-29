
-- 1) Unpublish all currently-published products that have no cover
UPDATE public.digital_products
SET is_published = false,
    publication_status = 'draft',
    updated_at = now()
WHERE is_published = true
  AND (cover_image_url IS NULL OR cover_image_url = '');

-- 2) Trigger to prevent publishing without a cover going forward
CREATE OR REPLACE FUNCTION public.enforce_cover_before_publish()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  IF NEW.is_published = true AND (NEW.cover_image_url IS NULL OR NEW.cover_image_url = '') THEN
    RAISE EXCEPTION 'A cover image is required to publish a product.'
      USING ERRCODE = 'check_violation';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_enforce_cover_before_publish ON public.digital_products;
CREATE TRIGGER trg_enforce_cover_before_publish
BEFORE INSERT OR UPDATE ON public.digital_products
FOR EACH ROW
EXECUTE FUNCTION public.enforce_cover_before_publish();
