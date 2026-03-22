import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

/**
 * retry-webhooks: Scheduled Edge Function that retries failed webhook deliveries.
 * 
 * Strategy:
 * - Finds deliveries with status='retrying' and next_retry_at <= now()
 * - Retries with exponential backoff: 1min, 5min, 15min, 60min, 240min
 * - Max 5 attempts, then marks as 'failed'
 * - Auto-pauses webhook endpoints after 10 consecutive failures
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const BACKOFF_INTERVALS = [60, 300, 900, 3600, 14400]; // seconds
const MAX_ATTEMPTS = 5;
const AUTO_PAUSE_THRESHOLD = 10;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
  const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const supabase = createClient(supabaseUrl, serviceKey);

  try {
    // Find deliveries ready for retry
    const { data: deliveries, error } = await supabase
      .from('webhook_deliveries')
      .select('*, org_webhooks:webhook_id(id, url, secret, is_active, org_id)')
      .eq('status', 'retrying')
      .lte('next_retry_at', new Date().toISOString())
      .order('next_retry_at', { ascending: true })
      .limit(50);

    if (error) {
      console.error('[retry-webhooks] Query error:', error);
      return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: corsHeaders });
    }

    if (!deliveries?.length) {
      return new Response(JSON.stringify({ retried: 0, message: 'No deliveries to retry' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let retried = 0;
    let succeeded = 0;
    let permanentlyFailed = 0;

    for (const delivery of deliveries) {
      const webhook = delivery.org_webhooks as any;
      if (!webhook?.is_active || !webhook?.url) {
        // Webhook was deactivated — mark delivery as failed
        await supabase.from('webhook_deliveries').update({
          status: 'failed',
          response_body: 'Webhook endpoint deactivated',
          completed_at: new Date().toISOString(),
        }).eq('id', delivery.id);
        permanentlyFailed++;
        continue;
      }

      const currentAttempts = (delivery.attempts || 1);
      if (currentAttempts >= MAX_ATTEMPTS) {
        await supabase.from('webhook_deliveries').update({
          status: 'failed',
          response_body: `Max attempts (${MAX_ATTEMPTS}) reached`,
          completed_at: new Date().toISOString(),
        }).eq('id', delivery.id);
        permanentlyFailed++;

        // Check if we should auto-pause this endpoint
        await checkAutoPause(supabase, webhook.id);
        continue;
      }

      // Re-sign and send
      try {
        const payloadStr = JSON.stringify(delivery.payload);
        const encoder = new TextEncoder();
        const key = await crypto.subtle.importKey(
          'raw',
          encoder.encode(webhook.secret),
          { name: 'HMAC', hash: 'SHA-256' },
          false,
          ['sign'],
        );
        const signature = await crypto.subtle.sign('HMAC', key, encoder.encode(payloadStr));
        const signatureHex = Array.from(new Uint8Array(signature))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');

        const res = await fetch(webhook.url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'X-SiteViral-Signature': signatureHex,
            'X-SiteViral-Event': delivery.event,
            'X-SiteViral-Retry': String(currentAttempts),
          },
          body: payloadStr,
          signal: AbortSignal.timeout(10000),
        });

        const responseBody = (await res.text()).slice(0, 500);

        if (res.ok) {
          await supabase.from('webhook_deliveries').update({
            status: 'delivered',
            response_code: res.status,
            response_body: responseBody,
            attempts: currentAttempts + 1,
            completed_at: new Date().toISOString(),
            next_retry_at: null,
          }).eq('id', delivery.id);
          succeeded++;
        } else {
          // Schedule next retry with exponential backoff
          const backoffIdx = Math.min(currentAttempts, BACKOFF_INTERVALS.length - 1);
          const nextRetryAt = new Date(Date.now() + BACKOFF_INTERVALS[backoffIdx] * 1000).toISOString();

          await supabase.from('webhook_deliveries').update({
            status: currentAttempts + 1 >= MAX_ATTEMPTS ? 'failed' : 'retrying',
            response_code: res.status,
            response_body: responseBody,
            attempts: currentAttempts + 1,
            next_retry_at: currentAttempts + 1 >= MAX_ATTEMPTS ? null : nextRetryAt,
            completed_at: currentAttempts + 1 >= MAX_ATTEMPTS ? new Date().toISOString() : null,
          }).eq('id', delivery.id);

          if (currentAttempts + 1 >= MAX_ATTEMPTS) {
            permanentlyFailed++;
            await checkAutoPause(supabase, webhook.id);
          }
        }

        retried++;
      } catch (err: any) {
        // Network error — schedule another retry
        const backoffIdx = Math.min(currentAttempts, BACKOFF_INTERVALS.length - 1);
        const nextRetryAt = new Date(Date.now() + BACKOFF_INTERVALS[backoffIdx] * 1000).toISOString();

        await supabase.from('webhook_deliveries').update({
          status: currentAttempts + 1 >= MAX_ATTEMPTS ? 'failed' : 'retrying',
          response_body: (err.message || 'Network error').slice(0, 500),
          attempts: currentAttempts + 1,
          next_retry_at: currentAttempts + 1 >= MAX_ATTEMPTS ? null : nextRetryAt,
          completed_at: currentAttempts + 1 >= MAX_ATTEMPTS ? new Date().toISOString() : null,
        }).eq('id', delivery.id);

        if (currentAttempts + 1 >= MAX_ATTEMPTS) {
          permanentlyFailed++;
          await checkAutoPause(supabase, webhook.id);
        }
        retried++;
      }
    }

    console.log(`[retry-webhooks] Processed ${retried} retries, ${succeeded} succeeded, ${permanentlyFailed} permanently failed`);

    return new Response(JSON.stringify({ retried, succeeded, permanentlyFailed }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err: any) {
    console.error('[retry-webhooks] Error:', err);
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: corsHeaders,
    });
  }
});

/**
 * Auto-pause a webhook endpoint after too many consecutive failures.
 */
async function checkAutoPause(
  supabase: ReturnType<typeof createClient>,
  webhookId: string,
) {
  try {
    const { data: recentDeliveries } = await supabase
      .from('webhook_deliveries')
      .select('status')
      .eq('webhook_id', webhookId)
      .order('created_at', { ascending: false })
      .limit(AUTO_PAUSE_THRESHOLD);

    if (!recentDeliveries || recentDeliveries.length < AUTO_PAUSE_THRESHOLD) return;

    const allFailed = recentDeliveries.every((d: any) => d.status === 'failed');
    if (allFailed) {
      await supabase.from('org_webhooks').update({ is_active: false }).eq('id', webhookId);
      console.warn(`[retry-webhooks] Auto-paused webhook ${webhookId} after ${AUTO_PAUSE_THRESHOLD} consecutive failures`);
    }
  } catch (err) {
    console.warn('[retry-webhooks] Auto-pause check error:', err);
  }
}
