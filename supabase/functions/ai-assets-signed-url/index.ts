import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')!;

    // --- Auth ---
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) return jsonError('Unauthorized', 401);

    const userClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });
    const { data: { user }, error: authErr } = await userClient.auth.getUser();
    if (authErr || !user) return jsonError('Unauthorized', 401);

    const { org_id, asset_id } = await req.json();
    if (!org_id || !asset_id) return jsonError('org_id and asset_id required', 400);

    const admin = createClient(supabaseUrl, serviceKey);

    // --- Permission ---
    const { data: member } = await admin
      .from('organization_members')
      .select('role')
      .eq('user_id', user.id)
      .eq('organization_id', org_id)
      .maybeSingle();

    const { data: isSuperadmin } = await admin.rpc('is_superadmin', { _user_id: user.id });

    if (!member && !isSuperadmin) {
      return jsonError('Forbidden: not a member of this organization', 403);
    }

    // --- Load asset ---
    const { data: asset, error: assetErr } = await admin
      .from('ai_assets')
      .select('*')
      .eq('id', asset_id)
      .eq('org_id', org_id)
      .single();

    if (assetErr || !asset) return jsonError('Asset not found', 404);

    // --- Generate signed URL ---
    const expiresIn = 3600; // 1 hour
    const { data: signedData, error: signErr } = await admin.storage
      .from(asset.storage_bucket)
      .createSignedUrl(asset.storage_path, expiresIn);

    if (signErr || !signedData) {
      console.error('Signed URL error:', signErr);
      return jsonError('Failed to generate signed URL', 500);
    }

    return new Response(JSON.stringify({
      ok: true,
      url: signedData.signedUrl,
      expires_in: expiresIn,
      asset_type: asset.asset_type,
      mime_type: asset.mime_type,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (e) {
    console.error('ai-assets-signed-url error:', e);
    return jsonError(e instanceof Error ? e.message : 'Internal error', 500);
  }
});

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}
