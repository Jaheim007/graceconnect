
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS enabled_modules text[] NOT NULL DEFAULT ARRAY[]::text[],
  ADD COLUMN IF NOT EXISTS account_mode text NOT NULL DEFAULT 'client';

CREATE OR REPLACE FUNCTION public.validate_profile_account_mode()
RETURNS TRIGGER LANGUAGE plpgsql SET search_path = public AS $$
BEGIN
  IF NEW.account_mode NOT IN ('client','provider','both') THEN
    RAISE EXCEPTION 'account_mode must be one of: client, provider, both';
  END IF;
  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_validate_profile_account_mode ON public.profiles;
CREATE TRIGGER trg_validate_profile_account_mode
  BEFORE INSERT OR UPDATE OF account_mode ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.validate_profile_account_mode();

UPDATE public.profiles p SET
  account_mode = 'provider',
  enabled_modules = ARRAY['booking','reviews','location','kyc','affiliation','payments']
WHERE EXISTS (SELECT 1 FROM public.beauty_providers bp WHERE bp.user_id = p.id);

UPDATE public.profiles p SET
  account_mode = 'provider',
  enabled_modules = ARRAY['booking','reviews','location','kyc','affiliation','payments']
WHERE EXISTS (SELECT 1 FROM public.home_providers hp WHERE hp.user_id = p.id)
  AND p.account_mode <> 'provider';

UPDATE public.profiles p SET
  account_mode = 'provider',
  enabled_modules = ARRAY['booking','events_tickets','reviews','location','kyc','affiliation','payments']
WHERE EXISTS (SELECT 1 FROM public.events_providers ep WHERE ep.user_id = p.id)
  AND p.account_mode <> 'provider';

UPDATE public.profiles p SET
  account_mode = 'provider',
  enabled_modules = ARRAY['booking','reviews','location','kyc','affiliation','payments']
WHERE EXISTS (SELECT 1 FROM public.education_tutors et WHERE et.user_id = p.id)
  AND p.account_mode <> 'provider';

UPDATE public.profiles p SET
  account_mode = 'provider',
  enabled_modules = ARRAY['giving','ai_content','events_tickets','kyc','affiliation','payments']
WHERE EXISTS (SELECT 1 FROM public.church_providers cp WHERE cp.user_id = p.id)
  AND p.account_mode <> 'provider';

UPDATE public.profiles p SET
  account_mode = 'provider',
  enabled_modules = ARRAY['digital_products','ai_book','ai_content','comments','kyc','affiliation','payments']
WHERE EXISTS (SELECT 1 FROM public.digital_products dp WHERE dp.created_by = p.id)
  AND p.account_mode <> 'provider';
