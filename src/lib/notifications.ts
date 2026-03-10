/**
 * Centralized notification system — fires both in-app (user_notifications) and email.
 * Every function is fire-and-forget: never throws, never blocks UI.
 */
import { db } from '@/lib/db';
import { sendEmailNotification, EmailTemplate } from '@/lib/api';

// ── In-app notification insert ──
async function notify(
  userId: string,
  title: string,
  body: string,
  type: string = 'system',
  orgId?: string,
  actionUrl?: string,
) {
  try {
    await db.from('user_notifications').insert({
      user_id: userId,
      title,
      body,
      notification_type: type,
      organization_id: orgId || null,
      action_url: actionUrl || null,
    });
  } catch (e) {
    console.error('notify insert failed:', e);
  }
}

// ── Combined: in-app + email ──
async function notifyAndEmail(
  userId: string,
  email: string | undefined,
  title: string,
  body: string,
  template: EmailTemplate,
  emailData: Record<string, string | number>,
  type: string = 'system',
  orgId?: string,
  actionUrl?: string,
) {
  notify(userId, title, body, type, orgId, actionUrl);
  if (email) {
    sendEmailNotification(template, email, emailData, orgId).catch(() => {});
  }
}

// ── Notify all members of an org (in-app only) ──
async function notifyOrgMembers(
  orgId: string,
  title: string,
  body: string,
  type: string = 'org',
  excludeUserId?: string,
  actionUrl?: string,
) {
  try {
    const { data: members } = await db.from('organization_members')
      .select('user_id')
      .eq('organization_id', orgId);
    for (const m of members || []) {
      if (m.user_id !== excludeUserId) {
        notify(m.user_id, title, body, type, orgId, actionUrl);
      }
    }
  } catch (e) {
    console.error('notifyOrgMembers failed:', e);
  }
}

// ── Notify only owners & admins of an org (in-app only) ──
async function notifyOrgOwnersAdmins(
  orgId: string,
  title: string,
  body: string,
  type: string = 'org',
  actionUrl?: string,
) {
  try {
    const { data: members } = await db.from('organization_members')
      .select('user_id, role')
      .eq('organization_id', orgId)
      .in('role', ['owner', 'admin']);
    for (const m of members || []) {
      notify(m.user_id, title, body, type, orgId, actionUrl);
    }
  } catch (e) {
    console.error('notifyOrgOwnersAdmins failed:', e);
  }
}

// ── Notify all affiliates of an org (in-app + email) ──
async function notifyOrgAffiliates(
  orgId: string,
  orgName: string,
  title: string,
  body: string,
  template: EmailTemplate,
  emailData: Record<string, string | number>,
  type: string = 'affiliate',
) {
  try {
    const { data: links } = await db.from('affiliate_links')
      .select('user_id')
      .eq('organization_id', orgId)
      .eq('is_active', true);
    if (!links?.length) return;

    // Deduplicate user_ids
    const uniqueUserIds = Array.from(new Set<string>(links.map(l => String(l.user_id))));

    // Fetch emails for all affiliates
    const { data: profiles } = await db.from('profiles')
      .select('id')
      .in('id', uniqueUserIds);
    const emailMap = new Map<string, string>();

    for (const userId of uniqueUserIds) {
      notify(userId, title, body, type, orgId, `/affiliation`);
      const email = emailMap.get(userId);
      if (email) {
        sendEmailNotification(template, email, { ...emailData, org_name: orgName }, orgId).catch(() => {});
      }
    }
  } catch (e) {
    console.error('notifyOrgAffiliates failed:', e);
  }
}

// ── Email to org admins/owners (via edge function) ──
function emailOrgAdmins(template: EmailTemplate, orgId: string, data: Record<string, string | number>) {
  sendEmailNotification(template, '', data, orgId).catch(() => {});
}

// ── Email only to org owner (via edge function with owner_only flag) ──
function emailOrgOwnerOnly(template: EmailTemplate, orgId: string, data: Record<string, string | number>) {
  sendEmailNotification(template, '', { ...data, __owner_only: 1 }, orgId).catch(() => {});
}

// ═══════════════════════════════════════════════════════════
// PUBLIC API — call these from components / hooks
// ═══════════════════════════════════════════════════════════

// ── Member joins an org ──
export async function onMemberJoined(
  userId: string,
  userEmail: string | undefined,
  userName: string,
  orgId: string,
  orgName: string,
) {
  notify(userId, `🎉 Bienvenue dans ${orgName}`, `Vous avez rejoint l'organisation ${orgName}.`, 'org', orgId, `/org/${orgId}`);
  emailOrgAdmins('new_member_joined', orgId, { org_name: orgName, member_name: userName });
}

// ── Member leaves an org ──
export async function onMemberLeft(
  userId: string,
  userName: string,
  orgId: string,
  orgName: string,
) {
  emailOrgAdmins('member_left', orgId, { org_name: orgName, member_name: userName });
}

