import { useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { PersonalBottomNav } from './PersonalBottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';

/** Routes where the bottom nav should be completely hidden (prefix match) */
const HIDE_NAV_ROUTES = ['/auth', '/reels', '/superadmin'];
/** Routes where the bottom nav should be hidden (exact match) — e.g. the super-app hub */
const HIDE_NAV_EXACT = ['/'];

/**
 * GlobalBottomNav — Rendered once at App level, visible on ALL pages (mobile only).
 * When a signed-in user is in Personal mode (currentOrg === null), we swap to
 * the 5-item customer navigation (Home / Explore / Activity / Earn / Profile).
 * In a workspace or vertical section, the legacy feature-driven BottomNav renders.
 */
export function GlobalBottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { currentOrg } = useOrg();

  // Hide inside a beauty conversation thread — the chat composer owns the bottom edge.
  const isBeautyThread = /^\/beauty\/messages\/[^/]+/.test(location.pathname);
  const hidden =
    HIDE_NAV_EXACT.includes(location.pathname) ||
    HIDE_NAV_ROUTES.some((r) => location.pathname.startsWith(r)) ||
    isBeautyThread;

  if (hidden) return null;

  // Personal customer shell — only when signed in, in Personal mode, and not
  // inside a vertical provider surface (those keep their own nav).
  const inVerticalSurface = /^\/(beauty|home|events|education|church)\b/.test(location.pathname);
  const showPersonal = !!user && !currentOrg && !inVerticalSurface;

  return (
    <nav
      className="native-bottom-nav-shell fixed bottom-0 left-0 right-0 z-50 lg:hidden pointer-events-auto"
      aria-label="Navigation mobile"
    >
      {showPersonal ? <PersonalBottomNav /> : <BottomNav />}
    </nav>
  );
}
