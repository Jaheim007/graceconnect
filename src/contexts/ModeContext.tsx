import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';

export type AppMode = 'public' | 'ambassador' | 'creator';

/** Routes that force public mode regardless of user preference */
const PUBLIC_ROUTE_PREFIXES = [
  '/org/',
  '/campaign/',
  '/offering/',
  '/announcement/',
  '/event/',
  '/program/',
  '/go/',
  '/marketplace',
];

interface ModeContextValue {
  mode: AppMode;
  /** The persisted user preference (ambassador or creator), ignoring route overrides */
  preferredMode: AppMode;
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

  const [preferredMode, setPreferredRaw] = useState<AppMode>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'creator' || stored === 'ambassador') return stored;
    } catch {}
    return 'ambassador';
  });

  const [routeOverride, setRouteOverride] = useState<AppMode | null>(null);

  // Listen to pathname changes to detect public routes
  useEffect(() => {
    const checkRoute = () => {
      const path = window.location.pathname;
      const isPublicRoute = PUBLIC_ROUTE_PREFIXES.some(prefix => path.startsWith(prefix));
      setRouteOverride(isPublicRoute ? 'public' : null);
    };

    checkRoute();

    // Listen for popstate (back/forward) and custom navigation events
    window.addEventListener('popstate', checkRoute);

    // MutationObserver-based approach: watch for URL changes via pushState
    const origPushState = history.pushState;
    const origReplaceState = history.replaceState;
    history.pushState = function (...args) {
      origPushState.apply(this, args);
      checkRoute();
    };
    history.replaceState = function (...args) {
      origReplaceState.apply(this, args);
      checkRoute();
    };

    return () => {
      window.removeEventListener('popstate', checkRoute);
      history.pushState = origPushState;
      history.replaceState = origReplaceState;
    };
  }, []);

  const setMode = useCallback((m: AppMode) => {
    if (m === 'public') return; // public is route-driven only
    setPreferredRaw(m);
    try { localStorage.setItem(STORAGE_KEY, m); } catch {}
  }, []);

  const toggleMode = useCallback(() => {
    setMode(preferredMode === 'ambassador' ? 'creator' : 'ambassador');
  }, [preferredMode, setMode]);

  // Effective mode: route override wins
  const mode = routeOverride ?? preferredMode;

  // NEVER auto-switch mode based on org presence.
  // Mode only changes via explicit user action (ModeSwitch click).

  return (
    <ModeContext.Provider value={{ mode, preferredMode, setMode, toggleMode, hasOrgs, isRouteOverride: !!routeOverride }}>
      {children}
    </ModeContext.Provider>
  );
}

export const useMode = () => useContext(ModeContext);
