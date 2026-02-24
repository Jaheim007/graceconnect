import { useCallback } from 'react';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';

export function useAbandonedCart() {
  const { user } = useAuth();

  const trackCartOpen = useCallback(async (productId: string, organizationId: string) => {
    if (!user) return;
    try {
      // Check if there's already a recent unconverted cart for this product
      const { data: existing } = await db
        .from('abandoned_carts')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .eq('converted', false)
        .maybeSingle();

      if (existing) return; // Already tracking

      await db.from('abandoned_carts').insert({
        user_id: user.id,
        product_id: productId,
        organization_id: organizationId,
        email: user.email,
      });
    } catch (e) {
      console.warn('[AbandonedCart] Failed to track:', e);
    }
  }, [user]);

  const markConverted = useCallback(async (productId: string) => {
    if (!user) return;
    try {
      await db
        .from('abandoned_carts')
        .update({ converted: true, converted_at: new Date().toISOString() })
        .eq('user_id', user.id)
        .eq('product_id', productId)
        .eq('converted', false);
    } catch (e) {
      console.warn('[AbandonedCart] Failed to mark converted:', e);
    }
  }, [user]);

  return { trackCartOpen, markConverted };
}
