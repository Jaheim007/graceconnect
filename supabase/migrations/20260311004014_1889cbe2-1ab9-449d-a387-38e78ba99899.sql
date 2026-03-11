
-- Add screenshot_url and ticket_number to support_tickets
ALTER TABLE public.support_tickets 
  ADD COLUMN IF NOT EXISTS screenshot_url text,
  ADD COLUMN IF NOT EXISTS ticket_number text;

-- Generate unique ticket numbers for existing rows
UPDATE public.support_tickets 
SET ticket_number = 'TK-' || LPAD(FLOOR(RANDOM() * 999999)::text, 6, '0')
WHERE ticket_number IS NULL;

-- Create a function to auto-generate ticket numbers
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  NEW.ticket_number := 'TK-' || LPAD(nextval('support_ticket_seq')::text, 6, '0');
  RETURN NEW;
END;
$$;

-- Create sequence for ticket numbers
CREATE SEQUENCE IF NOT EXISTS public.support_ticket_seq START 1000;

-- Trigger to auto-set ticket_number on insert
DROP TRIGGER IF EXISTS set_ticket_number ON public.support_tickets;
CREATE TRIGGER set_ticket_number
  BEFORE INSERT ON public.support_tickets
  FOR EACH ROW
  WHEN (NEW.ticket_number IS NULL)
  EXECUTE FUNCTION public.generate_ticket_number();

-- Create storage bucket for ticket screenshots
INSERT INTO storage.buckets (id, name, public, file_size_limit)
VALUES ('ticket-screenshots', 'ticket-screenshots', false, 5242880)
ON CONFLICT (id) DO NOTHING;

-- RLS: users can upload their own screenshots
CREATE POLICY "Users can upload ticket screenshots"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'ticket-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: users can view their own screenshots
CREATE POLICY "Users can view own ticket screenshots"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'ticket-screenshots' AND (storage.foldername(name))[1] = auth.uid()::text);

-- RLS: superadmins can view all ticket screenshots (service role handles this)
