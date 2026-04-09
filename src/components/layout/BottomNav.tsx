import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Settings, Bell } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { getActionNavItems, type ActionNavItem } from '@/lib/navigation/actionNavItems';
import { useRef } from 'react';

export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isSuperadmin, signOut } = useAuth();
  const { currentOrg, canManage, userOrgs } = useOrg();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { hasPurchases, hasOrgs } = useUserProfile();
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasManageableOrg = userOrgs.some(o => canManage(o.id));

  const resolveRoute = (id: string) => {
    switch (id) {
      case 'course': return hasManageableOrg ? '/admin/programs' : user ? '/create-org' : '/creer-formation';
      case 'sell': return hasManageableOrg ? '/admin/products' : user ? '/create-org' : '/vendre';
      case 'orgs': return hasManageableOrg ? '/admin' : '/create-org';
      default: return '';
    }
  };

  const navItems = getActionNavItems({
    isAuthenticated: !!user,
    hasPurchases,
    hasManageableOrg,
    hasOrgs,
    isSuperadmin,
  }, resolveRoute);

  const isActive = (route: string) => {
    if (route === '/') return location.pathname === '/';
    return location.pathname.startsWith(route.split('?')[0]);
  };

  return (
    <div className="native-bottom-nav pointer-events-auto">
      <div className="rounded-[1.35rem] border border-border bg-card/95 backdrop-blur-xl shadow-elevated">
        <div
          ref={scrollRef}
          className="flex items-center gap-1 overflow-x-auto px-2 py-2 scrollbar-hide snap-x snap-mandatory"
        >
          {navItems.map((item) => {
            const active = isActive(item.route);
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => navigate(item.route)}
                className={cn(
                  'flex min-w-[64px] shrink-0 snap-center flex-col items-center gap-1 rounded-xl px-3 py-2 transition-all duration-200',
                  active
                    ? cn('bg-card shadow-sm border', item.borderClass.replace('hover:', ''))
                    : 'border border-transparent'
                )}
              >
                <div className={cn('flex h-8 w-8 items-center justify-center rounded-lg', item.iconBg)}>
                  <Icon className={cn('h-4 w-4', item.iconColor)} />
                </div>
                <span className={cn(
                  'text-[9px] font-medium leading-tight text-center whitespace-nowrap',
                  active ? 'text-foreground font-bold' : 'text-muted-foreground'
                )}>
                  {isFr ? item.titleFr : item.titleEn}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
