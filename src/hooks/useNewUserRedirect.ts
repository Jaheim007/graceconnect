import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserMode } from '@/contexts/UserModeContext';

/**
 * Redirects users without a selected mode to /welcome for mode selection.
 * Skips certain routes (auth, welcome, public pages, admin).
 */
export function useNewUserRedirect() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasChosenMode } = useUserMode();
  const checked = useRef(false);

  useEffect(() => {
    if (!user || checked.current) return;
    checked.current = true;

    // Skip if already on these pages
    const skip = ['/welcome', '/auth', '/create-org', '/admin', '/superadmin', '/payment', '/go/', '/org/'];
    if (skip.some(p => location.pathname.startsWith(p))) return;

    // If no mode chosen, redirect to mode selection
    if (!hasChosenMode) {
      navigate('/welcome', { replace: true });
    }
  }, [user, navigate, location.pathname, hasChosenMode]);
}
