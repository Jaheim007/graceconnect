import { createContext, useContext, useState, useEffect, ReactNode, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type UserMode = 'purchases' | 'sell' | 'earn' | 'create';

export const MODE_LABELS: Record<UserMode, { fr: string; en: string; emoji: string }> = {
  purchases: { fr: 'Mes Achats', en: 'My Purchases', emoji: '📦' },
  sell: { fr: 'Vendre', en: 'Sell', emoji: '🛒' },
  earn: { fr: 'Gagner', en: 'Earn', emoji: '🔗' },
  create: { fr: 'Créer avec l\'IA', en: 'Create with AI', emoji: '✨' },
};

interface UserModeContextType {
  mode: UserMode | null;
  setMode: (mode: UserMode) => void;
  hasChosenMode: boolean;
}

const UserModeContext = createContext<UserModeContextType>({
  mode: null,
  setMode: () => {},
  hasChosenMode: false,
});

const STORAGE_KEY = 'sv_user_mode';

export function UserModeProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [mode, setModeState] = useState<UserMode | null>(() => {
    if (typeof window === 'undefined') return null;
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored && ['purchases', 'sell', 'earn', 'create'].includes(stored)) {
      return stored as UserMode;
    }
    return null;
  });

  const setMode = useCallback((newMode: UserMode) => {
    setModeState(newMode);
    localStorage.setItem(STORAGE_KEY, newMode);
  }, []);

  // Reset mode on logout
  useEffect(() => {
    if (!user) {
      setModeState(null);
      localStorage.removeItem(STORAGE_KEY);
    }
  }, [user]);

  return (
    <UserModeContext.Provider value={{ mode, setMode, hasChosenMode: mode !== null }}>
      {children}
    </UserModeContext.Provider>
  );
}

export function useUserMode() {
  return useContext(UserModeContext);
}
