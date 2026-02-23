import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadCount } from '@/hooks/useNotifications';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n/I18nContext';

const navItems = [
  { to: '/feed', icon: Home, labelKey: 'nav.feed' },
  { to: '/discover', icon: Compass, labelKey: 'nav.discover' },
  { to: '/notifications', icon: Bell, labelKey: 'nav.notifications' },
  { to: '/profile', icon: User, labelKey: 'nav.profile' },
];

export function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { data: unread = 0 } = useUnreadCount(user?.id);
  const { t } = useI18n();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm lg:hidden">
      <div className="flex items-center justify-around h-14 px-1 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, labelKey }) => {
          const label = t(labelKey);
          const active = to === '/feed'
            ? location.pathname === '/feed'
            : location.pathname.startsWith(to);

          return (
            <Link
              key={to}
              to={user ? to : (to === '/discover' ? to : '/auth')}
              data-tour={`nav-${to.replace('/', '')}`}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[48px] transition-colors relative',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
                {labelKey === 'nav.notifications' && unread > 0 && (
                  <Badge variant="destructive" className="absolute -top-1.5 -right-2.5 h-4 min-w-4 px-1 text-[9px] flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] font-medium leading-none">{label}</span>
              {active && (
                <div className="absolute -bottom-0.5 w-6 h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
