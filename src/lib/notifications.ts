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
) {
  try {
    await db.from('user_notifications').insert({
      user_id: userId,
      title,
      body,
      notification_type: type,
      organization_id: orgId || null,
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
) {
  notify(userId, title, body, type, orgId);
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
) {
  try {
    const { data: members } = await db.from('organization_members')
      .select('user_id')
      .eq('organization_id', orgId);
    for (const m of members || []) {
      if (m.user_id !== excludeUserId) {
        notify(m.user_id, title, body, type, orgId);
      }
    }
  } catch (e) {
    console.error('notifyOrgMembers failed:', e);
  }
}

// ── Email to org members (via edge function) ──
function emailOrgAdmins(template: EmailTemplate, orgId: string, data: Record<string, string | number>) {
  sendEmailNotification(template, '', data, orgId).catch(() => {});
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
  notify(userId, `🎉 Bienvenue dans ${orgName}`, `Vous avez rejoint l'organisation ${orgName}.`, 'org', orgId);
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
    'org', orgId,
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
    'org', orgId,
  );
}

// ── Program enrollment ──
export async function onProgramEnrolled(
  userId: string,
  userEmail: string | undefined,
  programName: string,
  orgName: string,
  orgId: string,
  programId: string,
) {
  notifyAndEmail(
    userId, userEmail,
    '🎓 Inscription confirmée',
    `Vous êtes inscrit au programme "${programName}" de ${orgName}.`,
    'program_enrolled',
    { program_name: programName, org_name: orgName, program_link: `https://siteviral.com/programs/${programId}` },
    'program', orgId,
  );
}

// ── Program completed ──
export async function onProgramCompleted(
  userId: string,
  userEmail: string | undefined,
  programName: string,
  orgId: string,
) {
  notifyAndEmail(
    userId, userEmail,
    '🏆 Programme terminé !',
    `Félicitations ! Vous avez terminé le programme "${programName}".`,
    'program_completed',
    { program_name: programName },
    'program', orgId,
  );
}

// ── Content published (events, announcements, media, products, campaigns, programs) ──
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

  // In-app notification to all members
  notifyOrgMembers(
    orgId,
    `${icons[contentType]} Nouveau ${labels[contentType]}`,
    `${orgName} a publié : "${contentTitle}"`,
    'org',
    publisherId,
  );

  // Email to org admins with the right template
  emailOrgAdmins(templates[contentType], orgId, {
    org_name: orgName,
    [`${contentType}_title`]: contentTitle,
    event_title: contentTitle,
    announcement_title: contentTitle,
    media_title: contentTitle,
    product_name: contentTitle,
    campaign_name: contentTitle,
    program_name: contentTitle,
    org_link: `https://siteviral.com/org/${orgId}`,
    ...extraData,
  });
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
  emailOrgAdmins('org_suspended', orgId, { org_name: orgName, reason, until: until || '' });
  notifyOrgMembers(orgId, '⚠️ Organisation suspendue', `${orgName} a été suspendue. Raison: ${reason}`, 'system');
}

export async function onOrgUnsuspended(orgId: string, orgName: string) {
  emailOrgAdmins('org_unsuspended', orgId, { org_name: orgName });
  notifyOrgMembers(orgId, '✅ Suspension levée', `${orgName} est de nouveau active.`, 'system');
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
  emailOrgAdmins(templates[status], orgId, { org_name: orgName, reason: reason || '' });
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
    'support',
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
    'support',
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
    'support',
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
    'affiliate', orgId,
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
    'affiliate',
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
    'affiliate',
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
  notify(userId, '🔒 Nouvelle connexion', `Connexion détectée depuis: ${device}`, 'security');
}

export async function onPasswordChanged(userId: string, userEmail: string | undefined) {
  if (userEmail) {
    sendEmailNotification('password_changed', userEmail, {}).catch(() => {});
  }
  notify(userId, '🔑 Mot de passe modifié', 'Votre mot de passe a été modifié avec succès.', 'security');
}

export async function onEmailChanged(userId: string, oldEmail: string | undefined, newEmail: string) {
  if (oldEmail) {
    sendEmailNotification('email_changed', oldEmail, { new_email: newEmail }).catch(() => {});
  }
  notify(userId, '📧 Email modifié', `Votre email a été changé pour ${newEmail}.`, 'security');
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
    'transaction',
  );
}

// ── Milestones ──
export async function onFirstDonationReceived(orgId: string, orgName: string, amount: number, currency: string) {
  emailOrgAdmins('first_donation_milestone', orgId, { org_name: orgName, amount, currency });
  notifyOrgMembers(orgId, '🎉 Premier don reçu !', `${orgName} a reçu son tout premier don de ${amount} ${currency} !`, 'milestone');
}

export async function onFirstSale(orgId: string, orgName: string, productName: string, amount: number, currency: string) {
  emailOrgAdmins('first_sale_milestone', orgId, { org_name: orgName, product_name: productName, amount, currency });
}

export async function onCampaignGoalReached(orgId: string, orgName: string, campaignName: string, goalAmount: number, currentAmount: number, currency: string) {
  emailOrgAdmins('campaign_goal_reached', orgId, {
    org_name: orgName, campaign_name: campaignName,
    goal_amount: goalAmount, current_amount: currentAmount, currency,
  });
  notifyOrgMembers(orgId, '🏆 Objectif atteint !', `La campagne "${campaignName}" a atteint son objectif de ${goalAmount} ${currency} !`, 'milestone');
}

// ── Fraud alert (for superadmins) ──
export async function onFraudAlert(orgName: string, reason: string, userEmail: string) {
  // This sends to the org's admins but ideally should send to superadmins
  // The CRON function handles superadmin recaps, but we can trigger immediate alerts
  sendEmailNotification('fraud_alert', '', { org_name: orgName, reason, user_email: userEmail }).catch(() => {});
}
