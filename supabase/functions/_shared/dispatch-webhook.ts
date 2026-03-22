/**
 * Shared webhook dispatcher.
 * Invokes the outgoing-webhook Edge Function to send webhooks to org endpoints.
 * Fire-and-forget: errors are logged but never block the caller.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

type DB = ReturnType<typeof createClient>;

export type WebhookEventName =
  | 'purchase.completed'
  | 'purchase.failed'
  | 'donation.received'
  | 'affiliate.sale'
  | 'member.joined'
  | 'payout.requested'
  | 'subscription.started'
  | 'test.ping';

/**
 * Dispatch an outgoing webhook for an organization.
 * This calls the outgoing-webhook Edge Function which handles:
 * - Looking up active webhooks for the org
 * - Event filtering
 * - HMAC signing
 * - Delivery logging
 * - Retry scheduling on failure
 */
export async function dispatchWebhook(
  db: DB,
  orgId: string,
  event: WebhookEventName,
  data: Record<string, unknown>,
): Promise<void> {
  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Direct internal call to the outgoing-webhook function
    const url = `${supabaseUrl}/functions/v1/outgoing-webhook`;
    const res = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${serviceKey}`,
      },
      body: JSON.stringify({ org_id: orgId, event, data }),
      signal: AbortSignal.timeout(15000),
    });

    if (!res.ok) {
      const body = await res.text();
      console.warn(`[dispatch-webhook] outgoing-webhook returned ${res.status}: ${body.slice(0, 200)}`);
    } else {
      const result = await res.json();
      console.log(`[dispatch-webhook] ${event} → org=${orgId} sent=${result.sent}`);
    }
  } catch (err) {
    console.warn(`[dispatch-webhook] Failed to dispatch ${event} for org=${orgId}:`, err);
  }
}
