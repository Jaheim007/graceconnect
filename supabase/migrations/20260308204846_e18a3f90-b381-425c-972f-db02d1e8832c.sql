-- Auto-trigger social snippets generation when a product is published
CREATE OR REPLACE FUNCTION public.trigger_snippets_on_publish()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
BEGIN
  -- Only fire when is_published changes to true
  IF NOT (NEW.is_published = true AND (OLD IS NULL OR OLD.is_published IS DISTINCT FROM true)) THEN
    RETURN NEW;
  END IF;

  -- Call the ai-generate-snippets edge function via pg_net
  PERFORM net.http_post(
    url := 'https://xzgpzbrgsxtcsktiprik.supabase.co/functions/v1/ai-generate-snippets',
    headers := jsonb_build_object(
      'Content-Type', 'application/json',
      'Authorization', 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh6Z3B6YnJnc3h0Y3NrdGlwcmlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzE2MDYyMzMsImV4cCI6MjA4NzE4MjIzM30.BTVz_Vc5opzgGdVyHuP-23TIca0f7yhsp7FQCYgLiVM'
    ),
    body := jsonb_build_object(
      'product_id', NEW.id,
      'organization_id', NEW.organization_id
    )
  );

  RETURN NEW;
END;
$$;

-- Attach trigger to digital_products
DROP TRIGGER IF EXISTS trg_auto_snippets_on_publish ON public.digital_products;
CREATE TRIGGER trg_auto_snippets_on_publish
  AFTER INSERT OR UPDATE ON public.digital_products
  FOR EACH ROW
  EXECUTE FUNCTION public.trigger_snippets_on_publish();