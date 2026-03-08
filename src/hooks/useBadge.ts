import { useCallback, useEffect } from 'react';

/**
 * Hook to manage the PWA app badge (unread count on icon).
 * Uses the Badging API (Chrome 81+, Edge 81+).
 * Falls back silently on unsupported browsers.
 */
export function useBadge() {
  const isSupported = typeof navigator !== 'undefined' && 'setAppBadge' in navigator;

  const setBadge = useCallback((count: number) => {
    if (!isSupported) return;
    try {
      if (count > 0) {
        (navigator as any).setAppBadge(count);
      } else {
        (navigator as any).clearAppBadge();
      }
    } catch (e) {
      console.warn('[Badge] Failed to set badge:', e);
    }
  }, [isSupported]);

  const clearBadge = useCallback(() => {
    if (!isSupported) return;
    try {
      (navigator as any).clearAppBadge();
    } catch (e) {
      // silent
    }
  }, [isSupported]);

  // Clear badge when app gains focus (user opened it)
  useEffect(() => {
    if (!isSupported) return;
    const handler = () => clearBadge();
    window.addEventListener('focus', handler);
    return () => window.removeEventListener('focus', handler);
  }, [isSupported, clearBadge]);

  return { isSupported, setBadge, clearBadge };
}
