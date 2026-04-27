import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface OrgAlert {
  organization_id: string;
  org_name: string;
  owner_id: string;
  owner_email: string | null;
  alert_type: 'churn_high' | 'at_risk_buyers';
  churn_rate: number;
  at_risk_count: number;
  active_buyers: number;
}

function buildAlertContent(a: OrgAlert) {
  if (a.alert_type === 'churn_high') {
    return {
      title_fr: `⚠️ Taux de churn élevé sur ${a.org_name}`,
      body_fr: `${a.churn_rate}% de tes acheteurs sont inactifs depuis +90j. Lance une campagne de réactivation depuis tes analytics.`,
      title_en: `⚠️ High churn rate on ${a.org_name}`,
      body_en: `${a.churn_rate}% of your buyers have been inactive for 90+ days. Launch a re-engagement campaign from your analytics.`,
      action_url: '/creator/analytics',
    };
  }
  return {
    title_fr: `🟠 ${a.at_risk_count} clients à risque sur ${a.org_name}`,
    body_fr: `Ces clients n'ont pas acheté depuis 60-90j. C'est le bon moment pour leur envoyer une offre exclusive.`,
    title_en: `🟠 ${a.at_risk_count} at-risk customers on ${a.org_name}`,
    body_en: `These customers haven't purchased in 60-90 days. Now is the time to send them an exclusive offer.`,
    action_url: '/creator/analytics',
  };
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response('ok', { headers: corsHeaders });

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const serviceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, serviceKey);

    const body = await req.json().catch(() => ({}));
    const dryRun = body.dry_run === true;

    // Get orgs needing alerts (RPC handles dedup via week_bucket)
    const { data: alerts, error } = await supabase.rpc('get_orgs_needing_alerts');
    if (error) throw error;

    const list = (alerts || []) as OrgAlert[];
    console.log(`[proactive-alerts] ${list.length} orgs need alerts`);

    if (dryRun) {
      return new Response(JSON.stringify({ dry_run: true, count: list.length, sample: list.slice(0, 5) }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const results = { sent: 0, failed: 0, skipped: 0 };

    for (const alert of list) {
      try {
        const content = buildAlertContent(alert);

        // Insert in-app notification (FR par défaut, l'UI gère la traduction si besoin)
        const { data: notif, error: notifErr } = await supabase
          .from('user_notifications')
          .insert({
            user_id: alert.owner_id,
            organization_id: alert.organization_id,
            title: content.title_fr,
            body: content.body_fr,
            notification_type: 'proactive_alert',
            action_url: content.action_url,
          })
          .select('id')
          .single();

        if (notifErr) throw notifErr;

        // Email (best effort, ne bloque pas si échec)
        let emailSent = false;
        if (alert.owner_email) {
          try {
            await supabase.functions.invoke('send-email', {
              body: {
                to: alert.owner_email,
                subject: content.title_fr,
                html: `
                  <div style="font-family:system-ui;max-width:560px;margin:0 auto;padding:24px;">
                    <h2 style="margin:0 0 12px;">${content.title_fr}</h2>
                    <p style="color:#475569;line-height:1.5;">${content.body_fr}</p>
                    <a href="https://siteviral.com${content.action_url}"
                       style="display:inline-block;margin-top:16px;background:#0ea5e9;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;">
                      Voir mes analytics
                    </a>
                    <hr style="margin:24px 0;border:none;border-top:1px solid #e2e8f0;" />
                    <p style="font-size:12px;color:#94a3b8;">SiteViral — Alerte automatique hebdomadaire.</p>
                  </div>
                `,
              },
            });
            emailSent = true;
          } catch (e) {
            console.warn(`[proactive-alerts] email failed for ${alert.organization_id}:`, e);
          }
        }

        // Log dedup entry
        await supabase.from('proactive_alerts_log').insert({
          organization_id: alert.organization_id,
          alert_type: alert.alert_type,
          notification_id: notif?.id,
          email_sent: emailSent,
          metadata: {
            churn_rate: alert.churn_rate,
            at_risk_count: alert.at_risk_count,
            active_buyers: alert.active_buyers,
          },
        });

        results.sent++;
      } catch (e) {
        console.error(`[proactive-alerts] failed for ${alert.organization_id}:`, e);
        results.failed++;
      }
    }

    return new Response(JSON.stringify({ ok: true, ...results, total: list.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (e: any) {
    console.error('[proactive-alerts] fatal:', e);
    return new Response(JSON.stringify({ error: e.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
