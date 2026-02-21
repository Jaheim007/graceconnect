import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, Play, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadCount } from '@/hooks/useNotifications';

const navItems = [
  { to: '/feed', icon: Home, label: 'Accueil' },
  { to: '/discover', icon: Compass, label: 'Explorer' },
  { to: '/reels', icon: Play, label: 'Reels' },
  { to: '/notifications', icon: Bell, label: 'Alertes' },
  { to: '/profile', icon: User, label: 'Compte' },
];

export function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { data: unread = 0 } = useUnreadCount(user?.id);

  return (
    <nav className="glass border-t border-border/60 px-2 py-1 safe-area-pb">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const isActive = location.pathname === to ||
            (to === '/feed' && location.pathname === '/');
          const showBadge = label === 'Alertes' && unread > 0;

          return (
            <Link
              key={to}
              to={user ? to : '/auth'}
              className={cn(
                'flex flex-col items-center gap-0.5 px-3 py-2 rounded-xl transition-all duration-200 relative',
                isActive
                  ? 'text-primary'
                  : 'text-muted-foreground hover:text-foreground'
              )}
            >
              <div className={cn(
                'p-1.5 rounded-xl transition-all duration-200',
                isActive && 'bg-primary/10'
              )}>
                <Icon className={cn('h-5 w-5', isActive && 'stroke-[2.5px]')} />
                {showBadge && (
                  <span className="absolute top-1 right-2 h-2 w-2 rounded-full bg-destructive" />
                )}
              </div>
              <span className={cn(
                'text-[10px] font-medium',
                isActive ? 'text-primary' : 'text-muted-foreground'
              )}>
                {label}
              </span>
              {isActive && (
                <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 h-0.5 w-4 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
