import { createServerFn } from '@tanstack/react-start';
import { requireSupabaseAuth } from '@/integrations/supabase/auth-middleware';
import { registerMobileDevice } from './devices.server';

export const registerDevice = createServerFn({ method: 'POST' })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: {
    action?: 'register' | 'unregister';
    device_token: string;
    platform?: string;
    organization_id?: string | null;
    device_model?: string | null;
    app_version?: string | null;
    onesignal_player_id?: string | null;
  }) => input)
  .handler(async ({ data, context }) =>
    registerMobileDevice({
      userId: context.userId,
      action: data.action,
      deviceToken: data.device_token,
      platform: data.platform,
      organizationId: data.organization_id ?? null,
      deviceModel: data.device_model ?? null,
      appVersion: data.app_version ?? null,
      onesignalPlayerId: data.onesignal_player_id ?? null,
    }),
  );
