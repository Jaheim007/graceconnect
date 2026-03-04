
-- Function to notify org members when new content is published
CREATE OR REPLACE FUNCTION public.notify_org_members_on_publish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _org_id uuid;
  _title text;
  _content_type text;
  _action_url text;
  _notif_title text;
  _notif_body text;
  _org_name text;
BEGIN
  -- Only fire when is_published changes from false/null to true
  IF NOT (NEW.is_published = true AND (OLD IS NULL OR OLD.is_published IS DISTINCT FROM true)) THEN
    RETURN NEW;
  END IF;

  -- Determine content type and build notification
  IF TG_TABLE_NAME = 'digital_products' THEN
    _org_id := NEW.organization_id;
    _title := NEW.title;
    _content_type := 'product';
    _action_url := '/org/' || (SELECT slug FROM organizations WHERE id = _org_id) || '/product/' || COALESCE(NEW.slug, NEW.id::text);
    _notif_title := '🆕 Nouveau produit disponible';
  ELSIF TG_TABLE_NAME = 'media_content' THEN
    _org_id := NEW.organization_id;
    _title := NEW.title;
    _content_type := 'media';
    _action_url := '/watch/' || NEW.id;
    _notif_title := '📹 Nouveau contenu publié';
  ELSIF TG_TABLE_NAME = 'events' THEN
    _org_id := NEW.organization_id;
    _title := NEW.title;
    _content_type := 'event';
    _action_url := '/event/' || NEW.id;
    _notif_title := '📅 Nouvel événement';
  ELSIF TG_TABLE_NAME = 'announcements' THEN
    _org_id := NEW.organization_id;
    _title := NEW.title;
    _content_type := 'announcement';
    _action_url := '/announcement/' || NEW.id;
    _notif_title := '📢 Nouvelle annonce';
  ELSIF TG_TABLE_NAME = 'programs' THEN
    _org_id := NEW.organization_id;
    _title := NEW.title;
    _content_type := 'program';
    _action_url := '/program/' || NEW.id;
    _notif_title := '🎓 Nouveau programme';
  ELSE
    RETURN NEW;
  END IF;

  -- Get org name
  SELECT name INTO _org_name FROM organizations WHERE id = _org_id;
  _notif_body := _title || ' — ' || COALESCE(_org_name, 'Organisation');

  -- Notify all members of this org (except the creator)
  INSERT INTO user_notifications (user_id, organization_id, title, body, notification_type, action_url)
  SELECT om.user_id, _org_id, _notif_title, _notif_body, 'new_' || _content_type, _action_url
  FROM organization_members om
  WHERE om.organization_id = _org_id
    AND om.user_id IS DISTINCT FROM COALESCE(NEW.created_by, '00000000-0000-0000-0000-000000000000'::uuid);

  RETURN NEW;
END;
$$;

-- Create triggers on all content tables
DROP TRIGGER IF EXISTS trg_notify_product_published ON public.digital_products;
CREATE TRIGGER trg_notify_product_published
  AFTER INSERT OR UPDATE OF is_published ON public.digital_products
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_org_members_on_publish();

DROP TRIGGER IF EXISTS trg_notify_media_published ON public.media_content;
CREATE TRIGGER trg_notify_media_published
  AFTER INSERT OR UPDATE OF is_published ON public.media_content
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_org_members_on_publish();

DROP TRIGGER IF EXISTS trg_notify_event_published ON public.events;
CREATE TRIGGER trg_notify_event_published
  AFTER INSERT OR UPDATE OF is_published ON public.events
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_org_members_on_publish();

DROP TRIGGER IF EXISTS trg_notify_announcement_published ON public.announcements;
CREATE TRIGGER trg_notify_announcement_published
  AFTER INSERT OR UPDATE OF is_published ON public.announcements
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_org_members_on_publish();

DROP TRIGGER IF EXISTS trg_notify_program_published ON public.programs;
CREATE TRIGGER trg_notify_program_published
  AFTER INSERT OR UPDATE OF is_published ON public.programs
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_org_members_on_publish();
