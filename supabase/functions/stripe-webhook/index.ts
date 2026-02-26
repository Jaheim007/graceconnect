import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail, sendEmailToOrgAdmins, getUserEmail } from '../_shared/send-email-helper.ts';

/**
 * Stripe Webhook handler.
 * Processes checkout.session.completed events to record transactions.
 * Uses the same business logic as verify-payment (Paystack equivalent).
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

// Simple HMAC-SHA256 for Stripe signature verification
async function verifyStripeSignature(payload: string, sigHeader: string, secret: string): Promise<boolean> {
  try {
    const elements = sigHeader.split(',').map((e) => e.trim());
    const timestamp = elements.find(e => e.startsWith('t='))?.slice(2);
    const signatures = elements.filter(e => e.startsWith('v1=')).map(e => e.slice(3));

    if (!timestamp || signatures.length === 0) return false;

    // Check timestamp tolerance (5 minutes)
    const ts = parseInt(timestamp);
    if (Math.abs(Date.now() / 1000 - ts) > 300) return false;

    const signedPayload = `${timestamp}.${payload}`;
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey(
      'raw', encoder.encode(secret.trim()),
      { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
    );
    const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(signedPayload));
    const expectedSig = Array.from(new Uint8Array(sig)).map(b => b.toString(16).padStart(2, '0')).join('');

    return signatures.some(s => s === expectedSig);
  } catch {
    return false;
  }
}

async function fetchStripeEvent(eventId: string, stripeSecret: string) {
  try {
    const eventRes = await fetch(`https://api.stripe.com/v1/events/${eventId}`, {
      headers: { 'Authorization': `Bearer ${stripeSecret}` },
    });

    if (!eventRes.ok) return null;
    return await eventRes.json();
  } catch {
    return null;
  }
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

    // Verify signature if webhook secret is configured
    if (STRIPE_WEBHOOK_SECRET) {
      const valid = await verifyStripeSignature(rawBody, sigHeader, STRIPE_WEBHOOK_SECRET);
      if (!valid) {
        console.error('[stripe-webhook] Invalid signature, trying Stripe API fallback');

        const parsed = JSON.parse(rawBody);
        const eventId = parsed?.id;
        if (!eventId) {
          return new Response(JSON.stringify({ error: 'Invalid signature' }), {
            status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        const remoteEvent = await fetchStripeEvent(eventId, STRIPE_SECRET);
        if (!remoteEvent) {
          return new Response(JSON.stringify({ error: 'Invalid signature' }), {
            status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          });
        }

        event = remoteEvent;
      } else {
        event = JSON.parse(rawBody);
      }
    } else {
      event = JSON.parse(rawBody);
    }

    // Only handle checkout.session.completed
    if (event.type !== 'checkout.session.completed') {
      return new Response(JSON.stringify({ received: true, skipped: event.type }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const session = event.data.object;
    const metadata = session.metadata || {};
    const piMetadata = session.payment_intent ? null : metadata; // fallback

    // Get PaymentIntent metadata (more reliable)
    let meta = metadata;
    if (session.payment_intent && typeof session.payment_intent === 'string') {
      try {
        const piRes = await fetch(`https://api.stripe.com/v1/payment_intents/${session.payment_intent}`, {
          headers: { 'Authorization': `Bearer ${STRIPE_SECRET}` },
        });
        const pi = await piRes.json();
        if (pi.metadata) meta = pi.metadata;
      } catch (e) {
        console.warn('[stripe-webhook] Could not fetch PI metadata, using session metadata');
      }
    }

    const reference = meta.sv_reference;
    const type = meta.type as 'donation' | 'product';
    const organizationId = meta.organization_id;
    const campaignId = meta.campaign_id;
    const productId = meta.product_id;
    const buyerName = meta.buyer_name;
    const buyerEmail = meta.buyer_email || session.customer_email;
    const userId = meta.user_id || null;
    const affiliateCode = meta.affiliate_code;
    const promoCode = meta.promo_code;

    if (!reference || !type || !organizationId) {
      console.error('[stripe-webhook] Missing metadata:', meta);
      return new Response(JSON.stringify({ error: 'Missing metadata' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Idempotency: check if already processed
    const table = type === 'donation' ? 'donations' : 'product_purchases';
    const refField = 'paystack_reference'; // reuse same field for both gateways
    const { data: existing } = await db.from(table)
      .select('id, status')
      .eq(refField, reference)
      .maybeSingle();

    if (existing?.status === 'completed') {
      return new Response(JSON.stringify({ ok: true, idempotent: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get amount from Stripe (convert from smallest unit)
    const zeroDecimalCurrencies = ['XOF', 'XAF', 'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV'];
    const currency = (session.currency || 'usd').toUpperCase();
    const isZeroDecimal = zeroDecimalCurrencies.includes(currency);
    const amountPaid = isZeroDecimal
      ? session.amount_total
      : session.amount_total / 100;

    // Load org
    const { data: org } = await db.from('organizations')
      .select('*')
      .eq('id', organizationId)
      .single();

    if (!org) {
      console.error('[stripe-webhook] Org not found:', organizationId);
      return new Response(JSON.stringify({ error: 'Org not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fee calculations
    const platformFeePct = org.platform_fee_percent ?? 10;
    const platformFee = parseFloat((amountPaid * platformFeePct / 100).toFixed(2));

    // Affiliate resolution (products only)
    let affiliateLinkId: string | null = null;
    let affiliateUserId: string | null = null;
    let affiliateCommission = 0;

    if (affiliateCode && org.affiliation_enabled && type === 'product') {
      const { data: affLink } = await db.from('affiliate_links')
        .select('id, user_id, is_active')
        .eq('code', affiliateCode)
        .eq('organization_id', organizationId)
        .maybeSingle();

      if (affLink?.is_active && affLink.user_id !== userId) {
        affiliateLinkId = affLink.id;
        affiliateUserId = affLink.user_id;
        const commPct = org.affiliation_commission_percent ?? 10;
        affiliateCommission = parseFloat((amountPaid * commPct / 100).toFixed(2));
      }
    }

    const organizationAmount = parseFloat((amountPaid - platformFee - affiliateCommission).toFixed(2));

    // Promo code
    let promoCodeId: string | null = null;
    let discountAmount = 0;
    if (promoCode) {
      const { data: promoData } = await db.from('promo_codes')
        .select('*')
        .eq('organization_id', organizationId)
        .eq('code', promoCode.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      if (promoData) {
        const withinLimit = !promoData.max_uses || promoData.current_uses < promoData.max_uses;
        const notExpired = !promoData.expires_at || new Date(promoData.expires_at) > new Date();
        if (withinLimit && notExpired) {
          promoCodeId = promoData.id;
          const origPrice = amountPaid / (1 - (promoData.discount_percent || 0) / 100);
          discountAmount = parseFloat((origPrice - amountPaid).toFixed(2));
          await db.from('promo_codes').update({ current_uses: promoData.current_uses + 1 }).eq('id', promoData.id);
        }
      }
    }

    // Insert transaction
    let transactionId: string;

    if (type === 'donation') {
      const payload = {
        organization_id: organizationId,
        campaign_id: campaignId || null,
        user_id: userId,
        donor_name: buyerName || null,
        donor_email: buyerEmail || null,
        amount: amountPaid,
        currency,
        paystack_reference: reference, // reused field name
        status: 'completed',
        is_recurring: false,
        affiliate_link_id: affiliateLinkId,
        platform_fee: platformFee,
        affiliate_commission: affiliateCommission,
        organization_amount: organizationAmount,
        completed_at: new Date().toISOString(),
        promo_code_id: promoCodeId,
        settlement_status: 'held',
      };

      if (existing) {
        const { data: updated } = await db.from('donations').update(payload).eq('id', existing.id).select('id').single();
        transactionId = updated!.id;
      } else {
        const { data: inserted } = await db.from('donations').insert(payload).select('id').single();
        transactionId = inserted!.id;
      }

      if (campaignId) {
        const { data: campaign } = await db.from('donation_campaigns').select('current_amount').eq('id', campaignId).single();
        if (campaign) {
          await db.from('donation_campaigns').update({ current_amount: (campaign.current_amount || 0) + amountPaid }).eq('id', campaignId);
        }
      }
    } else {
      if (!productId) {
        return new Response(JSON.stringify({ error: 'product_id required' }), {
          status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      const payload = {
        product_id: productId,
        organization_id: organizationId,
        user_id: userId,
        amount: amountPaid,
        currency,
        paystack_reference: reference,
        status: 'completed',
        affiliate_link_id: affiliateLinkId,
        platform_fee: platformFee,
        affiliate_commission: affiliateCommission,
        organization_amount: organizationAmount,
        completed_at: new Date().toISOString(),
        promo_code_id: promoCodeId,
        discount_amount: discountAmount,
        settlement_status: 'held',
      };

      if (existing) {
        const { data: updated } = await db.from('product_purchases').update(payload).eq('id', existing.id).select('id').single();
        transactionId = updated!.id;
      } else {
        const { data: inserted } = await db.from('product_purchases').insert(payload).select('id').single();
        transactionId = inserted!.id;
      }

      const { data: prod } = await db.from('digital_products').select('sales_count').eq('id', productId).single();
      if (prod) await db.from('digital_products').update({ sales_count: (prod.sales_count || 0) + 1 }).eq('id', productId);
    }

    // Affiliate sales record
    if (affiliateLinkId && affiliateUserId && affiliateCommission > 0) {
      try {
        const { data: existingAff } = await db.from('affiliate_sales')
          .select('id')
          .eq('affiliate_link_id', affiliateLinkId)
          .eq('transaction_id', transactionId!)
          .maybeSingle();

        if (!existingAff) {
          const payableAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
          await db.from('affiliate_sales').insert({
            affiliate_link_id: affiliateLinkId,
            affiliate_user_id: affiliateUserId,
            organization_id: organizationId,
            transaction_type: type,
            transaction_id: transactionId!,
            gross_amount: amountPaid,
            commission_amount: affiliateCommission,
            commission_percent: org.affiliation_commission_percent ?? 10,
            status: 'pending',
            payable_at: payableAt,
          });

          const { data: link } = await db.from('affiliate_links')
            .select('conversions, total_earned')
            .eq('id', affiliateLinkId)
            .single();
          if (link) {
            await db.from('affiliate_links').update({
              conversions: (link.conversions || 0) + 1,
              total_earned: (link.total_earned || 0) + affiliateCommission,
            }).eq('id', affiliateLinkId);
          }
        }
      } catch (affErr) {
        console.error('[stripe-webhook] Affiliate error:', affErr);
      }
    }

    // Partner commission
    if (type === 'product' && platformFee > 0) {
      try {
        const { data: partnerRef } = await db.from('partner_referrals')
          .select('partner_id, status')
          .eq('organization_id', organizationId)
          .eq('status', 'active')
          .maybeSingle();

        if (partnerRef) {
          const { data: partner } = await db.from('partners')
            .select('id, status, user_id')
            .eq('id', partnerRef.partner_id)
            .eq('status', 'approved')
            .maybeSingle();

          if (partner) {
            const { data: rate } = await db.rpc('get_partner_rate', { _partner_id: partner.id });
            const effectiveRate = typeof rate === 'number' ? rate : 5;
            const partnerCommission = parseFloat((platformFee * effectiveRate / 100).toFixed(2));

            if (partnerCommission > 0) {
              const { data: existingPC } = await db.from('partner_commissions')
                .select('id')
                .eq('partner_id', partner.id)
                .eq('payment_reference', reference)
                .maybeSingle();

              if (!existingPC) {
                await db.from('partner_commissions').insert({
                  partner_id: partner.id,
                  organization_id: organizationId,
                  payment_reference: reference,
                  platform_fee_amount: platformFee,
                  commission_percent: effectiveRate,
                  commission_amount: partnerCommission,
                  currency,
                  status: 'held',
                  payable_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
                });
              }
            }
          }
        }
      } catch (pErr) {
        console.error('[stripe-webhook] Partner commission error:', pErr);
      }
    }

    // User notification
    if (userId) {
      await db.from('user_notifications').insert({
        user_id: userId,
        organization_id: organizationId,
        title: type === 'donation' ? '🙏 Don confirmé' : '✅ Achat confirmé',
        body: type === 'donation'
          ? `Votre don de ${amountPaid} ${currency} a été confirmé via Stripe.`
          : `Votre achat de ${amountPaid} ${currency} a été confirmé via Stripe.`,
        notification_type: type === 'donation' ? 'donation' : 'purchase',
        action_url: `/payment-success?reference=${reference}`,
      });
    }

    // Audit log
    await db.from('audit_logs').insert({
      user_id: userId,
      organization_id: organizationId,
      action: `stripe.${type}.completed`,
      resource_type: type,
      resource_id: transactionId!,
      metadata: { reference, amount: amountPaid, currency, gateway: 'stripe' },
    });

    console.log(`[stripe-webhook] ✅ ${type} processed: ${reference} — ${amountPaid} ${currency}`);

    return new Response(JSON.stringify({ ok: true, transaction_id: transactionId! }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('[stripe-webhook] error:', err);
    return new Response(JSON.stringify({ error: 'Webhook processing failed' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
