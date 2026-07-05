import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { geminiGenerateText, extractJson } from '../_shared/ai-gemini.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const GEMINI_KEY = Deno.env.get('GEMINI_API_KEY')!;
const RESEND_KEY = Deno.env.get('RESEND_API_KEY');

const admin = createClient(SUPABASE_URL, SERVICE_KEY);

interface GeminiAnalysis {
  violation_category: string;
  severity: 'soft' | 'hard' | 'severe';
  confidence_score: number;
  recommended_action: string;
  user_notification_message: string;
  admin_summary: string;
  admin_review_required: boolean;
}

const FALLBACK_MESSAGES: Record<string, string> = {
  email: 'Message bloqué : les contacts externes ne sont pas autorisés. Gardez la discussion sur SiteViral pour protéger votre réservation.',
  phone: 'Message bloqué : les numéros de téléphone ne sont pas autorisés. Restez sur SiteViral pour rester protégé.',
  social_handle: 'Message bloqué : les contacts hors plateforme ne sont pas autorisés.',
  payment_bypass: 'Message bloqué : tout paiement doit passer par SiteViral. Les paiements hors plateforme ne sont pas protégés.',
};

const ACTION_LABELS: Record<string, string> = {
  warning: 'Avertissement',
  message_blocked: 'Message bloqué',
  chat_frozen: 'Chat gelé',
  account_limited: 'Compte limité',
  provider_hidden: 'Profil masqué',
  payout_held: 'Paiement retenu',
  suspended_24h: 'Suspension 24h',
  admin_review: 'Examen administrateur',
};

async function callGemini(violation: any, history24h: number, history7d: number, role: string): Promise<GeminiAnalysis> {
  const system = `You are a trust & safety analyst for SiteViral Beauty, an African beauty marketplace.
Users chat inside the app to arrange beauty services. They MUST NOT exchange phone numbers, emails, social handles, or attempt payments outside the platform.
Your job: classify a blocked message and recommend an action.
Return STRICT JSON only. Keep user_notification_message SHORT, SIMPLE, in FRENCH, direct, no long formal language.`;

  const prompt = `A message was blocked. Analyze it.

Blocked text: ${JSON.stringify(violation.original_body || '')}
Matched pattern: ${violation.matched || ''}
Detector reason: ${violation.reason}
User role: ${role}
Violations in last 24h (before this one): ${history24h}
Violations in last 7d (before this one): ${history7d}

Return JSON:
{
  "violation_category": "contact_bypass" | "payment_bypass" | "spam" | "abuse" | "false_positive",
  "severity": "soft" | "hard" | "severe",
  "confidence_score": 0.0-1.0,
  "recommended_action": "warning" | "message_blocked" | "chat_frozen" | "account_limited" | "provider_hidden" | "payout_held" | "suspended_24h" | "admin_review",
  "user_notification_message": "short french message to user (max 2 sentences)",
  "admin_summary": "one-line english summary for admin",
  "admin_review_required": true|false
}

Guidelines:
- 1st offense, obvious contact info -> soft, warning
- 2nd offense in 24h -> hard, chat_frozen
- 3+ in 7d or clear payment bypass -> hard, account_limited or provider_hidden if provider
- fraud/threats/scam patterns -> severe, suspended_24h + admin_review
- unclear/ambiguous -> mark admin_review_required true`;

  try {
    const raw = await geminiGenerateText({
      apiKey: GEMINI_KEY,
      model: 'gemini-2.5-flash',
      system,
      prompt,
      jsonMode: true,
      temperature: 0.2,
      maxOutputTokens: 800,
      timeoutMs: 15000,
    });
    const parsed = extractJson(raw);
    if (parsed && parsed.severity) return parsed as GeminiAnalysis;
  } catch (e) {
    console.error('[trust] Gemini failed', e);
  }
  // Fallback deterministic analysis
  const sev = history24h >= 1 ? 'hard' : 'soft';
  return {
    violation_category: violation.reason === 'payment_bypass' ? 'payment_bypass' : 'contact_bypass',
    severity: sev,
    confidence_score: 0.6,
    recommended_action: sev === 'hard' ? 'chat_frozen' : 'warning',
    user_notification_message: FALLBACK_MESSAGES[violation.reason] || 'Message bloqué par SiteViral.',
    admin_summary: `${violation.reason} — fallback (Gemini unavailable)`,
    admin_review_required: sev === 'hard',
  };
}

