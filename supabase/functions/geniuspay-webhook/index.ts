// geniuspay-webhook: Receives GeniusPay webhook events.
// Signature: HMAC-SHA256(timestamp + "." + raw_body, GENIUSPAY_WEBHOOK_SECRET)
// Header:    X-Webhook-Signature
// Replay protection: X-Webhook-Timestamp must be within 5 minutes.
//
// Public endpoint (no JWT) — protected by HMAC signature.

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac, timingSafeEqual } from 'node:crypto';
import { Buffer } from 'node:buffer';
import { processTransaction } from '../_shared/process-transaction.ts';
import { rateLimit } from '../_shared/rate-limit.ts';
import { sendEmail, getUserEmail } from '../_shared/send-email-helper.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers':
    'authorization, x-client-info, apikey, content-type, x-webhook-signature, x-webhook-timestamp, x-webhook-event, x-webhook-environment, x-webhook-delivery',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Light rate limit per IP
  const clientIp =
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('cf-connecting-ip');
  const rl = await rateLimit(clientIp, 120);
  if (!rl.allowed) return new Response('Rate limited', { status: 429 });

  const WEBHOOK_SECRET = Deno.env.get('GENIUSPAY_WEBHOOK_SECRET');
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  if (!WEBHOOK_SECRET) {
    console.error('[geniuspay-webhook] GENIUSPAY_WEBHOOK_SECRET not set');
    return new Response('Server misconfigured', { status: 500 });
  }

  try {
    // ── 1. Verify signature ──
    const rawBody = await req.text();
    const sig = req.headers.get('x-webhook-signature') || '';
    const ts = req.headers.get('x-webhook-timestamp') || '';
    const eventHeader = req.headers.get('x-webhook-event') || '';

    if (!sig || !ts) {
      console.error('[geniuspay-webhook] missing signature headers');
      return new Response('Unauthorized', { status: 401 });
    }

    // Replay protection — 5 min tolerance
    const tsNum = Number(ts);
    if (!Number.isFinite(tsNum) || Math.abs(Math.floor(Date.now() / 1000) - tsNum) > 300) {
      console.error('[geniuspay-webhook] timestamp out of tolerance', ts);
      return new Response('Timestamp too old', { status: 400 });
    }

    const data = `${ts}.${rawBody}`;
    const expected = createHmac('sha256', WEBHOOK_SECRET).update(data).digest('hex');

    // timing-safe compare
    const sigBuf = Buffer.from(sig, 'hex');
    const expBuf = Buffer.from(expected, 'hex');
    if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
      console.error('[geniuspay-webhook] invalid signature');
      return new Response('Unauthorized', { status: 401 });
    }

    const event = JSON.parse(rawBody);
    const eventName = (event.event as string) || eventHeader;
    const eventId = (event.id as string) || `${eventName}-${ts}-${Math.random().toString(36).slice(2, 8)}`;
    console.log('[geniuspay-webhook]', eventName, 'id:', eventId);

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // ── 2. Idempotency ──
    const { data: existingEvent } = await db
      .from('payment_events')
      .select('id, status')
      .eq('event_id', String(eventId))
      .maybeSingle();

    if (existingEvent?.status === 'processed') {
      console.log('[geniuspay-webhook] already processed:', eventId);
      return new Response(JSON.stringify({ ok: true, idempotent: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const txData = event.data || {};
    const reference = (txData.reference as string | undefined) || undefined;

    if (!existingEvent) {
      await db.from('payment_events').insert({
        event_id: String(eventId),
        provider: 'geniuspay',
        reference: reference || null,
        payload: event,
        status: 'received',
      });
    }

    // Handle webhook test pings — just ack
    if (eventName === 'webhook.test') {
      await db.from('payment_events').update({
        status: 'processed', processed_at: new Date().toISOString(),
      }).eq('event_id', String(eventId));
      return new Response(JSON.stringify({ ok: true, test: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Cashout events → log to audit_logs only (manual payout reconciliation)
    if (eventName?.startsWith('cashout.')) {
      await db.from('audit_logs').insert({
        action: eventName,
        resource_type: 'cashout',
        metadata: { reference, amount: txData.amount, status: txData.status, event: eventName },
      });
      await db.from('payment_events').update({
        status: 'processed', processed_at: new Date().toISOString(),
      }).eq('event_id', String(eventId));
      return new Response(JSON.stringify({ ok: true, cashout: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Only commit on payment.success — log everything else as skipped/info
    if (eventName !== 'payment.success') {
      // Log refund/failed to audit_logs for visibility
      if (eventName === 'payment.refunded' || eventName === 'payment.failed' || eventName === 'payment.cancelled' || eventName === 'payment.expired') {
        await db.from('audit_logs').insert({
          action: eventName,
          resource_type: 'payment',
          metadata: { reference, amount: txData.amount, status: txData.status, event: eventName },
        });
      }
      await db.from('payment_events').update({
        status: 'skipped', processed_at: new Date().toISOString(),
      }).eq('event_id', String(eventId));
      return new Response(JSON.stringify({ ok: true, skipped: true, event: eventName }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!reference) {
      console.error('[geniuspay-webhook] payment.success without reference');
      return new Response(JSON.stringify({ error: 'No reference' }), { status: 400, headers: corsHeaders });
    }

    // ── Extract metadata ──
    const meta = (txData.metadata as Record<string, any>) || {};
    const type = meta.type as string | undefined;
    const organizationId = meta.organization_id as string | undefined;
    const productId = meta.product_id as string | undefined;
    const campaignId = meta.campaign_id as string | undefined;
    const userId = meta.user_id as string | undefined;
    const buyerName = (meta.buyer_name as string | undefined) || (txData.customer_name as string | undefined);
    const buyerEmail = (meta.buyer_email as string | undefined) ||
                       (meta.donor_email as string | undefined) ||
                       (meta.customer_email as string | undefined);
    const affiliateCode = meta.affiliate_code as string | undefined;
    const promoCode = meta.promo_code as string | undefined;

    // ── PLATFORM SUBSCRIPTION (Pro/Org) ──
    if (type === 'platform_subscription' && userId) {
      const planKey = meta.plan_key as string;
      const plan = (meta.plan as string) || (planKey?.startsWith('org') ? 'org' : 'pro');
      const amountXof = Number(meta.amount_xof) || Number(txData.amount) || (plan === 'org' ? 49000 : 19000);
      const trialEnd = meta.trial_end ? new Date(meta.trial_end as string) : new Date(Date.now() + 14 * 86400000);

      await db.from('platform_subscriptions').upsert({
        user_id: userId, plan, status: 'trialing', provider: 'geniuspay',
        amount_xof: amountXof, currency: 'XOF', billing_interval: 'month',
        trial_start: new Date().toISOString(),
        trial_end: trialEnd.toISOString(),
        current_period_start: new Date().toISOString(),
        current_period_end: trialEnd.toISOString(),
        metadata: { plan_key: planKey, geniuspay_reference: reference },
      }, { onConflict: 'user_id' });

      const email = await getUserEmail(userId);
      if (email) {
        await sendEmail({
          template: 'platform_subscription_activated' as any,
          to: email,
          data: {
            plan, amount: String(amountXof), currency: 'XOF',
            next_billing: trialEnd.toISOString().slice(0, 10),
            billing_url: 'https://siteviral.com/billing',
          },
        }).catch(() => null);
      }

      await db.from('platform_subscription_events').insert({
        user_id: userId, provider: 'geniuspay', event_type: eventName,
        external_event_id: String(eventId), payload: event,
      });

      await db.from('payment_events').update({
        status: 'processed', processed_at: new Date().toISOString(),
      }).eq('event_id', String(eventId));
      return new Response(JSON.stringify({ ok: true, kind: 'platform_subscription' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── BEAUTY BOOKING ──
    const bookingId = meta.booking_id as string | undefined;
    if (type === 'beauty_booking' && bookingId) {
      const { data: bk } = await db
        .from('beauty_bookings')
        .select('id, status, slot_end')
        .eq('id', bookingId)
        .maybeSingle();
      if (bk && bk.status === 'pending_payment') {
        const autoRelease = new Date(
          new Date(bk.slot_end).getTime() + 24 * 60 * 60 * 1000,
        ).toISOString();
        await db.from('beauty_bookings').update({
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          auto_release_at: autoRelease,
        }).eq('id', bookingId);
        await db.from('beauty_booking_events').insert({
          booking_id: bookingId,
          event_type: 'payment_confirmed',
          payload: { gateway: 'geniuspay', reference },
        });
      }
      await db.from('payment_events').update({
        status: 'processed', processed_at: new Date().toISOString(),
      }).eq('event_id', String(eventId));
      return new Response(JSON.stringify({ ok: true, kind: 'beauty_booking' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── BEAUTY EXTRA CHARGE ──
    const extraChargeId = meta.extra_charge_id as string | undefined;
    if (type === 'beauty_extra_charge' && extraChargeId) {
      const { data: ec } = await db
        .from('beauty_extra_charges')
        .select('id, status')
        .eq('id', extraChargeId).maybeSingle();
      if (ec && ec.status !== 'paid') {
        await db.from('beauty_extra_charges').update({
          status: 'paid', paid_at: new Date().toISOString(),
        }).eq('id', extraChargeId);
      }
      await db.from('payment_events').update({
        status: 'processed', processed_at: new Date().toISOString(),
      }).eq('event_id', String(eventId));
      return new Response(JSON.stringify({ ok: true, kind: 'beauty_extra_charge' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });


    // ── CREDIT PURCHASE ──
    const purchaseId = meta.purchase_id as string | undefined;
    if (type === 'credit_purchase' && purchaseId) {
      const { data: result, error: cpErr } = await db.rpc('complete_credit_purchase', {
        _purchase_id: purchaseId,
        _payment_reference: reference,
      });
      if (cpErr) {
        console.error('[geniuspay-webhook] credit_purchase error:', cpErr.message);
        await db.from('payment_events').update({
          status: 'error', processed_at: new Date().toISOString(),
        }).eq('event_id', String(eventId));
        return new Response(JSON.stringify({ ok: false, error: cpErr.message }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      const res = result as any;
      if (res?.ok) {
        const { data: purchase } = await db.from('credit_purchases')
          .select('user_id, credits_amount').eq('id', purchaseId).maybeSingle();
        if (purchase) {
          await db.from('user_notifications').insert({
            user_id: purchase.user_id,
            title: '💰 Crédits reçus !',
            body: `Vous avez reçu ${purchase.credits_amount} crédits IA. Merci pour votre achat !`,
            notification_type: 'credit_purchase',
            action_url: '/credits',
          });
        }
      }
      await db.from('payment_events').update({
        status: 'processed', processed_at: new Date().toISOString(),
      }).eq('event_id', String(eventId));
      return new Response(JSON.stringify({ ok: true, credit_purchase: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── TEMPLATE CLONE ──
    if (type === 'template_clone') {
      const { data: result, error: tcErr } = await db.rpc('finalize_template_clone_payment', {
        _payment_reference: reference,
      });
      if (tcErr) {
        console.error('[geniuspay-webhook] template_clone error:', tcErr.message);
        await db.from('payment_events').update({
          status: 'error', processed_at: new Date().toISOString(),
        }).eq('event_id', String(eventId));
        return new Response(JSON.stringify({ ok: false, error: tcErr.message }), {
          status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      await db.from('payment_events').update({
        status: 'processed', processed_at: new Date().toISOString(),
      }).eq('event_id', String(eventId));
      return new Response(JSON.stringify({ ok: true, template_clone: result }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── PRODUCT / DONATION via shared core ──
    if (!organizationId) {
      await db.from('payment_events').update({
        status: 'skipped', processed_at: new Date().toISOString(),
      }).eq('event_id', String(eventId));
      return new Response(JSON.stringify({ ok: true, warning: 'no_org_metadata' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const amountPaid = Number(txData.amount);
    const currency = (txData.currency as string) || 'XOF';

    const result = await processTransaction(db, {
      reference,
      type: (type === 'product' ? 'product' : 'donation') as 'donation' | 'product',
      organization_id: organizationId,
      gateway: 'geniuspay' as any, // widened union (see process-transaction.ts)
      source: 'webhook',
      amount_paid: amountPaid,
      currency,
      campaign_id: campaignId,
      product_id: productId,
      user_id: userId,
      donor_name: buyerName,
      donor_email: buyerEmail,
      buyer_name: buyerName,
      buyer_email: buyerEmail,
      affiliate_code: affiliateCode,
      promo_code: promoCode,
    });

    await db.from('payment_events').update({
      status: 'processed', processed_at: new Date().toISOString(),
    }).eq('event_id', String(eventId));

    return new Response(JSON.stringify({ ok: true, ...result }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('[geniuspay-webhook] fatal:', err);
    // Return 200 so GeniusPay doesn't infinitely retry on non-transient errors
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
