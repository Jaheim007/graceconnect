import { useLocation, useNavigate } from '@/lib/router-compat';
import { BottomNav } from './BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { MessageSquare, Menu as MenuIcon, LogIn } from 'lucide-react';
import {
  SvHome, SvHomeSolid, SvExplore, SvExploreSolid, SvLibrary, SvLibrarySolid,
  SvEarn, SvEarnSolid,
} from '@/components/icons/nav-icons';
import { showServiceSurfaces } from '@/lib/siteviral/visibility';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { MobileMenuDrawer } from './MobileMenuDrawer';
import { useNavAutoHide } from '@/hooks/useNavAutoHide';

/** Hide bottom nav (prefix match) — only fully immersive surfaces */
const HIDE_NAV_ROUTES = ['/auth', '/reels'];
/** Hide bottom nav (exact match) */
const HIDE_NAV_EXACT: string[] = [];


/**
 * GlobalBottomNav — one unified compact bottom nav for signed-in customer/admin
 * routes on mobile. Consistent with the desktop Sidebar IA — no separate
 * Personal nav. A "Menu" button opens the full Sidebar drawer.
 *
 * Vertical provider surfaces (/beauty, /home, /events, /education, /church)
 * keep their vertical BottomNav.
 */
export function GlobalBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { workspaceReady: _workspaceReady } = useOrg();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [menuOpen, setMenuOpen] = useState(false);
  const navScrolling = useNavAutoHide();

  const isBeautyThread = /^\/beauty\/messages\/[^/]+/.test(location.pathname);
  const hidden =
    HIDE_NAV_EXACT.includes(location.pathname) ||
    HIDE_NAV_ROUTES.some((r) => location.pathname.startsWith(r)) ||
    isBeautyThread;

  // Never unmount the rail on workspace hydration — it must feel permanent.
  if (hidden) return null;

  const inVerticalSurface = /^\/(beauty|home|events|education|church)\b/.test(location.pathname);

  // Vertical provider surfaces keep their own vertical BottomNav.
  if (inVerticalSurface) {
    return (
      <nav
        className="native-bottom-nav-shell fixed bottom-0 left-0 right-0 z-40 lg:hidden pointer-events-auto"

        aria-label="Navigation mobile"
      >
        <BottomNav />
      </nav>
    );
  }

  const items = user
    ? ([
        { id: 'overview', route: '/dashboard', icon: SvHome, activeIcon: SvHomeSolid, fr: 'Accueil', en: 'Home' },
        { id: 'explore', route: '/dashboard/explore', icon: SvExplore, activeIcon: SvExploreSolid, fr: 'Explorer', en: 'Explore' },
        { id: 'purchases', route: '/my-purchases', icon: SvLibrary, activeIcon: SvLibrarySolid, fr: 'Biblio', en: 'Library' },
        showServiceSurfaces()
          ? { id: 'messages', route: '/dashboard/messages', icon: MessageSquare, activeIcon: MessageSquare, fr: 'Messages', en: 'Messages' }
          : { id: 'earn', route: '/gagner', icon: SvEarn, activeIcon: SvEarnSolid, fr: 'Gagner', en: 'Earn' },
      ] as const)
    : ([
        { id: 'overview', route: '/', icon: SvHome, activeIcon: SvHomeSolid, fr: 'Accueil', en: 'Home' },
        { id: 'explore', route: '/discover', icon: SvExplore, activeIcon: SvExploreSolid, fr: 'Explorer', en: 'Explore' },
        { id: 'purchases', route: '/my-purchases', icon: SvLibrary, activeIcon: SvLibrarySolid, fr: 'Biblio', en: 'Library' },
        { id: 'earn', route: '/gagner', icon: SvEarn, activeIcon: SvEarnSolid, fr: 'Gagner', en: 'Earn' },
      ] as const);

  /** Guests can browse Home/Explore/Earn; Purchases requires an account. */
  const go = (route: string) => {
    if (!user && route === '/my-purchases') {
      try { sessionStorage.setItem('sv_auth_returnTo', route); } catch {}
      navigate(`/auth?returnTo=${encodeURIComponent(route)}`);
      return;
    }
    navigate(route);
  };




  const isActive = (route: string) => {
    if (route === '/') return location.pathname === '/';
    if (route === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/dashboard/home';
    return location.pathname === route || location.pathname.startsWith(route + '/');
  };


  return (
    <>
      <nav
        className="native-bottom-nav-shell fixed bottom-0 left-0 right-0 z-40 lg:hidden pointer-events-auto"
        aria-label="Navigation mobile"
      >
        <div className="native-bottom-nav pointer-events-auto px-4 pb-2">
          <div
            className={cn(
              'mx-auto flex w-fit max-w-full items-center gap-1 rounded-full border border-border/50 px-2 py-2',
              'bg-background/70 backdrop-blur-2xl shadow-[0_12px_40px_-12px_rgba(0,0,0,0.45)]',
              'supports-[backdrop-filter]:bg-background/55',
              'transition-all duration-300 ease-out will-change-transform origin-bottom',
              navScrolling
                ? 'scale-[0.86] opacity-80'
                : 'scale-100 opacity-100',

            )}
          >
            {items.map((item) => {
              const active = isActive(item.route);
              const Icon = active ? item.activeIcon : item.icon;
              return (
                <button
                  key={item.id}
                  data-tour={`bottomnav-${item.id}`}
                  onClick={() => go(item.route)}
                  aria-current={active ? 'page' : undefined}
                  aria-label={isFr ? item.fr : item.en}
                  className={cn(
                    'grid h-11 w-14 place-items-center rounded-full transition-all duration-200 active:scale-90',
                    active
                      ? 'bg-foreground/10 text-foreground'
                      : 'text-muted-foreground hover:text-foreground',
                  )}
                >
                  <Icon
                    className={cn('h-6 w-6 transition-transform', active && 'scale-110')}
                    strokeWidth={2}
                  />
                </button>
              );
            })}
            <button
              data-tour="bottomnav-menu"
              onClick={() => {
                if (!user) {
                  try { sessionStorage.setItem('sv_auth_returnTo', location.pathname); } catch {}
                  navigate(`/auth?returnTo=${encodeURIComponent(location.pathname)}`);
                  return;
                }
                setMenuOpen(true);
              }}
              aria-label={user ? 'Menu' : isFr ? 'Se connecter' : 'Sign in'}
              className="grid h-11 w-14 place-items-center rounded-full text-muted-foreground transition-all duration-200 hover:text-foreground active:scale-90"
            >
              {user ? <MenuIcon className="h-6 w-6" strokeWidth={1.9} /> : <LogIn className="h-6 w-6" strokeWidth={1.9} />}
            </button>
          </div>
        </div>
      </nav>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="right" className="p-0 w-[86vw] max-w-[380px] border-l border-border/60 [&>button:last-child]:hidden">
          <MobileMenuDrawer onClose={() => setMenuOpen(false)} />
        </SheetContent>
      </Sheet>
    </>
  );
}
