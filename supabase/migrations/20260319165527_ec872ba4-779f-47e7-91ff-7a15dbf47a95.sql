-- Auto-capture buyers as contacts when a purchase is completed
CREATE OR REPLACE FUNCTION public.auto_capture_buyer_contact()
RETURNS TRIGGER AS $$
DECLARE
  _email TEXT;
  _name TEXT;
BEGIN
  IF NEW.status != 'completed' THEN RETURN NEW; END IF;
  
  SELECT email INTO _email FROM auth.users WHERE id = NEW.user_id;
  IF _email IS NULL THEN RETURN NEW; END IF;
  
  SELECT display_name INTO _name FROM public.profiles WHERE id = NEW.user_id;
  
  INSERT INTO public.contacts (organization_id, email, name, source, tags)
  VALUES (NEW.organization_id, _email, _name, 'purchase', ARRAY['buyer'])
  ON CONFLICT (organization_id, email) DO UPDATE
  SET tags = array(SELECT DISTINCT unnest(contacts.tags || ARRAY['buyer'])),
  updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_capture_buyer ON public.product_purchases;
CREATE TRIGGER trg_auto_capture_buyer
  AFTER INSERT OR UPDATE OF status ON public.product_purchases
  FOR EACH ROW EXECUTE FUNCTION auto_capture_buyer_contact();

-- Auto-capture donors as contacts
CREATE OR REPLACE FUNCTION public.auto_capture_donor_contact()
RETURNS TRIGGER AS $$
DECLARE
  _email TEXT;
  _name TEXT;
BEGIN
  IF NEW.status != 'completed' THEN RETURN NEW; END IF;
  
  _email := NEW.donor_email;
  _name := NEW.donor_name;
  
  IF _email IS NULL AND NEW.user_id IS NOT NULL THEN
    SELECT email INTO _email FROM auth.users WHERE id = NEW.user_id;
    SELECT display_name INTO _name FROM public.profiles WHERE id = NEW.user_id;
  END IF;
  
  IF _email IS NULL THEN RETURN NEW; END IF;
  
  INSERT INTO public.contacts (organization_id, email, name, source, tags)
  VALUES (NEW.organization_id, _email, _name, 'donation', ARRAY['donor'])
  ON CONFLICT (organization_id, email) DO UPDATE
  SET tags = array(SELECT DISTINCT unnest(contacts.tags || ARRAY['donor'])),
  updated_at = now();
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS trg_auto_capture_donor ON public.donations;
CREATE TRIGGER trg_auto_capture_donor
  AFTER INSERT OR UPDATE OF status ON public.donations
  FOR EACH ROW EXECUTE FUNCTION auto_capture_donor_contact();

-- Add unique constraint for upsert if not exists
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contacts_org_email_unique'
  ) THEN
    ALTER TABLE public.contacts ADD CONSTRAINT contacts_org_email_unique UNIQUE (organization_id, email);
  END IF;
END $$;