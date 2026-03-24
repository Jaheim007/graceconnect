CREATE POLICY "credit_purchases_superadmin_select"
  ON public.credit_purchases
  FOR SELECT
  TO authenticated
  USING (is_superadmin(auth.uid()));