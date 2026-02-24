CREATE OR REPLACE FUNCTION public.self_enroll_affiliate(_org_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid;
  _org record;
  _member record;
BEGIN
  _caller := auth.uid();
  IF _caller IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- Check org exists and has affiliation enabled
  SELECT id, owner_id, affiliation_enabled, slug
  INTO _org
  FROM public.organizations
  WHERE id = _org_id AND is_active = true;
  
  IF _org IS NULL THEN
    RAISE EXCEPTION 'Organization not found';
  END IF;
  
  IF NOT COALESCE(_org.affiliation_enabled, false) THEN
    RAISE EXCEPTION 'Affiliation is not enabled for this organization';
  END IF;
  
  -- Block owners from becoming affiliates of their own org
  IF _org.owner_id = _caller THEN
    RAISE EXCEPTION 'Organization owners cannot be affiliates of their own organization';
  END IF;

  -- Check if already a member
  SELECT id, role INTO _member
  FROM public.organization_members
  WHERE user_id = _caller AND organization_id = _org_id;

  IF _member IS NULL THEN
    -- Insert as new member (regular member role, NOT affiliate role)
    INSERT INTO public.organization_members (user_id, organization_id, role)
    VALUES (_caller, _org_id, 'member');
  END IF;
  -- No role changes — keep whatever role they already have

  -- Create affiliate link if doesn't exist
  IF NOT EXISTS (
    SELECT 1 FROM public.affiliate_links
    WHERE user_id = _caller AND organization_id = _org_id
  ) THEN
    INSERT INTO public.affiliate_links (user_id, organization_id, code, link_type)
    VALUES (
      _caller,
      _org_id,
      UPPER(LEFT(_org.slug, 6)) || '-' || UPPER(LEFT(_caller::text, 6)),
      'org'
    );
  END IF;
END;
$$;