import { useState, useEffect, startTransition } from 'react';
import { isNativePlatform } from '@/lib/capacitor';

/**
 * Reactive hook that tracks online/offline status.
 * Uses Capacitor Network plugin on native, browser events on web.
 */
export function useOnlineStatus(): boolean {
  // Start as online on both server and first client render (Node exposes a
  // `navigator` global without `onLine`, which made SSR render the offline
  // banner and mismatch hydration). The real status syncs in the effect.
  const [online, setOnline] = useState(true);

  useEffect(() => {
    // On native, prefer Capacitor Network plugin for reliability
    if (isNativePlatform()) {
      let cleanup: (() => void) | undefined;

      (async () => {
        try {
          const { Network } = await import('@capacitor/network');
          const status = await Network.getStatus();
          setOnline(status.connected);

          const handle = await Network.addListener('networkStatusChange', (s) => {
            setOnline(s.connected);
          });
          cleanup = () => handle.remove();
        } catch {
          // Fallback to browser events if plugin fails
        }
      })();

      return () => cleanup?.();
    }

    // Web fallback
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);

    if (typeof navigator.onLine === 'boolean') startTransition(() => setOnline(navigator.onLine));
    window.addEventListener('online', goOnline);
    window.addEventListener('offline', goOffline);

    return () => {
      window.removeEventListener('online', goOnline);
      window.removeEventListener('offline', goOffline);
    };
  }, []);

  return online;
}
