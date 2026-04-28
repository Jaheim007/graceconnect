import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createRemoteJWKSet, jwtVerify } from 'https://esm.sh/jose@5.9.6';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const ONESIGNAL_APP_ID = '8b981e58-37db-409f-8372-7a1299547e2b';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const JWKS = createRemoteJWKSet(new URL(`${SUPABASE_URL}/auth/v1/.well-known/jwks.json`));

async function verifyJwt(token: string) {
  const { payload } = await jwtVerify(token, JWKS, { issuer: `${SUPABASE_URL}/auth/v1` });
  return payload;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');
  const db = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const token = authHeader.replace('Bearer ', '');
    let claims: any;
    try {
      claims = await verifyJwt(token);
    } catch {
      return new Response(JSON.stringify({ error: 'Invalid token' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const userId = claims.sub as string;
    if (!userId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const body = await req.json();
    const { action, device_token, platform, organization_id, device_model, app_version, onesignal_player_id } = body || {};

    if (action === 'unregister') {
      if (!device_token) return new Response(JSON.stringify({ error: 'device_token required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      await db.from('mobile_device_tokens').delete().eq('user_id', userId).eq('token', device_token);
      return new Response(JSON.stringify({ ok: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Default: register
    if (!device_token || !platform || !['ios', 'android'].includes(platform)) {
      return new Response(JSON.stringify({ error: 'device_token and valid platform required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Upsert token
    const { error: upsertErr } = await db.from('mobile_device_tokens').upsert({
      user_id: userId,
      organization_id: organization_id || null,
      token: device_token,
      platform,
      device_model: device_model || null,
      app_version: app_version || null,
      last_active_at: new Date().toISOString(),
    }, { onConflict: 'token' });

    if (upsertErr) {
      console.error('upsert error:', upsertErr);
      return new Response(JSON.stringify({ error: upsertErr.message }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Link OneSignal player to External User ID = supabase user id
    let oneSignalSynced = false;
    if (ONESIGNAL_REST_API_KEY && onesignal_player_id) {
      try {
        const res = await fetch(`https://api.onesignal.com/apps/${ONESIGNAL_APP_ID}/users/by/onesignal_id/${onesignal_player_id}/identity`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
          },
          body: JSON.stringify({ identity: { external_id: userId } }),
        });
        oneSignalSynced = res.ok;
        if (!res.ok) console.warn('OneSignal identity link failed:', await res.text());
      } catch (e) {
        console.warn('OneSignal sync error:', e);
      }
    }

    return new Response(JSON.stringify({ ok: true, oneSignalSynced }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('register-mobile-device error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
