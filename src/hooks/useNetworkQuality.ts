import { useEffect, useState } from 'react';

type ConnectionSpeed = 'slow' | 'medium' | 'fast' | 'unknown';

interface NetworkInfo {
  isOnline: boolean;
  speed: ConnectionSpeed;
  effectiveType: string;
  saveData: boolean;
}

/**
 * useNetworkQuality — Detects connection quality for adaptive UX.
 * Use to conditionally load heavy assets, disable animations, etc.
 *
 * Usage:
 *   const { isOnline, speed, saveData } = useNetworkQuality();
 *   if (speed === 'slow' || saveData) // skip heavy images
 */
export function useNetworkQuality(): NetworkInfo {
  const [info, setInfo] = useState<NetworkInfo>(() => getNetworkInfo());

  useEffect(() => {
    const update = () => setInfo(getNetworkInfo());

    window.addEventListener('online', update);
    window.addEventListener('offline', update);

    const conn = (navigator as any).connection;
    if (conn) {
      conn.addEventListener('change', update);
    }

    return () => {
      window.removeEventListener('online', update);
      window.removeEventListener('offline', update);
      if (conn) conn.removeEventListener('change', update);
    };
  }, []);

  return info;
}

function getNetworkInfo(): NetworkInfo {
  const conn = (navigator as any).connection;
  const effectiveType = conn?.effectiveType || 'unknown';

  let speed: ConnectionSpeed = 'unknown';
  if (effectiveType === 'slow-2g' || effectiveType === '2g') speed = 'slow';
  else if (effectiveType === '3g') speed = 'medium';
  else if (effectiveType === '4g') speed = 'fast';

  return {
    isOnline: navigator.onLine,
    speed,
    effectiveType,
    saveData: conn?.saveData || false,
  };
}
