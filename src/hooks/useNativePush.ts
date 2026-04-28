import { useEffect, useCallback, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { isNativePlatform, getPlatform } from '@/lib/capacitor';
import { supabase } from '@/integrations/supabase/client';

/**
 * Native mobile push notifications via Capacitor + OneSignal.
 * - Web: no-op (Web Push handled separately by usePushNotifications)
 * - iOS/Android: requests permission, registers FCM/APNs token, syncs with backend.
 */
export function useNativePush() {
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const [registered, setRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const callBackend = useCallback(async (payload: Record<string, any>) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.access_token) return null;
    const { data, error } = await supabase.functions.invoke('register-mobile-device', {
      body: payload,
      headers: { Authorization: `Bearer ${session.access_token}` },
    });
    if (error) {
      console.warn('[native-push] backend register failed:', error);
      return null;
    }
    return data;
  }, []);

  const register = useCallback(async () => {
    if (!isNativePlatform() || !user) return;
    try {
      const { PushNotifications } = await import('@capacitor/push-notifications');

      const permStatus = await PushNotifications.checkPermissions();
      let finalStatus = permStatus.receive;
      if (finalStatus !== 'granted') {
        const req = await PushNotifications.requestPermissions();
        finalStatus = req.receive;
      }
      if (finalStatus !== 'granted') {
        setError('Permission refusée');
        return;
      }

      // Listen for token
      await PushNotifications.removeAllListeners();

      PushNotifications.addListener('registration', async (token) => {
        const platform = getPlatform() as 'ios' | 'android';
        await callBackend({
          action: 'register',
          device_token: token.value,
          platform,
          organization_id: currentOrg?.id || null,
          app_version: '1.0.0',
        });
        setRegistered(true);
      });

      PushNotifications.addListener('registrationError', (err) => {
        console.error('[native-push] registration error:', err);
        setError(String(err?.error ?? 'unknown'));
      });

      PushNotifications.addListener('pushNotificationReceived', (notif) => {
        console.log('[native-push] received:', notif);
      });

      PushNotifications.addListener('pushNotificationActionPerformed', (action) => {
        const url = action.notification?.data?.url;
        if (url && typeof url === 'string') {
          window.location.href = url;
        }
      });

      await PushNotifications.register();
    } catch (e: any) {
      console.warn('[native-push] register failed:', e);
      setError(e?.message ?? 'unknown');
    }
  }, [user, currentOrg, callBackend]);

  // Auto-register on mount when authenticated on native
  useEffect(() => {
    if (isNativePlatform() && user && !registered) {
      void register();
    }
  }, [user, registered, register]);

  return { register, registered, error, isNative: isNativePlatform() };
}
