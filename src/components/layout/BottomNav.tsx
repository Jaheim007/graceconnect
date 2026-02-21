import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, LayoutDashboard, Bell, User } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadCount } from '@/hooks/useNotifications';
import { Badge } from '@/components/ui/badge';

const navItems = [
  { to: '/feed', icon: Home, label: 'Accueil' },
  { to: '/discover', icon: Compass, label: 'Explorer' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
  { to: '/notifications', icon: Bell, label: 'Alertes' },
  { to: '/profile', icon: User, label: 'Compte' },
];

export function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { data: unread = 0 } = useUnreadCount(user?.id);

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-background/95 backdrop-blur-sm lg:hidden">
      <div className="flex items-center justify-around h-14 px-1 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = to === '/feed'
            ? location.pathname === '/feed'
            : location.pathname.startsWith(to);

          return (
            <Link
              key={to}
              to={user ? to : (to === '/discover' ? to : '/auth')}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-1.5 transition-colors relative',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
                {label === 'Alertes' && unread > 0 && (
                  <Badge variant="destructive" className="absolute -top-1.5 -right-2.5 h-4 min-w-4 px-1 text-[9px] flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </Badge>
                )}
              </div>
              <span className="text-[10px] font-medium leading-none">{label}</span>
              {active && (
                <div className="absolute -bottom-1.5 w-6 h-0.5 rounded-full bg-primary" />
              )}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
