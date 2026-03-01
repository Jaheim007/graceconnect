import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail, sendEmailToOrgAdmins, getUserEmail } from './send-email-helper.ts';

/**
 * Centralized transaction processing core.
 * Used by: verify-payment, paystack-webhook, stripe-verify, stripe-webhook.
 *
 * SINGLE SOURCE OF TRUTH for:
 * - Fee calculations
 * - Promo code validation
 * - Affiliate resolution & commission
 * - Partner commission
 * - Transaction insert/update (donations & purchases)
 * - Referral conversion
 * - Notifications (in-app + email)
 * - Audit logging
 */

// ─── Types ───

export interface TransactionInput {
  reference: string;
  type: 'donation' | 'product';
  organization_id: string;
  gateway: 'paystack' | 'stripe';
  source: 'verify' | 'webhook'; // who called us
  amount_paid: number;
  currency: string;

  // Optional context
  campaign_id?: string | null;
  product_id?: string | null;
  user_id?: string | null;
  donor_name?: string | null;
  donor_email?: string | null;
  affiliate_code?: string | null;
  promo_code?: string | null;
}

export interface TransactionResult {
  ok: boolean;
  transaction_id: string;
  idempotent?: boolean;
  reference: string;
  breakdown: {
    amount: number;
    currency: string;
    platform_fee: number;
    affiliate_commission: number;
    organization_amount: number;
    affiliate_attributed: boolean;
    discount_amount: number;
    promo_applied: boolean;
    partner_commission_included: boolean;
  };
}

type DB = ReturnType<typeof createClient>;

// ─── Main entry point ───

