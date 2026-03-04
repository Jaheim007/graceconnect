
-- Enable pg_net extension for HTTP calls from triggers
CREATE EXTENSION IF NOT EXISTS pg_net WITH SCHEMA extensions;

-- Create a function that fires on every user_notifications INSERT
-- and calls the on-notification-created edge function via pg_net
CREATE OR REPLACE FUNCTION public.notify_on_notification_insert()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Call the edge function asynchronously via pg_net
  PERFORM net.http_post(
    url := 'https://xzgpzbrgsxtcsktiprik.supabase.co/functions/v1/on-notification-created',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer ' || current_setting('app.settings.service_role_key', true)
    ),
    body := jsonb_build_object(
      'record', jsonb_build_object(
        'id', NEW.id,
        'user_id', NEW.user_id,
        'title', NEW.title,
        'body', NEW.body,
        'notification_type', NEW.notification_type,
        'action_url', NEW.action_url,
        'organization_id', NEW.organization_id,
        'created_at', NEW.created_at
      )
    )
  );
  RETURN NEW;
END;
$$;

-- Create the trigger
DROP TRIGGER IF EXISTS trg_notification_dispatch ON public.user_notifications;
CREATE TRIGGER trg_notification_dispatch
  AFTER INSERT ON public.user_notifications
  FOR EACH ROW
  EXECUTE FUNCTION public.notify_on_notification_insert();
