import { createContext, useContext, ReactNode, useMemo, useState, useCallback, useEffect } from 'react';
import { useLocation } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { db } from '@/lib/db';

export type AppMode = 'public' | 'ambassador' | 'creator';

const MODE_STORAGE_KEY = 'sv_preferred_mode';

/**
 * Single source of truth for public route detection.
 */
const PUBLIC_ROUTE_EXACT = ['/', '/auth', '/welcome'];

const PUBLIC_ROUTE_PREFIXES = [
  '/org/', '/campaign/', '/offering/', '/event/', '/program/',
  '/go/', '/invite/', '/discover',
  '/gagner', '/earn', '/vendre', '/sell', '/write', '/migrate',
  '/checkout', '/payment/', '/success', '/cancel',
  '/auth/', '/login', '/signup',
  '/terms', '/privacy', '/about', '/aml', '/refund-policy', '/payout-policy',
  '/acceptable-use', '/faq', '/contact', '/compliance', '/dpa', '/security',
  '/subprocessors', '/features', '/affiliate-program', '/ambassador-program',
  '/ambassador', '/ambassador-terms', '/devenir-partenaire', '/partner-terms',
  '/install', '/changelog', '/temoignages', '/calculateur',
  '/pour/', '/comparer', '/presse', '/blog', '/etudes-de-cas',
  '/status', '/help', '/partenaires', '/guide/', '/maintenance',
];

/** Determine if a pathname should force public mode */
export function isPublicPath(pathname: string): boolean {
  if (PUBLIC_ROUTE_EXACT.includes(pathname)) return true;
  return PUBLIC_ROUTE_PREFIXES.some(prefix => pathname.startsWith(prefix));
}

/** Derive mode from current route automatically */
function deriveModeFromRoute(pathname: string): AppMode | null {
  if (isPublicPath(pathname)) return 'public';
  if (pathname.startsWith('/admin') || pathname.startsWith('/create-org')) return 'creator';
  if (pathname.startsWith('/affiliation') || pathname.startsWith('/leaderboard')) return 'ambassador';
  return null;
}

interface ModeContextValue {
  mode: AppMode;
  preferredMode: Exclude<AppMode, 'public'>;
  setMode: (m: AppMode) => void;
  toggleMode: () => void;
  hasOrgs: boolean;
  isRouteOverride: boolean;
  hasCreatorAccess: boolean;
  hasAmbassadorAccess: boolean;
}

const ModeContext = createContext<ModeContextValue>({
  mode: 'public',
  preferredMode: 'ambassador',
  setMode: () => {},
  toggleMode: () => {},
  hasOrgs: false,
  isRouteOverride: false,
  hasCreatorAccess: false,
  hasAmbassadorAccess: false,
});

function getInitialPreferredMode(): Exclude<AppMode, 'public'> {
  if (typeof window === 'undefined') return 'ambassador';
  const stored = window.localStorage.getItem(MODE_STORAGE_KEY);
  return stored === 'creator' ? 'creator' : 'ambassador';
}

export function ModeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { userOrgs, canManage } = useOrg();
  const location = useLocation();
  const [preferredMode, setPreferredModeState] = useState<Exclude<AppMode, 'public'>>(getInitialPreferredMode);

  const hasOrgs = userOrgs.length > 0;
  const hasCreatorAccess = useMemo(() => userOrgs.some((org) => canManage(org.id)), [userOrgs, canManage]);

  const { data: affiliateLinkCount = 0 } = useQuery({
    queryKey: ['mode-affiliate-link-count', user?.id],
    queryFn: async () => {
      if (!user) return 0;
      const { count } = await db
        .from('affiliate_links')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('is_active', true);
      return count || 0;
    },
    enabled: !!user,
    staleTime: 60_000,
  });

  const hasAmbassadorAccess = (affiliateLinkCount ?? 0) > 0;

  const persistPreferredMode = useCallback((nextMode: Exclude<AppMode, 'public'>) => {
    setPreferredModeState(nextMode);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(MODE_STORAGE_KEY, nextMode);
    }
  }, []);

  const derivedMode = useMemo(() => deriveModeFromRoute(location.pathname), [location.pathname]);
  const isRouteOverride = derivedMode === 'public';

  useEffect(() => {
    if (derivedMode === 'creator' || derivedMode === 'ambassador') {
      persistPreferredMode(derivedMode);
    }
  }, [derivedMode, persistPreferredMode]);

  const neutralMode = useMemo<AppMode>(() => {
    if (!user) return 'public';

    if (preferredMode === 'creator' && hasCreatorAccess) return 'creator';
    if (preferredMode === 'ambassador' && hasAmbassadorAccess) return 'ambassador';

    if (hasCreatorAccess && !hasAmbassadorAccess) return 'creator';
    if (hasAmbassadorAccess && !hasCreatorAccess) return 'ambassador';

    return 'public';
  }, [user, preferredMode, hasCreatorAccess, hasAmbassadorAccess]);

  const mode: AppMode = derivedMode ?? neutralMode;

  const setMode = (m: AppMode) => {
    if (m === 'public') return;
    persistPreferredMode(m);
  };

  const toggleMode = () => {
    persistPreferredMode(preferredMode === 'ambassador' ? 'creator' : 'ambassador');
  };

  return (
    <ModeContext.Provider
      value={{
        mode,
        preferredMode,
        setMode,
        toggleMode,
        hasOrgs,
        isRouteOverride,
        hasCreatorAccess,
        hasAmbassadorAccess,
      }}
    >
      {children}
    </ModeContext.Provider>
  );
}

export const useMode = () => useContext(ModeContext);

