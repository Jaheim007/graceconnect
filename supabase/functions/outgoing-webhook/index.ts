import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const { org_id, event, data } = await req.json();
    if (!org_id || !event) {
      return new Response(JSON.stringify({ error: 'org_id and event required' }), { status: 400, headers: corsHeaders });
    }

    // Get active webhooks for this org
    const { data: webhooks } = await supabase
      .from('org_webhooks')
      .select('*')
      .eq('org_id', org_id)
      .eq('is_active', true);

    if (!webhooks?.length) {
      return new Response(JSON.stringify({ sent: 0 }), { headers: corsHeaders });
    }

    const timestamp = new Date().toISOString();
    let sent = 0;

    for (const webhook of webhooks) {
      // Check if event is in allowed list (empty = all)
      if (webhook.events?.length > 0 && !webhook.events.includes(event)) continue;

      const payload = {
        event,
        timestamp,
        organization_id: org_id,
        data,
      };

      // Create HMAC signature
      const encoder = new TextEncoder();
      const key = await crypto.subtle.importKey(
        'raw',
        encoder.encode(webhook.secret),
        { name: 'HMAC', hash: 'SHA-256' },
        false,
        ['sign']
      );
      const payloadStr = JSON.stringify(payload);
      const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadStr));
      const signatureHex = Array.from(new Uint8Array(signature)).map(b => b.toString(16).padStart(2, '0')).join('');

      // Record delivery
      const { data: delivery } = await supabase
        .from('webhook_deliveries')
        .insert({
          webhook_id: webhook.id,
          event,
          payload,
          status: 'pending',
        })
        .select('id')
        .single();

      // Send
      try {
        const res = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-SiteViral-Signature': signatureHex,
            'X-SiteViral-Event': event,
          },
          body: payloadStr,
          signal: AbortSignal.timeout(10000),
        });

        await supabase.from('webhook_deliveries').update({
          status: res.ok ? 'delivered' : 'failed',
          response_code: res.status,
          response_body: (await res.text()).slice(0, 500),
          attempts: 1,
          completed_at: new Date().toISOString(),
        }).eq('id', delivery!.id);

        if (res.ok) sent++;
      } catch (err: any) {
        // Schedule retry
        const nextRetry = new Date(Date.now() + 60_000).toISOString();
        await supabase.from('webhook_deliveries').update({
          status: 'retrying',
          response_body: err.message?.slice(0, 500),
          attempts: 1,
          next_retry_at: nextRetry,
        }).eq('id', delivery!.id);
      }
    }

    return new Response(JSON.stringify({ sent }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (err: any) {
    console.error('outgoing-webhook error:', err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
