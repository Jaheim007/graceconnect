import { Link, useLocation } from 'react-router-dom';
import { Home, LogIn, UserPlus, Store, MoreHorizontal, User, Link2, BookOpen, LifeBuoy, Handshake, Trophy, LayoutDashboard, Bell, CreditCard, BarChart3, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadCount } from '@/hooks/useNotifications';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { data: unread = 0 } = useUnreadCount(user?.id);
  const [open, setOpen] = useState(false);

  const guestItems = [
    { to: '/', icon: Home, label: 'Accueil' },
    { to: '/marketplace', icon: Store, label: 'Marketplace' },
    { to: '/auth?mode=signin', icon: LogIn, label: 'Connexion' },
    { to: '/auth?mode=signup', icon: UserPlus, label: 'S\'inscrire' },
  ];

  // Simplified: 4 primary items for authenticated users
  const primaryItems = [
    { to: '/marketplace', icon: Store, label: 'Marketplace' },
    { to: '/affiliation', icon: Link2, label: 'Gagner' },
    { to: '/resources', icon: BookOpen, label: 'Mes achats' },
    { to: '/profile', icon: User, label: 'Profil' },
  ];

  // "Plus" / Advanced items
  const moreGroups = [
    {
      label: '📊 Mon activité',
      items: [
        { to: '/dashboard', icon: LayoutDashboard, label: 'Tableau de bord' },
        { to: '/notifications', icon: Bell, label: 'Notifications', showBadge: true },
        { to: '/my-programs', icon: GraduationCap, label: 'Mes programmes' },
        { to: '/invoices', icon: CreditCard, label: 'Mes factures' },
      ],
    },
    {
      label: '💰 Avancé',
      items: [
        { to: '/leaderboard', icon: Trophy, label: 'Classement' },
        { to: '/my-analytics', icon: BarChart3, label: 'Mes stats' },
        { to: '/partner', icon: Handshake, label: 'Partenaire' },
      ],
    },
    {
      label: '⚙️ Autre',
      items: [
        { to: '/support', icon: LifeBuoy, label: 'Aide' },
      ],
    },
  ];

  const allMoreItems = moreGroups.flatMap(g => g.items);
  const navItems = user ? primaryItems : guestItems;
  const isMoreActive = allMoreItems.some(item => location.pathname.startsWith(item.to.split('?')[0]));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm lg:hidden">
      <div className="flex items-center justify-around h-14 px-1 max-w-lg mx-auto">
        {navItems.map(({ to, icon: Icon, label }) => {
          const active = to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to.split('?')[0]);

          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? 'page' : undefined}
              aria-label={label}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[48px] min-w-[48px] transition-colors relative',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
                {to === '/affiliation' && false /* no badge needed here */}
              </div>
              <span className="text-[10px] font-medium leading-none">{label}</span>
              {active && <div className="absolute -bottom-0.5 w-6 h-0.5 rounded-full bg-primary" />}
            </Link>
          );
        })}

        {/* More button for authenticated users */}
        {user && (
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <button
                className={cn(
                  'flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[48px] transition-colors relative',
                  isMoreActive ? 'text-primary' : 'text-muted-foreground'
                )}
              >
                <MoreHorizontal className={cn('h-5 w-5', isMoreActive && 'stroke-[2.5]')} />
                <span className="text-[10px] font-medium leading-none">Plus</span>
                {isMoreActive && <div className="absolute -bottom-0.5 w-6 h-0.5 rounded-full bg-primary" />}
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl pb-8">
              <SheetHeader>
                <SheetTitle className="text-sm">Menu</SheetTitle>
              </SheetHeader>
              <div className="mt-4 space-y-5">
                {moreGroups.map((group) => (
                  <div key={group.label}>
                    <p className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider mb-2 px-1">{group.label}</p>
                    <div className="grid grid-cols-3 gap-2">
                      {group.items.map(({ to, icon: Icon, label, ...rest }) => {
                        const active = location.pathname.startsWith(to);
                        const showBadge = 'showBadge' in rest && (rest as any).showBadge;
                        return (
                          <Link
                            key={to}
                            to={to}
                            onClick={() => setOpen(false)}
                            className={cn(
                              'flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors text-center relative',
                              active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                            )}
                          >
                            <div className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center relative">
                              <Icon className="h-5 w-5" />
                              {showBadge && unread > 0 && (
                                <Badge variant="destructive" className="absolute -top-1 -right-1 h-4 min-w-4 px-1 text-[9px] flex items-center justify-center">
                                  {unread > 9 ? '9+' : unread}
                                </Badge>
                              )}
                            </div>
                            <span className="text-[11px] font-medium leading-tight">{label}</span>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </nav>
  );
}
