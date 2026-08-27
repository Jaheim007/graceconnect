// Server-only mobile push device registration (ported from register-mobile-device).

const ONESIGNAL_APP_ID = '8b981e58-37db-409f-8372-7a1299547e2b';

export async function registerMobileDevice(args: {
  userId: string;
  action?: 'register' | 'unregister';
  deviceToken: string;
  platform?: string;
  organizationId?: string | null;
  deviceModel?: string | null;
  appVersion?: string | null;
  onesignalPlayerId?: string | null;
}): Promise<{ ok: true; oneSignalSynced?: boolean } | { error: string }> {
  const { supabaseAdmin } = await import('@/integrations/supabase/client.server');
  const db = supabaseAdmin as unknown as { from: (t: string) => any };

  if (args.action === 'unregister') {
    if (!args.deviceToken) return { error: 'device_token required' };
    await db
      .from('mobile_device_tokens')
      .delete()
      .eq('user_id', args.userId)
      .eq('token', args.deviceToken);
    return { ok: true };
  }

  if (!args.deviceToken || !args.platform || !['ios', 'android'].includes(args.platform)) {
    return { error: 'device_token and valid platform required' };
  }

  const { error } = await db.from('mobile_device_tokens').upsert(
    {
      user_id: args.userId,
      organization_id: args.organizationId || null,
      token: args.deviceToken,
      platform: args.platform,
      device_model: args.deviceModel || null,
      app_version: args.appVersion || null,
      last_active_at: new Date().toISOString(),
    },
    { onConflict: 'token' },
  );
  if (error) {
    console.error('[register-mobile-device] upsert', error);
    return { error: error.message };
  }

  let oneSignalSynced = false;
  const restKey = process.env['ONESIGNAL_REST_API_KEY'];
  if (restKey && args.onesignalPlayerId) {
    try {
      const res = await fetch(
        `https://api.onesignal.com/apps/${ONESIGNAL_APP_ID}/users/by/onesignal_id/${args.onesignalPlayerId}/identity`,
        {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json', Authorization: `Basic ${restKey}` },
          body: JSON.stringify({ identity: { external_id: args.userId } }),
        },
      );
      oneSignalSynced = res.ok;
      if (!res.ok) console.warn('[register-mobile-device] OneSignal link failed');
    } catch (e) {
      console.warn('[register-mobile-device] OneSignal error', e);
    }
  }

  return { ok: true, oneSignalSynced };
}
