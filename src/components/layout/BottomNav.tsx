import { Link, useLocation } from 'react-router-dom';
import { Home, Store, Link2, User, MoreHorizontal, Bell, Trophy, Building2, BarChart3, Settings, Wallet, LifeBuoy, Package, LogIn, UserPlus, Heart, PenLine, Shield } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useUnreadCount } from '@/hooks/useNotifications';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { currentOrg, canManage } = useOrg();
  const { data: unread = 0 } = useUnreadCount(user?.id);
  const [open, setOpen] = useState(false);
  const canManageCurrentOrg = currentOrg ? canManage(currentOrg.id) : false;

  const guestItems = [
    { to: '/', icon: Home, label: 'Accueil' },
    { to: '/discover', icon: Store, label: 'Explorer' },
    { to: '/ecrire', icon: PenLine, label: 'Écrire', accent: true },
    { to: '/gagner', icon: Wallet, label: 'Gagner' },
    { to: '/auth?mode=signup', icon: UserPlus, label: "S'inscrire" },
  ];

  // Unified primary nav — "Écrire" always prominent, "Gagner" always visible
  const primaryItems = [
    { to: '/dashboard', icon: Home, label: 'Accueil' },
    { to: '/discover', icon: Store, label: 'Découvrir' },
    { to: '/ecrire', icon: PenLine, label: 'Écrire', accent: true },
    { to: '/gagner', icon: Wallet, label: 'Gagner' },
  ];

  // More menu items
  const moreGroups = [
    {
      label: '📚 Mes ressources',
      items: [
        { to: '/resources', icon: Package, label: 'Mes achats' },
        { to: '/my-donations', icon: Heart, label: 'Mes dons' },
        { to: '/affiliation', icon: Link2, label: 'Mes liens' },
        { to: '/notifications', icon: Bell, label: 'Notifications', showBadge: true },
      ],
    },
    ...(canManageCurrentOrg ? [{
      label: '🏗️ Mon espace',
      items: [
        { to: '/admin', icon: BarChart3, label: 'Vue d\'ensemble' },
        { to: '/admin/products', icon: Store, label: 'Produits' },
        { to: '/admin/sales', icon: Wallet, label: 'Ventes' },
        { to: '/admin/settings', icon: Settings, label: 'Paramètres' },
      ],
    }] : []),
    {
      label: '⚙️ Compte & aide',
      items: [
        { to: '/profile', icon: User, label: 'Profil' },
        { to: '/protection', icon: Shield, label: 'Protection' },
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
        {navItems.map(({ to, icon: Icon, label, ...rest }) => {
          const active = to === '/'
            ? location.pathname === '/'
            : location.pathname.startsWith(to.split('?')[0]);
          const isAccent = 'accent' in rest && (rest as any).accent;

          return (
            <Link
              key={to}
              to={to}
              aria-current={active ? 'page' : undefined}
              aria-label={label}
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[48px] min-w-[48px] transition-colors relative',
                isAccent ? 'text-primary' : active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              {isAccent ? (
                <div className="h-9 w-9 -mt-4 rounded-full bg-primary flex items-center justify-center shadow-lg shadow-primary/30">
                  <Icon className="h-5 w-5 text-primary-foreground" />
                </div>
              ) : (
                <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
              )}
              <span className={cn('text-[10px] font-medium leading-none', isAccent && 'font-bold text-primary')}>{label}</span>
              {active && !isAccent && <div className="absolute -bottom-0.5 w-6 h-0.5 rounded-full bg-primary" />}
            </Link>
          );
        })}

        {/* More button */}
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
                {unread > 0 && (
                  <Badge variant="destructive" className="absolute -top-0.5 right-1/4 h-4 min-w-4 px-1 text-[9px] flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </Badge>
                )}
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
