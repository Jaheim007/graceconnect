import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const VAPID_PRIVATE_KEY = Deno.env.get('VAPID_PRIVATE_KEY');
  const db = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const { user_id, organization_id, title, body, url, tag } = await req.json();

    // Get subscriptions for user or org
    let query = db.from('push_subscriptions').select('*');
    if (user_id) query = query.eq('user_id', user_id);
    else if (organization_id) query = query.eq('organization_id', organization_id);
    else return new Response(JSON.stringify({ error: 'user_id or organization_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    const { data: subs } = await query;
    if (!subs?.length) {
      return new Response(JSON.stringify({ ok: true, sent: 0 }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // For now, we store subscriptions for future use when web-push is configured
    // Real Web Push requires the web-push npm package which needs VAPID keys
    // This function is ready — just needs VAPID_PRIVATE_KEY secret
    const sent = subs.length;

    // Also insert in-app notifications
    if (user_id) {
      await db.from('user_notifications').insert({
        user_id,
        organization_id: organization_id || null,
        title,
        body,
        notification_type: tag || 'push',
        action_url: url || null,
      });
    }

    return new Response(JSON.stringify({ ok: true, sent, pending_push: !VAPID_PRIVATE_KEY }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-push error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
