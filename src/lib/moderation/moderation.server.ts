// Server-only moderation helpers: superadmin trust actions, KYC document
// signed URLs and content-report notifications.
// Ported from the trust-admin-action / kyc-signed-url / notify-report edge functions.

type AnyClient = { from: (t: string) => any; rpc: (fn: string, args?: any) => any; auth: any; storage: any };

async function admin(): Promise<AnyClient> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  return supabaseAdmin as unknown as AnyClient;
}

export async function assertSuperadmin(userClient: any, userId: string) {
  const { data } = await userClient.rpc('is_superadmin', { _user_id: userId });
  if (!data) throw new Error('Superadmin only');
}

/* ------------------------------------------------------------------ */
/* Trust admin actions                                                 */
/* ------------------------------------------------------------------ */

const ACTION_LABELS: Record<string, string> = {
  warning: 'Avertissement',
  chat_frozen: 'Chat gelé',
  chat_unfrozen: 'Chat réactivé',
  provider_hidden: 'Profil masqué',
  provider_unhidden: 'Profil réactivé',
  account_limited: 'Compte limité',
  suspended_24h: 'Suspension 24h',
  suspended_7d: 'Suspension 7 jours',
  suspended_30d: 'Suspension 30 jours',
  banned: 'Compte banni',
  restored: 'Compte réactivé',
  payout_held: 'Paiement retenu',
  payout_released: 'Paiement libéré',
  false_positive: 'Faux positif',
};

const MESSAGES: Record<string, string> = {
  warning: 'Vous avez reçu un avertissement pour non-respect des règles SiteViral.',
  chat_frozen: 'Votre chat est temporairement bloqué pour cette réservation.',
  chat_unfrozen: 'Votre chat a été réactivé.',
  provider_hidden:
    'Votre profil est temporairement masqué des recherches suite à plusieurs violations.',
  provider_unhidden: 'Votre profil est de nouveau visible dans les recherches.',
  account_limited:
    'Votre compte est temporairement limité. Un administrateur va examiner la situation.',
  suspended_24h: 'Votre compte est suspendu pendant 24h pour non-respect des règles SiteViral.',
  suspended_7d:
    'Votre compte est suspendu pendant 7 jours pour non-respect des règles SiteViral.',
  suspended_30d: 'Votre compte est suspendu pendant 30 jours.',
  banned: 'Votre compte a été banni de SiteViral suite à des violations graves des règles.',
  restored: 'Votre compte a été réactivé. Merci de respecter les règles SiteViral.',
  payout_held: 'Vos paiements sont temporairement retenus pour vérification.',
  payout_released: 'Vos paiements sont de nouveau libérés.',
  false_positive: 'Après vérification, cette alerte a été retirée. Votre compte est en règle.',
};

async function notifyTrustUser(
  db: AnyClient,
  userId: string,
  action: string,
  violationId: string | null,
  customMessage?: string,
) {
  const message = customMessage || MESSAGES[action] || 'Mise à jour de votre compte SiteViral.';
  const label = ACTION_LABELS[action] || 'Notification SiteViral';

  await db.from('user_notifications').insert({
    user_id: userId,
    notification_type: 'trust_' + action,
    title: label,
    body: message,
    action_url: '/account/trust',
  });
  await db.from('trust_notifications_log').insert({
    user_id: userId,
    violation_id: violationId,
    notification_type: action,
    channel: 'in_app',
    subject: label,
    message,
    delivery_status: 'sent',
    sent_at: new Date().toISOString(),
  });

  const resendKey = process.env['RESEND_API_KEY'];
  if (!resendKey) return;
  try {
    const { data } = await db.auth.admin.getUserById(userId);
    const email = data?.user?.email;
    if (!email) return;
    const html = `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#1a1a1a;color:#eee;border-radius:16px">
<h2 style="margin-top:0">${label}</h2><p>${message}</p>
<p style="font-size:13px;color:#aaa">Si vous pensez qu'il s'agit d'une erreur, écrivez à <a href="mailto:support@siteviral.com" style="color:#1a66e6">support@siteviral.com</a>.</p>
<p><a href="https://siteviral.com/account/trust" style="color:#1a66e6">Voir mon statut</a></p></div>`;
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${resendKey}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        from: 'SiteViral <noreply@siteviral.com>',
        to: email,
        subject: `[SiteViral] ${label}`,
        html,
      }),
    });
    await db.from('trust_notifications_log').insert({
      user_id: userId,
      violation_id: violationId,
      notification_type: action,
      channel: 'email',
      subject: label,
      message,
      delivery_status: res.ok ? 'sent' : 'failed',
      sent_at: res.ok ? new Date().toISOString() : null,
    });
  } catch (e) {
    console.error('[trust-admin-action] email error', e);
  }
}

