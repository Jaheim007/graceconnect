
-- Fix the KYC trigger: use correct table user_platform_roles instead of user_roles
CREATE OR REPLACE FUNCTION public.notify_superadmins_kyc_submitted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _admin record;
  _org_name text;
  _submitter_name text;
BEGIN
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status = 'pending' AND (OLD.status IS NULL OR OLD.status != 'pending')) THEN
    SELECT name INTO _org_name FROM public.organizations WHERE id = NEW.organization_id;
    SELECT display_name INTO _submitter_name FROM public.profiles WHERE id = NEW.submitted_by;
    
    FOR _admin IN SELECT user_id FROM public.user_platform_roles WHERE role = 'superadmin'
    LOOP
      INSERT INTO public.user_notifications (user_id, title, body, notification_type, action_url, organization_id)
      VALUES (
        _admin.user_id,
        '📄 Nouvelle soumission KYC',
        'L''organisation "' || COALESCE(_org_name, 'Inconnue') || '" (soumis par ' || COALESCE(_submitter_name, 'Inconnu') || ') a soumis une demande de vérification d''identité (Niveau ' || NEW.kyc_level || '). Veuillez examiner la soumission.',
        'kyc_submitted',
        '/superadmin/kyc',
        NEW.organization_id
      );
    END LOOP;
  END IF;
  
  RETURN NEW;
END;
$$;
