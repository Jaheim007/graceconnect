// Server-only API key management. Ported from the `api-keys-manage` edge
// function; hashing stays SHA-256 hex so keys issued here keep working with the
// public API functions that verify them.

export interface ApiKeyRow {
  id: string;
  name: string;
  key_prefix: string;
  scopes: string[];
  last_used_at?: string | null;
  expires_at?: string | null;
  revoked_at?: string | null;
  created_at: string;
}

export async function hashApiKey(rawKey: string): Promise<string> {
  const data = new TextEncoder().encode(rawKey);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hashBuffer))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

export function generateApiKey(): { raw: string; prefix: string } {
  const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  let body = '';
  for (const b of bytes) body += alphabet[b % alphabet.length];
  const raw = `sv_live_${body}`;
  return { raw, prefix: raw.slice(0, 12) };
}

async function requireOrgAdmin(orgId: string, userId: string) {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const db = supabaseAdmin as any;
  const { data: member } = await db
    .from('organization_members')
    .select('role')
    .eq('organization_id', orgId)
    .eq('user_id', userId)
    .maybeSingle();
  if (!member || !['owner', 'admin'].includes(String(member.role))) {
    throw new Error('forbidden');
  }
  return db;
}

export async function listApiKeys(orgId: string, userId: string): Promise<{ keys: ApiKeyRow[] }> {
  const db = await requireOrgAdmin(orgId, userId);
  const { data, error } = await db
    .from('api_keys')
    .select('id, name, key_prefix, scopes, last_used_at, expires_at, revoked_at, created_at')
    .eq('org_id', orgId)
    .order('created_at', { ascending: false });
  if (error) throw new Error(error.message);
  return { keys: (data ?? []) as ApiKeyRow[] };
}

export async function createApiKey(
  orgId: string,
  userId: string,
  name: string,
  scopesInput: unknown,
): Promise<{ key: ApiKeyRow; raw_key: string }> {
  const db = await requireOrgAdmin(orgId, userId);
  const scopes =
    Array.isArray(scopesInput) && scopesInput.every((s) => typeof s === 'string')
      ? (scopesInput as string[]).filter((s) => ['read', 'write'].includes(s))
      : ['read'];
  const trimmed = String(name ?? '').trim();
  if (!trimmed || trimmed.length > 80) throw new Error('invalid_name');
  if (scopes.length === 0) throw new Error('invalid_scopes');

  const { raw, prefix } = generateApiKey();
  const keyHash = await hashApiKey(raw);

  const { data, error } = await db
    .from('api_keys')
    .insert({
      org_id: orgId,
      created_by: userId,
      name: trimmed,
      key_prefix: prefix,
      key_hash: keyHash,
      scopes,
    })
    .select('id, name, key_prefix, scopes, created_at')
    .single();
  if (error) throw new Error(error.message);

  // Raw key is returned exactly once and never stored.
  return { key: data as ApiKeyRow, raw_key: raw };
}

export async function revokeApiKey(orgId: string, userId: string, keyId: string): Promise<{ ok: true }> {
  const db = await requireOrgAdmin(orgId, userId);
  if (!keyId) throw new Error('missing_key_id');
  const { error } = await db
    .from('api_keys')
    .update({ revoked_at: new Date().toISOString() })
    .eq('id', keyId)
    .eq('org_id', orgId);
  if (error) throw new Error(error.message);
  return { ok: true };
}
