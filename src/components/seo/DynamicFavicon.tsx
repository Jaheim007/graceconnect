import { useEffect } from 'react';

interface DynamicFaviconProps {
  logoUrl?: string | null;
  orgName?: string;
}

/**
 * Dynamically sets the favicon to the org's logo when on a custom domain.
 * Falls back to the default Siteviral favicon.
 */
export function DynamicFavicon({ logoUrl, orgName }: DynamicFaviconProps) {
  useEffect(() => {
    if (!logoUrl) return;

    // Update existing favicon or create one
    let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
    const originalHref = link?.href;

    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = logoUrl;
    link.type = logoUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png';

    // Also set apple-touch-icon
    let apple = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement | null;
    const originalApple = apple?.href;
    if (!apple) {
      apple = document.createElement('link');
      apple.rel = 'apple-touch-icon';
      document.head.appendChild(apple);
    }
    apple.href = logoUrl;

    // Update page title suffix if on org domain
    if (orgName) {
      const title = document.title;
      if (title.includes('Siteviral') && !title.includes(orgName)) {
        document.title = title.replace('Siteviral', orgName);
      }
    }

    return () => {
      // Restore original favicon on unmount
      if (link && originalHref) link.href = originalHref;
      if (apple && originalApple) apple.href = originalApple;
    };
  }, [logoUrl, orgName]);

  return null;
}
