import { Link, useLocation } from 'react-router-dom';
import { Home, Plus, Wallet, Store, User, PenLine, UserPlus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';

export function BottomNav() {
  const location = useLocation();
  const { user } = useAuth();
  const { currentOrg, canManage } = useOrg();
  const { t } = useI18n();
  const canManageCurrentOrg = currentOrg ? canManage(currentOrg.id) : false;

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
    { to: '/profile', icon: User, label: t('bottom.profile') },
  ];

  const consumerItems = [
    { to: '/dashboard', icon: Home, label: t('bottom.home') },
    { to: '/marketplace', icon: Store, label: t('bottom.discover') },
    { to: '/ecrire', icon: PenLine, label: t('bottom.write'), accent: true },
    { to: '/gagner', icon: Wallet, label: t('bottom.earn') },
    { to: '/profile', icon: User, label: t('bottom.profile') },
  ];

  const navItems = !user ? guestItems : canManageCurrentOrg ? creatorItems : consumerItems;

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
      </div>
    </nav>
  );
}
