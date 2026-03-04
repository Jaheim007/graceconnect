import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

/**
 * Webhook-style edge function triggered by pg_net on user_notifications INSERT.
 * For each new notification:
 *  1. Sends an email reminder to the user
 *  2. Sends a OneSignal push notification to the user
 */
Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });

  const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!;
  const SERVICE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
  const ONESIGNAL_REST_API_KEY = Deno.env.get('ONESIGNAL_REST_API_KEY');
  const ONESIGNAL_APP_ID = '8b981e58-37db-409f-8372-7a1299547e2b';

  const db = createClient(SUPABASE_URL, SERVICE_KEY);

  try {
    const body = await req.json();

    // Support both direct call { notification_id } and pg_net trigger { record }
    let notification: any = null;

    if (body.record) {
      notification = body.record;
    } else if (body.notification_id) {
      const { data } = await db.from('user_notifications').select('*').eq('id', body.notification_id).single();
      notification = data;
    } else if (body.type === 'INSERT' && body.table === 'user_notifications') {
      notification = body.record;
    }

    if (!notification) {
      return new Response(JSON.stringify({ error: 'No notification data' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const userId = notification.user_id;
    const title = notification.title || '🔔 Notification';
    const notifBody = notification.body || '';
    const actionUrl = notification.action_url || 'https://siteviral.com/notifications';
    const notifType = notification.notification_type || 'general';

    if (!userId) {
      return new Response(JSON.stringify({ ok: true, skipped: 'no user_id' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get user email
    let userEmail: string | null = null;
    try {
      const { data: { user } } = await db.auth.admin.getUserById(userId);
      userEmail = user?.email || null;
    } catch (e) {
      console.warn('Could not fetch user email:', e);
    }

    const results: Record<string, any> = { notification_id: notification.id };

    // ─── 1. SEND EMAIL ───
    if (userEmail) {
      try {
        // Check user notification preferences — respect email_enabled
        const { data: prefs } = await db.from('notification_preferences')
          .select('email_enabled')
          .eq('user_id', userId)
          .maybeSingle();

        const emailEnabled = prefs ? prefs.email_enabled !== false : true;

        if (emailEnabled) {
          // Map notification_type to email template category for anti-spam
          const emailTemplate = 'notification_reminder';

          const emailFnUrl = `${SUPABASE_URL}/functions/v1/send-email`;
          const emailRes = await fetch(emailFnUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${SERVICE_KEY}`,
            },
            body: JSON.stringify({
              template: emailTemplate,
              to: userEmail,
              data: {
                title,
                body: notifBody,
                action_url: actionUrl.startsWith('http') ? actionUrl : `https://siteviral.com${actionUrl}`,
                notification_type: notifType,
              },
            }),
          });
          const emailResult = await emailRes.json();
          results.email = { sent: emailRes.ok, ...emailResult };
        } else {
          results.email = { skipped: 'email_disabled_by_user' };
        }
      } catch (emailErr) {
        console.error('Email send error:', emailErr);
        results.email = { error: String(emailErr) };
      }
    } else {
      results.email = { skipped: 'no_email' };
    }

    // ─── 2. SEND ONESIGNAL PUSH ───
    if (ONESIGNAL_REST_API_KEY) {
      try {
        // Check user push preferences
        const { data: prefs } = await db.from('notification_preferences')
          .select('push_enabled')
          .eq('user_id', userId)
          .maybeSingle();

        const pushEnabled = prefs ? prefs.push_enabled !== false : true;

        if (pushEnabled) {
          const osRes = await fetch('https://api.onesignal.com/notifications', {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Basic ${ONESIGNAL_REST_API_KEY}`,
            },
            body: JSON.stringify({
              app_id: ONESIGNAL_APP_ID,
              include_aliases: { external_id: [userId] },
              target_channel: 'push',
              headings: { en: title, fr: title },
              contents: { en: notifBody || title, fr: notifBody || title },
              url: actionUrl.startsWith('http') ? actionUrl : `https://siteviral.com${actionUrl}`,
              // Group by type to avoid notification flood
              android_group: notifType,
              thread_id: notifType,
              collapse_id: `${notifType}_${userId}`,
            }),
          });
          const osData = await osRes.json();
          results.push = { sent: osRes.ok, recipients: osData.recipients || 0, id: osData.id };
        } else {
          results.push = { skipped: 'push_disabled_by_user' };
        }
      } catch (pushErr) {
        console.error('OneSignal push error:', pushErr);
        results.push = { error: String(pushErr) };
      }
    } else {
      results.push = { skipped: 'no_onesignal_key' };
    }

    return new Response(JSON.stringify({ ok: true, ...results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (err) {
    console.error('on-notification-created error:', err);
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
