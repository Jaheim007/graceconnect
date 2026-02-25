import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail, sendEmailToOrgAdmins, getUserEmail } from '../_shared/send-email-helper.ts';

// Simple in-memory rate limiter
const requestCounts = new Map<string, { count: number; windowStart: number }>();
function checkRateLimit(ip: string | null, max = 20): boolean {
  const key = ip || 'unknown';
  const now = Date.now();
  const entry = requestCounts.get(key);
  if (!entry || now - entry.windowStart > 60000) {
    requestCounts.set(key, { count: 1, windowStart: now });
    return true;
  }
  entry.count++;
  return entry.count <= max;
}

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

interface VerifyPaymentBody {
  reference: string;
  type: 'donation' | 'product';
  organization_id: string;
  campaign_id?: string;
  product_id?: string;
  affiliate_code?: string;
  donor_name?: string;
  donor_email?: string;
  promo_code?: string;
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  // Rate limiting
  const clientIp = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || req.headers.get('cf-connecting-ip');
  if (!checkRateLimit(clientIp, 20)) {
    return new Response(JSON.stringify({ error: 'Too many requests' }), {
      status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json', 'Retry-After': '60' }
    });
  }

  const PAYSTACK_SECRET = Deno.env.get('PAYSTACK_SECRET_KEY')!;
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const body: VerifyPaymentBody = await req.json();
    const { reference, type, organization_id, campaign_id, product_id, affiliate_code, donor_name, donor_email, promo_code } = body;

    // Input validation
    const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    const validationErrors: string[] = [];

    if (!reference || typeof reference !== 'string' || reference.length > 100) validationErrors.push('Invalid reference');
    if (!type || !['donation', 'product'].includes(type)) validationErrors.push('Invalid type');
    if (!organization_id || !UUID_RE.test(organization_id)) validationErrors.push('Invalid organization_id');
    if (campaign_id && !UUID_RE.test(campaign_id)) validationErrors.push('Invalid campaign_id');
    if (product_id && !UUID_RE.test(product_id)) validationErrors.push('Invalid product_id');
    if (affiliate_code && (typeof affiliate_code !== 'string' || affiliate_code.length > 50)) validationErrors.push('Invalid affiliate_code');
    if (donor_name && (typeof donor_name !== 'string' || donor_name.length > 200)) validationErrors.push('Invalid donor_name');
    if (donor_email && (typeof donor_email !== 'string' || donor_email.length > 255 || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(donor_email))) validationErrors.push('Invalid donor_email');
    if (promo_code && (typeof promo_code !== 'string' || promo_code.length > 50)) validationErrors.push('Invalid promo_code');

