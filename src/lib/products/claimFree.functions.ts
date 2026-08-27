import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { ClaimFreeInput, ClaimFreeResult } from './claimFree.server';

export const claimFreeProduct = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ClaimFreeInput) => {
    if (!input?.product_id || !input?.organization_id) {
      throw new Error('product_id and organization_id are required');
    }
    return {
      product_id: String(input.product_id),
      organization_id: String(input.organization_id),
    };
  })
  .handler(async ({ data, context }): Promise<ClaimFreeResult> => {
    const { runClaimFreeProduct } = await import('./claimFree.server');
    return runClaimFreeProduct(data, context.userId);
  });
