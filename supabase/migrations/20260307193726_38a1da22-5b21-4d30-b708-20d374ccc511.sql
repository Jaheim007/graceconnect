
-- Moderation actions table for superadmin audit trail
CREATE TABLE public.moderation_actions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_type TEXT NOT NULL, -- 'product', 'campaign', 'organization', 'media'
  target_id UUID NOT NULL,
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  action TEXT NOT NULL, -- 'unpublish', 'delete', 'warn', 'suspend_org', 'approve'
  reason TEXT,
  reason_category TEXT, -- 'plagiarism', 'fraud', 'inappropriate', 'low_quality', 'copyright', 'empty_content', 'other'
  performed_by UUID NOT NULL,
  notified_owner BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE public.moderation_actions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Superadmins can manage moderation_actions"
ON public.moderation_actions
FOR ALL
TO authenticated
USING (public.is_superadmin(auth.uid()))
WITH CHECK (public.is_superadmin(auth.uid()));

-- Index for lookups
CREATE INDEX idx_moderation_actions_target ON public.moderation_actions(target_type, target_id);
CREATE INDEX idx_moderation_actions_org ON public.moderation_actions(organization_id);

-- Quality check function that returns issues for a product
CREATE OR REPLACE FUNCTION public.check_product_quality(_product_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _p record;
  _issues jsonb := '[]'::jsonb;
  _score int := 100;
BEGIN
  SELECT * INTO _p FROM digital_products WHERE id = _product_id;
  IF _p IS NULL THEN RETURN jsonb_build_object('score', 0, 'issues', '["Produit introuvable"]'::jsonb); END IF;

  -- No description or too short
  IF _p.description IS NULL OR length(trim(_p.description)) < 30 THEN
    _issues := _issues || '"Description absente ou trop courte (min 30 caractères)"'::jsonb;
    _score := _score - 25;
  END IF;

  -- Placeholder/copy-paste patterns
  IF _p.description IS NOT NULL AND (
    _p.description ~* '\[.*\]' OR
    _p.description ~* 'lorem ipsum' OR
    _p.description ~* 'votre description ici' OR
    _p.description ~* 'insérez|inserez|ajoutez votre' OR
    _p.description ~* 'example|exemple de description'
  ) THEN
    _issues := _issues || '"Description contient du texte placeholder ou copier-coller non nettoyé"'::jsonb;
    _score := _score - 20;
  END IF;

  -- No cover image
  IF _p.cover_image_url IS NULL OR _p.cover_image_url = '' THEN
    _issues := _issues || '"Pas d''image de couverture"'::jsonb;
    _score := _score - 15;
  END IF;

  -- No file and no external link
  IF ((_p.file_url IS NULL OR _p.file_url = '') AND (_p.external_link IS NULL OR _p.external_link = '')) THEN
    _issues := _issues || '"Aucun fichier ni lien externe attaché"'::jsonb;
    _score := _score - 30;
  END IF;

  -- Price is 0 but not marked as free
  IF COALESCE(_p.price, 0) = 0 AND _p.is_free = false THEN
    _issues := _issues || '"Prix à 0 mais non marqué comme gratuit"'::jsonb;
    _score := _score - 10;
  END IF;

  -- Title too short
  IF length(trim(_p.title)) < 5 THEN
    _issues := _issues || '"Titre trop court (min 5 caractères)"'::jsonb;
    _score := _score - 10;
  END IF;

  RETURN jsonb_build_object('score', GREATEST(_score, 0), 'issues', _issues);
END;
$$;

-- Trigger: auto-check quality on publish and notify creator
CREATE OR REPLACE FUNCTION public.auto_quality_check_on_publish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _result jsonb;
  _issues jsonb;
  _issue_count int;
  _creator_id uuid;
  _org_name text;
  _issues_text text := '';
  _i int;
BEGIN
  -- Only fire when is_published changes to true
  IF NOT (NEW.is_published = true AND (OLD IS NULL OR OLD.is_published IS DISTINCT FROM true)) THEN
    RETURN NEW;
  END IF;

  _result := public.check_product_quality(NEW.id);
  _issues := _result->'issues';
  _issue_count := jsonb_array_length(_issues);

  IF _issue_count = 0 THEN RETURN NEW; END IF;

  -- Build issues text
  FOR _i IN 0..(_issue_count - 1) LOOP
    _issues_text := _issues_text || '• ' || trim(both '"' from (_issues->_i)::text) || E'\n';
  END LOOP;

  _creator_id := COALESCE(NEW.created_by, (SELECT owner_id FROM organizations WHERE id = NEW.organization_id));
  SELECT name INTO _org_name FROM organizations WHERE id = NEW.organization_id;

  -- Notify creator about quality issues
  IF _creator_id IS NOT NULL THEN
    INSERT INTO user_notifications (user_id, organization_id, title, body, notification_type, action_url)
    VALUES (
      _creator_id,
      NEW.organization_id,
      '⚠️ Améliorations suggérées pour "' || left(NEW.title, 30) || '"',
      'Nous avons détecté ' || _issue_count || ' point(s) à améliorer :' || E'\n' || _issues_text || 'Corrigez ces éléments pour maximiser vos ventes.',
      'quality_check',
      '/admin/products'
    );
  END IF;

  RETURN NEW;
END;
$$;

CREATE TRIGGER trg_product_quality_check
AFTER UPDATE ON public.digital_products
FOR EACH ROW
EXECUTE FUNCTION public.auto_quality_check_on_publish();

-- Superadmin moderation function: unpublish, delete, warn, suspend
CREATE OR REPLACE FUNCTION public.moderate_content(
  _target_type TEXT,
  _target_id UUID,
  _action TEXT,
  _reason TEXT DEFAULT NULL,
  _reason_category TEXT DEFAULT 'other'
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
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

  -- Resolve target
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

  -- If no owner found, get org owner
  IF _owner_id IS NULL AND _org_id IS NOT NULL THEN
    SELECT owner_id INTO _owner_id FROM organizations WHERE id = _org_id;
  END IF;

  -- Execute action
  IF _action = 'unpublish' THEN
    IF _target_type = 'product' THEN
      UPDATE digital_products SET is_published = false, publication_status = 'moderated' WHERE id = _target_id;
    ELSIF _target_type = 'campaign' THEN
      UPDATE donation_campaigns SET is_published = false, is_active = false WHERE id = _target_id;
    ELSIF _target_type = 'media' THEN
      UPDATE media_content SET is_published = false WHERE id = _target_id;
    END IF;
    _notif_body := '⛔ Votre contenu "' || COALESCE(_title, 'Sans titre') || '" a été dépublié par la modération.';

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

  -- Add reason to notification
  IF _reason IS NOT NULL AND _reason != '' THEN
    _notif_body := _notif_body || E'\nMotif : ' || _reason;
  END IF;

  -- Log moderation action
  INSERT INTO moderation_actions (target_type, target_id, organization_id, action, reason, reason_category, performed_by)
  VALUES (_target_type, _target_id, _org_id, _action, _reason, _reason_category, _caller);

  -- Notify the owner
  IF _owner_id IS NOT NULL THEN
    INSERT INTO user_notifications (user_id, organization_id, title, body, notification_type, action_url)
    VALUES (
      _owner_id,
      _org_id,
      CASE _action
        WHEN 'unpublish' THEN '⛔ Contenu dépublié'
        WHEN 'delete' THEN '🗑️ Contenu supprimé'
        WHEN 'warn' THEN '⚠️ Avertissement modération'
        WHEN 'suspend_org' THEN '🚫 Organisation suspendue'
      END,
      _notif_body,
      'moderation_' || _action,
      CASE WHEN _action = 'suspend_org' THEN '/admin' ELSE '/admin/products' END
    );
  END IF;

  -- Audit log
  INSERT INTO audit_logs (user_id, action, resource_type, resource_id, organization_id, metadata)
  VALUES (_caller, 'moderation.' || _action, _target_type, _target_id, _org_id,
    jsonb_build_object('title', _title, 'reason', _reason, 'category', _reason_category));

  RETURN jsonb_build_object('ok', true, 'action', _action, 'target', _title);
END;
$$;
