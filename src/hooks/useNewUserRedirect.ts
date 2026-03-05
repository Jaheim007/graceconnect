import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Detects first-time signups and redirects to /welcome for intent selection.
 * Uses sessionStorage to avoid re-triggering on page refresh.
 */
export function useNewUserRedirect() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const checked = useRef(false);

  useEffect(() => {
    if (!user || checked.current) return;
    checked.current = true;

    // Skip if already on welcome, auth, or callback pages
    const skip = ['/welcome', '/auth', '/create-org', '/admin'];
    if (skip.some(p => location.pathname.startsWith(p))) return;

    // Check if this is a brand-new user (created within last 2 minutes)
    const createdAt = new Date(user.created_at).getTime();
    const isNewUser = Date.now() - createdAt < 120_000;

    // Check sessionStorage flag to avoid re-triggering
    const alreadyShown = sessionStorage.getItem('sv_welcome_shown');
    
    // Check if user has an intent stored (from invite/landing pages)
    const storedIntent = sessionStorage.getItem('sv_auth_intent');

    if (isNewUser && !alreadyShown && !storedIntent) {
      sessionStorage.setItem('sv_welcome_shown', '1');
      navigate('/welcome', { replace: true });
    }
  }, [user, navigate, location.pathname]);
}