function decideAction(analysis: GeminiAnalysis, history24h: number, history7d: number, role: string): { action: string; adminReview: boolean } {
  const rec = analysis.recommended_action;
  // Safety cap: never auto-ban, never auto 7d/30d
  if (rec === 'suspended_24h' && analysis.severity === 'severe') {
    return { action: 'suspended_24h', adminReview: true };
  }
  if (rec === 'provider_hidden' && role === 'provider') {
    return { action: 'provider_hidden', adminReview: true };
  }
  if (rec === 'account_limited') return { action: 'account_limited', adminReview: true };
  if (rec === 'chat_frozen') return { action: 'chat_frozen', adminReview: history7d >= 2 };
  if (rec === 'payout_held') return { action: 'payout_held', adminReview: true };
  return { action: 'warning', adminReview: analysis.admin_review_required };
}

async function applyAction(userId: string, action: string, adminReview: boolean, scoreDelta: number) {
  // Upsert profile
  const { data: existing } = await admin
    .from('account_trust_profiles')
    .select('*')
    .eq('user_id', userId)
    .maybeSingle();

  const now = new Date();
  const in24h = new Date(now.getTime() + 24 * 3600 * 1000).toISOString();
  const in7d = new Date(now.getTime() + 7 * 24 * 3600 * 1000).toISOString();

  const base = existing || { user_id: userId, trust_score: 100, violations_total: 0, violations_24h: 0, violations_7d: 0 };
  const patch: any = {
    user_id: userId,
    trust_score: Math.max(0, (base.trust_score ?? 100) - scoreDelta),
    violations_total: (base.violations_total ?? 0) + 1,
    violations_24h: (base.violations_24h ?? 0) + 1,
    violations_7d: (base.violations_7d ?? 0) + 1,
    last_violation_at: now.toISOString(),
    admin_review_required: adminReview || base.admin_review_required,
  };

  switch (action) {
    case 'warning': patch.status = base.status === 'ok' ? 'warned' : base.status; break;
    case 'chat_frozen': patch.status = 'chat_frozen'; patch.restricted_until = in24h; break;
    case 'account_limited': patch.status = 'limited'; patch.restricted_until = in7d; break;
    case 'provider_hidden': patch.status = 'hidden'; patch.hidden_until = in7d; break;
    case 'payout_held': patch.payout_hold = true; break;
    case 'suspended_24h': patch.status = 'suspended'; patch.suspended_until = in24h; break;
  }

  await admin.from('account_trust_profiles').upsert(patch, { onConflict: 'user_id' });
  return { score_before: base.trust_score ?? 100, score_after: patch.trust_score };
}

async function logNotification(row: any) {
  const { data } = await admin.from('trust_notifications_log').insert(row).select('id').single();
  return data?.id;
}

async function sendInApp(userId: string, action: string, message: string, violationId: string) {
  await admin.from('user_notifications').insert({
    user_id: userId,
    notification_type: 'trust_' + action,
    title: ACTION_LABELS[action] || 'Notification SiteViral',
    body: message,
    action_url: '/account/trust',
  });
  await logNotification({
    user_id: userId, violation_id: violationId, notification_type: action,
    channel: 'in_app', subject: ACTION_LABELS[action], message,
    delivery_status: 'sent', sent_at: new Date().toISOString(),
  });
}

