CREATE POLICY "reviews_select_own" ON public.product_reviews
  FOR SELECT TO authenticated
  USING (user_id = auth.uid());