export async function processTransaction(
  db: DB,
  input: TransactionInput,
): Promise<TransactionResult> {
  const {
    reference, type, organization_id, gateway, source,
    amount_paid: amountPaid, currency,
    campaign_id, product_id, user_id,
    donor_name, donor_email, affiliate_code, promo_code,
  } = input;

  // ── 1. Idempotency check ──
  const table = type === 'donation' ? 'donations' : 'product_purchases';
  const { data: existing } = await db.from(table)
    .select('id, status')
    .eq('paystack_reference', reference)
    .maybeSingle();

  if (existing?.status === 'completed') {
    // Ensure affiliate is processed even for idempotent returns
    await ensureAffiliateForExisting(db, table, existing.id, reference, amountPaid, currency);
    return {
      ok: true,
      transaction_id: existing.id,
      idempotent: true,
      reference,
      breakdown: await getBreakdownFromDB(db, table, existing.id),
    };
  }

  // ── 2. Load organization ──
  const { data: org, error: orgErr } = await db.from('organizations')
    .select('*')
    .eq('id', organization_id)
    .single();
  if (orgErr || !org) throw new TransactionError('Organization not found', 404);
  if (!org.is_active) throw new TransactionError('Organization is inactive', 403);

  // ── 3. Promo code validation ──
  let promoCodeId: string | null = null;
  let discountPercent = 0;
  let discountAmount = 0;

  if (promo_code) {
    const { data: promoData } = await db.from('promo_codes')
      .select('*')
      .eq('organization_id', organization_id)
      .eq('code', promo_code.trim().toUpperCase())
      .eq('is_active', true)
      .maybeSingle();

    if (promoData) {
      const withinUsageLimit = !promoData.max_uses || promoData.current_uses < promoData.max_uses;
      const notExpired = !promoData.expires_at || new Date(promoData.expires_at) > new Date();
      const productMatch = !promoData.product_id || promoData.product_id === product_id;

      if (withinUsageLimit && notExpired && productMatch) {
        promoCodeId = promoData.id;
        discountPercent = promoData.discount_percent || 0;
        const originalPrice = amountPaid / (1 - discountPercent / 100);
        discountAmount = parseFloat((originalPrice - amountPaid).toFixed(2));
        // Atomic increment would be better, but Supabase JS doesn't support it natively
        await db.from('promo_codes')
          .update({ current_uses: promoData.current_uses + 1 })
          .eq('id', promoData.id);
      }
    }
  }

  // ── 4. Fee calculations ──
  const platformFeePct = org.platform_fee_percent ?? 10;
  const platformFee = parseFloat((amountPaid * platformFeePct / 100).toFixed(2));

  // ── 5. Affiliate resolution (products only, never donations) ──
  let affiliateLinkId: string | null = null;
  let affiliateUserId: string | null = null;
  let affiliateCommission = 0;

  if (affiliate_code && org.affiliation_enabled && type === 'product') {
    const { data: affLink } = await db.from('affiliate_links')
      .select('id, user_id, is_active, organization_id')
      .eq('code', affiliate_code)
      .eq('organization_id', organization_id)
      .maybeSingle();

    if (affLink?.is_active && affLink.user_id !== user_id) {
      affiliateLinkId = affLink.id;
      affiliateUserId = affLink.user_id;
      const commPct = org.affiliation_commission_percent ?? 10;
      affiliateCommission = parseFloat((amountPaid * commPct / 100).toFixed(2));
    }
  }

  const organizationAmount = parseFloat((amountPaid - platformFee - affiliateCommission).toFixed(2));

  // ── 6. Insert or update transaction record ──
  let transactionId: string;

  if (type === 'donation') {
    const payload: Record<string, unknown> = {
      organization_id,
      campaign_id: campaign_id || null,
      user_id: user_id || null,
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
      settlement_status: 'held',
      gateway,
    };

    if (existing) {
      const { data: updated } = await db.from('donations')
        .update(payload)
        .eq('id', existing.id)
        .select('id')
        .single();
      transactionId = updated!.id;
    } else {
      // Catch unique violation (race condition with webhook/verify)
      try {
        const { data: inserted, error: insertErr } = await db.from('donations')
          .insert(payload)
          .select('id')
          .single();
        if (insertErr) {
          if (isUniqueViolation(insertErr)) {
            const { data: found } = await db.from('donations')
              .select('id')
              .eq('paystack_reference', reference)
              .single();
            transactionId = found!.id;
          } else throw insertErr;
        } else {
          transactionId = inserted!.id;
        }
      } catch (e: unknown) {
        if (isUniqueViolation(e)) {
          const { data: found } = await db.from('donations')
            .select('id')
            .eq('paystack_reference', reference)
            .single();
          transactionId = found!.id;
        } else throw e;
      }
    }

    // Update campaign amount (non-atomic — noted as known risk)
    if (campaign_id) {
      const { data: campaign } = await db.from('donation_campaigns')
        .select('current_amount')
        .eq('id', campaign_id)
        .single();
      if (campaign) {
        await db.from('donation_campaigns')
          .update({ current_amount: (campaign.current_amount || 0) + amountPaid })
          .eq('id', campaign_id);
      }
    }
  } else {
    // Product purchase
    if (!product_id) throw new TransactionError('product_id required for product purchase', 400);

    const payload: Record<string, unknown> = {
      product_id,
      organization_id,
      user_id: user_id || null,
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
      gateway,
    };

    if (existing) {
      const { data: updated } = await db.from('product_purchases')
        .update(payload)
        .eq('id', existing.id)
        .select('id')
        .single();
      transactionId = updated!.id;
    } else {
      try {
        const { data: inserted, error: insertErr } = await db.from('product_purchases')
          .insert(payload)
          .select('id')
          .single();
        if (insertErr) {
          if (isUniqueViolation(insertErr)) {
            const { data: found } = await db.from('product_purchases')
              .select('id')
              .eq('paystack_reference', reference)
              .single();
            transactionId = found!.id;
          } else throw insertErr;
        } else {
          transactionId = inserted!.id;
        }
      } catch (e: unknown) {
        if (isUniqueViolation(e)) {
          const { data: found } = await db.from('product_purchases')
            .select('id')
            .eq('paystack_reference', reference)
            .single();
          transactionId = found!.id;
        } else throw e;
      }
    }

    // Increment sales_count (non-atomic — known risk, acceptable for now)
    const { data: prod } = await db.from('digital_products')
      .select('sales_count')
      .eq('id', product_id)
      .single();
    if (prod) {
      await db.from('digital_products')
        .update({ sales_count: (prod.sales_count || 0) + 1 })
        .eq('id', product_id);
    }
  }

  // ── 7. Affiliate sales record + notification ──
  if (affiliateLinkId && affiliateUserId && affiliateCommission > 0) {
    try {
      const { data: existingAffiliateSale } = await db.from('affiliate_sales')
        .select('id')
        .eq('affiliate_link_id', affiliateLinkId)
        .eq('transaction_id', transactionId!)
        .maybeSingle();

      if (!existingAffiliateSale) {
        const payableAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
        await db.from('affiliate_sales').insert({
          affiliate_link_id: affiliateLinkId,
          affiliate_user_id: affiliateUserId,
          organization_id,
          transaction_type: type,
          transaction_id: transactionId!,
          gross_amount: amountPaid,
          commission_amount: affiliateCommission,
          commission_percent: org.affiliation_commission_percent ?? 10,
          status: 'pending',
          payable_at: payableAt,
        });

        // Update affiliate link counters
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

        // Affiliate notification
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
      console.error('[process-transaction] Affiliate processing error (non-fatal):', affErr);
    }
  }

  // ── 8. Partner commission (on platform fee, products only) ──
  if (type === 'product' && platformFee > 0) {
    try {
      const { data: partnerRef } = await db.from('partner_referrals')
        .select('partner_id, status')
        .eq('organization_id', organization_id)
        .eq('status', 'active')
        .maybeSingle();

      if (partnerRef) {
        const { data: partner } = await db.from('partners')
          .select('id, status, user_id, full_name')
          .eq('id', partnerRef.partner_id)
          .eq('status', 'approved')
          .maybeSingle();

        if (partner) {
          const { data: partnerRate } = await db.rpc('get_partner_rate', { _partner_id: partner.id });
          const effectiveRate = typeof partnerRate === 'number' ? partnerRate : 5;
          const partnerCommission = parseFloat((platformFee * effectiveRate / 100).toFixed(2));

          if (partnerCommission > 0) {
            const { data: existingPC } = await db.from('partner_commissions')
              .select('id')
              .eq('partner_id', partner.id)
              .eq('payment_reference', reference)
              .maybeSingle();

            if (!existingPC) {
              const partnerPayableAt = new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString();
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
      console.error('[process-transaction] Partner commission error (non-fatal):', partnerErr);
    }
  }

  // ── 9. Referral conversion ──
  if (user_id) {
    try {
      const { data: pendingReferral } = await db.from('user_referrals')
        .select('id, referrer_id')
        .eq('referred_id', user_id)
        .eq('status', 'pending')
        .maybeSingle();

      if (pendingReferral) {
        await db.from('user_referrals').update({
          status: 'converted',
          converted_at: new Date().toISOString(),
        }).eq('id', pendingReferral.id);

        await db.from('user_notifications').insert({
          user_id: pendingReferral.referrer_id,
          title: '🎉 Parrainage converti !',
          body: `Un de vos filleuls vient d'effectuer son premier achat/don sur Siteviral.`,
          notification_type: 'referral',
          action_url: '/dashboard',
        });
      }
    } catch { /* non-fatal */ }
  }

  // ── 10. User & admin notifications ──
  if (user_id) {
    await db.from('user_notifications').insert({
      user_id,
      organization_id,
      title: type === 'donation' ? '🙏 Don confirmé' : '✅ Achat confirmé',
      body: type === 'donation'
        ? `Votre don de ${amountPaid.toLocaleString('fr-FR')} ${currency} à ${org.name} a été reçu.`
        : `Votre achat de ${amountPaid.toLocaleString('fr-FR')} ${currency} chez ${org.name} est confirmé.${promoCodeId ? ' (code promo appliqué)' : ''}`,
      notification_type: type === 'donation' ? 'donation' : 'purchase',
      action_url: type === 'donation' ? '/dashboard' : '/resources',
    });
  }

  const { data: admins } = await db.from('organization_members')
    .select('user_id')
    .eq('organization_id', organization_id)
    .in('role', ['owner', 'admin']);

  if (admins?.length) {
    const adminNotifs = admins.map((a: { user_id: string }) => ({
      user_id: a.user_id,
      organization_id,
      title: type === 'donation' ? '💰 Nouveau don reçu' : '🛍️ Nouvelle vente',
      body: `${amountPaid.toLocaleString('fr-FR')} ${currency} — L'organisation reçoit ${organizationAmount.toLocaleString('fr-FR')} ${currency}${gateway === 'stripe' ? ' (via Stripe)' : ''}`,
      notification_type: type === 'donation' ? 'donation_admin' : 'sale_admin',
      action_url: '/admin/analytics',
    }));
    await db.from('user_notifications').insert(adminNotifs);
  }

  // ── 11. Emails (with error logging instead of silent catch) ──
  const date = new Date().toLocaleDateString('fr-FR');

  if (type === 'donation') {
    const donorAddr = donor_email || (user_id ? await getUserEmail(user_id) : null);
    if (donorAddr) {
      safeEmail(() => sendEmail({
        template: 'donation_receipt',
        to: donorAddr,
        data: { org_name: org.name, amount: amountPaid, currency, reference, date },
        organization_id,
      }));
    }
    safeEmail(() => sendEmailToOrgAdmins('new_donation_received', organization_id, {
      donor_name: donor_name || 'Anonymous', amount: amountPaid, currency,
      org_name: org.name, campaign_name: campaign_id ? 'Campaign' : 'General', reference,
    }));
  } else {
    const buyerAddr = donor_email || (user_id ? await getUserEmail(user_id) : null);
    const { data: productData } = await db.from('digital_products')
      .select('title')
      .eq('id', product_id!)
      .maybeSingle();
    const productName = productData?.title || 'Product';
    if (buyerAddr) {
      safeEmail(() => sendEmail({
        template: 'purchase_confirmation',
        to: buyerAddr,
        data: { product_name: productName, org_name: org.name, amount: amountPaid, currency, reference, access_link: 'https://siteviral.com/resources' },
        organization_id,
      }));
    }
    safeEmail(() => sendEmailToOrgAdmins('new_purchase_received', organization_id, {
      buyer_name: donor_name || 'A customer', product_name: productName, amount: amountPaid, currency, reference,
    }));
  }

  // Affiliate email
  if (affiliateLinkId && affiliateUserId && affiliateCommission > 0) {
    const affEmail = await getUserEmail(affiliateUserId);
    if (affEmail) {
      safeEmail(() => sendEmail({
        template: 'affiliate_sale',
        to: affEmail,
        data: {
          commission: affiliateCommission, currency, org_name: org.name,
          transaction_type: type, gross_amount: amountPaid,
          commission_percent: org.affiliation_commission_percent ?? 10,
        },
        organization_id,
      }));
    }
  }

  // ── 12. Audit log ──
  await db.from('audit_logs').insert({
    user_id: user_id || null,
    organization_id,
    action: `${gateway}.${type}.completed`,
    resource_type: type,
    resource_id: transactionId!,
    metadata: { reference, amount: amountPaid, currency, gateway, source },
  });

  console.log(`[process-transaction] ✅ ${gateway}/${source} ${type} processed: ${reference} — ${amountPaid} ${currency}`);

  return {
    ok: true,
    transaction_id: transactionId!,
    reference,
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
  };
}

// ─── Helpers ───

export class TransactionError extends Error {
  status: number;
  constructor(message: string, status: number) {
    super(message);
    this.status = status;
  }
}

function isUniqueViolation(err: unknown): boolean {
  if (!err) return false;
  const s = String(err);
  return s.includes('23505') || s.includes('unique') || s.includes('duplicate key');
}

/** Fire-and-forget email with error logging instead of silent swallowing */
function safeEmail(fn: () => Promise<{ ok: boolean; error?: string }>): void {
  fn().then(res => {
    if (!res.ok) {
      console.error('[process-transaction] Email send failed:', res.error);
    }
  }).catch(err => {
    console.error('[process-transaction] Email send error:', err);
  });
}

/** Ensure affiliate processing for already-completed transactions (webhook catch-up) */
async function ensureAffiliateForExisting(
  db: DB,
  table: string,
  transactionId: string,
  reference: string,
  amountPaid: number,
  currency: string,
): Promise<void> {
  try {
    const { data: tx } = await db.from(table)
      .select('affiliate_link_id, affiliate_commission, organization_id')
      .eq('id', transactionId)
      .single();

    if (!tx?.affiliate_link_id || !tx.affiliate_commission || tx.affiliate_commission <= 0) return;

    const { data: existingSale } = await db.from('affiliate_sales')
      .select('id')
      .eq('transaction_id', transactionId)
      .maybeSingle();
    if (existingSale) return;

    const { data: affLink } = await db.from('affiliate_links')
      .select('id, user_id, conversions, total_earned')
      .eq('id', tx.affiliate_link_id)
      .single();
    if (!affLink) return;

    const { data: org } = await db.from('organizations')
      .select('name, affiliation_commission_percent')
      .eq('id', tx.organization_id)
      .single();

    await db.from('affiliate_sales').insert({
      affiliate_link_id: tx.affiliate_link_id,
      affiliate_user_id: affLink.user_id,
      organization_id: tx.organization_id,
      transaction_type: table === 'donations' ? 'donation' : 'product',
      transaction_id: transactionId,
      gross_amount: amountPaid,
      commission_amount: tx.affiliate_commission,
      commission_percent: org?.affiliation_commission_percent ?? 10,
      status: 'pending',
      payable_at: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString(),
    });

    await db.from('affiliate_links').update({
      conversions: (affLink.conversions || 0) + 1,
      total_earned: (affLink.total_earned || 0) + tx.affiliate_commission,
    }).eq('id', tx.affiliate_link_id);

    const commissionFmt = tx.affiliate_commission.toLocaleString('fr-FR');
    await db.from('user_notifications').insert({
      user_id: affLink.user_id,
      organization_id: tx.organization_id,
      title: '💰 Commission gagnée !',
      body: `Vous avez gagné ${commissionFmt} ${currency} de commission via ${org?.name || 'une organisation'}.`,
      notification_type: 'commission',
      action_url: '/affiliation',
    });
  } catch (err) {
    console.error('[process-transaction] ensureAffiliateForExisting error (non-fatal):', err);
  }
}

/** Get breakdown from an already-stored record */
async function getBreakdownFromDB(db: DB, table: string, id: string) {
  const { data } = await db.from(table)
    .select('amount, currency, platform_fee, affiliate_commission, organization_amount')
    .eq('id', id)
    .single();

  return {
    amount: data?.amount || 0,
    currency: data?.currency || 'XOF',
    platform_fee: data?.platform_fee || 0,
    affiliate_commission: data?.affiliate_commission || 0,
    organization_amount: data?.organization_amount || 0,
    affiliate_attributed: (data?.affiliate_commission || 0) > 0,
    discount_amount: 0,
    promo_applied: false,
    partner_commission_included: false,
  };
}
