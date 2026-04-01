import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { sendEmail, sendEmailToOrgAdmins, getUserEmail } from './send-email-helper.ts';
import { dispatchWebhook } from './dispatch-webhook.ts';

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
  buyer_name?: string | null;
  buyer_email?: string | null;
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
    donor_name, donor_email, buyer_name, buyer_email,
    affiliate_code, promo_code,
  } = input;

  // ── 1. Idempotency check ──
  const table = type === 'donation' ? 'donations' : 'product_purchases';
  const { data: existing } = await db.from(table)
    .select('id, status')
    .eq('paystack_reference', reference)
    .maybeSingle();

  if (existing?.status === 'completed') {
    // Ensure affiliate + partner processing even for idempotent returns
    await Promise.all([
      ensureAffiliateForExisting(db, table, existing.id, reference, amountPaid, currency),
      ensurePartnerForExisting(db, table, existing.id, reference, currency),
    ]);
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
        // Atomic increment via DB function (prevents race conditions)
        const { data: incrementOk } = await db.rpc('increment_promo_uses', { _promo_id: promoData.id });
        if (incrementOk === false) {
          // Promo limit reached between check and increment — skip promo
          console.warn('[process-transaction] Promo code limit reached atomically:', promo_code);
        } else {
          promoCodeId = promoData.id;
          discountPercent = promoData.discount_percent || 0;
          const originalPrice = amountPaid / (1 - discountPercent / 100);
          discountAmount = parseFloat((originalPrice - amountPaid).toFixed(2));
        }
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
      // Per-product commission rate overrides org default
      let commPct = org.affiliation_commission_percent ?? 10;
      if (product_id) {
        const { data: prod } = await db.from('digital_products')
          .select('commission_rate')
          .eq('id', product_id)
          .maybeSingle();
        if (prod?.commission_rate != null) commPct = prod.commission_rate;
      }
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

    // Update campaign amount (atomic via DB function)
    if (campaign_id) {
      await db.rpc('increment_campaign_amount', { _campaign_id: campaign_id, _amount: amountPaid });
    }
  } else {
    // Product purchase
    if (!product_id) throw new TransactionError('product_id required for product purchase', 400);

    // ── Resolve user_id: CRITICAL — product_purchases.user_id is NOT NULL ──
    let resolvedUserId = user_id || null;
    if (!resolvedUserId) {
      // Last resort: try to find user by email
      const lookupEmail = buyer_email || donor_email;
      if (lookupEmail) {
        try {
          const { data: users } = await db.auth.admin.listUsers({ perPage: 1 });
          // Search by email via admin API
          const { data: userByEmail } = await db.rpc('get_user_id_by_email' as any, { _email: lookupEmail }).maybeSingle();
          if (userByEmail?.id) resolvedUserId = userByEmail.id;
        } catch (_) { /* non-fatal */ }
      }
      // If still null, check the most recent auth user with this email via admin API
      if (!resolvedUserId && lookupEmail) {
        try {
          const { data: { users } } = await db.auth.admin.listUsers({ page: 1, perPage: 1 });
          // Direct lookup
          for (const u of (users || [])) {
            if (u.email === lookupEmail) {
              resolvedUserId = u.id;
              break;
            }
          }
        } catch (_) { /* non-fatal */ }
      }
      if (!resolvedUserId) {
        console.error(`[process-transaction] CRITICAL: No user_id for product purchase ref=${reference} email=${buyer_email || donor_email}`);
        throw new TransactionError('User identification required for product purchase. Please log in and try again.', 400);
      }
      console.warn(`[process-transaction] Resolved user_id from email lookup: ${resolvedUserId} for ref=${reference}`);
    }

    // Resolve buyer info: use explicit params, fallback to donor fields, then profile lookup
    let resolvedBuyerName = buyer_name || donor_name || null;
    let resolvedBuyerEmail = buyer_email || donor_email || null;
    if (resolvedUserId && (!resolvedBuyerName || !resolvedBuyerEmail)) {
      try {
        if (!resolvedBuyerName) {
          const { data: prof } = await db.from('profiles').select('display_name').eq('id', resolvedUserId).maybeSingle();
          if (prof?.display_name) resolvedBuyerName = prof.display_name;
        }
        if (!resolvedBuyerEmail) {
          const { data: authUser } = await db.auth.admin.getUserById(resolvedUserId);
          if (authUser?.user?.email) resolvedBuyerEmail = authUser.user.email;
        }
      } catch (_) { /* non-fatal */ }
    }

    const payload: Record<string, unknown> = {
      product_id,
      organization_id,
      user_id: resolvedUserId,
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
      buyer_name: resolvedBuyerName,
      buyer_email: resolvedBuyerEmail,
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

    // Increment sales_count (atomic via DB function)
    await db.rpc('increment_sales_count', { _product_id: product_id });
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

        // Update affiliate link counters atomically (avoid race conditions)
        await db.rpc('increment_affiliate_link_stats', {
          _link_id: affiliateLinkId,
          _earned: affiliateCommission,
        });

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

  // ── 8. Partner referral activation + commission (on platform fee, products only) ──
  let partnerCommissionIncluded = false;
  if (platformFee > 0) {
    try {
      // First: activate any pending partner referral on first completed payment for this org
      const { data: pendingRef } = await db.from('partner_referrals')
        .select('id, partner_id, status')
        .eq('organization_id', organization_id)
        .in('status', ['pending', 'active'])
        .maybeSingle();

      if (pendingRef) {
        // If still pending, activate it (first payment = org is active)
        if (pendingRef.status === 'pending') {
          await db.from('partner_referrals')
            .update({ status: 'active', locked_at: new Date().toISOString() })
            .eq('id', pendingRef.id);

          // Notify the partner about the new active org
          const { data: refPartner } = await db.from('partners')
            .select('user_id, full_name')
            .eq('id', pendingRef.partner_id)
            .maybeSingle();
          if (refPartner?.user_id) {
            await db.from('user_notifications').insert({
              user_id: refPartner.user_id,
              organization_id,
              title: '🎉 Organisation activée !',
              body: `${org.name} vient d'effectuer son premier paiement. Elle est maintenant comptabilisée comme active dans votre portefeuille.`,
              notification_type: 'partner_referral_active',
              action_url: '/partner',
            });
          }
        }

        // Compute commission for all transaction types (products AND donations)
          const { data: partner } = await db.from('partners')
            .select('id, status, user_id, full_name, level')
            .eq('id', pendingRef.partner_id)
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
                partnerCommissionIncluded = true;

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

                // Check for level-up
                const oldLevel = partner.level || 1;
                const { data: newLevelResult } = await db.rpc('compute_partner_level', { _partner_id: partner.id });
                const newLevel = typeof newLevelResult === 'number' ? newLevelResult : oldLevel;

                if (newLevel > oldLevel) {
                  // Update partner level
                  await db.from('partners').update({ level: newLevel }).eq('id', partner.id);

                  const LEVEL_NAMES: Record<number, string> = { 1: 'Bronze', 2: 'Argent', 3: 'Or', 4: 'Platine', 5: 'Diamant' };
                  const LEVEL_RATES: Record<number, number> = { 1: 5, 2: 8, 3: 10, 4: 12, 5: 15 };

                  // In-app notification
                  if (partner.user_id) {
                    await db.from('user_notifications').insert({
                      user_id: partner.user_id,
                      title: `🏆 Niveau ${LEVEL_NAMES[newLevel]} atteint !`,
                      body: `Félicitations ! Votre commission passe à ${LEVEL_RATES[newLevel]}%.`,
                      notification_type: 'partner_level_up',
                      action_url: '/partner',
                    });
                  }

                  // Level-up email
                  const { data: partnerEmail } = await db.from('partners')
                    .select('email, full_name')
                    .eq('id', partner.id)
                    .single();
                  if (partnerEmail?.email) {
                    safeEmail(() => sendEmail({
                      template: 'partner_level_up',
                      to: partnerEmail.email,
                      data: {
                        name: partnerEmail.full_name,
                        old_level: LEVEL_NAMES[oldLevel],
                        new_level: LEVEL_NAMES[newLevel],
                        new_rate: String(LEVEL_RATES[newLevel]),
                      },
                    }));
                  }
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

  // ── 12. Auto-capture contact in CRM ──
  try {
    const contactEmail = donor_email || buyer_email;
    const contactName = donor_name || buyer_name;
    if (contactEmail && organization_id) {
      const tag = type === 'donation' ? 'donor' : 'buyer';
      const { data: existingContact } = await db.from('contacts')
        .select('id, tags')
        .eq('organization_id', organization_id)
        .eq('email', contactEmail)
        .maybeSingle();

      if (existingContact) {
        // Add tag if not already present
        const currentTags: string[] = existingContact.tags || [];
        if (!currentTags.includes(tag)) {
          await db.from('contacts').update({
            tags: [...currentTags, tag],
            name: contactName || existingContact.name || null,
          }).eq('id', existingContact.id);
        }
      } else {
        await db.from('contacts').insert({
          organization_id,
          email: contactEmail,
          name: contactName || null,
          source: type === 'donation' ? 'donation' : 'purchase',
          tags: [tag],
          is_subscribed: true,
        });
      }
    }
  } catch (crmErr) {
    console.warn('[process-transaction] CRM contact capture error (non-fatal):', crmErr);
  }

  // ── 13. Audit log ──
  await db.from('audit_logs').insert({
    user_id: user_id || null,
    organization_id,
    action: `${gateway}.${type}.completed`,
    resource_type: type,
    resource_id: transactionId!,
    metadata: { reference, amount: amountPaid, currency, gateway, source },
  });

  // ── 13. Fire org webhook via outgoing-webhook Edge Function ──
  const webhookEvent = type === 'donation' ? 'donation.received' : 'purchase.completed';
  dispatchWebhook(db, organization_id, webhookEvent, {
    transaction_id: transactionId,
    reference,
    type,
    amount: amountPaid,
    currency,
    gateway,
    platform_fee: platformFee,
    organization_amount: organizationAmount,
    product_id: product_id || null,
    campaign_id: campaign_id || null,
    buyer_name: donor_name || buyer_name || null,
    buyer_email: donor_email || buyer_email || null,
    affiliate_attributed: !!affiliateLinkId,
    affiliate_commission: affiliateCommission,
    promo_applied: !!promoCodeId,
    discount_amount: discountAmount,
  });

  // Fire affiliate.sale webhook if applicable
  if (affiliateLinkId && affiliateCommission > 0) {
    dispatchWebhook(db, organization_id, 'affiliate.sale', {
      transaction_id: transactionId,
      reference,
      affiliate_link_id: affiliateLinkId,
      affiliate_user_id: affiliateUserId,
      commission_amount: affiliateCommission,
      gross_amount: amountPaid,
      currency,
    });
  }

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
      partner_commission_included: partnerCommissionIncluded,
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
    if (!res?.ok) {
      console.warn('[process-transaction] Email send failed:', res?.error || 'unknown');
    }
  }).catch(err => {
    console.warn('[process-transaction] Email send error (non-fatal):', err);
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
      .select('id, user_id')
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

    // Update affiliate link counters atomically
    await db.rpc('increment_affiliate_link_stats', {
      _link_id: tx.affiliate_link_id,
      _earned: tx.affiliate_commission,
    });

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

/** Ensure partner commission exists for already-completed transactions (idempotent catch-up) */
async function ensurePartnerForExisting(
  db: DB,
  table: string,
  transactionId: string,
  reference: string,
  fallbackCurrency: string,
): Promise<void> {
  try {
    const { data: tx } = await db.from(table)
      .select('organization_id, platform_fee, completed_at, currency')
      .eq('id', transactionId)
      .single();

    const platformFee = Number(tx?.platform_fee || 0);
    if (!tx?.organization_id || platformFee <= 0) return;

    const { data: referral } = await db.from('partner_referrals')
      .select('id, partner_id, status')
      .eq('organization_id', tx.organization_id)
      .in('status', ['pending', 'active'])
      .maybeSingle();

    if (!referral) return;

    const { data: partner } = await db.from('partners')
      .select('id, user_id, full_name, level')
      .eq('id', referral.partner_id)
      .eq('status', 'approved')
      .maybeSingle();

    if (!partner) return;

    if (referral.status === 'pending') {
      await db.from('partner_referrals')
        .update({ status: 'active', locked_at: tx.completed_at || new Date().toISOString() })
        .eq('id', referral.id);
    }

    const { data: existingCommission } = await db.from('partner_commissions')
      .select('id')
      .eq('partner_id', partner.id)
      .eq('payment_reference', reference)
      .maybeSingle();

    if (existingCommission) return;

    const { data: partnerRate } = await db.rpc('get_partner_rate', { _partner_id: partner.id });
    const effectiveRate = typeof partnerRate === 'number' ? partnerRate : 5;
    const partnerCommission = parseFloat((platformFee * effectiveRate / 100).toFixed(2));
    if (partnerCommission <= 0) return;

    const completedAt = tx.completed_at ? new Date(tx.completed_at) : new Date();
    const payableAt = new Date(completedAt.getTime() + 15 * 24 * 60 * 60 * 1000);
    const status = payableAt <= new Date() ? 'payable' : 'held';
    const currency = tx.currency || fallbackCurrency || 'XOF';

    await db.from('partner_commissions').insert({
      partner_id: partner.id,
      organization_id: tx.organization_id,
      payment_reference: reference,
      platform_fee_amount: platformFee,
      commission_percent: effectiveRate,
      commission_amount: partnerCommission,
      currency,
      status,
      payable_at: payableAt.toISOString(),
    });

    if (partner.user_id) {
      const { data: org } = await db.from('organizations')
        .select('name')
        .eq('id', tx.organization_id)
        .maybeSingle();

      await db.from('user_notifications').insert({
        user_id: partner.user_id,
        organization_id: tx.organization_id,
        title: '🤝 Rémunération partenaire',
        body: `${partnerCommission.toLocaleString('fr-FR')} ${currency} de rémunération via ${org?.name || 'une organisation'}. Disponible dans 15 jours.`,
        notification_type: 'partner_commission',
        action_url: '/partner',
      });
    }

    const oldLevel = partner.level || 1;
    const { data: newLevelResult } = await db.rpc('compute_partner_level', { _partner_id: partner.id });
    const newLevel = typeof newLevelResult === 'number' ? newLevelResult : oldLevel;
    if (newLevel > oldLevel) {
      await db.from('partners').update({ level: newLevel }).eq('id', partner.id);
    }
  } catch (err) {
    console.error('[process-transaction] ensurePartnerForExisting error (non-fatal):', err);
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
