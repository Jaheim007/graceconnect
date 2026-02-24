import { Link, useLocation } from 'react-router-dom';
import { Home, LogIn, UserPlus, LayoutDashboard, Building2, Bell, User, Store, MoreHorizontal, MessageCircle, Trophy, Award, Link2, BookOpen, LifeBuoy } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useUnreadCount } from '@/hooks/useNotifications';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n/I18nContext';
import { useState } from 'react';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';

export function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { data: unread = 0 } = useUnreadCount(user?.id);
  const { t } = useI18n();
  const [open, setOpen] = useState(false);

  const guestItems = [
    { to: '/', icon: Home, label: t('bottom.home') },
    { to: '/auth?mode=signin', icon: LogIn, label: t('bottom.sign_in') },
    { to: '/auth?mode=signup', icon: UserPlus, label: t('bottom.get_started') },
  ];

  // Primary 4 items shown in bottom bar
  const primaryItems = [
    { to: '/feed', icon: Home, label: t('sidebar.my_network') },
    { to: '/marketplace', icon: Store, label: t('sidebar.explorer') },
    // { to: '/messages', icon: MessageCircle, label: t('sidebar.messages') }, // DISABLED
    { to: '/notifications', icon: Bell, label: t('bottom.alerts') },
  ];

  // Items shown in "More" sheet
  const moreItems = [
    { to: '/dashboard', icon: LayoutDashboard, label: t('sidebar.dashboard'), desc: t('sidebar.desc.dashboard') },
    { to: '/leaderboard', icon: Trophy, label: t('sidebar.leaderboard'), desc: t('sidebar.desc.leaderboard') },
    // { to: '/certificates', icon: Award, label: t('sidebar.certificates'), desc: t('sidebar.desc.certificates') }, // DISABLED
    { to: '/affiliation', icon: Link2, label: t('sidebar.affiliation'), desc: t('sidebar.desc.affiliation') },
    { to: '/resources', icon: BookOpen, label: t('sidebar.my_purchases'), desc: t('sidebar.desc.my_purchases') },
    { to: '/support', icon: LifeBuoy, label: t('sidebar.help'), desc: t('sidebar.desc.help') },
    { to: '/profile', icon: User, label: t('sidebar.account'), desc: t('sidebar.desc.account') },
    { to: '/admin', icon: Building2, label: t('sidebar.manage_org'), desc: t('sidebar.desc.manage_org') },
  ];

  const navItems = user ? primaryItems : guestItems;

  const isMoreActive = moreItems.some(item => location.pathname.startsWith(item.to.split('?')[0]));

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
              className={cn(
                'flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[48px] transition-colors relative',
                active ? 'text-primary' : 'text-muted-foreground'
              )}
            >
              <div className="relative">
                <Icon className={cn('h-5 w-5', active && 'stroke-[2.5]')} />
                {label === t('bottom.alerts') && unread > 0 && (
                  <Badge variant="destructive" className="absolute -top-1.5 -right-2.5 h-4 min-w-4 px-1 text-[9px] flex items-center justify-center">
                    {unread > 9 ? '9+' : unread}
                  </Badge>
                )}
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
                <span className="text-[10px] font-medium leading-none">{t('bottom.more')}</span>
                {isMoreActive && <div className="absolute -bottom-0.5 w-6 h-0.5 rounded-full bg-primary" />}
              </button>
            </SheetTrigger>
            <SheetContent side="bottom" className="rounded-t-2xl pb-8">
              <SheetHeader>
                <SheetTitle className="text-sm">{t('bottom.more')}</SheetTitle>
              </SheetHeader>
              <div className="grid grid-cols-4 gap-3 mt-4">
                {moreItems.map(({ to, icon: Icon, label, desc }) => {
                  const active = location.pathname.startsWith(to);
                  return (
                    <Link
                      key={to}
                      to={to}
                      onClick={() => setOpen(false)}
                      className={cn(
                        'flex flex-col items-center gap-1.5 p-3 rounded-xl transition-colors text-center',
                        active ? 'bg-primary/10 text-primary' : 'text-muted-foreground hover:bg-muted'
                      )}
                    >
                      <div className="h-10 w-10 rounded-xl bg-muted/60 flex items-center justify-center">
                        <Icon className="h-5 w-5" />
                      </div>
                      <span className="text-[11px] font-medium leading-tight">{label}</span>
                    </Link>
                  );
                })}
              </div>
            </SheetContent>
          </Sheet>
        )}
      </div>
    </nav>
  );
}
