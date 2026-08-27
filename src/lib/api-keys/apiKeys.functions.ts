import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import type { ApiKeyRow } from './apiKeys.server';

export const listOrgApiKeys = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { org_id: string }) => {
    if (!input?.org_id) throw new Error('missing_org_id');
    return { org_id: String(input.org_id) };
  })
  .handler(async ({ data, context }): Promise<{ keys: ApiKeyRow[] }> => {
    const { listApiKeys } = await import('./apiKeys.server');
    return listApiKeys(data.org_id, context.userId);
  });

export const createOrgApiKey = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { org_id: string; name: string; scopes?: string[] }) => {
    if (!input?.org_id) throw new Error('missing_org_id');
    return {
      org_id: String(input.org_id),
      name: String(input.name ?? ''),
      scopes: input.scopes,
    };
  })
  .handler(async ({ data, context }): Promise<{ key: ApiKeyRow; raw_key: string }> => {
    const { createApiKey } = await import('./apiKeys.server');
    return createApiKey(data.org_id, context.userId, data.name, data.scopes);
  });

export const revokeOrgApiKey = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { org_id: string; key_id: string }) => {
    if (!input?.org_id) throw new Error('missing_org_id');
    if (!input?.key_id) throw new Error('missing_key_id');
    return { org_id: String(input.org_id), key_id: String(input.key_id) };
  })
  .handler(async ({ data, context }): Promise<{ ok: true }> => {
    const { revokeApiKey } = await import('./apiKeys.server');
    return revokeApiKey(data.org_id, context.userId, data.key_id);
  });
