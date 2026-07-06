import { useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';

/** Routes where the bottom nav should be completely hidden (prefix match) */
const HIDE_NAV_ROUTES = ['/auth', '/reels', '/superadmin'];
/** Routes where the bottom nav should be hidden (exact match) — e.g. the super-app hub */
const HIDE_NAV_EXACT = ['/'];

/**
 * GlobalBottomNav — Rendered once at App level, visible on ALL pages (mobile only).
 * The nav is hidden on the super-app hub (/) because the hub IS the vertical picker.
 * On /beauty/* it swaps to Beauty items; everywhere else it shows Digital items.
 */
export function GlobalBottomNav() {
  const location = useLocation();
  // Hide inside a beauty conversation thread — the chat composer owns the bottom edge.
  const isBeautyThread = /^\/beauty\/messages\/[^/]+/.test(location.pathname);
  const hidden =
    HIDE_NAV_EXACT.includes(location.pathname) ||
    HIDE_NAV_ROUTES.some(r => location.pathname.startsWith(r)) ||
    isBeautyThread;

  if (hidden) return null;

  return (
    <nav
      className="native-bottom-nav-shell fixed bottom-0 left-0 right-0 z-50 lg:hidden pointer-events-auto"
      aria-label="Navigation mobile"
    >
      <BottomNav />
    </nav>
  );
}
