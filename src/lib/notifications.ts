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
  // Notify the member
  notify(userId, `🎉 Bienvenue dans ${orgName}`, `Vous avez rejoint l'organisation ${orgName}.`, 'org', orgId);

  // Email org admins (via edge function — server-side)
  sendEmailNotification('new_member_joined', '', {
    org_name: orgName,
    member_name: userName,
  }, orgId).catch(() => {});
}

// ── Member leaves an org ──
export async function onMemberLeft(
  userId: string,
  userName: string,
  orgId: string,
  orgName: string,
) {
  // Email org admins
  sendEmailNotification('member_left', '', {
    org_name: orgName,
    member_name: userName,
  }, orgId).catch(() => {});
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

// ── Directory application result ──
export async function onDirectoryDecision(
  orgId: string,
  orgName: string,
  action: 'approved' | 'rejected',
  reason?: string,
) {
  const template: EmailTemplate = action === 'approved' ? 'directory_approved' : 'directory_rejected';
  sendEmailNotification(template, '', {
    org_name: orgName,
    reason: reason || '',
  }, orgId).catch(() => {});
}

// ── Org suspended / unsuspended ──
export async function onOrgSuspended(orgId: string, orgName: string, reason: string, until?: string) {
  sendEmailNotification('org_suspended', '', {
    org_name: orgName,
    reason,
    until: until || '',
  }, orgId).catch(() => {});
}

export async function onOrgUnsuspended(orgId: string, orgName: string) {
  sendEmailNotification('org_unsuspended', '', {
    org_name: orgName,
  }, orgId).catch(() => {});
}

// ── Payouts frozen ──
export async function onPayoutsFrozen(orgId: string, orgName: string, reason: string) {
  sendEmailNotification('payouts_frozen', '', {
    org_name: orgName,
    reason,
  }, orgId).catch(() => {});
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
  sendEmailNotification(templates[status], '', {
    org_name: orgName,
    reason: reason || '',
  }, orgId).catch(() => {});
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