// ── Role changed ──
export async function onRoleChanged(
  userId: string,
  userEmail: string | undefined,
  orgName: string,
  orgId: string,
  newRole: string,
  oldRole?: string,
) {
  notifyAndEmail(
    userId, userEmail,
    '🔄 Rôle mis à jour',
    `Votre rôle dans ${orgName} est maintenant : ${newRole}.`,
    'role_changed',
    { org_name: orgName, new_role: newRole, old_role: oldRole || '' },
    'org', orgId, `/admin/members`,
  );
}

// ── Invite accepted ──
export async function onInviteAccepted(
  inviterId: string,
  inviterEmail: string | undefined,
  memberName: string,
  orgId: string,
  orgName: string,
) {
  notifyAndEmail(
    inviterId, inviterEmail,
    '✅ Invitation acceptée',
    `${memberName} a accepté votre invitation pour ${orgName}.`,
    'invite_accepted',
    { member_name: memberName, org_name: orgName },
    'org', orgId, `/admin/members`,
  );
}

// ── Notify only owner of an org (in-app only) ──
async function notifyOrgOwnerOnly(
  orgId: string,
  title: string,
  body: string,
  type: string = 'org',
  actionUrl?: string,
) {
  try {
    const { data: members } = await db.from('organization_members')
      .select('user_id, role')
      .eq('organization_id', orgId)
      .eq('role', 'owner');
    for (const m of members || []) {
      notify(m.user_id, title, body, type, orgId, actionUrl);
    }
  } catch (e) {
    console.error('notifyOrgOwnerOnly failed:', e);
  }
}

// ── Content published (events, announcements, media, products, campaigns) ──
export async function onContentPublished(
  orgId: string,
  orgName: string,
  contentType: 'event' | 'announcement' | 'media' | 'product' | 'campaign' | 'program',
  contentTitle: string,
  contentId: string,
  extraData?: Record<string, string | number>,
  publisherId?: string,
) {
  const templates: Record<string, EmailTemplate> = {
    event: 'new_event_published',
    announcement: 'new_announcement_published',
    media: 'new_media_published',
    product: 'new_product_published',
    campaign: 'new_campaign_published',
    program: 'new_program_published',
  };

  const icons: Record<string, string> = {
    event: '📅', announcement: '📢', media: '🎬',
    product: '🛍', campaign: '🎯', program: '🎓',
  };

  const labels: Record<string, string> = {
    event: 'événement', announcement: 'annonce', media: 'contenu',
    product: 'produit', campaign: 'campagne', program: 'programme',
  };

  const notifTitle = `${icons[contentType]} Nouveau ${labels[contentType]}`;
  const notifBody = `${orgName} a publié : "${contentTitle}"`;

  // In-app notification to all members — deep link to the relevant content page
  const contentRoutes: Record<string, string> = {
    event: `/admin/events`,
    announcement: `/admin/announcements`,
    media: `/admin/media`,
    product: `/admin/products`,
    campaign: `/admin/campaigns`,
    program: `/admin/programs`,
  };
  notifyOrgMembers(orgId, notifTitle, notifBody, 'org', publisherId, contentRoutes[contentType] || `/feed`);

  // Email to org admins with the right template
  emailOrgAdmins(templates[contentType], orgId, {
    org_name: orgName,
    [`${contentType}_title`]: contentTitle,
    event_title: contentTitle,
    announcement_title: contentTitle,
    media_title: contentTitle,
    product_name: contentTitle,
    program_name: contentTitle,
    org_link: `https://siteviral.com/org/${orgId}`,
    ...extraData,
  });

  // Notify all affiliates about new promotable content
  // IMPORTANT: No commissions on donations/campaigns — only products and paid programs
  if (['product', 'program'].includes(contentType)) {
    const affiliateTemplates: Record<string, EmailTemplate> = {
      product: 'affiliate_new_product',
      program: 'affiliate_new_program',
    };
    notifyOrgAffiliates(
      orgId, orgName,
      `🚀 Nouveau ${labels[contentType]} à promouvoir !`,
      `${orgName} vient d'ajouter un nouveau ${labels[contentType]} : "${contentTitle}". Partagez-le avec votre audience pour gagner des commissions !`,
      affiliateTemplates[contentType],
      {
        content_title: contentTitle,
        content_type: labels[contentType],
        org_link: `https://siteviral.com/org/${orgId}`,
        ...extraData,
      },
    );
  }
}

// ── Notify affiliates: content unpublished ──
// Only for products and programs — no commissions on campaigns/donations
export async function onContentUnpublished(
  orgId: string,
  orgName: string,
  contentType: 'product' | 'program',
  contentTitle: string,
) {
  const labels: Record<string, string> = { product: 'produit', program: 'programme' };
  notifyOrgAffiliates(
    orgId, orgName,
    `⚠️ ${labels[contentType].charAt(0).toUpperCase() + labels[contentType].slice(1)} retiré`,
    `Le ${labels[contentType]} "${contentTitle}" de ${orgName} a été dépublié. Retirez-le de vos promotions.`,
    'affiliate_content_unpublished',
    { content_title: contentTitle, content_type: labels[contentType] },
  );
}

