
-- Replace the overly permissive INSERT policy with one that requires either auth or email
DROP POLICY "Anyone can create offering transactions" ON public.offering_transactions;

CREATE POLICY "Authenticated or guest with email can create offering transactions"
  ON public.offering_transactions FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL OR donor_email IS NOT NULL);
