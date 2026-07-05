
CREATE TABLE public.beauty_chat_violations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.beauty_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  reason text NOT NULL,
  matched text,
  original_body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT ON public.beauty_chat_violations TO authenticated;
GRANT ALL ON public.beauty_chat_violations TO service_role;

ALTER TABLE public.beauty_chat_violations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users see their own chat violations"
ON public.beauty_chat_violations FOR SELECT
TO authenticated
USING (
  sender_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM public.user_platform_roles
    WHERE user_id = auth.uid() AND role::text = 'superadmin'
  )
);

CREATE OR REPLACE FUNCTION public.beauty_filter_message()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  clean text;
  matched text;
  reason text;
BEGIN
  IF NEW.kind IS NOT NULL AND NEW.kind <> 'text' THEN
    RETURN NEW;
  END IF;

  clean := lower(coalesce(NEW.body, ''));

  IF clean ~ '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}' THEN
    reason := 'email';
    matched := (regexp_matches(clean, '[a-z0-9._%+-]+@[a-z0-9.-]+\.[a-z]{2,}'))[1];
  ELSIF (regexp_replace(NEW.body, '[^0-9]', '', 'g') ~ '[0-9]{7,}') THEN
    reason := 'phone';
    matched := (regexp_matches(regexp_replace(NEW.body, '[^0-9]', '', 'g'), '[0-9]{7,}'))[1];
  ELSIF clean ~ '(whats ?app|wa\.me|t\.me|telegram|signal\.me|viber|instagram|snapchat|facebook|messenger|fb\.com|tiktok)' THEN
    reason := 'social_handle';
    matched := (regexp_matches(clean, '(whats ?app|wa\.me|t\.me|telegram|signal\.me|viber|instagram|snapchat|facebook|messenger|fb\.com|tiktok)'))[1];
  ELSIF clean ~ '(orange money|mobile money|\bmomo\b|mtn money|moov money|\bwave\b|airtel money|western union|moneygram|payer (en )?cash|cash payment|pay(er)? (en )?dehors|hors (de l''|de la |l'')?app|hors( de la)? plateforme)' THEN
    reason := 'payment_bypass';
    matched := (regexp_matches(clean, '(orange money|mobile money|\bmomo\b|mtn money|moov money|\bwave\b|airtel money|western union|moneygram|payer (en )?cash|cash payment|pay(er)? (en )?dehors|hors (de l''|de la |l'')?app|hors( de la)? plateforme)'))[1];
  END IF;

  IF reason IS NOT NULL THEN
    INSERT INTO public.beauty_chat_violations (conversation_id, sender_id, reason, matched, original_body)
    VALUES (NEW.conversation_id, NEW.sender_id, reason, matched, NEW.body);

    RAISE EXCEPTION 'beauty_chat_blocked:%', reason
      USING ERRCODE = 'check_violation',
            HINT = 'Message blocked: contact info or off-platform payment reference detected.';
  END IF;

  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS beauty_messages_filter ON public.beauty_messages;
CREATE TRIGGER beauty_messages_filter
BEFORE INSERT ON public.beauty_messages
FOR EACH ROW EXECUTE FUNCTION public.beauty_filter_message();
