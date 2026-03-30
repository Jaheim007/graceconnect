-- Ensure payout request currency always follows organization currency
CREATE OR REPLACE FUNCTION public.sync_payout_request_currency()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  org_currency text;
BEGIN
  SELECT currency INTO org_currency
  FROM public.organizations
  WHERE id = NEW.organization_id;

  IF org_currency IS NOT NULL AND org_currency <> '' THEN
    NEW.currency := org_currency;
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_sync_payout_request_currency ON public.payout_requests;
CREATE TRIGGER trg_sync_payout_request_currency
BEFORE INSERT ON public.payout_requests
FOR EACH ROW
EXECUTE FUNCTION public.sync_payout_request_currency();

-- Backfill inconsistent pending requests (e.g. EUR shown while org is XAF)
UPDATE public.payout_requests pr
SET currency = o.currency
FROM public.organizations o
WHERE pr.organization_id = o.id
  AND COALESCE(pr.currency, '') <> COALESCE(o.currency, '')
  AND pr.status IN ('pending', 'requested', 'processing');