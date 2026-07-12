import { useLocation, useNavigate } from 'react-router-dom';
import { Home, Compass, ListChecks, Gift, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

/**
 * PersonalBottomNav — the 5-item customer navigation shown when the user is
 * in Personal mode (currentOrg === null). Messages & Notifications live in
 * the top header, not here.
 */
export function PersonalBottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const items = [
    { id: 'home',     route: '/dashboard/home',     icon: Home,       fr: 'Accueil',  en: 'Home' },
    { id: 'explore',  route: '/dashboard/explore',  icon: Compass,    fr: 'Explorer', en: 'Explore' },
    { id: 'activity', route: '/dashboard/activity', icon: ListChecks, fr: 'Activité', en: 'Activity' },
    { id: 'earn',     route: '/dashboard/earn',     icon: Gift,       fr: 'Gagner',   en: 'Earn' },
    { id: 'profile',  route: '/dashboard/profile',  icon: User,       fr: 'Profil',   en: 'Profile' },
  ] as const;

  const isActive = (route: string) => {
    if (route === '/dashboard/home') {
      return location.pathname === '/dashboard' || location.pathname === '/dashboard/home';
    }
    return location.pathname.startsWith(route);
  };

  return (
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
                  'relative flex-1 flex flex-col items-center gap-1 rounded-xl px-1 pt-2 pb-1.5 transition-all duration-200',
                  'active:scale-[0.94] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40',
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <span
                  className={cn(
                    'absolute top-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full transition-all duration-300',
                    active ? 'w-6 bg-primary' : 'w-0 bg-transparent'
                  )}
                />
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-xl transition-all',
                    active ? 'bg-primary/10 scale-105' : 'bg-transparent'
                  )}
                >
                  <Icon className={cn('h-4 w-4', active ? 'text-primary' : 'text-current')} />
                </div>
                <span className={cn('text-[10px] leading-none tracking-wide', active ? 'font-semibold' : 'font-medium')}>
                  {isFr ? item.fr : item.en}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