    if (validationErrors.length > 0) {
      return new Response(JSON.stringify({ error: 'Validation failed', details: validationErrors }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Resolve authenticated user
    const authHeader = req.headers.get('Authorization');
    let userId: string | null = null;
    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.replace('Bearer ', '');
      const { data: { user: authUser } } = await db.auth.getUser(token);
      userId = authUser?.id ?? null;
    }

    // ── 1. Idempotency check ──
    const table = type === 'donation' ? 'donations' : 'product_purchases';
    const { data: existing } = await db.from(table).select('id, status').eq('paystack_reference', reference).maybeSingle();
    if (existing?.status === 'completed') {
      return new Response(JSON.stringify({ ok: true, transaction_id: existing.id, idempotent: true }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // ── 2. Load organization ──
    const { data: org, error: orgErr } = await db.from('organizations').select('*').eq('id', organization_id).single();
    if (orgErr || !org) return new Response(JSON.stringify({ error: 'Organization not found' }), { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
    if (!org.is_active) return new Response(JSON.stringify({ error: 'Organization is inactive' }), { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

    // ── 3. Verify with Paystack ──
    const psRes = await fetch(`https://api.paystack.co/transaction/verify/${reference}`, {
      headers: { Authorization: `Bearer ${PAYSTACK_SECRET}` }
    });
    const psData = await psRes.json();

    if (!psData.status || psData.data?.status !== 'success') {
      return new Response(JSON.stringify({ error: 'Payment not successful', paystack: psData }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const amountPaid = psData.data.amount / 100;
    const currency = psData.data.currency || org.currency || 'XOF';

    // ── 4. Promo code validation ──
    let promoCodeId: string | null = null;
    let discountPercent = 0;
    let discountAmount = 0;

    if (promo_code) {
      const promoQuery = db.from('promo_codes')
        .select('*')
        .eq('organization_id', organization_id)
        .eq('code', promo_code.trim().toUpperCase())
        .eq('is_active', true)
        .maybeSingle();

      const { data: promoData } = await promoQuery;

      if (promoData) {
        const withinUsageLimit = !promoData.max_uses || promoData.current_uses < promoData.max_uses;
        const notExpired = !promoData.expires_at || new Date(promoData.expires_at) > new Date();
        const productMatch = !promoData.product_id || promoData.product_id === product_id;

        if (withinUsageLimit && notExpired && productMatch) {
          promoCodeId = promoData.id;
          discountPercent = promoData.discount_percent;
          // We calculate the original price from the paid amount: paid = original * (1 - discount/100)
          // So original = paid / (1 - discount/100), discount_amount = original - paid
          const originalPrice = amountPaid / (1 - discountPercent / 100);
          discountAmount = parseFloat((originalPrice - amountPaid).toFixed(2));

          // Increment usage
          await db.from('promo_codes').update({ current_uses: promoData.current_uses + 1 }).eq('id', promoData.id);
        }
      }
    }

    // ── 5. Fee calculations ──
    const platformFeePct = org.platform_fee_percent ?? 10;
    const platformFee = parseFloat((amountPaid * platformFeePct / 100).toFixed(2));

    // ── 6. Affiliate resolution ──
    let affiliateLinkId: string | null = null;
    let affiliateUserId: string | null = null;
    let affiliateCommission = 0;

    // ── Affiliate commission: ONLY on products, NEVER on donations ──
    if (affiliate_code && org.affiliation_enabled && type === 'product') {
      const { data: affLink } = await db.from('affiliate_links')
        .select('id, user_id, is_active, organization_id')
        .eq('code', affiliate_code)
        .eq('organization_id', organization_id)
        .maybeSingle();

      if (affLink?.is_active) {
        // Anti-fraud: affiliate cannot be the buyer
        if (affLink.user_id !== userId) {
          affiliateLinkId = affLink.id;
          affiliateUserId = affLink.user_id;
          const commPct = org.affiliation_commission_percent ?? 10;
          affiliateCommission = parseFloat((amountPaid * commPct / 100).toFixed(2));
        }
      }
    }

    const organizationAmount = parseFloat((amountPaid - platformFee - affiliateCommission).toFixed(2));

    // ── 7. Insert / update transaction record ──
    let transactionId: string;

    if (type === 'donation') {
      const payload: Record<string, unknown> = {
        organization_id,
        campaign_id: campaign_id || null,
        user_id: userId,
        donor_name: donor_name || null,
        donor_email: donor_email || null,
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
        settlement_status: 'held', // Held for 72h before release
      };

      let donationId: string;
      if (existing) {
        const { data: updated } = await db.from('donations').update(payload).eq('id', existing.id).select('id').single();
        donationId = updated.id;
      } else {
        const { data: inserted } = await db.from('donations').insert(payload).select('id').single();
        donationId = inserted.id;
      }
      transactionId = donationId;

      if (campaign_id) {
        const { data: campaign } = await db.from('donation_campaigns').select('current_amount').eq('id', campaign_id).single();
        if (campaign) {
          const newAmount = (campaign.current_amount || 0) + amountPaid;
          await db.from('donation_campaigns').update({ current_amount: newAmount }).eq('id', campaign_id);
        }
      }
    } else {
      if (!product_id) return new Response(JSON.stringify({ error: 'product_id required for product purchase' }), { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

      const payload: Record<string, unknown> = {
        product_id,
        organization_id,
        user_id: userId!,
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
        settlement_status: 'held', // Held for 72h before release
      };

      let purchaseId: string;
      if (existing) {
        const { data: updated } = await db.from('product_purchases').update(payload).eq('id', existing.id).select('id').single();
        purchaseId = updated.id;
      } else {
        const { data: inserted } = await db.from('product_purchases').insert(payload).select('id').single();
        purchaseId = inserted.id;
      }
      transactionId = purchaseId;

      const { data: prod } = await db.from('digital_products').select('sales_count').eq('id', product_id).single();
      if (prod) await db.from('digital_products').update({ sales_count: (prod.sales_count || 0) + 1 }).eq('id', product_id);
    }

    // ── 8. Affiliate sales record + notification ──
    if (affiliateLinkId && affiliateUserId && affiliateCommission > 0) {
      try {
        // Check if affiliate_sale already exists (idempotency)
        const { data: existingAffiliateSale } = await db.from('affiliate_sales')
          .select('id')
          .eq('affiliate_link_id', affiliateLinkId)
          .eq('transaction_id', transactionId)
          .maybeSingle();

        if (!existingAffiliateSale) {
          const payableAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(); // 15 days hold for affiliates
          await db.from('affiliate_sales').insert({
            affiliate_link_id: affiliateLinkId,
            affiliate_user_id: affiliateUserId,
            organization_id,
            transaction_type: type,
            transaction_id: transactionId,
            gross_amount: amountPaid,
            commission_amount: affiliateCommission,
            commission_percent: org.affiliation_commission_percent ?? 10,
            status: 'pending',
            payable_at: payableAt,
          });

          const { data: link } = await db.from('affiliate_links').select('clicks, conversions, total_earned').eq('id', affiliateLinkId).single();
          if (link) {
            await db.from('affiliate_links').update({
              conversions: (link.conversions || 0) + 1,
              total_earned: (link.total_earned || 0) + affiliateCommission,
            }).eq('id', affiliateLinkId);
          }

          const commissionFmt = affiliateCommission.toLocaleString('fr-FR');
          await db.from('user_notifications').insert({
            user_id: affiliateUserId,
            organization_id,
            title: '💰 Commission gagnée !',
            body: `Vous avez gagné ${commissionFmt} ${currency} de commission via ${org.name}. Disponible dans 15 jours.`,
            notification_type: 'commission',
            action_url: '/affiliation',
          });
        }
      } catch (affErr) {
        console.error('[verify-payment] Affiliate processing error (non-fatal):', affErr);
        // Don't fail the entire transaction for affiliate processing errors
      }
    }

    // ── 8b. Partner commission (on platform fee, products only) ──
    if (type === 'product' && platformFee > 0) {
      try {
        // Check if this org was referred by a partner
        const { data: partnerRef } = await db.from('partner_referrals')
          .select('partner_id, status')
          .eq('organization_id', organization_id)
          .eq('status', 'active')
          .maybeSingle();

        if (partnerRef) {
          // Check partner is approved and not suspended
          const { data: partner } = await db.from('partners')
            .select('id, status, user_id, full_name')
            .eq('id', partnerRef.partner_id)
            .eq('status', 'approved')
            .maybeSingle();

          if (partner) {
            // Get effective rate (custom_override > level-based)
            const { data: partnerRate } = await db.rpc('get_partner_rate', { _partner_id: partner.id });
            const effectiveRate = typeof partnerRate === 'number' ? partnerRate : 5;

            // Commission = rate% of platform_fee (NOT of total amount)
            const partnerCommission = parseFloat((platformFee * effectiveRate / 100).toFixed(2));

            if (partnerCommission > 0) {
              // Idempotency: unique(partner_id, payment_reference)
              const { data: existingPartnerComm } = await db.from('partner_commissions')
                .select('id')
                .eq('partner_id', partner.id)
                .eq('payment_reference', reference)
                .maybeSingle();

              if (!existingPartnerComm) {
                const partnerPayableAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(); // 15 days hold

                await db.from('partner_commissions').insert({
                  partner_id: partner.id,
                  organization_id,
                  payment_reference: reference,
                  platform_fee_amount: platformFee,
                  commission_percent: effectiveRate,
                  commission_amount: partnerCommission,
                  currency,
                  status: 'held',
                  payable_at: partnerPayableAt,
                });

                // Notify partner
                if (partner.user_id) {
                  const commFmt = partnerCommission.toLocaleString('fr-FR');
                  await db.from('user_notifications').insert({
                    user_id: partner.user_id,
                    organization_id,
                    title: '🤝 Rémunération partenaire',
                    body: `${commFmt} ${currency} de rémunération via ${org.name}. Disponible dans 15 jours.`,
                    notification_type: 'partner_commission',
                    action_url: '/partner',
                  });
                }
              }
            }
          }
        }
      } catch (partnerErr) {
        console.error('[verify-payment] Partner commission error (non-fatal):', partnerErr);
      }
    }

    // ── 9. Referral conversion ──
    if (userId) {
      const { data: pendingReferral } = await db.from('user_referrals')
        .select('id')
        .eq('referred_id', userId)
        .eq('status', 'pending')
        .maybeSingle();

      if (pendingReferral) {
        await db.from('user_referrals').update({
          status: 'converted',
          converted_at: new Date().toISOString(),
        }).eq('id', pendingReferral.id);

        // Notify referrer
        const { data: referralData } = await db.from('user_referrals')
          .select('referrer_id')
          .eq('id', pendingReferral.id)
          .single();

        if (referralData) {
          await db.from('user_notifications').insert({
            user_id: referralData.referrer_id,
            title: '🎉 Parrainage converti !',
            body: `Un de vos filleuls vient d'effectuer son premier achat/don sur Siteviral.`,
            notification_type: 'referral',
            action_url: '/dashboard',
          });
        }
      }
    }

    // ── 10. User notification ──
    if (userId) {
      await db.from('user_notifications').insert({
        user_id: userId,
        organization_id,
        title: type === 'donation' ? '🙏 Don confirmé' : '✅ Achat confirmé',
        body: type === 'donation'
          ? `Votre don de ${amountPaid.toLocaleString('fr-FR')} ${currency} à ${org.name} a été reçu.`
          : `Votre achat de ${amountPaid.toLocaleString('fr-FR')} ${currency} chez ${org.name} est confirmé.${promoCodeId ? ' (code promo appliqué)' : ''}`,
        notification_type: type === 'donation' ? 'donation' : 'purchase',
        action_url: '/dashboard',
      });
    }

    // Notify org admins
    const { data: admins } = await db.from('organization_members')
      .select('user_id')
      .eq('organization_id', organization_id)
      .in('role', ['owner', 'admin']);

    if (admins?.length) {
      const adminNotifs = admins.map((a: { user_id: string }) => ({
        user_id: a.user_id,
        organization_id,
        title: type === 'donation' ? '💰 Nouveau don reçu' : '🛍️ Nouvelle vente',
        body: `${amountPaid.toLocaleString('fr-FR')} ${currency} — L'organisation reçoit ${organizationAmount.toLocaleString('fr-FR')} ${currency}${promoCodeId ? ' (code promo utilisé)' : ''}`,
        notification_type: type === 'donation' ? 'donation_admin' : 'sale_admin',
        action_url: `/admin/analytics`,
      }));
      await db.from('user_notifications').insert(adminNotifs);
    }

    // ── 11. Send emails (fire-and-forget) ──
    const date = new Date().toLocaleDateString('fr-FR');

    if (type === 'donation') {
      // Email to donor
      const donorAddr = donor_email || (userId ? await getUserEmail(userId) : null);
      if (donorAddr) {
        sendEmail({ template: 'donation_receipt', to: donorAddr, data: { org_name: org.name, amount: amountPaid, currency, reference, date }, organization_id }).catch(() => {});
      }
      // Email to org admins
      sendEmailToOrgAdmins('new_donation_received', organization_id, {
        donor_name: donor_name || 'Anonymous', amount: amountPaid, currency, org_name: org.name,
        campaign_name: campaign_id ? 'Campaign' : 'General', reference,
      }).catch(() => {});
    } else {
      // Email to buyer
      const buyerEmail = userId ? await getUserEmail(userId) : null;
      const { data: productData } = await db.from('digital_products').select('title').eq('id', product_id!).maybeSingle();
      const productName = productData?.title || 'Product';
      if (buyerEmail) {
        sendEmail({ template: 'purchase_confirmation', to: buyerEmail, data: { product_name: productName, org_name: org.name, amount: amountPaid, currency, reference, access_link: `https://siteviral.com/resources` }, organization_id }).catch(() => {});
      }
      // Email to org admins
      sendEmailToOrgAdmins('new_purchase_received', organization_id, {
        buyer_name: donor_name || 'A customer', product_name: productName, amount: amountPaid, currency, reference,
      }).catch(() => {});
    }

    // Affiliate commission email
    if (affiliateLinkId && affiliateUserId && affiliateCommission > 0) {
      const affEmail = await getUserEmail(affiliateUserId);
      if (affEmail) {
        sendEmail({ template: 'affiliate_sale', to: affEmail, data: {
          commission: affiliateCommission, currency, org_name: org.name,
          transaction_type: type, gross_amount: amountPaid,
          commission_percent: org.affiliation_commission_percent ?? 10,
        }, organization_id }).catch(() => {});
      }
    }

    // ── 12. Return result ──
    return new Response(JSON.stringify({
      ok: true,
      transaction_id: transactionId,
      breakdown: {
        amount: amountPaid,
        currency,
        platform_fee: platformFee,
        affiliate_commission: affiliateCommission,
        organization_amount: organizationAmount,
        affiliate_attributed: !!affiliateLinkId,
        discount_amount: discountAmount,
        promo_applied: !!promoCodeId,
        partner_commission_included: type === 'product' && platformFee > 0,
      },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('verify_payment error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});