// ── Notify affiliates: price changed ──
export async function onProductPriceChanged(
  orgId: string,
  orgName: string,
  productTitle: string,
  oldPrice: number,
  newPrice: number,
  currency: string,
) {
  notifyOrgAffiliates(
    orgId, orgName,
    '💲 Prix modifié',
    `Le prix de "${productTitle}" est passé de ${oldPrice} à ${newPrice} ${currency}. Mettez à jour vos communications !`,
    'affiliate_price_changed',
    { content_title: productTitle, old_price: oldPrice, new_price: newPrice, currency },
  );
}

// ── Content liked ──
export async function onContentLiked(
  creatorUserId: string,
  creatorEmail: string | undefined,
  likerName: string,
  contentTitle: string,
  contentType: string = 'media',
) {
  notifyAndEmail(
    creatorUserId, creatorEmail,
    '❤️ Nouveau like',
    `${likerName} a aimé votre contenu "${contentTitle}".`,
    'content_liked',
    { liker_name: likerName, content_title: contentTitle, content_type: contentType },
    'social',
  );
}

// ── Content saved ──
export async function onContentSaved(
  creatorUserId: string,
  creatorEmail: string | undefined,
  saverName: string,
  contentTitle: string,
  contentType: string = 'media',
) {
  notifyAndEmail(
    creatorUserId, creatorEmail,
    '🔖 Contenu enregistré',
    `${saverName} a enregistré votre contenu "${contentTitle}".`,
    'content_saved',
    { saver_name: saverName, content_title: contentTitle, content_type: contentType },
    'social',
  );
}

// ── Directory application result ──
export async function onDirectoryDecision(
  orgId: string,
  orgName: string,
  action: 'approved' | 'rejected',
  reason?: string,
) {
  const template: EmailTemplate = action === 'approved' ? 'directory_approved' : 'directory_rejected';
  emailOrgAdmins(template, orgId, { org_name: orgName, reason: reason || '' });
}

// ── Org suspended / unsuspended ──
export async function onOrgSuspended(orgId: string, orgName: string, reason: string, until?: string) {
  emailOrgOwnerOnly('org_suspended', orgId, { org_name: orgName, reason, until: until || '' });
  notifyOrgOwnerOnly(orgId, '⚠️ Organisation suspendue', `${orgName} a été suspendue. Raison: ${reason}`, 'system', `/admin`);
}

export async function onOrgUnsuspended(orgId: string, orgName: string) {
  emailOrgOwnerOnly('org_unsuspended', orgId, { org_name: orgName });
  notifyOrgOwnerOnly(orgId, '✅ Suspension levée', `${orgName} est de nouveau active.`, 'system', `/admin`);
}

// ── Payouts frozen ──
export async function onPayoutsFrozen(orgId: string, orgName: string, reason: string) {
  emailOrgAdmins('payouts_frozen', orgId, { org_name: orgName, reason });
}

// ── KYC status ──
export async function onKycStatusChanged(
  orgId: string,
  orgName: string,
  status: 'submitted' | 'approved' | 'rejected',
  reason?: string,
) {
  const templates: Record<string, EmailTemplate> = {
    submitted: 'kyc_submitted',
    approved: 'kyc_approved',
    rejected: 'kyc_rejected',
  };
  emailOrgOwnerOnly(templates[status], orgId, { org_name: orgName, reason: reason || '' });
  // In-app notification for KYC status — owner only
  const icons: Record<string, string> = { submitted: '📄', approved: '✅', rejected: '❌' };
  const msgs: Record<string, string> = {
    submitted: `Les documents de vérification de ${orgName} ont été soumis et sont en cours d'examen.`,
    approved: `La vérification de ${orgName} a été approuvée ! Vous pouvez activer la monétisation.`,
    rejected: `La vérification de ${orgName} nécessite une attention. ${reason || 'Veuillez contacter le support.'}`,
  };
  notifyOrgOwnerOnly(orgId, `${icons[status]} Vérification ${status === 'submitted' ? 'soumise' : status === 'approved' ? 'approuvée' : 'refusée'}`, msgs[status], 'org', `/admin/kyc`);
}

// ── Support tickets ──
export async function onTicketCreated(
  userId: string,
  userEmail: string | undefined,
  ticketId: string,
  subject: string,
  category: string,
) {
  notifyAndEmail(
    userId, userEmail,
    '🎫 Ticket créé',
    `Votre ticket "${subject}" a été enregistré. Notre équipe vous répondra sous 24–48h.`,
    'ticket_created',
    { ticket_id: ticketId, subject, category },
    'support', undefined, `/support`,
  );
}

export async function onTicketReplied(
  userId: string,
  userEmail: string | undefined,
  ticketId: string,
  replyPreview: string,
) {
  notifyAndEmail(
    userId, userEmail,
    '💬 Réponse à votre ticket',
    `Un agent a répondu à votre ticket.`,
    'ticket_replied',
    { ticket_id: ticketId, reply_preview: replyPreview },
    'support', undefined, `/support`,
  );
}

