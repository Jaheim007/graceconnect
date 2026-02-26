-- Delete the fake product with no file
DELETE FROM public.abandoned_carts WHERE product_id = 'b6edc69c-399b-407e-87cb-c68e5936e5d4';
DELETE FROM public.affiliate_links WHERE product_id = 'b6edc69c-399b-407e-87cb-c68e5936e5d4';
DELETE FROM public.bundle_items WHERE bundle_product_id = 'b6edc69c-399b-407e-87cb-c68e5936e5d4' OR included_product_id = 'b6edc69c-399b-407e-87cb-c68e5936e5d4';
DELETE FROM public.digital_products WHERE id = 'b6edc69c-399b-407e-87cb-c68e5936e5d4';

-- Add a trigger to prevent publishing products without a file_url
CREATE OR REPLACE FUNCTION public.validate_product_publish()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path TO 'public'
AS $$
BEGIN
  -- Block publishing if no file is attached (except for external link products)
  IF NEW.is_published = true 
     AND (NEW.file_url IS NULL OR NEW.file_url = '') 
     AND (NEW.external_link IS NULL OR NEW.external_link = '') THEN
    RAISE EXCEPTION 'Impossible de publier un produit sans fichier ni lien externe. Ajoutez un fichier avant de publier.';
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_validate_product_publish
BEFORE INSERT OR UPDATE ON public.digital_products
FOR EACH ROW
EXECUTE FUNCTION public.validate_product_publish();