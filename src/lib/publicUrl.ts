import { isMainPlatformDomain } from '@/hooks/useDomainResolver';

/**
 * Returns the public-facing origin URL for product links and sharing.
 * On preview/dev domains, returns the published custom domain.
 * On org subdomains/custom domains, returns the current origin.
 */
export function getPublicOrigin(): string {
  const host = window.location.hostname;

  // Already on production custom domain or org domain
  if (
    host === 'siteviral.com' ||
    host === 'www.siteviral.com' ||
    host === 'api.siteviral.com' ||
    host === 'graceconnect.lovable.app'
    || host === 'siteviral.lovable.app'
  ) {
    return window.location.origin;
  }

  // On an org subdomain (xxx.siteviral.com) or custom domain
  if (host.endsWith('.siteviral.com') && host !== 'www.siteviral.com' && host !== 'api.siteviral.com') {
    return window.location.origin;
  }

  // On a custom domain (not lovable, not siteviral)
  if (!isMainPlatformDomain(host)) {
    return window.location.origin;
  }

  // Preview / dev → use the published custom domain
  if (host.includes('lovable.app') || host.includes('lovableproject.com') || host === 'localhost') {
    return 'https://siteviral.com';
  }

  return window.location.origin;
}

/**
 * Build a full public URL for a given path.
 */
export function getPublicUrl(path: string): string {
  return `${getPublicOrigin()}${path}`;
}
