import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const db = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const body = await req.json();
    const { content_id, content_type, content_title, reason, reporter_email, reporter_id } = body;

    if (!content_id || !reason) {
      return new Response(JSON.stringify({ error: 'Missing fields' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get reporter profile
    let reporterName = reporter_email || 'Utilisateur inconnu';
    try {
      const { data: profile } = await db.from('profiles')
        .select('display_name, email')
        .eq('id', reporter_id)
        .maybeSingle();
      if (profile?.display_name) reporterName = profile.display_name;
    } catch {}

    // Find superadmin users
    const { data: admins } = await db.from('user_platform_roles')
      .select('user_id')
      .eq('role', 'superadmin');

    if (!admins || admins.length === 0) {
      console.warn('No superadmin users found');
      return new Response(JSON.stringify({ ok: true, skipped: 'no_admins' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Send email to each superadmin
    const emailFnUrl = `${SUPABASE_URL}/functions/v1/send-email`;
    const contentLabel = content_type === 'product' ? 'Produit' : content_type === 'event' ? 'Événement' : content_type;

    for (const admin of admins) {
      try {
        const { data: { user } } = await db.auth.admin.getUserById(admin.user_id);
        if (!user?.email) continue;

        await fetch(emailFnUrl, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${SERVICE_KEY}`,
          },
          body: JSON.stringify({
            template: 'notification_reminder',
            to: user.email,
            data: {
              title: `🚩 Nouveau signalement — ${contentLabel}`,
              body: `Un signalement a été soumis par ${reporterName} (${reporter_email}).\n\nContenu signalé : ${content_title || content_id}\nType : ${contentLabel}\nMotif : ${reason}\n\nConnectez-vous au panel Superadmin pour examiner ce signalement.`,
              action_url: 'https://siteviral.com/superadmin/reports',
              notification_type: 'content_report',
            },
          }),
        });
      } catch (e) {
        console.error('Failed to email admin:', e);
      }
    }

    // Also create in-app notification for superadmins
    for (const admin of admins) {
      await db.from('user_notifications').insert({
        user_id: admin.user_id,
        notification_type: 'content_report',
        title: `🚩 Signalement : ${content_title || contentLabel}`,
        body: `${reporterName} a signalé un ${contentLabel.toLowerCase()} — ${reason}`,
        action_url: '/superadmin/reports',
      }).catch(() => {});
    }

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('notify-report error:', err);
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
