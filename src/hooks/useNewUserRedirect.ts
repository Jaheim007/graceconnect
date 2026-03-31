import { useEffect, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';

/**
 * Redirects users to /welcome on every fresh login.
 * Uses a per-user key so switching accounts always triggers the welcome.
 */
export function useNewUserRedirect() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const lastCheckedUserId = useRef<string | null>(null);

  useEffect(() => {
    if (!user) {
      lastCheckedUserId.current = null;
      return;
    }

    // Only check once per user per mount cycle
    if (lastCheckedUserId.current === user.id) return;
    lastCheckedUserId.current = user.id;

    // Skip if already on these pages
    const skip = ['/welcome', '/auth', '/auth/callback', '/create-org', '/payment', '/go/', '/reset-password'];
    if (skip.some(p => location.pathname.startsWith(p))) return;

    // Per-user session key — switching accounts = new key = welcome shown again
    const seenKey = `sv_welcome_seen_${user.id}`;
    const seen = sessionStorage.getItem(seenKey);
    if (seen === 'true') return;

    navigate('/welcome', { replace: true });
  }, [user, navigate, location.pathname]);
}
