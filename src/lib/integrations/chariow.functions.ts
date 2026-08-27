import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

const CHARIOW_BASE = 'https://api.chariow.com/v1';

interface ChariowInput {
  action: 'list' | 'detail' | 'store';
  api_key: string;
  cursor?: string;
  per_page?: number;
  product_id?: string;
}

// Proxies the Chariow API with the user's own key (never stored server-side).
export const chariowProxy = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: ChariowInput) => {
    if (!input?.api_key) throw new Error('API key is required. Please provide your Chariow API key.');
    if (!['list', 'detail', 'store'].includes(input.action)) throw new Error('Invalid action');
    return input;
  })
  .handler(async ({ data }): Promise<any> => {
    const { action, api_key, cursor, per_page, product_id } = data;

    let url: string;
    if (action === 'list') {
      const params = new URLSearchParams({ per_page: String(per_page || 50) });
      if (cursor) params.set('cursor', cursor);
      url = `${CHARIOW_BASE}/products?${params}`;
    } else if (action === 'detail') {
      if (!product_id) return { error: 'Invalid action' };
      url = `${CHARIOW_BASE}/products/${product_id}`;
    } else {
      url = `${CHARIOW_BASE}/store`;
    }

    const res = await fetch(url, {
      headers: { Authorization: `Bearer ${api_key}`, 'Content-Type': 'application/json' },
    });
    const body = await res.json().catch(() => ({}));
    if (!res.ok) {
      return { error: (body as any)?.message || `Chariow API error (${res.status})` };
    }
    return body;
  });
