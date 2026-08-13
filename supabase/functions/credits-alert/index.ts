/**
 * credits-alert
 *
 * Called by the app when the signed-in user's credit balance crosses a
 * warning threshold. Creates an in-app notification + sends an email,
 * at most once per user / per alert type / per day.
 */
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Daily grant is 20 credits/day, so only warn when really low.
const LOW_THRESHOLD = 5;

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  const json = (body: unknown, status = 200) =>
    new Response(JSON.stringify(body), {
      status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  try {
    const authHeader = req.headers.get('Authorization') || '';
    const token = authHeader.replace('Bearer ', '');
    if (!token) return json({ error: 'unauthorized' }, 401);

    const admin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
    );

    const { data: userData, error: userErr } = await admin.auth.getUser(token);
    const user = userData?.user;
    if (userErr || !user) return json({ error: 'unauthorized' }, 401);

    let locale = 'fr';
    try {
      const body = await req.json();
      if (body?.locale === 'en') locale = 'en';
    } catch { /* no body */ }
    const isFr = locale === 'fr';

    // Authoritative balance (never trust the client)
    const { data: summary, error: sumErr } = await admin.rpc('get_credit_summary', {
      _user_id: user.id,
    });
    if (sumErr) return json({ error: sumErr.message }, 400);

    const balance = Number((summary as any)?.balance ?? 0);
    const alertType = balance <= 0.5 ? 'credits_empty' : balance <= LOW_THRESHOLD ? 'credits_low' : null;
    if (!alertType) return json({ ok: true, skipped: 'balance_ok', balance });

    // Dedupe: one alert per type per day
    const { error: logErr } = await admin.from('credit_alert_log').insert({
      user_id: user.id,
      alert_type: alertType,
      balance,
      emailed: true,
    });
    if (logErr) {
      // unique violation → already alerted today
      return json({ ok: true, skipped: 'already_alerted', balance });
    }

    const rounded = balance.toFixed(1);
    const title = alertType === 'credits_empty'
      ? (isFr ? '🔴 Plus de crédits' : '🔴 Out of credits')
      : (isFr ? `⚡ Crédits bientôt épuisés (${rounded})` : `⚡ Credits running low (${rounded})`);
    const bodyText = alertType === 'credits_empty'
      ? (isFr ? 'Recharge tes crédits pour continuer à générer avec l\'IA.' : 'Top up your credits to keep generating with AI.')
      : (isFr ? `Il te reste ${rounded} crédits. Recharge pour éviter une interruption.` : `You have ${rounded} credits left. Top up to avoid interruptions.`);

    await admin.from('user_notifications').insert({
      user_id: user.id,
      title,
      body: bodyText,
      notification_type: alertType,
      action_url: '/credits',
    });

    if (user.email) {
      try {
        await admin.functions.invoke('send-email', {
          body: {
            template: alertType,
            to: user.email,
            data: { balance: rounded, lang: locale },
          },
        });
      } catch (e) {
        console.error('[credits-alert] email failed', e);
      }
    }

    return json({ ok: true, alert: alertType, balance });
  } catch (err) {
    console.error('[credits-alert] error', err);
    return json({ error: String(err) }, 500);
  }
});
