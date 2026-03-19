-- Fix search_path for security
ALTER FUNCTION public.auto_capture_buyer_contact() SET search_path = public;
ALTER FUNCTION public.auto_capture_donor_contact() SET search_path = public;