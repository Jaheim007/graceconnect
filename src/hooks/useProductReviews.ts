import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';

export interface ProductReview {
  id: string;
  product_id: string;
  user_id: string;
  organization_id: string;
  rating: number;
  title: string | null;
  comment: string | null;
  helpful_count: number;
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
        .select('*, profiles(display_name, avatar_url)')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (!data) return null;
      return { ...(data as any), profile: (data as any).profiles } as ProductReview;
    },
    enabled: !!productId && !!user,
  });
}

export function useSubmitReview() {
  const qc = useQueryClient();
  const { user } = useAuth();

  return useMutation({
    mutationFn: async ({
      productId, organizationId, rating, title, comment, isVerifiedPurchase,
    }: {
      productId: string; organizationId: string; rating: number; title: string; comment: string; isVerifiedPurchase: boolean;
    }) => {
      if (!user) throw new Error('Not authenticated');

      const { data: existing } = await db
        .from('product_reviews')
        .select('id')
        .eq('product_id', productId)
        .eq('user_id', user.id)
        .maybeSingle();

      if (existing) {
        const { error } = await db
          .from('product_reviews')
          .update({
            rating,
            title: title || null,
            comment: comment || null,
            updated_at: new Date().toISOString(),
          } as any)
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
            title: title || null,
            comment: comment || null,
            is_verified_purchase: isVerifiedPurchase,
          } as any);
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

export function useHelpfulReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ reviewId, productId }: { reviewId: string; productId: string }) => {
      // Simple increment — could be improved with a user-specific tracking table
      const { error } = await db.rpc('increment_review_helpful' as any, { review_id: reviewId });
      if (error) {
        // Fallback: direct update if RPC doesn't exist
        const { data } = await db
          .from('product_reviews')
          .select('helpful_count' as any)
          .eq('id', reviewId)
          .single();
        const current = (data as any)?.helpful_count || 0;
        await db
          .from('product_reviews')
          .update({ helpful_count: current + 1 } as any)
          .eq('id', reviewId);
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['product-reviews', vars.productId] });
    },
  });
}

export function useDeleteReview() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ reviewId, productId }: { reviewId: string; productId: string }) => {
      const { error } = await db.from('product_reviews').delete().eq('id', reviewId);
      if (error) throw error;

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
