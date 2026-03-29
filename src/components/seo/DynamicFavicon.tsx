import { useEffect } from 'react';

interface DynamicFaviconProps {
  logoUrl?: string | null;
  orgName?: string;
  orgDescription?: string;
}

/**
 * Dynamically sets the favicon AND PWA manifest to the org's branding
 * when on a custom domain or subdomain.
 */
export function DynamicFavicon({ logoUrl, orgName, orgDescription }: DynamicFaviconProps) {
  useEffect(() => {
    if (!logoUrl) return;

    // ── Favicon ──
    let link = document.querySelector('link[rel="icon"]') as HTMLLinkElement | null;
    const originalFavicon = link?.href;
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      document.head.appendChild(link);
    }
    link.href = logoUrl;
    link.type = logoUrl.endsWith('.svg') ? 'image/svg+xml' : 'image/png';

    // ── Apple touch icon ──
    let apple = document.querySelector('link[rel="apple-touch-icon"]') as HTMLLinkElement | null;
    const originalApple = apple?.href;
    if (!apple) {
      apple = document.createElement('link');
      apple.rel = 'apple-touch-icon';
      document.head.appendChild(apple);
    }
    apple.href = logoUrl;

    // ── Page title ──
    if (orgName) {
      const title = document.title;
      if (title.includes('Siteviral') && !title.includes(orgName)) {
        document.title = title.replace('Siteviral', orgName);
      }
    }

    // ── Dynamic PWA manifest ──
    let manifestBlobUrl: string | null = null;
    const existingManifest = document.querySelector('link[rel="manifest"]') as HTMLLinkElement | null;
    const originalManifestHref = existingManifest?.href;

    if (orgName) {
      const origin = window.location.origin;
      const manifest = {
        id: '/',
        name: orgName,
        short_name: orgName.length > 12 ? orgName.substring(0, 12) : orgName,
        description: orgDescription || orgName,
        start_url: '/',
        display: 'standalone',
        background_color: '#0d1117',
        theme_color: '#d4920a',
        orientation: 'any',
        lang: 'fr',
        scope: '/',
        icons: [
          { src: logoUrl, sizes: '192x192', type: 'image/png' },
          { src: logoUrl, sizes: '512x512', type: 'image/png' },
          { src: logoUrl, sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: logoUrl, sizes: '512x512', type: 'image/png', purpose: 'maskable' },
        ],
      };

      const blob = new Blob([JSON.stringify(manifest)], { type: 'application/json' });
      manifestBlobUrl = URL.createObjectURL(blob);

      if (existingManifest) {
        existingManifest.href = manifestBlobUrl;
      } else {
        const manifestLink = document.createElement('link');
        manifestLink.rel = 'manifest';
        manifestLink.href = manifestBlobUrl;
        document.head.appendChild(manifestLink);
      }
    }

    return () => {
      if (link && originalFavicon) link.href = originalFavicon;
      if (apple && originalApple) apple.href = originalApple;
      if (existingManifest && originalManifestHref) existingManifest.href = originalManifestHref;
      if (manifestBlobUrl) URL.revokeObjectURL(manifestBlobUrl);
    };
  }, [logoUrl, orgName, orgDescription]);

  return null;
}
