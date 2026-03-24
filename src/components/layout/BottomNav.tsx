import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Plus, Wallet, Store, User, PenLine, UserPlus, MoreHorizontal, Shield, Bell, Settings, Heart, BookOpen, HelpCircle, Award } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet';
import { useState } from 'react';

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isSuperadmin } = useAuth();
  const { currentOrg, canManage } = useOrg();
  const { t } = useI18n();
  const canManageCurrentOrg = currentOrg ? canManage(currentOrg.id) : false;
  const [moreOpen, setMoreOpen] = useState(false);

  const guestItems = [
    { to: '/', icon: Home, label: t('bottom.home') },
    { to: '/discover', icon: Store, label: t('bottom.explore') },
    { to: '/ecrire', icon: PenLine, label: t('bottom.write'), accent: true },
    { to: '/gagner', icon: Wallet, label: t('bottom.earn') },
    { to: '/auth?mode=signup', icon: UserPlus, label: t('bottom.signup') },
  ];

  const creatorItems = [
    { to: '/dashboard', icon: Home, label: t('bottom.home') },
    { to: '/admin/create', icon: Plus, label: t('sidebar.create'), accent: true },
    { to: '/admin/sales', icon: Wallet, label: t('sidebar.sales') },
    { to: '/marketplace', icon: Store, label: t('bottom.discover') },
    { to: '__more__', icon: MoreHorizontal, label: t('bottom.more') },
  ];

  const consumerItems = [
    { to: '/dashboard', icon: Home, label: t('bottom.home') },
    { to: '/marketplace', icon: Store, label: t('bottom.discover') },
    { to: '/ecrire', icon: PenLine, label: t('bottom.write'), accent: true },
    { to: '/gagner', icon: Wallet, label: t('bottom.earn') },
    { to: '__more__', icon: MoreHorizontal, label: t('bottom.more') },
  ];

  // "More" menu items — everything not already in the bottom bar
  const moreMenuItems = [
    { to: '/profile', icon: User, label: t('bottom.profile') || 'Profil' },
    { to: '/notifications', icon: Bell, label: t('sidebar.notifications') },
    { to: '/resources', icon: BookOpen, label: t('sidebar.my_purchases') },
    { to: '/ambassador', icon: Heart, label: t('sidebar.my_affiliations') },
    { to: '/leaderboard', icon: Award, label: t('sidebar.leaderboard') },
    { to: '/help', icon: HelpCircle, label: t('sidebar.help') },
    ...(isSuperadmin ? [{ to: '/superadmin', icon: Shield, label: t('sidebar.superadmin') }] : []),
  ];

  const navItems = !user ? guestItems : canManageCurrentOrg ? creatorItems : consumerItems;

  return (
    <>
      <nav className="fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur-sm lg:hidden">
        <div className="flex items-center justify-around h-14 px-1 max-w-lg mx-auto">
          {navItems.map(({ to, icon: Icon, label, ...rest }) => {
            const isMore = to === '__more__';
            const active = isMore
              ? false
              : to === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(to.split('?')[0]);
            const isAccent = 'accent' in rest && (rest as any).accent;

            if (isMore) {
              return (
                <button
                  key="more"
                  onClick={() => setMoreOpen(true)}
                  aria-label={label}
                  className="flex flex-col items-center justify-center gap-0.5 flex-1 py-2 min-h-[48px] min-w-[48px] transition-colors text-muted-foreground"
                >
                  <Icon className="h-5 w-5" />
                  <span className="text-[10px] font-medium leading-none">{label}</span>
                </button>
              );
            }

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
        </div>
      </nav>

      {/* More sheet */}
      {user && (
        <Sheet open={moreOpen} onOpenChange={setMoreOpen}>
          <SheetContent side="bottom" className="rounded-t-2xl px-2 pb-8 pt-3 max-h-[70vh]">
            <SheetHeader className="pb-2">
              <SheetTitle className="text-sm font-semibold">{t('bottom.more') || 'Plus'}</SheetTitle>
            </SheetHeader>
            <div className="grid grid-cols-3 gap-1">
              {moreMenuItems.map(({ to, icon: Icon, label }) => {
                const active = location.pathname.startsWith(to);
                return (
                  <button
                    key={to}
                    onClick={() => { setMoreOpen(false); navigate(to); }}
                    className={cn(
                      'flex flex-col items-center gap-1.5 py-4 px-2 rounded-xl transition-colors',
                      active ? 'bg-primary/10 text-primary' : 'text-foreground hover:bg-muted'
                    )}
                  >
                    <div className={cn(
                      'h-10 w-10 rounded-xl flex items-center justify-center',
                      active ? 'bg-primary/15' : 'bg-muted'
                    )}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <span className="text-[11px] font-medium leading-tight text-center">{label}</span>
                  </button>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      )}
    </>
  );
}
