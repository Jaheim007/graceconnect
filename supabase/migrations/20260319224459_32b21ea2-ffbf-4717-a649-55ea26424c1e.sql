
-- 1. Reset all auto-rejected KYC submissions back to pending
-- These were wrongly auto-rejected due to file accessibility issues (private bucket URLs)
UPDATE public.kyc_submissions 
SET status = 'pending', 
    rejection_reason = NULL, 
    reviewed_at = NULL
WHERE status = 'rejected' 
  AND rejection_reason LIKE '[Auto]%';

-- Also reset the corresponding organization kyc_status back to pending
UPDATE public.organizations o
SET kyc_status = 'pending'
FROM public.kyc_submissions ks
WHERE ks.organization_id = o.id
  AND ks.status = 'pending'
  AND o.kyc_status = 'rejected';

-- 2. Create trigger to notify superadmins when KYC is submitted
CREATE OR REPLACE FUNCTION public.notify_superadmins_kyc_submitted()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
DECLARE
  _admin record;
  _org_name text;
BEGIN
  -- Only fire on insert or when status changes to 'pending'
  IF TG_OP = 'INSERT' OR (TG_OP = 'UPDATE' AND NEW.status = 'pending' AND (OLD.status IS NULL OR OLD.status != 'pending')) THEN
    SELECT name INTO _org_name FROM public.organizations WHERE id = NEW.organization_id;
    
    -- Notify all superadmins
    FOR _admin IN SELECT user_id FROM public.user_roles WHERE role = 'admin'
    LOOP
      INSERT INTO public.user_notifications (user_id, title, body, notification_type, action_url, organization_id)
      VALUES (
        _admin.user_id,
        '📄 Nouvelle soumission KYC',
        'La plateforme "' || COALESCE(_org_name, 'Inconnue') || '" a soumis une demande de vérification d''identité (Niveau ' || NEW.kyc_level || '). Veuillez examiner la soumission.',
        'kyc_submitted',
        '/superadmin/kyc',
        NEW.organization_id
      );
    END LOOP;
    
    -- Also try to send email notification via send-email edge function
    -- (handled by the edge function, not SQL)
  END IF;
  
  RETURN NEW;
END;
$$;

-- Drop existing trigger if any
DROP TRIGGER IF EXISTS trg_notify_kyc_submitted ON public.kyc_submissions;

-- Create the trigger
CREATE TRIGGER trg_notify_kyc_submitted
  AFTER INSERT OR UPDATE ON public.kyc_submissions
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_superadmins_kyc_submitted();
