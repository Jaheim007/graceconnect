import { useEffect, useState } from 'react';
import { isNative, isPWA } from '@/lib/platform';

/**
 * True when the app runs as an installed app: Capacitor native shell or an
 * installed PWA (standalone display). Marketing surfaces (landing pages,
 * cookie banners, "learn more about us" links) are hidden only there — a phone
 * or tablet *browser* is still the website and keeps every marketing page.
 *
 * Resolved after mount so SSR and hydration always agree.
 */
export function useAppLikeMobile(): boolean {
  const [appLike, setAppLike] = useState(false);

  useEffect(() => {
    const compute = () => setAppLike(isNative() || isPWA());
    compute();
    window.addEventListener('resize', compute);
    return () => window.removeEventListener('resize', compute);
  }, []);

  return appLike;
}
