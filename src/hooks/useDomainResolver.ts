import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';

/**
 * Resolves the current hostname to an organization.
 * Returns the org slug if we're on a custom domain or subdomain,
 * or null if we're on the main siteviral.com / lovable.app domain.
 */
export function useDomainResolver() {
  // SSR-safe: no hostname during server render; the query stays disabled
  // until hydration provides the real one.
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

  return useQuery({
    enabled: hostname !== '',
    queryKey: ['domain-resolve', hostname],
    queryFn: async () => {
      // Main platform domains — no org resolution needed
      if (isMainPlatformDomain(hostname)) {
        return null;
      }

      // Try to resolve hostname from org_domains table
      const { data } = await db
        .from('org_domains')
        .select('organization_id, domain, domain_type, is_verified, organizations!inner(slug)')
        .eq('domain', hostname)
        .eq('is_verified', true)
        .limit(1)
        .single();

      if (data) {
        return {
          orgId: data.organization_id,
          slug: (data as any).organizations?.slug as string,
          domain: data.domain,
          domainType: data.domain_type,
        };
      }

      // Fallback: check if it's a *.siteviral.com subdomain
      if (hostname.endsWith('.siteviral.com')) {
        const sub = hostname.replace('.siteviral.com', '');
        if (sub && sub !== 'www' && sub !== 'api') {
          // Try finding by slug directly
          const { data: org } = await db
            .from('organizations')
            .select('id, slug')
            .eq('slug', sub)
            .single();

          if (org) {
            return {
              orgId: org.id,
              slug: org.slug,
              domain: hostname,
              domainType: 'subdomain' as const,
            };
          }
        }
      }

      return null;
    },
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
    gcTime: 10 * 60 * 1000,
  });
}

/** Check if hostname is the main platform (not an org domain) */
export function isMainPlatformDomain(hostname: string): boolean {
  return (
    hostname === 'siteviral.com' ||
    hostname === 'www.siteviral.com' ||
    hostname === 'api.siteviral.com' ||
    hostname === 'localhost' ||
    hostname.includes('lovable.app') ||
    hostname.includes('lovableproject.com')
  );
}

/** Get the org domain origin for links */
export function getOrgDomainOrigin(domain: string): string {
  return `https://${domain}`;
}
