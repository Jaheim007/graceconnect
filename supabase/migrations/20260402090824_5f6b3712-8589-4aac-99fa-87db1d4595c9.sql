
-- ═══ BACKFILL: existing buyers → members (exclude org owners) ═══
INSERT INTO public.organization_members (user_id, organization_id, role)
SELECT DISTINCT pp.user_id, dp.organization_id, 'member'::org_member_role
FROM public.product_purchases pp
JOIN public.digital_products dp ON dp.id = pp.product_id
WHERE pp.status = 'completed'
  AND pp.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = dp.organization_id AND o.owner_id = pp.user_id
  )
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- ═══ BACKFILL: existing donors → members (exclude org owners) ═══
INSERT INTO public.organization_members (user_id, organization_id, role)
SELECT DISTINCT d.user_id, d.organization_id, 'member'::org_member_role
FROM public.donations d
WHERE d.status = 'completed'
  AND d.user_id IS NOT NULL
  AND NOT EXISTS (
    SELECT 1 FROM public.organizations o
    WHERE o.id = d.organization_id AND o.owner_id = d.user_id
  )
ON CONFLICT (user_id, organization_id) DO NOTHING;

-- ═══ UPDATE TRIGGERS: add notification + skip owners ═══

CREATE OR REPLACE FUNCTION public.auto_enroll_buyer_as_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id uuid;
  _org_name text;
  _already_member boolean;
  _is_owner boolean;
BEGIN
  IF NEW.status = 'completed' AND NEW.user_id IS NOT NULL THEN
    SELECT dp.organization_id INTO _org_id
    FROM public.digital_products dp WHERE dp.id = NEW.product_id;

    IF _org_id IS NOT NULL THEN
      SELECT EXISTS(SELECT 1 FROM public.organizations WHERE id = _org_id AND owner_id = NEW.user_id) INTO _is_owner;
      IF _is_owner THEN RETURN NEW; END IF;

      SELECT EXISTS(SELECT 1 FROM public.organization_members WHERE user_id = NEW.user_id AND organization_id = _org_id) INTO _already_member;

      INSERT INTO public.organization_members (user_id, organization_id, role)
      VALUES (NEW.user_id, _org_id, 'member'::org_member_role)
      ON CONFLICT (user_id, organization_id) DO NOTHING;

      IF NOT _already_member THEN
        SELECT name INTO _org_name FROM public.organizations WHERE id = _org_id;
        INSERT INTO public.user_notifications (user_id, organization_id, title, body, notification_type, action_url)
        VALUES (NEW.user_id, _org_id, '🎉 Bienvenue ! Vous êtes maintenant membre',
          'Vous êtes désormais membre de ' || COALESCE(_org_name, 'cette organisation') || '. Accédez à tous les contenus et nouveautés.',
          'membership', '/org/' || _org_id);
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;

CREATE OR REPLACE FUNCTION public.auto_enroll_donor_as_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_name text;
  _already_member boolean;
  _is_owner boolean;
BEGIN
  IF NEW.status = 'completed' AND NEW.user_id IS NOT NULL AND NEW.organization_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM public.organizations WHERE id = NEW.organization_id AND owner_id = NEW.user_id) INTO _is_owner;
    IF _is_owner THEN RETURN NEW; END IF;

    SELECT EXISTS(SELECT 1 FROM public.organization_members WHERE user_id = NEW.user_id AND organization_id = NEW.organization_id) INTO _already_member;

    INSERT INTO public.organization_members (user_id, organization_id, role)
    VALUES (NEW.user_id, NEW.organization_id, 'member'::org_member_role)
    ON CONFLICT (user_id, organization_id) DO NOTHING;

    IF NOT _already_member THEN
      SELECT name INTO _org_name FROM public.organizations WHERE id = NEW.organization_id;
      INSERT INTO public.user_notifications (user_id, organization_id, title, body, notification_type, action_url)
      VALUES (NEW.user_id, NEW.organization_id, '🎉 Bienvenue ! Vous êtes maintenant membre',
        'Merci pour votre don ! Vous êtes désormais membre de ' || COALESCE(_org_name, 'cette organisation') || '.',
        'membership', '/org/' || NEW.organization_id);
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
