// Webhook utility: fires org webhook on key events
import { db } from '@/lib/db';

type WebhookEvent = 'sale' | 'donation' | 'member_joined' | 'payout_requested' | 'subscription_started';

export async function fireWebhook(orgId: string, event: WebhookEvent, payload: Record<string, unknown>) {
  try {
    const { data: org } = await db.from('organizations')
      .select('webhook_url, webhook_events')
      .eq('id', orgId)
      .maybeSingle();

    if (!org?.webhook_url) return;
    const allowedEvents: string[] = org.webhook_events || [];
    if (allowedEvents.length > 0 && !allowedEvents.includes(event)) return;

    // Fire and forget — no-cors for external webhooks (Zapier/Make)
    fetch(org.webhook_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      mode: 'no-cors',
      body: JSON.stringify({
        event,
        timestamp: new Date().toISOString(),
        organization_id: orgId,
        data: payload,
      }),
    }).catch(err => console.warn('[webhook] fire failed:', err));
  } catch (err) {
    console.warn('[webhook] lookup failed:', err);
  }
}
