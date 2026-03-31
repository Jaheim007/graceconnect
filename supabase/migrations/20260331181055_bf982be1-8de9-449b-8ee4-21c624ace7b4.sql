
DROP FUNCTION IF EXISTS public.moderate_content(text, uuid, text, text, text);

CREATE FUNCTION public.moderate_content(
  _target_type text,
  _target_id uuid,
  _action text,
  _reason text,
  _reason_category text DEFAULT 'other'
)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _caller uuid;
  _org_id uuid;
  _owner_id uuid;
  _title text;
  _notif_body text;
BEGIN
  _caller := auth.uid();
  IF NOT public.is_superadmin(_caller) THEN
    RAISE EXCEPTION 'Superadmin only';
  END IF;

  IF _target_type = 'product' THEN
    SELECT organization_id, title, created_by INTO _org_id, _title, _owner_id
    FROM digital_products WHERE id = _target_id;
  ELSIF _target_type = 'campaign' THEN
    SELECT organization_id, title, created_by INTO _org_id, _title, _owner_id
    FROM donation_campaigns WHERE id = _target_id;
  ELSIF _target_type = 'media' THEN
    SELECT organization_id, title, created_by INTO _org_id, _title, _owner_id
    FROM media_content WHERE id = _target_id;
  ELSIF _target_type = 'organization' THEN
    SELECT id, name, owner_id INTO _org_id, _title, _owner_id
    FROM organizations WHERE id = _target_id;
  ELSE
    RAISE EXCEPTION 'Invalid target_type: %', _target_type;
  END IF;

  IF _org_id IS NULL AND _target_type != 'organization' THEN
    RAISE EXCEPTION 'Target not found';
  END IF;

  IF _owner_id IS NULL AND _org_id IS NOT NULL THEN
    SELECT owner_id INTO _owner_id FROM organizations WHERE id = _org_id;
  END IF;

  IF _action = 'unpublish' THEN
    IF _target_type = 'product' THEN
      UPDATE digital_products SET is_published = false, publication_status = 'moderated' WHERE id = _target_id;
    ELSIF _target_type = 'campaign' THEN
      UPDATE donation_campaigns SET is_published = false, is_active = false WHERE id = _target_id;
    ELSIF _target_type = 'media' THEN
      UPDATE media_content SET is_published = false WHERE id = _target_id;
    END IF;
    _notif_body := '⛔ Votre contenu "' || COALESCE(_title, 'Sans titre') || '" a été dépublié par la modération.';

  ELSIF _action = 'restore' THEN
    IF _target_type = 'product' THEN
      UPDATE digital_products SET is_published = true, publication_status = 'published' WHERE id = _target_id;
    ELSIF _target_type = 'campaign' THEN
      UPDATE donation_campaigns SET is_published = true, is_active = true WHERE id = _target_id;
    ELSIF _target_type = 'media' THEN
      UPDATE media_content SET is_published = true WHERE id = _target_id;
    END IF;
    _notif_body := '✅ Votre contenu "' || COALESCE(_title, 'Sans titre') || '" a été restauré par la modération.';

  ELSIF _action = 'delete' THEN
    IF _target_type = 'product' THEN
      DELETE FROM digital_products WHERE id = _target_id;
    ELSIF _target_type = 'campaign' THEN
      DELETE FROM donation_campaigns WHERE id = _target_id;
    ELSIF _target_type = 'media' THEN
      DELETE FROM media_content WHERE id = _target_id;
    END IF;
    _notif_body := '🗑️ Votre contenu "' || COALESCE(_title, 'Sans titre') || '" a été supprimé par la modération.';

  ELSIF _action = 'warn' THEN
    _notif_body := '⚠️ Avertissement concernant "' || COALESCE(_title, 'Sans titre') || '".';

  ELSIF _action = 'suspend_org' THEN
    UPDATE organizations SET is_suspended = true, suspension_reason = _reason WHERE id = COALESCE(_org_id, _target_id);
    _notif_body := '🚫 Votre organisation a été suspendue par la modération.';

  ELSE
    RAISE EXCEPTION 'Invalid action: %', _action;
  END IF;

  IF _reason IS NOT NULL AND _reason != '' THEN
    _notif_body := _notif_body || E'\nMotif : ' || _reason;
  END IF;

  INSERT INTO moderation_actions (target_type, target_id, organization_id, action, reason, reason_category, performed_by)
  VALUES (_target_type, _target_id, _org_id, _action, _reason, _reason_category, _caller);

  IF _owner_id IS NOT NULL THEN
    INSERT INTO user_notifications (user_id, organization_id, title, body, notification_type, action_url)
    VALUES (
      _owner_id, _org_id,
      CASE _action
        WHEN 'unpublish' THEN '⛔ Contenu dépublié'
        WHEN 'restore' THEN '✅ Contenu restauré'
        WHEN 'delete' THEN '🗑️ Contenu supprimé'
        WHEN 'warn' THEN '⚠️ Avertissement modération'
        WHEN 'suspend_org' THEN '🚫 Organisation suspendue'
      END,
      _notif_body,
      'moderation_' || _action,
      CASE WHEN _action = 'suspend_org' THEN '/admin' ELSE '/admin/products' END
    );
  END IF;

  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, organization_id, metadata)
  VALUES (_caller, 'moderation.' || _action, _target_type, _target_id, _org_id,
    jsonb_build_object('title', _title, 'reason', _reason, 'category', _reason_category));

  RETURN jsonb_build_object('ok', true, 'action', _action, 'target', _title);
END;
$$;
