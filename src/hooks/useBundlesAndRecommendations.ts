import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';

// --- Bundle Items ---
export function useBundleItems(bundleProductId: string | undefined) {
  return useQuery({
    queryKey: ['bundle-items', bundleProductId],
    queryFn: async () => {
      if (!bundleProductId) return [];
      const { data } = await db
        .from('bundle_items')
        .select('*, digital_products!bundle_items_included_product_id_fkey(id, title, cover_image_url, price, currency, is_free, product_type, slug)')
        .eq('bundle_product_id', bundleProductId)
        .order('display_order', { ascending: true });
      return (data || []).map((item: any) => ({
        ...item,
        included_product: item.digital_products,
      }));
    },
    enabled: !!bundleProductId,
  });
}

export function useAddBundleItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ bundleProductId, includedProductId }: { bundleProductId: string; includedProductId: string }) => {
      const { error } = await db.from('bundle_items').insert({
        bundle_product_id: bundleProductId,
        included_product_id: includedProductId,
      });
      if (error) throw error;
    },
    onSuccess: (_: unknown, vars) => {
      qc.invalidateQueries({ queryKey: ['bundle-items', vars.bundleProductId] });
    },
  });
}

export function useRemoveBundleItem() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, bundleProductId }: { id: string; bundleProductId: string }) => {
      const { error } = await db.from('bundle_items').delete().eq('id', id);
      if (error) throw error;
      return bundleProductId;
    },
    onSuccess: (_: unknown, vars) => {
      qc.invalidateQueries({ queryKey: ['bundle-items', vars.bundleProductId] });
    },
  });
}

// --- Product Recommendations ---
export function useProductRecommendations(productId: string | undefined) {
  return useQuery({
    queryKey: ['product-recommendations', productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data } = await db
        .from('product_recommendations')
        .select('*, digital_products!product_recommendations_recommended_product_id_fkey(id, title, cover_image_url, price, currency, is_free, product_type, slug, organization_id)')
        .eq('product_id', productId)
        .order('display_order', { ascending: true });
      return (data || []).map((item: any) => ({
        ...item,
        recommended_product: item.digital_products,
      }));
    },
    enabled: !!productId,
  });
}

export function useAddRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ productId, recommendedProductId, type }: { productId: string; recommendedProductId: string; type: string }) => {
      const { error } = await db.from('product_recommendations').insert({
        product_id: productId,
        recommended_product_id: recommendedProductId,
        recommendation_type: type,
      });
      if (error) throw error;
    },
    onSuccess: (_: unknown, vars) => {
      qc.invalidateQueries({ queryKey: ['product-recommendations', vars.productId] });
    },
  });
}

export function useRemoveRecommendation() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, productId }: { id: string; productId: string }) => {
      const { error } = await db.from('product_recommendations').delete().eq('id', id);
      if (error) throw error;
      return productId;
    },
    onSuccess: (_: unknown, vars) => {
      qc.invalidateQueries({ queryKey: ['product-recommendations', vars.productId] });
    },
  });
}
