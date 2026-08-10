CREATE OR REPLACE FUNCTION public.cleanup_program_mirror_product()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_purchases integer := 0;
BEGIN
  IF OLD.linked_product_id IS NULL THEN
    RETURN OLD;
  END IF;

  SELECT count(*) INTO v_purchases
  FROM public.product_purchases
  WHERE product_id = OLD.linked_product_id;

  IF v_purchases > 0 THEN
    UPDATE public.digital_products
       SET is_published = false,
           publication_status = 'draft'
     WHERE id = OLD.linked_product_id;
  ELSE
    DELETE FROM public.digital_products WHERE id = OLD.linked_product_id;
  END IF;

  RETURN OLD;
END;
$$;

DROP TRIGGER IF EXISTS trg_cleanup_program_mirror_product ON public.programs;
CREATE TRIGGER trg_cleanup_program_mirror_product
AFTER DELETE ON public.programs
FOR EACH ROW EXECUTE FUNCTION public.cleanup_program_mirror_product();