import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Redirects brand-new users (first visit) to /welcome for onboarding.
 * No mode logic — just checks if they've seen the welcome page.
 */
export function useNewUserRedirect() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const checked = useRef(false);

  useEffect(() => {
    if (!user || checked.current) return;
    checked.current = true;

    // Skip if already on these pages
    const skip = ['/welcome', '/auth', '/create-org', '/admin', '/superadmin', '/payment', '/go/', '/org/', '/resources', '/my-programs', '/discover', '/profile', '/bookmarks', '/affiliation', '/spotlight', '/feed', '/credits'];
    if (skip.some(p => location.pathname.startsWith(p))) return;

    // Check if user has visited before
    const hasVisited = localStorage.getItem('sv_has_visited');
    if (!hasVisited) {
      localStorage.setItem('sv_has_visited', 'true');
      navigate('/welcome', { replace: true });
    }
  }, [user, navigate, location.pathname]);
}
