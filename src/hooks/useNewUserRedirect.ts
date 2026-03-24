import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useUserMode } from '@/contexts/UserModeContext';

/**
 * Redirects users without a selected mode to /welcome for mode selection.
 * Also handles initial landing redirect based on mode (e.g. purchases → /resources).
 */
export function useNewUserRedirect() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { hasChosenMode, mode } = useUserMode();
  const checked = useRef(false);

  useEffect(() => {
    if (!user || checked.current) return;
    checked.current = true;

    // Skip if already on these pages
    const skip = ['/welcome', '/auth', '/create-org', '/admin', '/superadmin', '/payment', '/go/', '/org/', '/resources', '/my-programs', '/discover', '/profile', '/bookmarks', '/affiliation', '/spotlight', '/feed', '/credits'];
    if (skip.some(p => location.pathname.startsWith(p))) return;

    // If no mode chosen, redirect to mode selection
    if (!hasChosenMode) {
      navigate('/welcome', { replace: true });
      return;
    }

    // If landing on /dashboard with purchases mode, redirect to /resources
    if (mode === 'purchases' && location.pathname === '/dashboard') {
      navigate('/resources', { replace: true });
    }
  }, [user, navigate, location.pathname, hasChosenMode, mode]);
}
