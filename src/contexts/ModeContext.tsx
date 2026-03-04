import { createContext, useContext, useState, useCallback, ReactNode, useMemo } from 'react';
import { useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';

export type AppMode = 'public' | 'ambassador' | 'creator';

/**
 * Single source of truth for public route detection.
 * These routes force public mode regardless of user preference.
 */
const PUBLIC_ROUTE_EXACT = ['/', '/auth', '/welcome'];

const PUBLIC_ROUTE_PREFIXES = [
  '/org/', '/campaign/', '/offering/', '/event/', '/program/',
  '/go/', '/invite/',
  '/gagner', '/vendre',
  '/checkout', '/payment/', '/success', '/cancel',
  '/auth/', '/login', '/signup',
  // Static/legal/content pages
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

const STORAGE_KEY = 'sv_app_mode';

export function ModeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { userOrgs } = useOrg();
  const hasOrgs = userOrgs.length > 0;
  const location = useLocation();

  const [preferredMode, setPreferredRaw] = useState<Exclude<AppMode, 'public'>>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'creator' || stored === 'ambassador') return stored;
    } catch {}
    return 'ambassador';
  });

  // Route-based override using React Router's useLocation — no window patching
  const isRouteOverride = useMemo(() => isPublicPath(location.pathname), [location.pathname]);
  const mode: AppMode = isRouteOverride ? 'public' : preferredMode;

  const setMode = useCallback((m: AppMode) => {
    if (m === 'public') return; // public is route-driven only
    setPreferredRaw(m);
    try { localStorage.setItem(STORAGE_KEY, m); } catch {}
  }, []);

  const toggleMode = useCallback(() => {
    setMode(preferredMode === 'ambassador' ? 'creator' : 'ambassador');
  }, [preferredMode, setMode]);

  // NEVER auto-switch mode based on org presence.
  // Mode only changes via explicit user action (ModeSwitch click).

  return (
    <ModeContext.Provider value={{ mode, preferredMode, setMode, toggleMode, hasOrgs, isRouteOverride }}>
      {children}
    </ModeContext.Provider>
  );
}

export const useMode = () => useContext(ModeContext);
