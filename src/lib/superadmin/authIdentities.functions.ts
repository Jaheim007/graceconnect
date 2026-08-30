import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';

export const getAuthIdentities = createServerFn({ method: 'GET' })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { assertSuperadmin, listAuthIdentities } = await import('./authIdentities.server');
    await assertSuperadmin(context.supabase, context.userId);
    return { identities: await listAuthIdentities() };
  });