export async function onTicketResolved(
  userId: string,
  userEmail: string | undefined,
  ticketId: string,
  subject: string,
) {
  notifyAndEmail(
    userId, userEmail,
    '✅ Ticket résolu',
    `Votre ticket "${subject}" a été marqué comme résolu.`,
    'ticket_resolved',
    { ticket_id: ticketId, subject },
    'support', undefined, `/support`,
  );
}

// ── Content report resolved ──
export async function onContentReportResolved(
  userId: string,
  userEmail: string | undefined,
  contentType: string,
  actionTaken: string,
) {
  notifyAndEmail(
    userId, userEmail,
    '📋 Rapport traité',
    `Votre signalement (${contentType}) a été examiné et traité.`,
    'content_report_resolved',
    { content_type: contentType, action_taken: actionTaken },
    'system',
  );
}

// ── Affiliate events ──
export async function onAffiliateWelcome(
  userId: string,
  userEmail: string | undefined,
  orgName: string,
  orgId: string,
  code: string,
  commissionPercent: number,
) {
  notifyAndEmail(
    userId, userEmail,
    '🤝 Lien affilié créé',
    `Votre lien affilié pour ${orgName} est prêt ! Code: ${code}`,
    'affiliate_welcome',
    { org_name: orgName, code, commission_percent: commissionPercent },
    'affiliate', orgId, `/affiliation`,
  );
}

export async function onAffiliateFirstClick(
  userId: string,
  userEmail: string | undefined,
  orgName: string,
) {
  notifyAndEmail(
    userId, userEmail,
    '👆 Premier clic !',
    `Quelqu'un a cliqué sur votre lien affilié pour ${orgName}.`,
    'affiliate_first_click',
    { org_name: orgName },
    'affiliate', undefined, `/affiliation`,
  );
}

export async function onAffiliateFirstConversion(
  userId: string,
  userEmail: string | undefined,
  orgName: string,
  commission: number,
  currency: string,
) {
  notifyAndEmail(
    userId, userEmail,
    '🎯 Première conversion !',
    `Votre premier referral a converti ! Commission: ${commission} ${currency}`,
    'affiliate_first_conversion',
    { org_name: orgName, commission, currency },
    'affiliate', undefined, `/affiliation`,
  );
}

// ── Affiliate sale notification (every sale) ──
export async function onAffiliateSale(
  userId: string,
  userEmail: string | undefined,
  orgName: string,
  orgId: string,
  commission: number,
  currency: string,
  grossAmount: number,
  transactionType: string,
) {
  notifyAndEmail(
    userId, userEmail,
    '💰 Commission gagnée !',
    `Vous avez gagné ${commission} ${currency} de commission sur une ${transactionType} de ${grossAmount} ${currency} pour ${orgName}.`,
    'affiliate_sale',
    { org_name: orgName, commission, currency, gross_amount: grossAmount, transaction_type: transactionType },
    'affiliate', orgId, `/affiliation`,
  );
}

// ── Affiliate payout requested ──
export async function onAffiliatePayoutRequested(
  userId: string,
  userEmail: string | undefined,
  orgName: string,
  orgId: string,
  amount: number,
  currency: string,
) {
  notifyAndEmail(
    userId, userEmail,
    '💸 Retrait demandé',
    `Votre demande de retrait de ${amount} ${currency} depuis ${orgName} a été soumise.`,
    'affiliate_payout_requested',
    { org_name: orgName, amount, currency },
    'affiliate', orgId, `/affiliation`,
  );
}

// ── Affiliate payout completed ──
export async function onAffiliatePayoutCompleted(
  userId: string,
  userEmail: string | undefined,
  orgName: string,
  orgId: string,
  amount: number,
  currency: string,
) {
  notifyAndEmail(
    userId, userEmail,
    '✅ Retrait envoyé !',
    `Votre retrait de ${amount} ${currency} depuis ${orgName} a été envoyé sur votre compte.`,
    'affiliate_payout_completed',
    { org_name: orgName, amount, currency },
    'affiliate', orgId, `/affiliation`,
  );
}

// ── Security events ──
export async function onNewDeviceLogin(
  userId: string,
  userEmail: string | undefined,
  device: string,
) {
  if (userEmail) {
    sendEmailNotification('new_device_login', userEmail, { device, time: new Date().toISOString() }).catch(() => {});
  }
  notify(userId, '🔒 Nouvelle connexion', `Connexion détectée depuis: ${device}`, 'security', undefined, `/profile`);
}

export async function onPasswordChanged(userId: string, userEmail: string | undefined) {
  if (userEmail) {
    sendEmailNotification('password_changed', userEmail, {}).catch(() => {});
  }
  notify(userId, '🔑 Mot de passe modifié', 'Votre mot de passe a été modifié avec succès.', 'security', undefined, `/profile`);
}

export async function onEmailChanged(userId: string, oldEmail: string | undefined, newEmail: string) {
  if (oldEmail) {
    sendEmailNotification('email_changed', oldEmail, { new_email: newEmail }).catch(() => {});
  }
  notify(userId, '📧 Email modifié', `Votre email a été changé pour ${newEmail}.`, 'security', undefined, `/profile`);
}

