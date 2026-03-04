import { createContext, useContext, ReactNode, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';

export type AppMode = 'public' | 'ambassador' | 'creator';

/**
 * Single source of truth for public route detection.
 */
const PUBLIC_ROUTE_EXACT = ['/', '/auth', '/welcome'];

const PUBLIC_ROUTE_PREFIXES = [
  '/org/', '/campaign/', '/offering/', '/event/', '/program/',
  '/go/', '/invite/',
  '/gagner', '/vendre',
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

/** Derive mode from current route automatically — no toggle needed */
function deriveModeFromRoute(pathname: string): AppMode | null {
  if (isPublicPath(pathname)) return 'public';
  // Creator routes
  if (pathname.startsWith('/admin') || pathname.startsWith('/create-org')) return 'creator';
  // Ambassador routes
  if (pathname.startsWith('/affiliation') || pathname.startsWith('/leaderboard')) return 'ambassador';
  // Neutral routes (dashboard, resources, marketplace, notifications, profile) → null = no override
  return null;
}

interface ModeContextValue {
  mode: AppMode;
  /** The persisted user preference (ambassador or creator), ignoring route overrides */
  preferredMode: Exclude<AppMode, 'public'>;
  setMode: (m: AppMode) => void;
  toggleMode: () => void;
  hasOrgs: boolean;
  /** True when current mode is forced by route (public pages) */
  isRouteOverride: boolean;
}

const ModeContext = createContext<ModeContextValue>({
  mode: 'ambassador',
  preferredMode: 'ambassador',
  setMode: () => {},
  toggleMode: () => {},
  hasOrgs: false,
  isRouteOverride: false,
});

export function ModeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { userOrgs } = useOrg();
  const hasOrgs = userOrgs.length > 0;
  const location = useLocation();

  // Route-derived mode — automatic, no toggle
  const derivedMode = useMemo(() => deriveModeFromRoute(location.pathname), [location.pathname]);
  const isRouteOverride = derivedMode === 'public';

  // For neutral routes, default to ambassador (buyer-friendly)
  const mode: AppMode = derivedMode ?? 'ambassador';
  const preferredMode: Exclude<AppMode, 'public'> = mode === 'public' ? 'ambassador' : mode;

  // setMode and toggleMode are kept for backward compat but are no-ops now
  const setMode = () => {};
  const toggleMode = () => {};

  return (
    <ModeContext.Provider value={{ mode, preferredMode, setMode, toggleMode, hasOrgs, isRouteOverride }}>
      {children}
    </ModeContext.Provider>
  );
}

export const useMode = () => useContext(ModeContext);
