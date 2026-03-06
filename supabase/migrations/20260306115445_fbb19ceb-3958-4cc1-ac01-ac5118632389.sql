CREATE OR REPLACE FUNCTION public.create_book_quick(
  _title text,
  _style text DEFAULT 'ebook'::text,
  _page_count integer DEFAULT 20,
  _price integer DEFAULT 2000,
  _is_free boolean DEFAULT false,
  _commission_rate integer DEFAULT 20,
  _description text DEFAULT NULL::text,
  _cover_url text DEFAULT NULL::text,
  _file_url text DEFAULT NULL::text,
  _chapters jsonb DEFAULT '[]'::jsonb,
  _topic text DEFAULT NULL::text
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $function$
DECLARE
  _caller uuid;
  _org_id uuid;
  _product_id uuid;
  _project_id uuid;
  _slug text;
  _org_slug text;
  _profile record;
BEGIN
  _caller := auth.uid();
  IF _caller IS NULL THEN RAISE EXCEPTION 'Not authenticated'; END IF;

  -- Get user profile
  SELECT display_name INTO _profile FROM public.profiles WHERE id = _caller;

  -- Check if user already has an org, use it; otherwise create one
  SELECT o.id, o.slug INTO _org_id, _org_slug
  FROM public.organizations o
  JOIN public.organization_members om ON om.organization_id = o.id
  WHERE om.user_id = _caller AND om.role = 'owner'
  ORDER BY o.created_at ASC
  LIMIT 1;

  IF _org_id IS NULL THEN
    -- Auto-create org for the user
    _org_slug := 'writer-' || left(replace(gen_random_uuid()::text, '-', ''), 8);
    INSERT INTO public.organizations (name, slug, category, owner_id, currency, affiliation_enabled)
    VALUES (
      COALESCE(_profile.display_name, 'Mon espace') || '''s books',
      _org_slug,
      'business',
      _caller,
      'XOF',
      true
    ) RETURNING id INTO _org_id;

    INSERT INTO public.organization_members (organization_id, user_id, role)
    VALUES (_org_id, _caller, 'owner');
  END IF;

  -- Generate product slug
  _slug := lower(regexp_replace(_title, '[^a-zA-Z0-9]+', '-', 'g'));
  _slug := trim(both '-' from _slug);
  IF length(_slug) < 3 THEN _slug := 'book-' || left(replace(gen_random_uuid()::text, '-', ''), 6); END IF;

  -- Create AI content project
  INSERT INTO public.ai_content_projects (
    organization_id, created_by, project_type, title, objective,
    data_json, status, target_length
  ) VALUES (
    _org_id, _caller, 'ebook', _title, _topic,
    jsonb_build_object('style', _style, 'chapters', _chapters, 'page_count', _page_count),
    'ready_to_publish', _page_count
  ) RETURNING id INTO _project_id;

  -- Create the digital product
  INSERT INTO public.digital_products (
    organization_id, created_by, title, slug, description,
    price, is_free, is_published, cover_image_url, file_url,
    page_count, product_type, ai_generated, ai_project_id,
    publication_status
  ) VALUES (
    _org_id, _caller, _title, _slug, _description,
    CASE WHEN _is_free THEN 0 ELSE _price END,
    _is_free, false, _cover_url, _file_url,
    _page_count, 'ebook', true, _project_id,
    'draft'
  ) RETURNING id INTO _product_id;

  -- Update project link
  UPDATE public.ai_content_projects SET linked_product_id = _product_id WHERE id = _project_id;

  -- Set commission rate on org if different from default
  IF _commission_rate IS DISTINCT FROM 20 THEN
    UPDATE public.organizations SET default_commission_rate = _commission_rate WHERE id = _org_id;
  END IF;

  -- Audit log
  INSERT INTO public.audit_logs (user_id, action, resource_type, resource_id, organization_id, metadata)
  VALUES (_caller, 'book.quick_create', 'digital_product', _product_id, _org_id,
    jsonb_build_object('title', _title, 'style', _style, 'is_free', _is_free, 'price', _price));

  RETURN jsonb_build_object(
    'ok', true,
    'product_id', _product_id,
    'project_id', _project_id,
    'organization_id', _org_id,
    'org_slug', _org_slug,
    'slug', _slug
  );
END;
$function$;