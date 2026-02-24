
-- Clean up bundle_items and product_recommendations in delete_organization function
-- These cascade on delete from digital_products, so no explicit deletion needed.

-- Add UPDATE policy for product_recommendations (needed for reordering)
CREATE POLICY "recommendations_manager_update" ON public.product_recommendations FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.digital_products dp WHERE dp.id = product_id AND can_manage_org(auth.uid(), dp.organization_id)));

CREATE POLICY "bundle_items_manager_update" ON public.bundle_items FOR UPDATE
  USING (EXISTS (SELECT 1 FROM public.digital_products dp WHERE dp.id = bundle_product_id AND can_manage_org(auth.uid(), dp.organization_id)));