async function sendEmail(userId: string, action: string, message: string, violationId: string) {
  if (!RESEND_KEY) return;
  const { data: { user } } = await admin.auth.admin.getUserById(userId);
  const email = user?.email;
  if (!email) return;

  const subject = `[SiteViral] ${ACTION_LABELS[action] || 'Notification compte'}`;
  const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#0f0f0f;color:#eee;padding:32px">
<div style="max-width:520px;margin:0 auto;background:#1a1a1a;border-radius:16px;padding:32px;border:1px solid #333">
<h2 style="color:#fff;margin-top:0">${ACTION_LABELS[action] || 'Notification'}</h2>
<p style="color:#ddd;font-size:15px;line-height:1.5">${message}</p>
<p style="color:#aaa;font-size:13px;margin-top:24px">Si vous pensez qu'il s'agit d'une erreur, contactez <a href="mailto:support@siteviral.com" style="color:#1a66e6">support@siteviral.com</a>.</p>
<p style="color:#aaa;font-size:13px"><a href="https://siteviral.com/account/trust" style="color:#1a66e6">Voir mon statut de compte</a></p>
<div style="margin-top:32px;padding-top:16px;border-top:1px solid #333;font-size:11px;color:#777">
SiteViral — Operated by Hacktualiz Inc.
</div></div></body></html>`;

  let status: 'sent' | 'failed' = 'sent';
  let errDetail = '';
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: { Authorization: `Bearer ${RESEND_KEY}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({ from: 'SiteViral <noreply@siteviral.com>', to: email, subject, html }),
    });
    if (!res.ok) { status = 'failed'; errDetail = (await res.text()).slice(0, 300); }
  } catch (e: any) { status = 'failed'; errDetail = String(e).slice(0, 300); }

  await logNotification({
    user_id: userId, violation_id: violationId, notification_type: action,
    channel: 'email', subject, message,
    delivery_status: status, sent_at: status === 'sent' ? new Date().toISOString() : null,
    error_detail: errDetail || null,
  });
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const { violation_id } = await req.json();
    if (!violation_id) return new Response(JSON.stringify({ error: 'violation_id required' }), { status: 400, headers: corsHeaders });

    const { data: v } = await admin.from('beauty_chat_violations').select('*').eq('id', violation_id).single();
    if (!v) return new Response(JSON.stringify({ error: 'not found' }), { status: 404, headers: corsHeaders });
    if (v.processed_at) return new Response(JSON.stringify({ ok: true, skipped: 'already processed' }), { headers: corsHeaders });

    // History counts (excluding this one)
    const now = Date.now();
    const [{ count: c24 }, { count: c7 }] = await Promise.all([
      admin.from('beauty_chat_violations').select('id', { count: 'exact', head: true })
        .eq('sender_id', v.sender_id).gte('created_at', new Date(now - 24 * 3600 * 1000).toISOString()).neq('id', v.id),
      admin.from('beauty_chat_violations').select('id', { count: 'exact', head: true })
        .eq('sender_id', v.sender_id).gte('created_at', new Date(now - 7 * 24 * 3600 * 1000).toISOString()).neq('id', v.id),
    ]);

    // Role detection
    const { data: prov } = await admin.from('beauty_providers').select('id').eq('user_id', v.sender_id).maybeSingle();
    const role = prov ? 'provider' : 'client';

    const analysis = await callGemini(v, c24 || 0, c7 || 0, role);
    const decision = decideAction(analysis, c24 || 0, c7 || 0, role);
    const scoreDelta = analysis.severity === 'severe' ? 25 : analysis.severity === 'hard' ? 10 : 3;
    const scores = await applyAction(v.sender_id, decision.action, decision.adminReview, scoreDelta);

    await admin.from('beauty_chat_violations').update({
      severity: analysis.severity,
      ai_category: analysis.violation_category,
      ai_confidence: analysis.confidence_score,
      ai_recommended_action: analysis.recommended_action,
      ai_admin_summary: analysis.admin_summary,
      ai_user_message: analysis.user_notification_message,
      action_taken: decision.action,
      admin_review_required: decision.adminReview,
      score_before: scores.score_before,
      score_after: scores.score_after,
      processed_at: new Date().toISOString(),
    }).eq('id', v.id);

    await sendInApp(v.sender_id, decision.action, analysis.user_notification_message, v.id);
    await sendEmail(v.sender_id, decision.action, analysis.user_notification_message, v.id);

    return new Response(JSON.stringify({ ok: true, action: decision.action, severity: analysis.severity }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } });
  } catch (e: any) {
    console.error('[trust-process-violation]', e);
    return new Response(JSON.stringify({ error: String(e?.message || e) }), { status: 500, headers: corsHeaders });
  }
});
