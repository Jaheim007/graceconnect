import { useLocation, useNavigate } from 'react-router-dom';
import { BottomNav } from './BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { LayoutDashboard, Compass, Package, MessageSquare, Menu as MenuIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { Sheet, SheetContent } from '@/components/ui/sheet';
import { Sidebar } from './Sidebar';

/** Hide bottom nav (prefix match) */
const HIDE_NAV_ROUTES = ['/auth', '/reels', '/superadmin'];
/** Hide bottom nav (exact match) */
const HIDE_NAV_EXACT = ['/'];

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
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [menuOpen, setMenuOpen] = useState(false);

  const isBeautyThread = /^\/beauty\/messages\/[^/]+/.test(location.pathname);
  const hidden =
    HIDE_NAV_EXACT.includes(location.pathname) ||
    HIDE_NAV_ROUTES.some((r) => location.pathname.startsWith(r)) ||
    isBeautyThread;

  if (hidden) return null;

  const inVerticalSurface = /^\/(beauty|home|events|education|church)\b/.test(location.pathname);

  // Guest or vertical surface → keep legacy generic bottom nav
  if (!user || inVerticalSurface) {
    return (
      <nav
        className="native-bottom-nav-shell fixed bottom-0 left-0 right-0 z-50 lg:hidden pointer-events-auto"
        aria-label="Navigation mobile"
      >
        <BottomNav />
      </nav>
    );
  }

  const items = [
    { id: 'overview', route: '/dashboard', icon: LayoutDashboard, fr: 'Accueil',  en: 'Home' },
    { id: 'explore',  route: '/dashboard/explore', icon: Compass, fr: 'Explorer', en: 'Explore' },
    { id: 'purchases', route: '/my-purchases', icon: Package,     fr: 'Achats',   en: 'Purchases' },
    { id: 'messages', route: '/dashboard/messages', icon: MessageSquare, fr: 'Messages', en: 'Messages' },
  ] as const;

  const isActive = (route: string) => {
    if (route === '/dashboard') return location.pathname === '/dashboard' || location.pathname === '/dashboard/home';
    return location.pathname === route || location.pathname.startsWith(route + '/');
  };

  return (
    <>
      <nav
        className="native-bottom-nav-shell fixed bottom-0 left-0 right-0 z-50 lg:hidden pointer-events-auto"
        aria-label="Navigation mobile"
      >
        <div className="native-bottom-nav pointer-events-auto">
          <div className="rounded-2xl border border-border/60 bg-background/80 backdrop-blur-2xl shadow-[0_10px_40px_-12px_rgba(0,0,0,0.35)] supports-[backdrop-filter]:bg-background/60">
            <div className="flex items-stretch px-1.5 pt-1.5 pb-2">
              {items.map((item) => {
                const active = isActive(item.route);
                const Icon = item.icon;
                return (
                  <button
                    key={item.id}
                    onClick={() => navigate(item.route)}
                    aria-current={active ? 'page' : undefined}
                    aria-label={isFr ? item.fr : item.en}
                    className={cn(
                      'relative flex-1 flex flex-col items-center gap-1 rounded-xl px-1 pt-2 pb-1.5 transition-all duration-200 active:scale-[0.94]',
                      active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground',
                    )}
                  >
                    <span className={cn(
                      'absolute top-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full transition-all duration-300',
                      active ? 'w-6 bg-primary' : 'w-0 bg-transparent',
                    )} />
                    <div className={cn(
                      'flex h-8 w-8 items-center justify-center rounded-xl transition-all',
                      active ? 'bg-primary/10 scale-105' : 'bg-transparent',
                    )}>
                      <Icon className={cn('h-4 w-4', active ? 'text-primary' : 'text-current')} />
                    </div>
                    <span className={cn('text-[10px] leading-none tracking-wide', active ? 'font-semibold' : 'font-medium')}>
                      {isFr ? item.fr : item.en}
                    </span>
                  </button>
                );
              })}
              <button
                onClick={() => setMenuOpen(true)}
                aria-label={isFr ? 'Menu' : 'Menu'}
                className="relative flex-1 flex flex-col items-center gap-1 rounded-xl px-1 pt-2 pb-1.5 transition-all duration-200 active:scale-[0.94] text-muted-foreground hover:text-foreground"
              >
                <div className="flex h-8 w-8 items-center justify-center rounded-xl">
                  <MenuIcon className="h-4 w-4" />
                </div>
                <span className="text-[10px] leading-none tracking-wide font-medium">
                  {isFr ? 'Menu' : 'Menu'}
                </span>
              </button>
            </div>
          </div>
        </div>
      </nav>

      <Sheet open={menuOpen} onOpenChange={setMenuOpen}>
        <SheetContent side="left" className="p-0 w-[280px] max-w-[85vw]">
          <div onClick={() => setMenuOpen(false)}>
            <Sidebar />
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
