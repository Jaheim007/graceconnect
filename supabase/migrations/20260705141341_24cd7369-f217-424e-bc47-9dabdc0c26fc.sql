
-- Contact masking trigger: redact phone/email/socials from message body
CREATE OR REPLACE FUNCTION public.beauty_redact_message()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  redacted text;
  had_contact boolean := false;
BEGIN
  redacted := COALESCE(NEW.body, '');

  -- email
  IF redacted ~* '[[:alnum:]._%+-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}' THEN
    had_contact := true;
    redacted := regexp_replace(redacted, '[[:alnum:]._%+-]+@[[:alnum:].-]+\.[[:alpha:]]{2,}', '[contact masqué]', 'gi');
  END IF;

  -- phone numbers (7+ digits, spaces/dashes/dots allowed, optional +)
  IF redacted ~ '(\+?\d[\d\s().-]{6,}\d)' THEN
    had_contact := true;
    redacted := regexp_replace(redacted, '(\+?\d[\d\s().-]{6,}\d)', '[contact masqué]', 'g');
  END IF;

  -- whatsapp / telegram / instagram / snapchat handles or urls
  IF redacted ~* '(whatsapp|wa\.me|t\.me|telegram|instagram|snapchat|facebook|messenger|@[[:alnum:]_.]{3,})' THEN
    had_contact := true;
    redacted := regexp_replace(redacted, '(https?://\S+|wa\.me/\S+|t\.me/\S+|@[[:alnum:]_.]{3,})', '[contact masqué]', 'gi');
  END IF;

  NEW.redacted_body := redacted;
  NEW.contains_contact_attempt := had_contact;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_beauty_redact_message ON public.beauty_messages;
CREATE TRIGGER trg_beauty_redact_message
BEFORE INSERT OR UPDATE OF body ON public.beauty_messages
FOR EACH ROW EXECUTE FUNCTION public.beauty_redact_message();

-- Bump conversation.last_message_at on new message
CREATE OR REPLACE FUNCTION public.beauty_bump_conversation()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  UPDATE public.beauty_conversations
  SET last_message_at = NEW.created_at
  WHERE id = NEW.conversation_id;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS trg_beauty_bump_conversation ON public.beauty_messages;
CREATE TRIGGER trg_beauty_bump_conversation
AFTER INSERT ON public.beauty_messages
FOR EACH ROW EXECUTE FUNCTION public.beauty_bump_conversation();

-- Enable realtime
ALTER TABLE public.beauty_messages REPLICA IDENTITY FULL;
ALTER TABLE public.beauty_conversations REPLICA IDENTITY FULL;

DO $$
BEGIN
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.beauty_messages;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
  BEGIN
    ALTER PUBLICATION supabase_realtime ADD TABLE public.beauty_conversations;
  EXCEPTION WHEN duplicate_object THEN NULL;
  END;
END $$;
