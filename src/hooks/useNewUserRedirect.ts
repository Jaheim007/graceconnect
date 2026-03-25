import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Redirects users to /welcome on login unless they've already dismissed it this session.
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

    // If user already saw welcome this session, don't redirect again
    const seen = sessionStorage.getItem('sv_welcome_seen');
    if (seen === 'true') return;

    navigate('/welcome', { replace: true });
  }, [user, navigate, location.pathname]);
}
