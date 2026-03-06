-- 1. Change default org_category from 'church' to 'business' in create_organization_with_owner
-- Drop both overloaded versions and recreate with business default

DROP FUNCTION IF EXISTS public.create_organization_with_owner(text, text, org_category, text, text);
DROP FUNCTION IF EXISTS public.create_organization_with_owner(text, text, org_category, text);

CREATE OR REPLACE FUNCTION public.create_organization_with_owner(
  _name text,
  _slug text,
  _category org_category DEFAULT 'business'::org_category,
  _description text DEFAULT NULL::text,
  _currency text DEFAULT 'XOF'::text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _org_id UUID;
  _caller UUID;
BEGIN
  _caller := auth.uid();
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  INSERT INTO public.organizations (name, slug, category, description, owner_id, currency)
  VALUES (_name, _slug, _category, _description, _caller, _currency)
  RETURNING id INTO _org_id;

  INSERT INTO public.organization_members (organization_id, user_id, role)
  VALUES (_org_id, _caller, 'owner');

  RETURN _org_id;
END;
$$;

-- 2. Add onboarding_intent column to profiles
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS onboarding_intent text;