import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';

export function useWishlist() {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['wishlist', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const { data } = await db
        .from('wishlists')
        .select('*, digital_products(*, organizations(name, slug, logo_url, currency))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user,
  });
}

export function useIsWishlisted(productId: string | undefined) {
  const { user } = useAuth();

  return useQuery({
    queryKey: ['wishlist-check', user?.id, productId],
    queryFn: async () => {
      if (!user || !productId) return false;
      const { count } = await db
        .from('wishlists')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('product_id', productId);
      return (count || 0) > 0;
    },
    enabled: !!user && !!productId,
  });
}

export function useToggleWishlist() {
  const { user } = useAuth();
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async ({ productId, isCurrentlyWishlisted }: { productId: string; isCurrentlyWishlisted: boolean }) => {
      if (!user) throw new Error('Not authenticated');

      if (isCurrentlyWishlisted) {
        await db.from('wishlists').delete().eq('user_id', user.id).eq('product_id', productId);
      } else {
        await db.from('wishlists').insert({ user_id: user.id, product_id: productId });
      }
    },
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ['wishlist'] });
      qc.invalidateQueries({ queryKey: ['wishlist-check', user?.id, vars.productId] });
    },
  });
}
