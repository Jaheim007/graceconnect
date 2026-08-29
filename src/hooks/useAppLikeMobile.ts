import { useEffect, useState } from 'react';
import { isNative, isPWA, isMobileDevice } from '@/lib/platform';

/**
 * True when the app is being used like a mobile app (installed PWA, Capacitor
 * native shell, or a phone/tablet browser). Marketing surfaces (landing pages,
 * cookie banners, "learn more about us" links) are hidden in this context —
 * mobile app users expect a product, not a website.
 *
 * Resolved after mount so SSR and hydration always agree.
 */
export function useAppLikeMobile(): boolean {
  const [appLike, setAppLike] = useState(false);

  useEffect(() => {
    const compute = () => setAppLike(isNative() || isPWA() || isMobileDevice());
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  return appLike;
}
