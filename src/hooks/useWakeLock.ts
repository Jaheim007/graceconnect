import { useState, useCallback, useEffect, useRef } from 'react';

/**
 * Hook to prevent the screen from dimming/locking.
 * Useful during video playback, reading, or long tasks.
 */
export function useWakeLock() {
  const [isActive, setIsActive] = useState(false);
  const wakeLockRef = useRef<any>(null);

  const isSupported = typeof navigator !== 'undefined' && 'wakeLock' in navigator;

  const request = useCallback(async () => {
    if (!isSupported || wakeLockRef.current) return;
    try {
      wakeLockRef.current = await (navigator as any).wakeLock.request('screen');
      setIsActive(true);

      wakeLockRef.current.addEventListener('release', () => {
        setIsActive(false);
        wakeLockRef.current = null;
      });
    } catch (e) {
      console.warn('[WakeLock] Request failed:', e);
    }
  }, [isSupported]);

  const release = useCallback(async () => {
    if (wakeLockRef.current) {
      await wakeLockRef.current.release();
      wakeLockRef.current = null;
      setIsActive(false);
    }
  }, []);

  // Re-acquire on visibility change (e.g. user switches tabs and comes back)
  useEffect(() => {
    if (!isSupported) return;
    const handler = () => {
      if (document.visibilityState === 'visible' && isActive && !wakeLockRef.current) {
        request();
      }
    };
    document.addEventListener('visibilitychange', handler);
    return () => document.removeEventListener('visibilitychange', handler);
  }, [isSupported, isActive, request]);

  // Release on unmount
  useEffect(() => {
    return () => { release(); };
  }, [release]);

  return { isSupported, isActive, request, release };
}
