import { useNativePush } from '@/hooks/useNativePush';

/**
 * Invisible bootstrap component — initializes native push notifications
 * (FCM/APNs via Capacitor + OneSignal) when running on iOS/Android.
 * Safe no-op on web.
 */
export function NativePushBootstrap() {
  useNativePush();
  return null;
}
