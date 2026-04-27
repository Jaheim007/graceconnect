import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { processTransaction, TransactionError } from '../_shared/process-transaction.ts';
import { sendEmail, getUserEmail } from '../_shared/send-email-helper.ts';

/**
 * Stripe Webhook handler.
 * Processes checkout.session.completed events.
 * Delegates transaction recording to shared processTransaction().
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  try {
    const elements = sigHeader.split(',').map((e) => e.trim());
    const timestamp = elements.find(e => e.startsWith('t='))?.slice(2);
    const signatures = elements.filter(e => e.startsWith('v1=')).map(e => e.slice(3));
    if (!timestamp || signatures.length === 0) return false;
    const ts = parseInt(timestamp);
    if (Math.abs(Date.now() / 1000 - ts) > 300) return false;
    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret.trim()), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']);
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
    const expectedSig = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');
    return signatures.some(s => s === expectedSig);
  } catch { return false; }
}

async function fetchStripeEvent(eventId: string, stripeSecret: string) {
  try {
    const res = await fetch(`https://api.stripe.com/v1/events/${eventId}`, {
      headers: { 'Authorization': `Bearer ${stripeSecret}` },
    });
    if (!res.ok) return null;
    return await res.json();
  } catch { return null; }
}

const zeroDecimalCurrencies = ['XOF', 'XAF', 'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV'];

const STATUS_MAP: Record<string, string> = {
  trialing: 'trialing', active: 'active', past_due: 'past_due',
  canceled: 'canceled', incomplete: 'incomplete', incomplete_expired: 'expired',
  unpaid: 'past_due', paused: 'past_due',
};

/**
 * Handle Stripe events related to a SiteViral platform subscription
 * (Pro / Org monthly subs and Founder lifetime payments).
 * Returns `true` if the event was a platform-subscription event (handled or skipped),
 * `false` if it should fall through to the regular payment flow.
 */
