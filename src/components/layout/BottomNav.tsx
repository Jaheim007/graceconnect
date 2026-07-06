import { useLocation, useNavigate } from 'react-router-dom';
import { LogOut, Settings, Bell, LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { getActionNavItems, getBeautyNavItems, type ActionNavItem } from '@/lib/navigation/actionNavItems';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
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

  // Vertical-aware nav: /beauty/* shows Beauty items, everything else shows Digital items.
  const isBeauty = location.pathname.startsWith('/beauty');

  const { data: isBeautyProvider } = useQuery({
    queryKey: ['beauty-is-provider-nav', user?.id],
    enabled: !!user && isBeauty,
    staleTime: 5 * 60_000,
    queryFn: async () => {
      if (!user) return false;
      const { data } = await supabase
        .from('beauty_providers')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();
      return !!data;
    },
  });

  let navItems = isBeauty
    ? getBeautyNavItems({
        isAuthenticated: !!user,
        hasPurchases,
        hasManageableOrg,
        hasOrgs,
        isSuperadmin,
      })
    : getActionNavItems({
        isAuthenticated: !!user,
        hasPurchases,
        hasManageableOrg,
        hasOrgs,
        isSuperadmin,
      }, resolveRoute);

  // Existing beauty pros should land on their dashboard, not the onboarding
  // wizard (which just spins and redirects — feels like a broken refresh).
  if (isBeauty && isBeautyProvider) {
    navItems = navItems.map((it) =>
      it.id === 'beauty-pro'
        ? {
            ...it,
            icon: LayoutDashboard,
            titleFr: 'Mon espace',
            titleEn: 'My space',
            descFr: 'Agenda, revenus, services',
            descEn: 'Calendar, revenue, services',
            route: '/beauty/pro',
          }
        : it
    );
  }


  const isActive = (route: string) => {
    if (route === '/') return location.pathname === '/';
    return location.pathname.startsWith(route.split('?')[0]);
  };

  return (
    <div className="native-bottom-nav pointer-events-auto">
      <div className="rounded-[1.35rem] border border-border bg-card/95 backdrop-blur-xl shadow-elevated">
        <div
          ref={scrollRef}
          className="flex items-center gap-0.5 overflow-x-auto px-1.5 py-1.5 scrollbar-hide snap-x snap-mandatory"
        >
          {navItems.map((item) => {
            const active = isActive(item.route);
            const Icon = item.icon;
            return (
              <button
                key={item.id}
                onClick={() => {
                  const authRequired = ['purchases', 'sales', 'orgs', 'superadmin'];
                  if (!user && authRequired.includes(item.id)) {
                    navigate('/auth');
                    return;
                  }
                  navigate(item.route);
                }}
                className={cn(
                  'flex min-w-[60px] shrink-0 snap-center flex-col items-center gap-0.5 rounded-xl px-2.5 py-1.5 transition-all duration-150',
                  'active:scale-95 active:opacity-70',
                  active
                    ? cn('bg-card shadow-sm border', item.borderClass.replace('hover:', ''))
                    : 'border border-transparent'
                )}
              >
                <div className={cn('flex h-7 w-7 items-center justify-center rounded-lg', item.iconBg)}>
                  <Icon className={cn('h-3.5 w-3.5', item.iconColor)} />
                </div>
                <span className={cn(
                  'text-[8px] font-medium leading-none text-center whitespace-nowrap',
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
