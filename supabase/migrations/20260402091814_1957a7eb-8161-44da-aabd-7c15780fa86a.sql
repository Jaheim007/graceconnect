
CREATE OR REPLACE FUNCTION public.auto_enroll_buyer_as_member()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _org_id uuid;
  _org_name text;
  _org_slug text;
  _already_member boolean;
  _is_owner boolean;
  _user_email text;
  _user_name text;
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
        SELECT name, slug INTO _org_name, _org_slug FROM public.organizations WHERE id = _org_id;
        
        -- In-app notification
        INSERT INTO public.user_notifications (user_id, organization_id, title, body, notification_type, action_url)
        VALUES (NEW.user_id, _org_id,
          '🎉 Bienvenue ! Vous êtes maintenant membre',
          'Vous êtes désormais membre de ' || COALESCE(_org_name, 'cette organisation') || '. Accédez à tous les contenus et nouveautés.',
          'membership', '/org/' || COALESCE(_org_slug, _org_id::text));

        -- Send email via pg_net
        SELECT p.display_name INTO _user_name FROM public.profiles p WHERE p.id = NEW.user_id;
        SELECT au.email INTO _user_email FROM auth.users au WHERE au.id = NEW.user_id;

        IF _user_email IS NOT NULL THEN
          PERFORM net.http_post(
            url := 'https://xzgpzbrgsxtcsktiprik.supabase.co/functions/v1/send-email',
            headers := jsonb_build_object(
              'Content-Type', 'application/json',
              'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Z3B6YnJnc3h0Y3NrdGlwcmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDYyMzMsImV4cCI6MjA4NzE4MjIzM30.BTVz_Vc5opzgGdVyHuP-23TIca0f7yhsp7FQCYgLiVM'
            ),
            body := jsonb_build_object(
              'template', 'member_auto_enrolled',
              'to', _user_email,
              'data', jsonb_build_object(
                'name', COALESCE(_user_name, ''),
                'org_name', COALESCE(_org_name, ''),
                'reason', 'purchase',
                'org_url', 'https://siteviral.com/org/' || COALESCE(_org_slug, _org_id::text)
              ),
              'organization_id', _org_id::text
            )
          );
        END IF;
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
  _org_slug text;
  _already_member boolean;
  _is_owner boolean;
  _user_email text;
  _user_name text;
BEGIN
  IF NEW.status = 'completed' AND NEW.user_id IS NOT NULL AND NEW.organization_id IS NOT NULL THEN
    SELECT EXISTS(SELECT 1 FROM public.organizations WHERE id = NEW.organization_id AND owner_id = NEW.user_id) INTO _is_owner;
    IF _is_owner THEN RETURN NEW; END IF;

    SELECT EXISTS(SELECT 1 FROM public.organization_members WHERE user_id = NEW.user_id AND organization_id = NEW.organization_id) INTO _already_member;

    INSERT INTO public.organization_members (user_id, organization_id, role)
    VALUES (NEW.user_id, NEW.organization_id, 'member'::org_member_role)
    ON CONFLICT (user_id, organization_id) DO NOTHING;

    IF NOT _already_member THEN
      SELECT name, slug INTO _org_name, _org_slug FROM public.organizations WHERE id = NEW.organization_id;

      INSERT INTO public.user_notifications (user_id, organization_id, title, body, notification_type, action_url)
      VALUES (NEW.user_id, NEW.organization_id,
        '🎉 Bienvenue ! Vous êtes maintenant membre',
        'Merci pour votre don ! Vous êtes désormais membre de ' || COALESCE(_org_name, 'cette organisation') || '.',
        'membership', '/org/' || COALESCE(_org_slug, NEW.organization_id::text));

      SELECT p.display_name INTO _user_name FROM public.profiles p WHERE p.id = NEW.user_id;
      SELECT au.email INTO _user_email FROM auth.users au WHERE au.id = NEW.user_id;

      IF _user_email IS NOT NULL THEN
        PERFORM net.http_post(
          url := 'https://xzgpzbrgsxtcsktiprik.supabase.co/functions/v1/send-email',
          headers := jsonb_build_object(
            'Content-Type', 'application/json',
            'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Z3B6YnJnc3h0Y3NrdGlwcmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDYyMzMsImV4cCI6MjA4NzE4MjIzM30.BTVz_Vc5opzgGdVyHuP-23TIca0f7yhsp7FQCYgLiVM'
          ),
          body := jsonb_build_object(
            'template', 'member_auto_enrolled',
            'to', _user_email,
            'data', jsonb_build_object(
              'name', COALESCE(_user_name, ''),
              'org_name', COALESCE(_org_name, ''),
              'reason', 'donation',
              'org_url', 'https://siteviral.com/org/' || COALESCE(_org_slug, NEW.organization_id::text)
            ),
            'organization_id', NEW.organization_id::text
          )
        );
      END IF;
    END IF;
  END IF;
  RETURN NEW;
END;
$$;