export async function onAccountDeleted(email: string) {
  sendEmailNotification('account_deleted', email, {}).catch(() => {});
}

// ── Payment failed ──
export async function onPaymentFailed(
  userId: string,
  userEmail: string | undefined,
  amount: number,
  currency: string,
  reference: string,
) {
  notifyAndEmail(
    userId, userEmail,
    '❌ Paiement échoué',
    `Votre paiement de ${amount} ${currency} n'a pas pu être traité.`,
    'payment_failed',
    { amount, currency, reference },
    'transaction', undefined, `/resources`,
  );
}

// ── Milestones ──
export async function onFirstDonationReceived(orgId: string, orgName: string, amount: number, currency: string) {
  emailOrgOwnerOnly('first_donation_milestone', orgId, { org_name: orgName, amount, currency });
  notifyOrgOwnerOnly(orgId, '🎉 Premier don reçu !', `${orgName} a reçu son tout premier don de ${amount} ${currency} !`, 'milestone', `/admin/campaigns`);
}

export async function onFirstSale(orgId: string, orgName: string, productName: string, amount: number, currency: string) {
  emailOrgOwnerOnly('first_sale_milestone', orgId, { org_name: orgName, product_name: productName, amount, currency });
  notifyOrgOwnerOnly(orgId, '🎉 Première vente !', `${orgName} a réalisé sa première vente : "${productName}" — ${amount} ${currency}`, 'milestone', `/admin/products`);
}

// ── New sale (every purchase) ──
export async function onNewSale(
  orgId: string,
  orgName: string,
  productName: string,
  buyerName: string,
  amount: number,
  currency: string,
) {
  notifyOrgOwnerOnly(
    orgId,
    '💰 Nouvelle vente !',
    `${buyerName} a acheté "${productName}" — ${amount} ${currency}`,
    'transaction', `/admin/products`,
  );
}

// ── New donation received ──
export async function onNewDonation(
  orgId: string,
  orgName: string,
  campaignName: string,
  donorName: string,
  amount: number,
  currency: string,
) {
  notifyOrgOwnerOnly(
    orgId,
    '🙏 Nouveau don !',
    `${donorName} a fait un don de ${amount} ${currency} pour "${campaignName}"`,
    'transaction', `/admin/campaigns`,
  );
}

export async function onCampaignGoalReached(orgId: string, orgName: string, campaignName: string, goalAmount: number, currentAmount: number, currency: string) {
  emailOrgOwnerOnly('campaign_goal_reached', orgId, {
    org_name: orgName, campaign_name: campaignName,
    goal_amount: goalAmount, current_amount: currentAmount, currency,
  });
  notifyOrgOwnerOnly(orgId, '🏆 Objectif atteint !', `La campagne "${campaignName}" a atteint son objectif de ${goalAmount} ${currency} !`, 'milestone', `/admin/campaigns`);
}

// ═══════════════════════════════════════════════════════════
// NEW NOTIFICATIONS — Acheteur / Donateur
// ═══════════════════════════════════════════════════════════

// ── Purchase confirmed (buyer notification) ──
export async function onPurchaseConfirmed(
  userId: string,
  userEmail: string | undefined,
  productName: string,
  orgName: string,
  amount: number,
  currency: string,
  reference: string,
) {
  notifyAndEmail(
    userId, userEmail,
    '✅ Achat confirmé',
    `Votre achat de "${productName}" sur ${orgName} a été confirmé. Montant: ${amount} ${currency}`,
    'purchase_confirmation',
    { product_name: productName, org_name: orgName, amount, currency, reference, access_link: 'https://siteviral.com/resources' },
    'transaction', undefined, `/resources`,
  );
}

// ── Donation confirmed (donor notification) ──
export async function onDonationConfirmed(
  userId: string,
  userEmail: string | undefined,
  orgName: string,
  campaignName: string,
  amount: number,
  currency: string,
  reference: string,
) {
  notifyAndEmail(
    userId, userEmail,
    '🙏 Don confirmé',
    `Merci pour votre don de ${amount} ${currency} à ${orgName} pour "${campaignName}".`,
    'donation_receipt',
    { org_name: orgName, amount, currency, reference, date: new Date().toLocaleDateString('fr-FR') },
    'transaction',
  );
}

// ── Refund initiated ──
export async function onRefundInitiated(
  userId: string,
  userEmail: string | undefined,
  amount: number,
  currency: string,
  reference: string,
  itemName: string,
) {
  notifyAndEmail(
    userId, userEmail,
    '🔄 Remboursement en cours',
    `Votre remboursement de ${amount} ${currency} pour "${itemName}" est en cours de traitement.`,
    'refund_initiated',
    { amount, currency, reference, item_name: itemName },
    'transaction',
  );
}

// ── Refund completed ──
export async function onRefundCompleted(
  userId: string,
  userEmail: string | undefined,
  amount: number,
  currency: string,
  reference: string,
) {
  notifyAndEmail(
    userId, userEmail,
    '✅ Remboursement effectué',
    `Votre remboursement de ${amount} ${currency} a été traité avec succès.`,
    'refund_completed',
    { amount, currency, reference },
    'transaction',
  );
}

