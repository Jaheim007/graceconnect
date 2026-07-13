import { useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { PersonalBottomNav } from './PersonalBottomNav';
import { useAuth } from '@/contexts/AuthContext';

/** Routes where the bottom nav should be completely hidden (prefix match) */
const HIDE_NAV_ROUTES = ['/auth', '/reels', '/superadmin', '/admin'];
/** Routes where the bottom nav should be hidden (exact match) — e.g. the super-app hub */
const HIDE_NAV_EXACT = ['/'];

/**
 * GlobalBottomNav — Rendered once at App level, visible on ALL customer pages (mobile only).
 *
 * New model (2026-07): every signed-in user gets the account-wide customer
 * bottom nav on customer routes. There is no "Personal vs Business" toggle.
 * Vertical provider surfaces (/beauty, /home, /events, /education, /church)
 * and /admin keep their own navs / no nav.
 */
export function GlobalBottomNav() {
  const location = useLocation();
  const { user } = useAuth();

  // Hide inside a beauty conversation thread — the chat composer owns the bottom edge.
  const isBeautyThread = /^\/beauty\/messages\/[^/]+/.test(location.pathname);
  const hidden =
    HIDE_NAV_EXACT.includes(location.pathname) ||
    HIDE_NAV_ROUTES.some((r) => location.pathname.startsWith(r)) ||
    isBeautyThread;

  if (hidden) return null;

  // Vertical provider/customer surfaces keep their vertical BottomNav.
  const inVerticalSurface = /^\/(beauty|home|events|education|church)\b/.test(location.pathname);

  return (
    <nav
      className="native-bottom-nav-shell fixed bottom-0 left-0 right-0 z-50 lg:hidden pointer-events-auto"
      aria-label="Navigation mobile"
    >
      {user && !inVerticalSurface ? <PersonalBottomNav /> : <BottomNav />}
    </nav>
  );
}
