import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail, sendEmailToOrgAdmins, getUserEmail } from '../_shared/send-email-helper.ts';

/**
 * stripe-verify: Called by the frontend after Stripe redirects back.
 * Checks DB for already-processed transaction, then verifies with Stripe API.
 */

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const STRIPE_SECRET = Deno.env.get('STRIPE_SECRET_KEY')!;
  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const { reference, session_id } = await req.json();

    if (!reference) {
      return new Response(JSON.stringify({ error: 'Missing reference' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Step 1: Check if already in DB (webhook already processed) ──
    const existingResult = await checkDatabase(db, reference);
    if (existingResult) {
      return new Response(JSON.stringify(existingResult), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Step 2: Verify with Stripe API ──
    if (!session_id) {
      return new Response(JSON.stringify({
        ok: false, pending: true,
        message: 'Transaction is being processed. Please wait a moment.',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Fetch the checkout session from Stripe
    const sessionRes = await fetch(`https://api.stripe.com/v1/checkout/sessions/${session_id}`, {
      headers: { 'Authorization': `Bearer ${STRIPE_SECRET}` },
    });

    if (!sessionRes.ok) {
      console.error('[stripe-verify] Failed to fetch session from Stripe');
      return new Response(JSON.stringify({
        ok: false, pending: true,
        message: 'Unable to verify with Stripe. Please wait.',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    const session = await sessionRes.json();

    // Verify payment status
    if (session.payment_status !== 'paid') {
      return new Response(JSON.stringify({
        ok: false, pending: true,
        message: 'Payment not yet confirmed by Stripe.',
      }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    }

    // Get metadata (prefer payment_intent metadata)
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

    // Validate metadata matches our reference
    if (meta.sv_reference !== reference) {
      console.error('[stripe-verify] Reference mismatch:', meta.sv_reference, reference);
      return new Response(JSON.stringify({ error: 'Reference mismatch' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const type = meta.type as 'donation' | 'product';
    const organizationId = meta.organization_id;
    const campaignId = meta.campaign_id;
    const productId = meta.product_id;
    const buyerName = meta.buyer_name;
    const buyerEmail = meta.buyer_email || session.customer_email;
    const userId = meta.user_id || null;
    const affiliateCode = meta.affiliate_code;
    const promoCode = meta.promo_code;

    if (!type || !organizationId) {
      console.error('[stripe-verify] Missing metadata:', meta);
      return new Response(JSON.stringify({ error: 'Missing metadata' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // ── Step 3: Record the transaction (same logic as webhook) ──
    // Double-check DB again (race condition with webhook)
    const recheck = await checkDatabase(db, reference);
    if (recheck) {
      return new Response(JSON.stringify(recheck), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Amount conversion
    const zeroDecimalCurrencies = ['XOF', 'XAF', 'BIF', 'CLP', 'DJF', 'GNF', 'JPY', 'KMF', 'KRW', 'MGA', 'PYG', 'RWF', 'UGX', 'VND', 'VUV'];
    const currency = (session.currency || 'usd').toUpperCase();
    const isZeroDecimal = zeroDecimalCurrencies.includes(currency);
    const amountPaid = isZeroDecimal ? session.amount_total : session.amount_total / 100;

    // Load org
    const { data: org } = await db.from('organizations').select('*').eq('id', organizationId).single();
    if (!org) {
      return new Response(JSON.stringify({ error: 'Org not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fee calculations
    const platformFeePct = org.platform_fee_percent ?? 10;
    const platformFee = parseFloat((amountPaid * platformFeePct / 100).toFixed(2));

    // Affiliate resolution
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
        paystack_reference: reference,
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

      const { data: inserted } = await db.from('donations').insert(payload).select('id').single();
      transactionId = inserted!.id;

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

      const { data: inserted } = await db.from('product_purchases').insert(payload).select('id').single();
      transactionId = inserted!.id;

      const { data: prod } = await db.from('digital_products').select('sales_count').eq('id', productId).single();
      if (prod) await db.from('digital_products').update({ sales_count: (prod.sales_count || 0) + 1 }).eq('id', productId);
    }

    // Affiliate sales record
    if (affiliateLinkId && affiliateUserId && affiliateCommission > 0) {
      try {
        const payableAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
        await db.from('affiliate_sales').insert({
          affiliate_link_id: affiliateLinkId,
          affiliate_user_id: affiliateUserId,
          organization_id: organizationId,
          transaction_type: type,
          transaction_id: transactionId,
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
      } catch (affErr) {
        console.error('[stripe-verify] Affiliate error:', affErr);
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
              }).maybeSingle(); // ignore duplicate
            }
          }
        }
      } catch (pErr) {
        console.error('[stripe-verify] Partner commission error:', pErr);
      }
    }

    // ── Notifications & Emails ──
    const date = new Date().toLocaleDateString('fr-FR');

    // Buyer notification (in-app)
    if (userId) {
      await db.from('user_notifications').insert({
        user_id: userId,
        organization_id: organizationId,
        title: type === 'donation' ? '🙏 Don confirmé' : '✅ Achat confirmé',
        body: type === 'donation'
          ? `Votre don de ${amountPaid} ${currency} à ${org.name} a été confirmé via Stripe.`
          : `Votre achat de ${amountPaid} ${currency} chez ${org.name} est confirmé via Stripe.`,
        notification_type: type === 'donation' ? 'donation' : 'purchase',
        action_url: `/payment-success?reference=${reference}`,
      });
    }

    // Admin notifications (in-app)
    const { data: admins } = await db.from('organization_members')
      .select('user_id')
      .eq('organization_id', organizationId)
      .in('role', ['owner', 'admin']);

    if (admins?.length) {
      const adminNotifs = admins.map((a: { user_id: string }) => ({
        user_id: a.user_id,
        organization_id: organizationId,
        title: type === 'donation' ? '💰 Nouveau don reçu' : '🛍️ Nouvelle vente',
        body: `${amountPaid.toLocaleString('fr-FR')} ${currency} — L'organisation reçoit ${organizationAmount.toLocaleString('fr-FR')} ${currency} (via Stripe)`,
        notification_type: type === 'donation' ? 'donation_admin' : 'sale_admin',
        action_url: '/admin/analytics',
      }));
      await db.from('user_notifications').insert(adminNotifs);
    }

    // Affiliate notification (in-app)
    if (affiliateLinkId && affiliateUserId && affiliateCommission > 0) {
      await db.from('user_notifications').insert({
        user_id: affiliateUserId,
        organization_id: organizationId,
        title: '💰 Commission gagnée !',
        body: `Vous avez gagné ${affiliateCommission.toLocaleString('fr-FR')} ${currency} de commission via ${org.name}. Disponible dans 15 jours.`,
        notification_type: 'commission',
        action_url: '/affiliation',
      });
    }

    // ── Emails (fire-and-forget) ──
    if (type === 'donation') {
      const donorAddr = buyerEmail || (userId ? await getUserEmail(userId) : null);
      if (donorAddr) {
        sendEmail({ template: 'donation_receipt', to: donorAddr, data: { org_name: org.name, amount: amountPaid, currency, reference, date }, organization_id: organizationId }).catch(() => {});
      }
      sendEmailToOrgAdmins('new_donation_received', organizationId, {
        donor_name: buyerName || 'Anonymous', amount: amountPaid, currency, org_name: org.name,
        campaign_name: campaignId ? 'Campaign' : 'General', reference,
      }).catch(() => {});
    } else {
      const buyerAddr = buyerEmail || (userId ? await getUserEmail(userId) : null);
      const { data: productData } = await db.from('digital_products').select('title').eq('id', productId!).maybeSingle();
      const productName = productData?.title || 'Product';
      if (buyerAddr) {
        sendEmail({ template: 'purchase_confirmation', to: buyerAddr, data: { product_name: productName, org_name: org.name, amount: amountPaid, currency, reference, access_link: 'https://siteviral.com/resources' }, organization_id: organizationId }).catch(() => {});
      }
      sendEmailToOrgAdmins('new_purchase_received', organizationId, {
        buyer_name: buyerName || 'A customer', product_name: productName, amount: amountPaid, currency, reference,
      }).catch(() => {});
    }

    // Affiliate email
    if (affiliateLinkId && affiliateUserId && affiliateCommission > 0) {
      const affEmail = await getUserEmail(affiliateUserId);
      if (affEmail) {
        sendEmail({ template: 'affiliate_sale', to: affEmail, data: {
          commission: affiliateCommission, currency, org_name: org.name,
          transaction_type: type, gross_amount: amountPaid,
          commission_percent: org.affiliation_commission_percent ?? 10,
        }, organization_id: organizationId }).catch(() => {});
      }
    }

    // Audit log
    await db.from('audit_logs').insert({
      user_id: userId,
      organization_id: organizationId,
      action: `stripe-verify.${type}.completed`,
      resource_type: type,
      resource_id: transactionId,
      metadata: { reference, amount: amountPaid, currency, gateway: 'stripe', source: 'verify' },
    });

    console.log(`[stripe-verify] ✅ ${type} processed: ${reference} — ${amountPaid} ${currency}`);

    return new Response(JSON.stringify({
      ok: true,
      transaction_id: transactionId,
      breakdown: {
        amount: amountPaid,
        currency,
        platform_fee: platformFee,
        affiliate_commission: affiliateCommission,
        organization_amount: organizationAmount,
        affiliate_attributed: affiliateCommission > 0,
        discount_amount: discountAmount,
        promo_applied: !!promoCodeId,
      },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('[stripe-verify] error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});

/** Check DB for an already-processed transaction */
async function checkDatabase(db: ReturnType<typeof createClient>, reference: string) {
  const { data: purchase } = await db.from('product_purchases')
    .select('id, amount, currency, status, platform_fee, affiliate_commission, organization_amount')
    .eq('paystack_reference', reference)
    .eq('status', 'completed')
    .maybeSingle();

  if (purchase) {
    return {
      ok: true,
      transaction_id: purchase.id,
      breakdown: {
        amount: purchase.amount,
        currency: purchase.currency,
        platform_fee: purchase.platform_fee,
        affiliate_commission: purchase.affiliate_commission,
        organization_amount: purchase.organization_amount,
        affiliate_attributed: (purchase.affiliate_commission || 0) > 0,
      },
    };
  }

  const { data: donation } = await db.from('donations')
    .select('id, amount, currency, status, platform_fee, affiliate_commission, organization_amount')
    .eq('paystack_reference', reference)
    .eq('status', 'completed')
    .maybeSingle();

  if (donation) {
    return {
      ok: true,
      transaction_id: donation.id,
      breakdown: {
        amount: donation.amount,
        currency: donation.currency,
        platform_fee: donation.platform_fee,
        affiliate_commission: donation.affiliate_commission,
        organization_amount: donation.organization_amount,
        affiliate_attributed: (donation.affiliate_commission || 0) > 0,
      },
    };
  }

  return null;
}