// ═══════════════════════════════════════════════════════════
// NEW NOTIFICATIONS — Payouts (org admin)
// ═══════════════════════════════════════════════════════════

export async function onPayoutRequested(orgId: string, orgName: string, amount: number, currency: string) {
  emailOrgOwnerOnly('payout_requested', orgId, { org_name: orgName, amount, currency });
  notifyOrgOwnerOnly(orgId, '💸 Retrait demandé', `Un retrait de ${amount} ${currency} a été demandé pour ${orgName}.`, 'transaction');
}

export async function onPayoutApproved(orgId: string, orgName: string, amount: number, currency: string) {
  emailOrgAdmins('payout_approved', orgId, { org_name: orgName, amount, currency });
  notifyOrgOwnerOnly(orgId, '✅ Retrait approuvé', `Le retrait de ${amount} ${currency} pour ${orgName} a été approuvé.`, 'transaction');
}

export async function onPayoutRejected(orgId: string, orgName: string, reason: string) {
  emailOrgAdmins('payout_rejected', orgId, { org_name: orgName, reason });
  notifyOrgOwnerOnly(orgId, '❌ Retrait rejeté', `Le retrait pour ${orgName} a été rejeté. Raison: ${reason}`, 'transaction');
}

// ═══════════════════════════════════════════════════════════
// NEW NOTIFICATIONS — Comments
// ═══════════════════════════════════════════════════════════

export async function onNewComment(
  creatorUserId: string,
  creatorEmail: string | undefined,
  commenterName: string,
  contentTitle: string,
  contentType: string,
  commentPreview: string,
  orgId?: string,
) {
  notifyAndEmail(
    creatorUserId, creatorEmail,
    '💬 Nouveau commentaire',
    `${commenterName} a commenté votre ${contentType} "${contentTitle}": "${commentPreview.substring(0, 80)}..."`,
    'new_comment_received',
    { commenter_name: commenterName, content_title: contentTitle, content_type: contentType, comment_preview: commentPreview },
    'social', orgId,
  );
}

export async function onCommentReply(
  originalCommenterId: string,
  originalCommenterEmail: string | undefined,
  replierName: string,
  contentTitle: string,
  replyPreview: string,
  orgId?: string,
) {
  notifyAndEmail(
    originalCommenterId, originalCommenterEmail,
    '↩️ Réponse à votre commentaire',
    `${replierName} a répondu à votre commentaire sur "${contentTitle}": "${replyPreview.substring(0, 80)}..."`,
    'comment_reply',
    { replier_name: replierName, content_title: contentTitle, reply_preview: replyPreview },
    'social', orgId,
  );
}

// ═══════════════════════════════════════════════════════════
// NEW NOTIFICATIONS — Offerings
// ═══════════════════════════════════════════════════════════

export async function onOfferingReceived(
  orgId: string,
  orgName: string,
  offeringTitle: string,
  donorName: string,
  amount: number,
  currency: string,
) {
  emailOrgAdmins('offering_received', orgId, { org_name: orgName, offering_title: offeringTitle, donor_name: donorName, amount, currency });
  notifyOrgOwnerOnly(orgId, '🙏 Offrande reçue', `${donorName} a fait une offrande de ${amount} ${currency} pour "${offeringTitle}"`, 'transaction');
}

export async function onOfferingReceipt(
  userId: string,
  userEmail: string | undefined,
  orgName: string,
  offeringTitle: string,
  amount: number,
  currency: string,
) {
  notifyAndEmail(
    userId, userEmail,
    '🙏 Reçu d\'offrande',
    `Merci pour votre offrande de ${amount} ${currency} à ${orgName} pour "${offeringTitle}".`,
    'offering_receipt',
    { org_name: orgName, offering_title: offeringTitle, amount, currency },
    'transaction',
  );
}

// ═══════════════════════════════════════════════════════════
// NEW NOTIFICATIONS — Subscriptions
// ═══════════════════════════════════════════════════════════

export async function onSubscriptionRenewed(
  userId: string,
  userEmail: string | undefined,
  planName: string,
  orgName: string,
  amount: number,
  currency: string,
  nextDate: string,
) {
  notifyAndEmail(
    userId, userEmail,
    '🔄 Abonnement renouvelé',
    `Votre abonnement "${planName}" sur ${orgName} a été renouvelé. Prochain: ${nextDate}`,
    'subscription_renewed',
    { plan_name: planName, org_name: orgName, amount, currency, next_date: nextDate },
    'transaction',
  );
}

export async function onSubscriptionExpiring(
  userId: string,
  userEmail: string | undefined,
  planName: string,
  orgName: string,
  expiryDate: string,
) {
  notifyAndEmail(
    userId, userEmail,
    '⏰ Abonnement bientôt expiré',
    `Votre abonnement "${planName}" sur ${orgName} expire le ${expiryDate}.`,
    'subscription_expiring',
    { plan_name: planName, org_name: orgName, expiry_date: expiryDate },
    'transaction',
  );
}

