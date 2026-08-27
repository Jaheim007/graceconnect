import { useLocation, useNavigate } from 'react-router-dom';
import { LayoutDashboard } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { getActionNavItems, getBeautyNavItems } from '@/lib/navigation/actionNavItems';
import { normalizeBuyerWorld, type BuyerWorld } from '@/lib/siteviral/buyerWorlds';
import { buildFeatureNavItems } from '@/lib/navigation/featureNavBuilder';
import { useOrgFeatures } from '@/hooks/useOrgFeatures';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { useRef, useMemo } from 'react';
import type { SiteviralFeatureKey, SiteviralType } from '@/types/database';

/**
 * Professional floating bottom nav.
 * - Rail is icon-first with tight labels.
 * - Active item gets a filled pill + short top accent bar (iOS/pro-app feel).
 * - Items are feature-gated per the current org's SiteViral type.
 */
export function BottomNav() {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, isSuperadmin, signOut: _signOut } = useAuth();
  const { currentOrg, canManage, userOrgs } = useOrg();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { hasPurchases, hasOrgs } = useUserProfile();
  const scrollRef = useRef<HTMLDivElement>(null);

  const hasManageableOrg = userOrgs.some(o => canManage(o.id));

  const resolveRoute = (id: string) => {
    switch (id) {
      case 'course': return hasManageableOrg ? '/admin/programs' : user ? '/create-org' : '/creer-formation';
      case 'sell':   return hasManageableOrg ? '/admin/products' : user ? '/create-org' : '/vendre';
      case 'orgs':   return hasManageableOrg ? '/admin' : '/create-org';
      default:       return '';
    }
  };

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

  const { has, type: siteviralType, org: featureOrg } = useOrgFeatures();
  const typeConfirmed = !!featureOrg?.type_confirmed_at;
  const enabledFeatures = (featureOrg?.enabled_features ?? []) as SiteviralFeatureKey[];

  const navItems = useMemo(() => {
    if (isBeauty) {
      const items = getBeautyNavItems({
        isAuthenticated: !!user, hasPurchases, hasManageableOrg, hasOrgs, isSuperadmin,
      });
      if (isBeautyProvider) {
        return items.map((it) =>
          it.id === 'beauty-pro'
            ? { ...it, icon: LayoutDashboard,
                titleFr: 'Mon espace', titleEn: 'My space',
                descFr: 'Agenda, revenus, services', descEn: 'Calendar, revenue, services',
                route: '/beauty/pro' }
            : it
        );
      }
      return items;
    }

    // 1. Feature-driven nav when the org has a confirmed SiteViral type.
    const featureBuilt = buildFeatureNavItems(
      { isAuthenticated: !!user, hasPurchases, hasManageableOrg, hasOrgs, isSuperadmin },
      enabledFeatures,
      siteviralType as SiteviralType | null,
    );
    if (typeConfirmed && featureBuilt && featureBuilt.length > 0) return featureBuilt;

    // 2. Legacy digital-defaults, still respecting per-item featureKey gate.
    let interests: BuyerWorld[] = [];
    try {
      const raw = typeof window !== 'undefined' ? localStorage.getItem('sv_interests') : null;
      const arr = raw ? (JSON.parse(raw) as string[]) : [];
      interests = arr.map(normalizeBuyerWorld).filter((k): k is BuyerWorld => !!k);
    } catch {}
    const raw = getActionNavItems(
      { isAuthenticated: !!user, hasPurchases, hasManageableOrg, hasOrgs, isSuperadmin, interests },
      resolveRoute,
    );
    return raw.filter((item) => {
      if (!item.featureKey) return true;
      if (!typeConfirmed) return true;
      return has(item.featureKey);
    });
  }, [
    isBeauty, isBeautyProvider, user, hasPurchases, hasManageableOrg, hasOrgs, isSuperadmin,
    typeConfirmed, siteviralType, enabledFeatures, has,
  ]);

  const isActive = (route: string) => {
    if (route === '/') return location.pathname === '/';
    return location.pathname.startsWith(route.split('?')[0]);
  };

  return (
    <div className="native-bottom-nav pointer-events-auto">
      <div className="rounded-2xl border border-border/60 bg-background/80 backdrop-blur-2xl shadow-[0_10px_40px_-12px_rgba(0,0,0,0.35)] supports-[backdrop-filter]:bg-background/60">
        <div
          ref={scrollRef}
          className="flex items-center gap-0.5 overflow-x-auto px-1.5 pt-1.5 pb-2 scrollbar-hide snap-x snap-mandatory"
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
                aria-current={active ? 'page' : undefined}
                aria-label={isFr ? item.titleFr : item.titleEn}
                className={cn(
                  'relative flex min-w-[62px] shrink-0 snap-center flex-col items-center gap-1 rounded-xl px-2.5 pt-2 pb-1.5 transition-all duration-200',
                  'active:scale-[0.94] focus-visible:outline-hidden focus-visible:ring-2 focus-visible:ring-primary/40',
                  active ? 'text-foreground' : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {/* Top accent bar for the active item */}
                <span
                  className={cn(
                    'absolute top-0 left-1/2 -translate-x-1/2 h-[2px] rounded-full transition-all duration-300',
                    active ? 'w-6 bg-primary' : 'w-0 bg-transparent'
                  )}
                />
                <div
                  className={cn(
                    'flex h-8 w-8 items-center justify-center rounded-xl transition-all',
                    active ? cn(item.iconBg, 'scale-105') : 'bg-transparent'
                  )}
                >
                  <Icon className={cn('h-4 w-4', active ? item.iconColor : 'text-current')} />
                </div>
                <span
                  className={cn(
                    'text-[9px] leading-none tracking-wide text-center whitespace-nowrap',
                    active ? 'font-semibold' : 'font-medium'
                  )}
                >
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
