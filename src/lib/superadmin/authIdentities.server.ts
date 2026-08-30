// Server-only: read auth identity info (email, provider, last sign-in) for
// profiles that have no display_name, so the superadmin users list can show a
// real person instead of a truncated user id.
import { assertSuperadmin } from '@/lib/moderation/moderation.server';

export interface AuthIdentity {
  id: string;
  email: string | null;
  provider: string | null;
  last_sign_in_at: string | null;
  confirmed: boolean;
}

export async function listAuthIdentities(): Promise<AuthIdentity[]> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');

  const out: AuthIdentity[] = [];
  const perPage = 1000;
  for (let page = 1; page <= 20; page++) {
    const { data, error } = await supabaseAdmin.auth.admin.listUsers({ page, perPage });
    if (error) throw error;
    const users = data?.users ?? [];
    for (const u of users) {
      out.push({
        id: u.id,
        email: u.email ?? null,
        provider: (u.app_metadata as any)?.provider ?? null,
        last_sign_in_at: u.last_sign_in_at ?? null,
        confirmed: !!(u.email_confirmed_at || u.confirmed_at),
      });
    }
    if (users.length < perPage) break;
  }
  return out;
}

export { assertSuperadmin };