async function handlePlatformSubscriptionEvent(event: any, db: any, stripeSecret: string): Promise<boolean> {
  const obj = event.data?.object;
  if (!obj) return false;

  // Resolve metadata across event types
  const meta = obj.metadata || {};
  const isPlatformSub = meta.platform_subscription === 'true' || meta.founder_lifetime === 'true';

  // For invoice/subscription events, fetch the parent subscription metadata
  let userId = meta.user_id as string | undefined;
  let planKey = meta.plan_key as string | undefined;
  let isFounder = meta.founder_lifetime === 'true';

  if ((!userId || !planKey) && (event.type.startsWith('customer.subscription.') || event.type.startsWith('invoice.'))) {
    const subId = event.type.startsWith('invoice.') ? obj.subscription : obj.id;
    if (subId) {
      try {
        const r = await fetch(`https://api.stripe.com/v1/subscriptions/${subId}`, {
          headers: { Authorization: `Bearer ${stripeSecret}` },
        });
        const sub = await r.json();
        userId = sub.metadata?.user_id;
        planKey = sub.metadata?.plan_key;
      } catch { /* noop */ }
    }
  }

  // checkout.session.completed: distinguish platform sub from regular product payment
  if (event.type === 'checkout.session.completed') {
    if (!isPlatformSub) return false; // not us → regular flow
    // Subscription mode: status update happens via subscription.created event
    // Founder lifetime (one-off payment_intent): claim slot now
    if (isFounder && userId) {
      const paymentIntent = obj.payment_intent;
      const { data: slot } = await db.rpc('claim_founder_slot', {
        _user_id: userId,
        _provider: 'stripe',
        _external_payment_id: paymentIntent || obj.id,
        _amount_xof: 49000,
      });
      await db.from('platform_subscriptions').upsert({
        user_id: userId,
        plan: 'pro',
        status: 'active',
        provider: 'founder',
        stripe_customer_id: obj.customer,
        amount_xof: 49000,
        currency: 'USD',
        billing_interval: 'lifetime',
        metadata: { plan_key: planKey, founder_slot: slot, payment_intent: paymentIntent },
      }, { onConflict: 'user_id' });
      await db.from('platform_subscription_events').insert({
        user_id: userId, provider: 'stripe', event_type: event.type,
        external_event_id: event.id, payload: event,
      });
      // Founder welcome email (non-blocking)
      const fEmail = await getUserEmail(userId);
      if (fEmail) {
        await sendEmail({
          template: 'founder_welcome' as any,
          to: fEmail,
          data: { slot: String(slot || ''), plan: 'pro' },
        }).catch(() => null);
      }
      console.log(`[platform-sub] Founder slot ${slot} claimed for ${userId}`);
    }
    return true;
  }

  if (!userId) {
    console.warn('[platform-sub] No user_id in metadata, skipping', event.type);
    return true;
  }

  // Determine plan from plan_key
  const plan = planKey?.startsWith('org') ? 'org' : 'pro';

  if (event.type.startsWith('customer.subscription.')) {
    const sub = obj;
    const update: any = {
      user_id: userId,
      plan,
      status: STATUS_MAP[sub.status] || sub.status,
      provider: 'stripe',
      stripe_customer_id: sub.customer,
      stripe_subscription_id: sub.id,
      current_period_start: sub.current_period_start ? new Date(sub.current_period_start * 1000).toISOString() : null,
      current_period_end: sub.current_period_end ? new Date(sub.current_period_end * 1000).toISOString() : null,
      cancel_at_period_end: sub.cancel_at_period_end,
      canceled_at: sub.canceled_at ? new Date(sub.canceled_at * 1000).toISOString() : null,
      trial_start: sub.trial_start ? new Date(sub.trial_start * 1000).toISOString() : null,
      trial_end: sub.trial_end ? new Date(sub.trial_end * 1000).toISOString() : null,
      amount_xof: planKey === 'org_monthly' ? 49000 : 19000,
      currency: 'USD',
      billing_interval: 'month',
      metadata: { plan_key: planKey },
    };
    await db.from('platform_subscriptions').upsert(update, { onConflict: 'user_id' });

    // Lifecycle emails
    if (event.type === 'customer.subscription.created') {
      const e = await getUserEmail(userId);
      if (e) {
        await sendEmail({
          template: 'platform_subscription_activated' as any,
          to: e,
          data: {
            plan,
            amount: String(update.amount_xof),
            currency: update.currency,
            next_billing: update.current_period_end?.slice(0, 10) || '',
            billing_url: 'https://siteviral.com/billing',
          },
        }).catch(() => null);
      }
    } else if (event.type === 'customer.subscription.deleted') {
      const e = await getUserEmail(userId);
      if (e) {
        await sendEmail({
          template: 'platform_subscription_canceled' as any,
          to: e,
          data: { plan, period_end: update.current_period_end?.slice(0, 10) || '' },
        }).catch(() => null);
      }
    }
  } else if (event.type === 'invoice.paid') {
    await db.from('platform_subscriptions').update({
      status: 'active',
    }).eq('user_id', userId);
  } else if (event.type === 'invoice.payment_failed') {
    await db.from('platform_subscriptions').update({
      status: 'past_due',
    }).eq('user_id', userId);

    // Lookup the platform_subscription record so we can log the dunning attempt
    const { data: subRow } = await db
      .from('platform_subscriptions')
      .select('id, currency')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    const invoice: any = (event as any).data?.object || {};
    if (subRow?.id) {
      await db.from('dunning_attempts').upsert({
        subscription_id: subRow.id,
        user_id: userId,
        provider: 'stripe',
        step: 'd1',
        invoice_id: invoice.id,
        amount_due: (invoice.amount_due ?? 0) / 100,
        currency: (invoice.currency || subRow.currency || 'usd').toUpperCase(),
      }, { onConflict: 'subscription_id,step', ignoreDuplicates: true });
    }

    const e = await getUserEmail(userId);
    if (e) {
      await sendEmail({
        template: 'subscription_payment_failed' as any,
        to: e,
        data: { plan, attempt: 1, recovery_url: 'https://siteviral.com/billing' },
      }).catch(() => null);
    }
  }

  await db.from('platform_subscription_events').insert({
    user_id: userId, provider: 'stripe', event_type: event.type,
    external_event_id: event.id, payload: event,
  });

  console.log(`[platform-sub] ${event.type} processed for ${userId} (${plan})`);
  return true;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY')!;
  const STRIPE_WEBHOOK_SECRET = Deno.env.get('STRIPE_WEBHOOK_SECRET');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const rawBody = await req.text();
    const sigHeader = req.headers.get('stripe-signature') || '';

    let event: any;

    if (STRIPE_WEBHOOK_SECRET) {
      const valid = await verifyStripeSignature(rawBody, sigHeader, STRIPE_WEBHOOK_SECRET);
      if (!valid) {
        console.error('[stripe-webhook] Invalid signature, trying Stripe API fallback');
        const parsed = JSON.parse(rawBody);
        const eventId = parsed?.id;
        if (!eventId) {
          return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        const remoteEvent = await fetchStripeEvent(eventId, STRIPE_SECRET);
        if (!remoteEvent) {
          return new Response(JSON.stringify({ error: 'Invalid signature' }), { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }
        event = remoteEvent;
      } else {
        event = JSON.parse(rawBody);
      }
    } else {
      event = JSON.parse(rawBody);
    }

    // ── Handle dispute events ──
    if (event.type === 'charge.dispute.created' || event.type === 'charge.dispute.updated' || event.type === 'charge.dispute.closed') {
      const dispute = event.data.object;
      const chargeId = dispute.charge;
      const disputeStatus = dispute.status; // needs_response, under_review, won, lost
      const disputeId = dispute.id;
      const reason = dispute.reason || 'unknown';

      console.log(`[stripe-webhook] Dispute ${event.type}: ${disputeId} status=${disputeStatus} reason=${reason}`);

      // Find transaction by stripe charge — check both tables
      for (const tbl of ['donations', 'product_purchases'] as const) {
        const { data: txn } = await db.from(tbl)
          .select('id, paystack_reference')
          .eq('gateway', 'stripe')
          .like('paystack_reference', `%${chargeId}%`)
          .maybeSingle();

        if (!txn) {
          // Also try via payment_intent on the charge
          if (dispute.payment_intent) {
            const { data: txn2 } = await db.from(tbl)
              .select('id, paystack_reference')
              .eq('gateway', 'stripe')
              .like('paystack_reference', `%${dispute.payment_intent}%`)
              .maybeSingle();
            if (txn2) {
              await db.from(tbl).update({
                dispute_id: disputeId,
                dispute_status: disputeStatus,
              }).eq('id', txn2.id);
            }
          }
          continue;
        }

        await db.from(tbl).update({
          dispute_id: disputeId,
          dispute_status: disputeStatus,
        }).eq('id', txn.id);
      }

      // Audit log
      await db.from('audit_logs').insert({
        action: `stripe.dispute.${disputeStatus}`,
        resource_type: 'dispute',
        resource_id: disputeId,
        metadata: { reason, charge: chargeId, amount: dispute.amount, currency: dispute.currency },
      });

      return new Response(JSON.stringify({ received: true, dispute: disputeId }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Handle PLATFORM SUBSCRIPTION events (Pro/Org/Founder) ──
    const platformSubEvents = [
      'checkout.session.completed',
      'customer.subscription.created',
      'customer.subscription.updated',
      'customer.subscription.deleted',
      'customer.subscription.trial_will_end',
      'invoice.paid',
      'invoice.payment_failed',
    ];
    if (platformSubEvents.includes(event.type)) {
      const handled = await handlePlatformSubscriptionEvent(event, db, STRIPE_SECRET);
      if (handled) {
        return new Response(JSON.stringify({ ok: true, kind: 'platform_subscription', event: event.type }), {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      // Not a platform sub event → fall through to normal handling
    }

    // Only handle checkout.session.completed for payments
    if (event.type !== 'checkout.session.completed') {
      return new Response(JSON.stringify({ received: true, skipped: event.type }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Idempotency via payment_events table ──
    const stripeEventId = event.id || `stripe-${Date.now()}`;
    const { data: existingEvent } = await db.from('payment_events')
      .select('id, status')
      .eq('event_id', String(stripeEventId))
      .maybeSingle();

    if (existingEvent?.status === 'processed') {
      console.log('[stripe-webhook] Event already processed:', stripeEventId);
      return new Response(JSON.stringify({ ok: true, idempotent: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const session = event.data.object;

    // Log the event
    if (!existingEvent) {
      await db.from('payment_events').insert({
        event_id: String(stripeEventId),
        provider: 'stripe',
        reference: session.metadata?.sv_reference || null,
        payload: event,
        status: 'received',
      });
    }

    // Get PaymentIntent metadata (more reliable)
    let meta = session.metadata || {};
    if (session.payment_intent && typeof session.payment_intent === 'string') {
      try {
        const piRes = await fetch(`https://api.stripe.com/v1/payment_intents/${session.payment_intent}`, {
          headers: { 'Authorization': `Bearer ${STRIPE_SECRET}` },
        });
        const pi = await piRes.json();
        if (pi.metadata) meta = pi.metadata;
      } catch { /* use session metadata */ }
    }

    const reference = meta.sv_reference;
    const type = meta.type as 'donation' | 'product';
    const organizationId = meta.organization_id;

    if (!reference || !type || !organizationId) {
      console.error('[stripe-webhook] Missing metadata:', meta);
      await db.from('payment_events').update({ status: 'skipped', processed_at: new Date().toISOString() }).eq('event_id', String(stripeEventId));
      return new Response(JSON.stringify({ error: 'Missing metadata' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Amount conversion
    const currency = (session.currency || 'usd').toUpperCase();
    const isZeroDecimal = zeroDecimalCurrencies.includes(currency);
    const amountPaid = isZeroDecimal ? session.amount_total : session.amount_total / 100;

    // ── Delegate to shared core ──
    const result = await processTransaction(db, {
      reference,
      type,
      organization_id: organizationId,
      gateway: 'stripe',
      source: 'webhook',
      amount_paid: amountPaid,
      currency,
      campaign_id: meta.campaign_id,
      product_id: meta.product_id,
      user_id: meta.user_id || null,
      donor_name: meta.buyer_name,
      donor_email: meta.buyer_email || session.customer_email,
      affiliate_code: meta.affiliate_code,
      promo_code: meta.promo_code,
    });

    // Mark event processed
    await db.from('payment_events').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('event_id', String(stripeEventId));

    console.log(`[stripe-webhook] ✅ ${type} processed: ${reference} — ${amountPaid} ${currency}`);

    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    if (err instanceof TransactionError) {
      return new Response(JSON.stringify({ error: err.message }), {
        status: err.status, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
    console.error('[stripe-webhook] error:', err);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
