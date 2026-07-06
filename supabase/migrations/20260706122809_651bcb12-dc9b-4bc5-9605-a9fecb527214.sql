-- Notify church owner on new prayer request
CREATE OR REPLACE FUNCTION public.notify_church_prayer()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner uuid; v_name text;
BEGIN
  SELECT user_id, name INTO v_owner, v_name FROM public.church_providers WHERE id = NEW.church_id;
  IF v_owner IS NOT NULL THEN
    INSERT INTO public.user_notifications (user_id, title, body, notification_type, action_url)
    VALUES (v_owner,
      'Nouvelle demande de prière',
      COALESCE(NEW.requester_name, 'Anonyme') || ' — ' || left(NEW.message, 120),
      'church_prayer', '/church/pro/prayer');
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_church_prayer ON public.church_prayer_requests;
CREATE TRIGGER trg_notify_church_prayer AFTER INSERT ON public.church_prayer_requests
  FOR EACH ROW EXECUTE FUNCTION public.notify_church_prayer();

-- Notify on completed donation
CREATE OR REPLACE FUNCTION public.notify_church_donation()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner uuid;
BEGIN
  IF NEW.status = 'completed' AND (OLD.status IS DISTINCT FROM 'completed') THEN
    SELECT user_id INTO v_owner FROM public.church_providers WHERE id = NEW.church_id;
    IF v_owner IS NOT NULL THEN
      INSERT INTO public.user_notifications (user_id, title, body, notification_type, action_url)
      VALUES (v_owner,
        'Nouveau don reçu',
        NEW.amount || ' ' || NEW.currency || ' — ' || COALESCE(NEW.giving_type, 'don'),
        'church_giving', '/church/pro/giving');
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_church_donation ON public.church_donations;
CREATE TRIGGER trg_notify_church_donation AFTER UPDATE ON public.church_donations
  FOR EACH ROW EXECUTE FUNCTION public.notify_church_donation();

-- Notify on sermon transcription ready
CREATE OR REPLACE FUNCTION public.notify_church_transcription()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_owner uuid;
BEGIN
  IF NEW.transcription_status = 'ready' AND (OLD.transcription_status IS DISTINCT FROM 'ready') THEN
    SELECT user_id INTO v_owner FROM public.church_providers WHERE id = NEW.church_id;
    IF v_owner IS NOT NULL THEN
      INSERT INTO public.user_notifications (user_id, title, body, notification_type, action_url)
      VALUES (v_owner,
        'Transcription prête',
        'Votre prédication "' || NEW.title || '" est transcrite. Générez vos contenus IA.',
        'church_sermon', '/church/pro/sermons/' || NEW.id);
    END IF;
  END IF;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_church_transcription ON public.church_sermons;
CREATE TRIGGER trg_notify_church_transcription AFTER UPDATE ON public.church_sermons
  FOR EACH ROW EXECUTE FUNCTION public.notify_church_transcription();

-- Notify on new content report (superadmin)
CREATE OR REPLACE FUNCTION public.notify_church_report()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE v_admin uuid;
BEGIN
  FOR v_admin IN
    SELECT user_id FROM public.user_platform_roles WHERE role = 'superadmin'
  LOOP
    INSERT INTO public.user_notifications (user_id, title, body, notification_type, action_url)
    VALUES (v_admin,
      'Nouveau signalement — Église',
      COALESCE(NEW.reason, 'motif non spécifié'),
      'church_report', '/superadmin/church');
  END LOOP;
  RETURN NEW;
END $$;

DROP TRIGGER IF EXISTS trg_notify_church_report ON public.church_content_reports;
CREATE TRIGGER trg_notify_church_report AFTER INSERT ON public.church_content_reports
  FOR EACH ROW EXECUTE FUNCTION public.notify_church_report();