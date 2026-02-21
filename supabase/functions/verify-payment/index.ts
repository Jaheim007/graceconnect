import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

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

  const PAYSTACK_SECRET = Deno.env.get('PAYSTACK_SECRET_KEY')!;
  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SUPABASE_SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')!;

  const db = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

  try {
    const body: VerifyPaymentBody = await req.json();
    const { reference, type, organization_id, campaign_id, product_id, affiliate_code, donor_name, donor_email, promo_code } = body;

    if (!reference || !type || !organization_id) {
      return new Response(JSON.stringify({ error: 'Missing required fields' }), {
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

    if (affiliate_code && org.affiliation_enabled) {
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
      const payableAt = new Date(Date.now() + 72 * 60 * 60 * 1000).toISOString();
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
        body: `Vous venez de gagner ${commissionFmt} ${currency} de commission sur une vente ${type === 'donation' ? 'de don' : 'de produit'} via ${org.name}. Elle sera disponible dans 72h.`,
        notification_type: 'commission',
        action_url: '/dashboard',
      });
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

    // ── 11. Send email receipt ──
    const emailAddress = donor_email || null;

    if (emailAddress && RESEND_API_KEY) {
      const emailHtml = type === 'donation'
        ? buildDonationReceiptHtml({ orgName: org.name, amount: amountPaid, currency, reference, date: new Date().toLocaleDateString('fr-FR') })
        : buildPurchaseReceiptHtml({ orgName: org.name, amount: amountPaid, currency, reference, date: new Date().toLocaleDateString('fr-FR'), discount: discountAmount, promoCode: promo_code || '' });

      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: { Authorization: `Bearer ${RESEND_API_KEY}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          from: 'Siteviral <noreply@graceconnect.app>',
          to: [emailAddress],
          subject: type === 'donation' ? `Reçu de don – ${org.name}` : `Confirmation d'achat – ${org.name}`,
          html: emailHtml,
        }),
      }).catch(console.error);
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
      },
    }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

  } catch (err) {
    console.error('verify_payment error:', err);
    return new Response(JSON.stringify({ error: 'Internal server error', details: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }
});

// ── Email templates ──
function buildDonationReceiptHtml({ orgName, amount, currency, reference, date }: Record<string, string | number>) {
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0f0f0f;color:#eee;padding:32px">
<div style="max-width:520px;margin:0 auto;background:#1a1a1a;border-radius:16px;padding:32px;border:1px solid #333">
  <h1 style="color:#c9a84c;margin-top:0">🙏 Reçu de don</h1>
  <p>Merci pour votre don généreux à <strong>${orgName}</strong>.</p>
  <table style="width:100%;border-collapse:collapse;margin:24px 0">
    <tr><td style="padding:8px 0;color:#aaa">Montant</td><td style="text-align:right;font-weight:bold;color:#c9a84c">${Number(amount).toLocaleString('fr-FR')} ${currency}</td></tr>
    <tr><td style="padding:8px 0;color:#aaa">Référence</td><td style="text-align:right;font-family:monospace;font-size:12px">${reference}</td></tr>
    <tr><td style="padding:8px 0;color:#aaa">Date</td><td style="text-align:right">${date}</td></tr>
  </table>
  <p style="color:#777;font-size:12px">Ceci est un reçu officiel de Siteviral. Conservez-le pour vos dossiers.</p>
</div></body></html>`;
}

function buildPurchaseReceiptHtml({ orgName, amount, currency, reference, date, discount, promoCode }: Record<string, string | number>) {
  const discountRow = Number(discount) > 0
    ? `<tr><td style="padding:8px 0;color:#4ade80">Réduction (${promoCode})</td><td style="text-align:right;color:#4ade80">-${Number(discount).toLocaleString('fr-FR')} ${currency}</td></tr>`
    : '';
  return `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0f0f0f;color:#eee;padding:32px">
<div style="max-width:520px;margin:0 auto;background:#1a1a1a;border-radius:16px;padding:32px;border:1px solid #333">
  <h1 style="color:#c9a84c;margin-top:0">✅ Confirmation d'achat</h1>
  <p>Votre achat chez <strong>${orgName}</strong> est confirmé.</p>
  <table style="width:100%;border-collapse:collapse;margin:24px 0">
    <tr><td style="padding:8px 0;color:#aaa">Montant payé</td><td style="text-align:right;font-weight:bold;color:#c9a84c">${Number(amount).toLocaleString('fr-FR')} ${currency}</td></tr>
    ${discountRow}
    <tr><td style="padding:8px 0;color:#aaa">Référence</td><td style="text-align:right;font-family:monospace;font-size:12px">${reference}</td></tr>
    <tr><td style="padding:8px 0;color:#aaa">Date</td><td style="text-align:right">${date}</td></tr>
  </table>
  <p style="color:#777;font-size:12px">Accédez à votre achat depuis votre tableau de bord Siteviral. Merci pour votre confiance !</p>
</div></body></html>`;
}