export async function onSubscriptionCancelled(
  userId: string,
  userEmail: string | undefined,
  planName: string,
  orgName: string,
) {
  notifyAndEmail(
    userId, userEmail,
    '🚫 Abonnement annulé',
    `Votre abonnement "${planName}" sur ${orgName} a été annulé.`,
    'subscription_cancelled',
    { plan_name: planName, org_name: orgName },
    'transaction',
  );
}

// ═══════════════════════════════════════════════════════════
// NEW NOTIFICATIONS — Partners
// ═══════════════════════════════════════════════════════════

export async function onPartnerNewReferral(
  userId: string,
  userEmail: string | undefined,
  orgName: string,
  partnerName: string,
) {
  notifyAndEmail(
    userId, userEmail,
    '🤝 Nouveau referral !',
    `L'organisation "${orgName}" a été créée avec votre code d'invitation.`,
    'partner_new_referral',
    { org_name: orgName, partner_name: partnerName },
    'partner',
  );
}

export async function onPartnerCommissionEarned(
  userId: string,
  userEmail: string | undefined,
  orgName: string,
  commission: number,
  currency: string,
) {
  notifyAndEmail(
    userId, userEmail,
    '💰 Commission partenaire !',
    `Vous avez gagné ${commission} ${currency} de commission grâce à ${orgName}.`,
    'partner_commission_earned',
    { org_name: orgName, commission, currency },
    'partner',
  );
}

export async function onPartnerPayoutSent(
  userId: string,
  userEmail: string | undefined,
  partnerName: string,
  amount: number,
  currency: string,
) {
  notifyAndEmail(
    userId, userEmail,
    '💸 Paiement partenaire envoyé',
    `Un paiement de ${amount} ${currency} a été envoyé sur votre compte.`,
    'partner_payout_sent',
    { name: partnerName, amount, currency },
    'partner',
  );
}

// ═══════════════════════════════════════════════════════════
// NEW NOTIFICATIONS — Programs / Courses
// ═══════════════════════════════════════════════════════════

export async function onProgramEnrolled(
  userId: string,
  userEmail: string | undefined,
  programName: string,
  orgName: string,
  orgId: string,
) {
  notifyAndEmail(
    userId, userEmail,
    '🎓 Inscription confirmée',
    `Vous êtes inscrit au programme "${programName}" de ${orgName}.`,
    'program_enrolled',
    { program_name: programName, org_name: orgName },
    'org', orgId,
  );
}

export async function onProgramCompleted(
  userId: string,
  userEmail: string | undefined,
  programName: string,
  orgName: string,
) {
  notifyAndEmail(
    userId, userEmail,
    '🏆 Programme terminé !',
    `Félicitations ! Vous avez complété le programme "${programName}" de ${orgName}.`,
    'program_completed',
    { program_name: programName, org_name: orgName },
    'milestone',
  );
}

export async function onProgramNewLesson(
  orgId: string,
  orgName: string,
  programName: string,
  lessonTitle: string,
) {
  // Notify all enrolled users
  try {
    const { data: programs } = await db.from('programs').select('id').eq('organization_id', orgId).ilike('title', programName);
    if (programs?.[0]) {
      const { data: enrollments } = await db.from('program_enrollments').select('user_id').eq('program_id', programs[0].id);
      for (const e of enrollments || []) {
        notify(e.user_id, '📚 Nouvelle leçon', `Nouvelle leçon dans "${programName}": "${lessonTitle}"`, 'org', orgId);
      }
    }
  } catch (e) {
    console.error('onProgramNewLesson error:', e);
  }
  emailOrgAdmins('program_new_lesson', orgId, { org_name: orgName, program_name: programName, lesson_title: lessonTitle });
}

// ═══════════════════════════════════════════════════════════
// NEW NOTIFICATIONS — Gamification
// ═══════════════════════════════════════════════════════════

export async function onBadgeEarned(
  userId: string,
  userEmail: string | undefined,
  badgeName: string,
  badgeDescription: string,
) {
  notifyAndEmail(
    userId, userEmail,
    '🏅 Badge gagné !',
    `Félicitations ! Vous avez obtenu le badge "${badgeName}" — ${badgeDescription}`,
    'badge_earned',
    { badge_name: badgeName, badge_description: badgeDescription },
    'gamification',
  );
}

export async function onLevelUp(
  userId: string,
  level: number,
  xp: number,
) {
  notify(userId, '⬆️ Niveau supérieur !', `Vous êtes passé au niveau ${level} avec ${xp} XP !`, 'gamification');
}

// ═══════════════════════════════════════════════════════════
// NEW NOTIFICATIONS — Abandoned Cart
// ═══════════════════════════════════════════════════════════

export async function onAbandonedCartReminder(
  email: string,
  productName: string,
  orgName: string,
  orgSlug: string,
  productId: string,
) {
  sendEmailNotification('abandoned_cart_reminder', email, {
    product_name: productName, org_name: orgName,
    checkout_link: `https://siteviral.com/org/${orgSlug}?product=${productId}`,
  }).catch(() => {});
}

