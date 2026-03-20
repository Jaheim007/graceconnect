import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import * as jose from 'jsr:@panva/jose@6';

export type AuthContext = {
  supabaseUrl: string;
  anonKey: string;
  serviceKey: string;
  authHeader: string;
  userId: string;
};

export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

export function jsonResp(body: unknown, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

const SUPABASE_JWT_ISSUER =
  Deno.env.get('SB_JWT_ISSUER') ?? `${Deno.env.get('SUPABASE_URL')}/auth/v1`;

const SUPABASE_JWT_KEYS = jose.createRemoteJWKSet(
  new URL(`${Deno.env.get('SUPABASE_URL')}/auth/v1/.well-known/jwks.json`),
);

export async function requireAuth(req: Request): Promise<AuthContext | Response> {
  const authHeader = req.headers.get('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return jsonResp({ error: 'Unauthorized' }, 401);
  }

  const token = authHeader.replace('Bearer ', '').trim();
  if (!token) {
    return jsonResp({ error: 'Unauthorized' }, 401);
  }

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const anonKey = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY') || serviceKey;

  try {
    const { payload } = await jose.jwtVerify(token, SUPABASE_JWT_KEYS, {
      issuer: SUPABASE_JWT_ISSUER,
    });
    const userId = typeof payload.sub === 'string' ? payload.sub : null;
    if (!userId) {
      return jsonResp({ error: 'Unauthorized' }, 401);
    }

    return { supabaseUrl, anonKey, serviceKey, authHeader, userId };
  } catch (error) {
    console.error('[requireAuth] JWT verification failed', error instanceof Error ? error.message : error);
    return jsonResp({ error: 'Unauthorized' }, 401);
  }
}

export function adminClient(supabaseUrl: string, serviceKey: string) {
  return createClient(supabaseUrl, serviceKey);
}
