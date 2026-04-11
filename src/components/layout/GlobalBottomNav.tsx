import { useLocation } from 'react-router-dom';
import { BottomNav } from './BottomNav';

/** Routes where the bottom nav should be completely hidden */
const HIDE_NAV_ROUTES = ['/auth', '/reels', '/superadmin'];

/**
 * GlobalBottomNav — Rendered once at App level, visible on ALL pages (mobile only).
 * This ensures the nav bar is always present regardless of which layout a page uses.
 */
export function GlobalBottomNav() {
  const location = useLocation();
  const hidden = HIDE_NAV_ROUTES.some(r => location.pathname.startsWith(r));

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
