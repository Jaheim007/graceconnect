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
    // Auth check - require authenticated user
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }
    const token = authHeader.replace('Bearer ', '');
    const anonClient = createClient(SUPABASE_URL, Deno.env.get('SUPABASE_PUBLISHABLE_KEY') ?? SERVICE_KEY, {
      global: { headers: { Authorization: authHeader } }
    });
    const { data: claims } = await anonClient.auth.getClaims(token);
    const callerId = claims?.claims?.sub;
    if (!callerId) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const { user_id, organization_id, title, body, url, tag } = await req.json();

    // Verify caller can manage the org (if org notification) or is sending to self
    if (organization_id) {
      const { data: canManage } = await db.rpc('can_manage_org', { _user_id: callerId, _org_id: organization_id });
      if (!canManage) {
        return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    } else if (user_id && user_id !== callerId) {
      // Only allow sending to self unless org manager
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!user_id && !organization_id) {
      return new Response(JSON.stringify({ error: 'user_id or organization_id required' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get subscriptions for user or org
    let query = db.from('push_subscriptions').select('*');
    if (user_id) query = query.eq('user_id', user_id);
    else if (organization_id) query = query.eq('organization_id', organization_id);

    const { data: subs } = await query;
    const webPushSent = subs?.length ?? 0;

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

    // Send native push via OneSignal (FCM/APNs) targeting external_user_id
    let nativeSent = 0;
    const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');
    const ONESIGNAL_APP_ID = '8b981e58-37db-409f-8372-7a1299547e2b';
    if (ONESIGNAL_REST_API_KEY) {
      try {
        let externalIds: string[] = [];
        if (user_id) {
          externalIds = [user_id];
        } else if (organization_id) {
          const { data: tokens } = await db
            .from('mobile_device_tokens')
            .select('user_id')
            .eq('organization_id', organization_id);
          externalIds = [...new Set((tokens || []).map((t: any) => t.user_id))];
        }
        if (externalIds.length > 0) {
          const osPayload: any = {
            app_id: ONESIGNAL_APP_ID,
            include_aliases: { external_id: externalIds },
            target_channel: 'push',
            headings: { en: title, fr: title },
            contents: { en: body, fr: body },
          };
          if (url) osPayload.url = url;
          if (tag) osPayload.android_group = tag;
          const osRes = await fetch('https://api.onesignal.com/notifications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
            },
            body: JSON.stringify(osPayload),
          });
          const osData = await osRes.json();
          nativeSent = osData?.recipients ?? 0;
          if (!osRes.ok) console.warn('OneSignal send failed:', osData);
        }
      } catch (e) {
        console.warn('OneSignal send error:', e);
      }
    }

    return new Response(JSON.stringify({
      ok: true,
      sent: webPushSent + nativeSent,
      web_push_sent: webPushSent,
      native_sent: nativeSent,
      pending_push: !VAPID_PRIVATE_KEY,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('send-push error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