// ═══════════════════════════════════════════════════════════
// NEW NOTIFICATIONS — Event Reminder
// ═══════════════════════════════════════════════════════════

export async function onEventReminder24h(
  orgId: string,
  orgName: string,
  eventTitle: string,
  eventDate: string,
  eventLocation: string,
) {
  notifyOrgMembers(orgId, '📅 Événement demain !', `"${eventTitle}" commence demain à ${eventLocation || 'lieu non précisé'}.`, 'org');
  emailOrgAdmins('event_reminder_24h', orgId, { org_name: orgName, event_title: eventTitle, event_date: eventDate, event_location: eventLocation });
}

// ═══════════════════════════════════════════════════════════
// NEW NOTIFICATIONS — Campaign expiring
// ═══════════════════════════════════════════════════════════

export async function onCampaignExpiringSoon(
  orgId: string,
  orgName: string,
  campaignName: string,
  daysLeft: number,
  currentAmount: number,
  goalAmount: number,
  currency: string,
) {
  emailOrgAdmins('campaign_expiring_soon', orgId, {
    org_name: orgName, campaign_name: campaignName,
    days_left: daysLeft, current_amount: currentAmount, goal_amount: goalAmount, currency,
  });
  notifyOrgMembers(orgId, `⏰ Campagne bientôt terminée`, `"${campaignName}" se termine dans ${daysLeft} jours. Progression: ${currentAmount}/${goalAmount} ${currency}`, 'org');
}

// ═══════════════════════════════════════════════════════════
// NEW NOTIFICATIONS — Promo / Flash sale / Misc
// ═══════════════════════════════════════════════════════════

export async function onPromoCodeUsed(
  orgId: string,
  orgName: string,
  promoCode: string,
  discount: string,
  buyerName: string,
) {
  notifyOrgOwnerOnly(orgId, '🎟️ Code promo utilisé', `${buyerName} a utilisé le code "${promoCode}" (${discount}).`, 'transaction');
  emailOrgAdmins('promo_code_used', orgId, { org_name: orgName, promo_code: promoCode, discount, buyer_name: buyerName });
}

export async function onFlashSaleAlert(
  orgId: string,
  orgName: string,
  productName: string,
  salePrice: number,
  originalPrice: number,
  currency: string,
  endsAt: string,
) {
  notifyOrgMembers(orgId, '⚡ Promo flash !', `"${productName}" à ${salePrice} ${currency} (au lieu de ${originalPrice} ${currency}) — se termine le ${endsAt} !`, 'org');
  emailOrgAdmins('flash_sale_alert', orgId, {
    org_name: orgName, product_name: productName,
    sale_price: salePrice, original_price: originalPrice, currency, ends_at: endsAt,
  });
}

export async function onOrgVerified(orgId: string, orgName: string) {
  emailOrgAdmins('org_verified', orgId, { org_name: orgName });
  notifyOrgMembers(orgId, '✅ Organisation vérifiée', `${orgName} est maintenant une organisation vérifiée !`, 'milestone');
}

export async function onWaitlistSpotAvailable(
  userId: string,
  userEmail: string | undefined,
  itemName: string,
  itemType: string,
) {
  notifyAndEmail(
    userId, userEmail,
    '🎉 Place disponible !',
    `Une place est disponible pour "${itemName}" !`,
    'waitlist_spot_available',
    { item_name: itemName, item_type: itemType },
    'system',
  );
}

export async function onReferralReward(
  userId: string,
  userEmail: string | undefined,
  referredName: string,
  rewardDescription: string,
) {
  notifyAndEmail(
    userId, userEmail,
    '🎁 Récompense de parrainage',
    `${referredName} s'est inscrit grâce à vous ! ${rewardDescription}`,
    'referral_reward',
    { referred_name: referredName, reward_description: rewardDescription },
    'gamification',
  );
}

// ── New content report received (for org admin) ──
export async function onNewContentReport(
  orgId: string,
  orgName: string,
  contentType: string,
  reason: string,
  reporterName: string,
) {
  notifyOrgMembers(orgId, '🚩 Signalement reçu', `${reporterName} a signalé un ${contentType}: "${reason}"`, 'system');
}

// ── Free product claimed ──
export async function onFreeProductClaimed(
  orgId: string,
  orgName: string,
  productName: string,
  claimerName: string,
) {
  notifyOrgMembers(orgId, '📦 Produit gratuit réclamé', `${claimerName} a réclamé "${productName}".`, 'transaction');
}

// ── Welcome notification (first login) ──
export async function onWelcomePlatform(userId: string) {
  notify(userId, '👋 Bienvenue sur SiteViral !', 'Votre compte est prêt. Explorez les organisations, rejoignez des communautés et découvrez du contenu inspirant.', 'system');
}

// ── Fraud alert (for superadmins) ──
export async function onFraudAlert(orgName: string, reason: string, userEmail: string) {
  sendEmailNotification('fraud_alert', '', { org_name: orgName, reason, user_email: userEmail }).catch(() => {});
}
