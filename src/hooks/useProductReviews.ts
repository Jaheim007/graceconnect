import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  organization_id: string;
  rating: number;
  comment: string | null;
  is_verified_purchase: boolean;
  is_published: boolean;
  created_at: string;
  updated_at: string;
  profile?: { display_name: string | null; avatar_url: string | null };
}

export function useProductReviews(productId: string | undefined) {
  return useQuery({
    queryKey: ['product-reviews', productId],
    queryFn: async () => {
      if (!productId) return [];
      const { data, error } = await db
        .from('product_reviews')
        .select('*, profiles(display_name, avatar_url)')
        .eq('product_id', productId)
        .eq('is_published', true)
        .order('created_at', { ascending: false });
      if (error) throw error;
      return (data || []).map((r: any) => ({ ...r, profile: r.profiles })) as ProductReview[];
    },
    enabled: !!productId,
  });
}

export function useMyReview(productId: string | undefined) {
  const { user } = useAuth();
  return useQuery({
    queryKey: ['my-review', productId, user?.id],
    queryFn: async () => {
      if (!productId || !user) return null;
      const { data } = await db
        .from('product_reviews')
        .select('*')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .maybeSingle();
      return data as ProductReview | null;
    },
    enabled: !!productId && !!user,
  });
}

export function useSubmitReview() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      productId, organizationId, rating, comment, isVerifiedPurchase,
    }: {
      productId: string; organizationId: string; rating: number; comment: string; isVerifiedPurchase: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');

      // Check if review already exists
      const { data: existing } = await db
        .from('product_reviews')
        .select('id')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await db
          .from('product_reviews')
          .update({ rating, comment: comment || null, updated_at: new Date().toISOString() })
          .eq('id', existing.id);
        if (error) throw error;
      } else {
        const { error } = await db
          .from('product_reviews')
          .insert({
            product_id: productId,
            user_id: user.id,
            organization_id: organizationId,
            rating,
            comment: comment || null,
            is_verified_purchase: isVerifiedPurchase,
          });
        if (error) throw error;
      }

      // Update average rating on product
      const { data: reviews } = await db
        .from('product_reviews')
        .select('rating')
        .eq('product_id', productId)
        .eq('is_published', true);

      if (reviews && reviews.length > 0) {
        const avg = reviews.reduce((s, r) => s + r.rating, 0) / reviews.length;
        await db
          .from('digital_products')
          .update({ average_rating: Math.round(avg * 10) / 10, review_count: reviews.length })
          .eq('id', productId);
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['product-reviews', vars.productId] });
      qc.invalidateQueries({ queryKey: ['my-review', vars.productId] });
      qc.invalidateQueries({ queryKey: ['product-detail'] });
    },
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ reviewId, productId }: { reviewId: string; productId: string }) => {
      const { error } = await db.from('product_reviews').delete().eq('id', reviewId);
      if (error) throw error;

      // Recalculate average
      const { data: reviews } = await db
        .from('product_reviews')
        .select('rating')
        .eq('product_id', productId)
        .eq('is_published', true);

      const count = reviews?.length || 0;
      const avg = count > 0 ? reviews!.reduce((s, r) => s + r.rating, 0) / count : 0;
      await db
        .from('digital_products')
        .update({ average_rating: Math.round(avg * 10) / 10, review_count: count })
        .eq('id', productId);
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['product-reviews', vars.productId] });
      qc.invalidateQueries({ queryKey: ['my-review', vars.productId] });
      qc.invalidateQueries({ queryKey: ['product-detail'] });
    },
  });
}
