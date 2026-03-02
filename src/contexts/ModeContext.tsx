import { createContext, useContext, useState, useEffect, useCallback, ReactNode } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';

export type AppMode = 'ambassador' | 'creator';

interface ModeContextValue {
  mode: AppMode;
  setMode: (m: AppMode) => void;
  toggleMode: () => void;
  hasOrgs: boolean;
}

const ModeContext = createContext<ModeContextValue>({
  mode: 'ambassador',
  setMode: () => {},
  toggleMode: () => {},
  hasOrgs: false,
});

const STORAGE_KEY = 'sv_app_mode';

export function ModeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const { userOrgs } = useOrg();
  const hasOrgs = userOrgs.length > 0;

  const [mode, setModeRaw] = useState<AppMode>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'creator' || stored === 'ambassador') return stored;
    } catch {}
    return 'ambassador';
  });

  const setMode = useCallback((m: AppMode) => {
    setModeRaw(m);
    try { localStorage.setItem(STORAGE_KEY, m); } catch {}
  }, []);

  const toggleMode = useCallback(() => {
    setMode(mode === 'ambassador' ? 'creator' : 'ambassador');
  }, [mode, setMode]);

  // NEVER auto-switch mode based on org presence.
  // Mode only changes via explicit user action (ModeSwitch click).

  return (
    <ModeContext.Provider value={{ mode, setMode, toggleMode, hasOrgs }}>
      {children}
    </ModeContext.Provider>
  );
}

export const useMode = () => useContext(ModeContext);
