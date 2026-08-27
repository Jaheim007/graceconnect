import { useEffect } from 'react';
import { useNavigate, useLocation } from '@/lib/router-compat';
import { useDomainResolver, isMainPlatformDomain } from '@/hooks/useDomainResolver';

/**
 * Invisible component that resolves custom domains/subdomains
 * and redirects to the correct org page.
 * 
 * If we're on shop.siteviral.com or mycustomdomain.com,
 * and the path is "/" → redirect to /org/{slug}
 */
export function DomainRouter() {
  const { data: resolved, isLoading } = useDomainResolver();
  const navigate = useNavigate();
  const { pathname } = useLocation();
  const hostname = typeof window !== 'undefined' ? window.location.hostname : '';

  useEffect(() => {
    if (isLoading || !resolved) return;
    if (isMainPlatformDomain(hostname)) return;

    // We're on a custom domain/subdomain with a resolved org
    // If user is at root or generic paths, redirect to org page
    const orgPrefix = `/org/${resolved.slug}`;

    if (pathname === '/' || pathname === '') {
      navigate(orgPrefix, { replace: true });
    } else if (!pathname.startsWith('/org/') && !pathname.startsWith('/auth') && !pathname.startsWith('/payment')) {
      // For paths like /store, /donate → redirect to /org/slug/store etc.
      const cleanPath = pathname.startsWith('/') ? pathname.slice(1) : pathname;
      const orgSections = ['store', 'donate', 'content', 'events', 'offerings', 'dons', 'photos', 'programs'];
      if (orgSections.includes(cleanPath)) {
        navigate(`${orgPrefix}/${cleanPath}`, { replace: true });
      } else if (cleanPath.startsWith('product/') || cleanPath.startsWith('p/')) {
        navigate(`${orgPrefix}/${cleanPath}`, { replace: true });
      }
    }
  }, [resolved, isLoading, pathname, hostname, navigate]);

  return null;
}