export async function runTrustAdminAction(args: {
  actorId: string;
  violationId?: string | null;
  targetUserId: string;
  action: string;
  customMessage?: string;
  notes?: string;
}): Promise<{ ok: true } | { error: string }> {
  if (!args.action || !args.targetUserId) return { error: 'action and target_user_id required' };
  const db = await admin();

  const now = new Date();
  const patch: Record<string, unknown> = {
    user_id: args.targetUserId,
    admin_review_required: false,
    updated_at: now.toISOString(),
  };
  if (args.notes) patch['notes'] = args.notes;

  const in24h = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();
  const in7d = new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString();
  const in30d = new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString();

  switch (args.action) {
    case 'warning':
      patch['status'] = 'warned';
      break;
    case 'chat_frozen':
      patch['status'] = 'chat_frozen';
      patch['restricted_until'] = in24h;
      break;
    case 'chat_unfrozen':
      patch['status'] = 'ok';
      patch['restricted_until'] = null;
      break;
    case 'provider_hidden':
      patch['status'] = 'hidden';
      patch['hidden_until'] = in7d;
      break;
    case 'provider_unhidden':
      patch['status'] = 'ok';
      patch['hidden_until'] = null;
      break;
    case 'account_limited':
      patch['status'] = 'limited';
      patch['restricted_until'] = in7d;
      break;
    case 'suspended_24h':
      patch['status'] = 'suspended';
      patch['suspended_until'] = in24h;
      break;
    case 'suspended_7d':
      patch['status'] = 'suspended';
      patch['suspended_until'] = in7d;
      break;
    case 'suspended_30d':
      patch['status'] = 'suspended';
      patch['suspended_until'] = in30d;
      break;
    case 'banned':
      patch['status'] = 'banned';
      patch['suspended_until'] = null;
      break;
    case 'restored':
      patch['status'] = 'ok';
      patch['restricted_until'] = null;
      patch['hidden_until'] = null;
      patch['suspended_until'] = null;
      patch['payout_hold'] = false;
      patch['trust_score'] = 100;
      patch['violations_24h'] = 0;
      patch['violations_7d'] = 0;
      break;
    case 'payout_held':
      patch['payout_hold'] = true;
      break;
    case 'payout_released':
      patch['payout_hold'] = false;
      break;
    case 'false_positive': {
      const { data } = await db
        .from('account_trust_profiles')
        .select('trust_score')
        .eq('user_id', args.targetUserId)
        .maybeSingle();
      patch['trust_score'] = Math.min(100, (data?.trust_score ?? 95) + 5);
      break;
    }
  }

  await db.from('account_trust_profiles').upsert(patch, { onConflict: 'user_id' });

  if (args.violationId) {
    await db
      .from('beauty_chat_violations')
      .update({
        admin_reviewed_by: args.actorId,
        admin_reviewed_at: now.toISOString(),
        admin_decision: args.action,
        admin_review_required: false,
      })
      .eq('id', args.violationId);
  }

  await notifyTrustUser(db, args.targetUserId, args.action, args.violationId || null, args.customMessage);
  return { ok: true };
}

/* ------------------------------------------------------------------ */
/* KYC document signed URL (superadmin only, audited)                  */
/* ------------------------------------------------------------------ */

