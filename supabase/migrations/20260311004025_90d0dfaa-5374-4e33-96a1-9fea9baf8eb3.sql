
-- Fix search_path for generate_ticket_number
CREATE OR REPLACE FUNCTION public.generate_ticket_number()
RETURNS trigger
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.ticket_number := 'TK-' || LPAD(nextval('support_ticket_seq')::text, 6, '0');
  RETURN NEW;
END;
$$;
