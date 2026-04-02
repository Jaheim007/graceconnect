
-- Function: auto-enroll buyer as org member on completed purchase
CREATE OR REPLACE FUNCTION public.auto_enroll_buyer_as_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id uuid;
BEGIN
  -- Only for completed purchases with a logged-in user
  IF NEW.status = 'completed' AND NEW.user_id IS NOT NULL THEN
    -- Get organization_id from the product
    SELECT organization_id INTO _org_id
    FROM public.digital_products
    WHERE id = NEW.product_id;

    IF _org_id IS NOT NULL THEN
      INSERT INTO public.organization_members (user_id, organization_id, role)
      VALUES (NEW.user_id, _org_id, 'member')
      ON CONFLICT (user_id, organization_id) DO NOTHING;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on product_purchases
DROP TRIGGER IF EXISTS trg_auto_enroll_buyer ON public.product_purchases;
CREATE TRIGGER trg_auto_enroll_buyer
  AFTER INSERT OR UPDATE ON public.product_purchases
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_enroll_buyer_as_member();

-- Function: auto-enroll donor as org member on completed donation
CREATE OR REPLACE FUNCTION public.auto_enroll_donor_as_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NEW.status = 'completed' AND NEW.user_id IS NOT NULL AND NEW.organization_id IS NOT NULL THEN
    INSERT INTO public.organization_members (user_id, organization_id, role)
    VALUES (NEW.user_id, NEW.organization_id, 'member')
    ON CONFLICT (user_id, organization_id) DO NOTHING;
  END IF;
  RETURN NEW;
END;
$$;

-- Trigger on donations
DROP TRIGGER IF EXISTS trg_auto_enroll_donor ON public.donations;
CREATE TRIGGER trg_auto_enroll_donor
  AFTER INSERT OR UPDATE ON public.donations
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_enroll_donor_as_member();