export async function createKycSignedUrl(args: {
  actorId: string;
  url: string;
  orgId: string;
  documentType?: string;
}): Promise<{ signedUrl: string } | { error: string }> {
  if (!args.url || !args.orgId) return { error: 'Missing url or org_id' };
  const db = await admin();

  let storagePath = args.url;
  const bucketPrefix = '/kyc-documents/';
  const idx = args.url.indexOf(bucketPrefix);
  if (idx !== -1) storagePath = args.url.substring(idx + bucketPrefix.length);

  const { data, error } = await db.storage.from('kyc-documents').createSignedUrl(storagePath, 300);
  if (error || !data?.signedUrl) {
    console.error('[kyc-signed-url]', error);
    return { error: 'Failed to generate signed URL' };
  }

  await db.from('audit_logs').insert({
    user_id: args.actorId,
    action: 'kyc.document_accessed',
    resource_type: 'organization',
    resource_id: args.orgId,
    metadata: {
      document_type: args.documentType || 'unknown',
      accessed_at: new Date().toISOString(),
    },
  });

  return { signedUrl: data.signedUrl as string };
}

/* ------------------------------------------------------------------ */
/* Content report notification                                         */
/* ------------------------------------------------------------------ */

export async function notifyContentReport(args: {
  contentId: string;
  contentType?: string;
  contentTitle?: string;
  reason: string;
  reporterEmail?: string;
  reporterId?: string;
}): Promise<{ ok: true; skipped?: string } | { error: string }> {
  if (!args.contentId || !args.reason) return { error: 'Missing fields' };
  const db = await admin();

  let reporterName = args.reporterEmail || 'Utilisateur inconnu';
  if (args.reporterId) {
    const { data: profile } = await db
      .from('profiles')
      .select('display_name, email')
      .eq('id', args.reporterId)
      .maybeSingle();
    if (profile?.display_name) reporterName = profile.display_name;
  }

  const { data: admins } = await db
    .from('user_platform_roles')
    .select('user_id')
    .eq('role', 'superadmin');

  if (!admins || admins.length === 0) return { ok: true, skipped: 'no_admins' };

  const adminEmails: string[] = [];
  for (const a of admins as { user_id: string }[]) {
    try {
      const { data } = await db.auth.admin.getUserById(a.user_id);
      if (data?.user?.email) adminEmails.push(data.user.email);
    } catch {
      /* ignore */
    }
  }

  const contentLabel =
    args.contentType === 'product'
      ? 'Produit'
      : args.contentType === 'event'
        ? 'Événement'
        : args.contentType || 'contenu';

  const supabaseUrl = process.env['SUPABASE_URL'];
  const serviceKey = process.env['SUPABASE_SERVICE_ROLE_KEY'];
  if (supabaseUrl && serviceKey && adminEmails.length > 0) {
    await Promise.allSettled(
      adminEmails.map((email) =>
        fetch(`${supabaseUrl}/functions/v1/send-email`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${serviceKey}` },
          body: JSON.stringify({
            template: 'notification_reminder',
            to: email,
            data: {
              title: `🚩 Nouveau signalement — ${contentLabel}`,
              body: `Un signalement a été soumis par ${reporterName} (${args.reporterEmail || ''}).\n\nContenu signalé : ${args.contentTitle || args.contentId}\nType : ${contentLabel}\nMotif : ${args.reason}\n\nConnectez-vous au panel Superadmin pour examiner ce signalement.`,
              action_url: 'https://siteviral.com/superadmin/reports',
              notification_type: 'content_report',
            },
          }),
        }).catch((e) => console.error('[notify-report] email failed', e)),
      ),
    );
  }

  for (const a of admins as { user_id: string }[]) {
    try {
      await db.from('user_notifications').insert({
        user_id: a.user_id,
        notification_type: 'content_report',
        title: `🚩 Signalement : ${args.contentTitle || contentLabel}`,
        body: `${reporterName} a signalé un ${contentLabel.toLowerCase()} — ${args.reason}`,
        action_url: '/superadmin/reports',
      });
    } catch {
      /* ignore */
    }
  }

  return { ok: true };
}
