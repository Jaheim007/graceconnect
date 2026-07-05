import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const ANON = Deno.env.get('SUPABASE_ANON_KEY') || Deno.env.get('SUPABASE_PUBLISHABLE_KEY')!;
const SERVICE = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY');

const admin = createClient(SUPABASE_URL, SERVICE);

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
  provider_hidden: 'Votre profil est temporairement masqué des recherches suite à plusieurs violations.',
  provider_unhidden: 'Votre profil est de nouveau visible dans les recherches.',
  account_limited: 'Votre compte est temporairement limité. Un administrateur va examiner la situation.',
  suspended_24h: 'Votre compte est suspendu pendant 24h pour non-respect des règles SiteViral.',
  suspended_7d: 'Votre compte est suspendu pendant 7 jours pour non-respect des règles SiteViral.',
  suspended_30d: 'Votre compte est suspendu pendant 30 jours.',
  banned: 'Votre compte a été banni de SiteViral suite à des violations graves des règles.',
  restored: 'Votre compte a été réactivé. Merci de respecter les règles SiteViral.',
  payout_held: 'Vos paiements sont temporairement retenus pour vérification.',
  payout_released: 'Vos paiements sont de nouveau libérés.',
  false_positive: 'Après vérification, cette alerte a été retirée. Votre compte est en règle.',
};

async function logNotif(row: any) {
  await admin.from('trust_notifications_log').insert(row);
}

async function notifyUser(userId: string, action: string, violationId: string | null, customMessage?: string) {
  const message = customMessage || MESSAGES[action] || 'Mise à jour de votre compte SiteViral.';
  const label = ACTION_LABELS[action] || 'Notification SiteViral';

  await admin.from('user_notifications').insert({
    user_id: userId, notification_type: 'trust_' + action,
    title: label, body: message, action_url: '/account/trust',
  });
  await logNotif({ user_id: userId, violation_id: violationId, notification_type: action, channel: 'in_app',
    subject: label, message, delivery_status: 'sent', sent_at: new Date().toISOString() });

  if (RESEND_KEY) {
    try {
      const { data: { user } } = await admin.auth.admin.getUserById(userId);
      const email = user?.email;
      if (email) {
        const html = `<div style="font-family:sans-serif;max-width:520px;margin:0 auto;padding:32px;background:#1a1a1a;color:#eee;border-radius:16px">
<h2 style="margin-top:0">${label}</h2><p>${message}</p>
<p style="font-size:13px;color:#aaa">Si vous pensez qu'il s'agit d'une erreur, écrivez à <a href="mailto:support@siteviral.com" style="color:#1a66e6">support@siteviral.com</a>.</p>
<p><a href="https://siteviral.com/account/trust" style="color:#1a66e6">Voir mon statut</a></p></div>`;
        const res = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
          body: JSON.stringify({ from: 'SiteViral <noreply@siteviral.com>', to: email, subject: `[SiteViral] ${label}`, html }),
        });
        await logNotif({ user_id: userId, violation_id: violationId, notification_type: action, channel: 'email',
          subject: label, message, delivery_status: res.ok ? 'sent' : 'failed',
          sent_at: res.ok ? new Date().toISOString() : null });
      }
    } catch (e) { console.error('email error', e); }
  }
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const auth = req.headers.get('Authorization') || '';
    const jwt = auth.replace('Bearer ', '');
    if (!jwt) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: corsHeaders });

    const userClient = createClient(SUPABASE_URL, ANON, { global: { headers: { Authorization: `Bearer ${jwt}` } } });
    const { data: { user } } = await userClient.auth.getUser();
    if (!user) return new Response(JSON.stringify({ error: 'unauthorized' }), { status: 401, headers: corsHeaders });

    const { data: role } = await admin.from('user_platform_roles')
      .select('role').eq('user_id', user.id).eq('role', 'superadmin' as any).maybeSingle();
    if (!role) return new Response(JSON.stringify({ error: 'forbidden' }), { status: 403, headers: corsHeaders });

    const { violation_id, target_user_id, action, custom_message, notes } = await req.json();
    if (!action || !target_user_id) {
      return new Response(JSON.stringify({ error: 'action and target_user_id required' }), { status: 400, headers: corsHeaders });
    }

    const now = new Date();
    const patch: any = { user_id: target_user_id, admin_review_required: false, updated_at: now.toISOString() };
    if (notes) patch.notes = notes;

    const in24h = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();
    const in7d = new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString();
    const in30d = new Date(now.getTime() + 30 * 24 * 3600 * 1000).toISOString();

    switch (action) {
      case 'warning': patch.status = 'warned'; break;
      case 'chat_frozen': patch.status = 'chat_frozen'; patch.restricted_until = in24h; break;
      case 'chat_unfrozen': patch.status = 'ok'; patch.restricted_until = null; break;
      case 'provider_hidden': patch.status = 'hidden'; patch.hidden_until = in7d; break;
      case 'provider_unhidden': patch.status = 'ok'; patch.hidden_until = null; break;
      case 'account_limited': patch.status = 'limited'; patch.restricted_until = in7d; break;
      case 'suspended_24h': patch.status = 'suspended'; patch.suspended_until = in24h; break;
      case 'suspended_7d': patch.status = 'suspended'; patch.suspended_until = in7d; break;
      case 'suspended_30d': patch.status = 'suspended'; patch.suspended_until = in30d; break;
      case 'banned': patch.status = 'banned'; patch.suspended_until = null; break;
      case 'restored':
        patch.status = 'ok'; patch.restricted_until = null; patch.hidden_until = null;
        patch.suspended_until = null; patch.payout_hold = false; patch.trust_score = 100;
        patch.violations_24h = 0; patch.violations_7d = 0; break;
      case 'payout_held': patch.payout_hold = true; break;
      case 'payout_released': patch.payout_hold = false; break;
      case 'false_positive': patch.trust_score = Math.min(100, (await admin.from('account_trust_profiles')
        .select('trust_score').eq('user_id', target_user_id).maybeSingle()).data?.trust_score ?? 100 + 5); break;
    }

    await admin.from('account_trust_profiles').upsert(patch, { onConflict: 'user_id' });

    if (violation_id) {
      await admin.from('beauty_chat_violations').update({
        admin_reviewed_by: user.id, admin_reviewed_at: now.toISOString(),
        admin_decision: action, admin_review_required: false,
      }).eq('id', violation_id);
    }

    await notifyUser(target_user_id, action, violation_id || null, custom_message);

    return new Response(JSON.stringify({ ok: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('[trust-admin-action]', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: corsHeaders });
  }
});
