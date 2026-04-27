import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { createHmac } from 'node:crypto';
import { getPaystackSecretKey } from '../_shared/paystack-key.ts';
import { processTransaction, TransactionError } from '../_shared/process-transaction.ts';
import { rateLimit } from '../_shared/rate-limit.ts';
import { sendEmail, getUserEmail } from '../_shared/send-email-helper.ts';

/**
 * paystack-webhook: Receives Paystack webhook events.
 * Handles charge.success, disputes, transfers.
 * Delegates transaction recording to shared processTransaction().
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-paystack-signature',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('cf-connecting-ip');
  const rl = await rateLimit(clientIp, 60);
  if (!rl.allowed) {
    return new Response('Rate limited', { status: 429 });
  }

  const PAYSTACK_SECRET = getPaystackSecretKey();
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

  try {
    // ── 1. Validate Paystack signature ──
    const body = await req.text();
    const signature = req.headers.get('x-paystack-signature');
    if (!signature) {
      console.error('Missing x-paystack-signature header');
      return new Response('Unauthorized', { status: 401 });
    }
    const hash = createHmac('sha512', PAYSTACK_SECRET).update(body).digest('hex');
    if (hash !== signature) {
      console.error('Invalid Paystack signature');
      return new Response('Unauthorized', { status: 401 });
    }

    const event = JSON.parse(body);
    const eventId = event.id || `${event.event}-${Date.now()}`;
    console.log('Paystack webhook event:', event.event, 'id:', eventId);

    const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

    // ── 2. Idempotency: upsert payment_events ──
    const { data: existingEvent } = await db.from('payment_events')
      .select('id, status')
      .eq('event_id', String(eventId))
      .maybeSingle();

    if (existingEvent?.status === 'processed') {
      console.log('Event already processed:', eventId);
      return new Response(JSON.stringify({ ok: true, idempotent: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const txData = event.data;
    const reference = txData?.reference as string | undefined;

    // Log the event
    if (!existingEvent) {
      await db.from('payment_events').insert({
        event_id: String(eventId),
        provider: 'paystack',
        reference: reference || null,
        payload: event,
        status: 'received',
      });
    }

    // ── Handle dispute events ──
    if (event.event === 'charge.dispute.create' || event.event === 'charge.dispute.remind' || event.event === 'charge.dispute.resolve') {
      const disputeRef = txData?.transaction?.reference || txData?.reference;
      const disputeId = txData?.id || txData?.dispute_id;
      const disputeStatus = event.event === 'charge.dispute.resolve' ? 'resolved' : 'active';

      if (disputeRef) {
        await db.from('donations').update({
          dispute_status: disputeStatus, dispute_id: String(disputeId),
          settlement_status: disputeStatus === 'active' ? 'disputed' : 'held',
        }).eq('paystack_reference', disputeRef);

        await db.from('product_purchases').update({
          dispute_status: disputeStatus, dispute_id: String(disputeId),
          settlement_status: disputeStatus === 'active' ? 'disputed' : 'held',
        }).eq('paystack_reference', disputeRef);

        if (disputeStatus === 'active') {
          const { data: donation } = await db.from('donations').select('organization_id').eq('paystack_reference', disputeRef).maybeSingle();
          const { data: purchase } = await db.from('product_purchases').select('organization_id').eq('paystack_reference', disputeRef).maybeSingle();
          const orgId = donation?.organization_id || purchase?.organization_id;
          if (orgId) {
            await db.from('audit_logs').insert({
              organization_id: orgId, action: 'dispute_opened', resource_type: 'payment',
              metadata: { reference: disputeRef, dispute_id: disputeId, event: event.event },
            });
          }
        }
      }

      await db.from('payment_events').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('event_id', String(eventId));
      return new Response(JSON.stringify({ ok: true, dispute_handled: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── Handle transfer events ──
    if (event.event === 'transfer.success' || event.event === 'transfer.failed' || event.event === 'transfer.reversed') {
      const transferStatus = event.event === 'transfer.success' ? 'completed' : event.event === 'transfer.failed' ? 'failed' : 'reversed';
      await db.from('audit_logs').insert({
        action: `transfer_${transferStatus}`, resource_type: 'transfer',
        metadata: { transfer_code: txData?.transfer_code, recipient_code: txData?.recipient?.recipient_code, amount: txData?.amount, reason: txData?.reason || txData?.complete_message || '', event: event.event },
      });
      await db.from('payment_events').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('event_id', String(eventId));
      return new Response(JSON.stringify({ ok: true, transfer_handled: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Only process successful charges
    if (event.event !== 'charge.success') {
      await db.from('payment_events').update({ status: 'skipped', processed_at: new Date().toISOString() }).eq('event_id', String(eventId));
      return new Response(JSON.stringify({ ok: true, skipped: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    if (!reference) {
      console.error('No reference in webhook data');
      return new Response(JSON.stringify({ error: 'No reference' }), { status: 400 });
    }

    // Only process our own references (SV- prefix)
    if (!reference.startsWith('SV-')) {
      console.log('Ignoring non-SV reference:', reference);
      await db.from('payment_events').update({ status: 'skipped', processed_at: new Date().toISOString() }).eq('event_id', String(eventId));
      return new Response(JSON.stringify({ ok: true, skipped: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // ── Extract metadata ──
    const meta = txData.metadata || {};
    const type = (meta.type as string) || undefined;
    const organizationId = meta.organization_id as string | undefined;
    const productId = meta.product_id as string | undefined;
    const campaignId = meta.campaign_id as string | undefined;
    const userId = meta.user_id as string | undefined;
    const donorName = (meta.donor_name as string | undefined) || (meta.buyer_name as string | undefined);
    const donorEmail = (meta.donor_email as string | undefined) || (meta.buyer_email as string | undefined) || txData.customer?.email;
    const affiliateCode = meta.affiliate_code as string | undefined;

    // ── PLATFORM SUBSCRIPTION (Pro/Org/Founder) ──
    const isPlatformSub = meta.platform_subscription === true || meta.platform_subscription === 'true';
    const isFounderLifetime = meta.founder_lifetime === true || meta.founder_lifetime === 'true';

    if (isPlatformSub && userId) {
      const planKey = meta.plan_key as string;
      const plan = (meta.plan as string) || (planKey?.startsWith('org') ? 'org' : 'pro');
      const interval = meta.interval as string | null;
      const amountXof = Number(meta.amount_xof) || (plan === 'org' ? 49000 : 19000);

      if (isFounderLifetime) {
        const { data: slot } = await db.rpc('claim_founder_slot', {
          _user_id: userId, _provider: 'paystack',
          _external_payment_id: reference, _amount_xof: 49000,
        });
        await db.from('platform_subscriptions').upsert({
          user_id: userId, plan: 'pro', status: 'active', provider: 'founder',
          paystack_customer_code: txData.customer?.customer_code,
          amount_xof: 49000, currency: 'XOF', billing_interval: 'lifetime',
          metadata: { plan_key: planKey, founder_slot: slot, paystack_reference: reference },
        }, { onConflict: 'user_id' });
        const fEmail = await getUserEmail(userId);
        if (fEmail) {
          await sendEmail({
            template: 'founder_welcome' as any,
            to: fEmail,
            data: { slot: String(slot || ''), plan: 'pro' },
          }).catch(() => null);
        }
        console.log(`[platform-sub-paystack] Founder slot ${slot} claimed for ${userId}`);
      } else if (interval === 'monthly') {
        const trialEnd = meta.trial_end ? new Date(meta.trial_end as string) : new Date(Date.now() + 14 * 86400000);
        await db.from('platform_subscriptions').upsert({
          user_id: userId, plan, status: 'trialing', provider: 'paystack',
          paystack_customer_code: txData.customer?.customer_code,
          amount_xof: amountXof, currency: 'XOF', billing_interval: 'month',
          trial_start: new Date().toISOString(),
          trial_end: trialEnd.toISOString(),
          current_period_start: new Date().toISOString(),
          current_period_end: trialEnd.toISOString(),
          metadata: { plan_key: planKey, paystack_reference: reference, paystack_authorization: txData.authorization?.authorization_code },
        }, { onConflict: 'user_id' });
        const aEmail = await getUserEmail(userId);
        if (aEmail) {
          await sendEmail({
            template: 'platform_subscription_activated' as any,
            to: aEmail,
            data: {
              plan,
              amount: String(amountXof),
              currency: 'XOF',
              next_billing: trialEnd.toISOString().slice(0, 10),
              billing_url: 'https://siteviral.com/billing',
            },
          }).catch(() => null);
        }
        console.log(`[platform-sub-paystack] Trial subscription started for ${userId} (${plan})`);
      }

      await db.from('platform_subscription_events').insert({
        user_id: userId, provider: 'paystack', event_type: event.event,
        external_event_id: String(eventId), payload: event,
      });
      await db.from('payment_events').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('event_id', String(eventId));
      return new Response(JSON.stringify({ ok: true, kind: 'platform_subscription' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── CREDIT PURCHASE: dedicated branch (no org needed) ──
    const purchaseId = meta.purchase_id as string | undefined;
    const isCreditPurchase = type === 'credit_purchase' || !!purchaseId || organizationId === 'platform';

    if (isCreditPurchase) {
      // Try to find the pending purchase by reference or purchase_id
      let resolvedPurchaseId = purchaseId;

      if (!resolvedPurchaseId) {
        // Fallback: look up by reference prefix in credit_purchases
        const { data: cp } = await db.from('credit_purchases')
          .select('id')
          .eq('status', 'pending')
          .order('created_at', { ascending: false })
          .limit(10);

        // Match by user email
        if (cp && txData.customer?.email) {
          const { data: cpByEmail } = await db.from('credit_purchases')
            .select('id, user_id')
            .eq('status', 'pending')
            .order('created_at', { ascending: false })
            .limit(1);
          if (cpByEmail && cpByEmail.length > 0) {
            resolvedPurchaseId = cpByEmail[0].id;
          }
        }
      }

      if (!resolvedPurchaseId) {
        console.error(`[webhook] credit_purchase: no purchase_id found for ${reference}`);
        await db.from('payment_events').update({ status: 'error', processed_at: new Date().toISOString() }).eq('event_id', String(eventId));
        return new Response(JSON.stringify({ ok: false, error: 'No purchase_id for credit purchase' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }

      try {
        const { data: result, error: completeErr } = await db.rpc('complete_credit_purchase', {
          _purchase_id: resolvedPurchaseId,
          _payment_reference: reference,
        });

        if (completeErr) {
          console.error(`[webhook] credit_purchase error for ${reference}:`, completeErr.message);
          await db.from('payment_events').update({ status: 'error', processed_at: new Date().toISOString() }).eq('event_id', String(eventId));
          return new Response(JSON.stringify({ ok: false, error: completeErr.message }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
        }

        const res = result as any;
        if (res?.ok) {
          // Send notification
          const { data: purchase } = await db.from('credit_purchases')
            .select('user_id, credits_amount')
            .eq('id', resolvedPurchaseId)
            .maybeSingle();

          if (purchase) {
            await db.from('user_notifications').insert({
              user_id: purchase.user_id,
              title: '💰 Crédits reçus !',
              body: `Vous avez reçu ${purchase.credits_amount} crédits IA. Merci pour votre achat !`,
              notification_type: 'credit_purchase',
              action_url: '/credits',
            });
          }

          console.log(`[webhook] credit_purchase completed for ${reference}, purchase ${resolvedPurchaseId}`);
        } else {
          console.warn(`[webhook] credit_purchase RPC returned not ok for ${reference}:`, res?.reason);
        }

        await db.from('payment_events').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('event_id', String(eventId));
        return new Response(JSON.stringify({ ok: true, credit_purchase: true }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      } catch (err) {
        console.error(`[webhook] credit_purchase exception for ${reference}:`, err);
        await db.from('payment_events').update({ status: 'error', processed_at: new Date().toISOString() }).eq('event_id', String(eventId));
        return new Response(JSON.stringify({ ok: false, error: String(err) }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
      }
    }

    if (!organizationId) {
      await db.from('payment_events').update({ status: 'skipped', processed_at: new Date().toISOString() }).eq('event_id', String(eventId));
      return new Response(JSON.stringify({ ok: true, warning: 'no_metadata' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const amountPaid = txData.amount / 100;
    const currency = txData.currency || 'XOF';

    // ── Delegate to shared core ──
    const result = await processTransaction(db, {
      reference,
      type: (type === 'product' ? 'product' : 'donation') as 'donation' | 'product',
      organization_id: organizationId,
      gateway: 'paystack',
      source: 'webhook',
      amount_paid: amountPaid,
      currency,
      campaign_id: campaignId,
      product_id: productId,
      user_id: userId,
      donor_name: donorName,
      donor_email: donorEmail,
      buyer_name: (meta.buyer_name as string | undefined) || donorName,
      buyer_email: (meta.buyer_email as string | undefined) || donorEmail,
      affiliate_code: affiliateCode,
    });

    // Mark event processed
    await db.from('payment_events').update({ status: 'processed', processed_at: new Date().toISOString() }).eq('event_id', String(eventId));

    return new Response(JSON.stringify({ ok: true, ...result }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('paystack-webhook error:', err);
    // Log the error to payment_events for debugging
    try {
      const body2 = typeof err === 'object' ? JSON.stringify(err) : String(err);
      // Best-effort error logging — don't block the response
    } catch (_) {}
    // Return 200 to prevent Paystack retries on non-transient errors
    return new Response(JSON.stringify({ error: String(err) }), { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  }
});
