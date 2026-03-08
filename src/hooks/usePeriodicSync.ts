import { useEffect } from 'react';

/**
 * Registers Periodic Background Sync if supported.
 * This allows the SW to periodically refresh content.
 * Call once in the app root.
 */
export function usePeriodicSync(tag = 'sv-content-sync', minIntervalMs = 12 * 60 * 60 * 1000) {
  useEffect(() => {
    if (!('serviceWorker' in navigator) || !('periodicSync' in (ServiceWorkerRegistration.prototype || {}))) {
      return;
    }

    const register = async () => {
      try {
        const registration = await navigator.serviceWorker.ready;
        // Check permission
        const status = await (navigator as any).permissions?.query?.({ name: 'periodic-background-sync' });
        if (status?.state !== 'granted') return;

        await (registration as any).periodicSync?.register(tag, {
          minInterval: minIntervalMs,
        });
        console.log('[PeriodicSync] Registered:', tag);
      } catch (e) {
        // Not supported or permission denied — silent
      }
    };

    register();
  }, [tag, minIntervalMs]);

  // Listen for sync messages from SW
  useEffect(() => {
    if (!('serviceWorker' in navigator)) return;

    const handler = (event: MessageEvent) => {
      if (event.data?.type === 'PERIODIC_SYNC') {
        // Dispatch custom event so React Query or other systems can refetch
        window.dispatchEvent(new CustomEvent('sv:periodic-sync', { detail: event.data.tag }));
      }
    };

    navigator.serviceWorker.addEventListener('message', handler);
    return () => navigator.serviceWorker.removeEventListener('message', handler);
  }, []);
}
