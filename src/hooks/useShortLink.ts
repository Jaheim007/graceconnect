import { useState, useEffect } from 'react';
import { getOrCreateShortLink, buildSocialShareUrl } from '@/lib/shareMeta';

/**
 * Hook to get a branded short link for sharing.
 * Returns a sync fallback immediately, then upgrades to a short link.
 */
export function useShortLink(opts: {
  targetPath: string;
  title?: string;
  description?: string;
  image?: string;
}) {
  const { targetPath, title, description, image } = opts;
  const [shareUrl, setShareUrl] = useState(() => {
    const origin = typeof window !== 'undefined' ? window.location.origin : 'https://siteviral.com';
    return buildSocialShareUrl({ targetUrl: `${origin}${targetPath}`, title, description, image });
  });
  const [isShort, setIsShort] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getOrCreateShortLink({ targetPath, title, description, image })
      .then((url) => {
        if (!cancelled) {
          setShareUrl(url);
          setIsShort(true);
        }
      })
      .catch(() => { /* keep fallback */ });
    return () => { cancelled = true; };
  }, [targetPath, title, description, image]);

  return { shareUrl, isShort };
}
