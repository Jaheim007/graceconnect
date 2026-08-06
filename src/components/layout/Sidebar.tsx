import { Link, useLocation } from 'react-router-dom';
import { SiteLogo } from '@/components/ui/SiteLogo';
import {
  ChevronLeft, ChevronRight, LogOut, Settings, ShieldCheck,
  Compass, ShoppingBag, GraduationCap, MessageSquare, HandCoins,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { OrgSwitcher } from '@/components/org/OrgSwitcher';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useUserProfile } from '@/hooks/useUserProfile';
import { applyNavOverride } from '@/lib/navigation/actionNavItemOverrides';
import { buildFeatureNavItems } from '@/lib/navigation/featureNavBuilder';
import { getActionNavItems, type ActionNavItem } from '@/lib/navigation/actionNavItems';
import { useOrgFeatures } from '@/hooks/useOrgFeatures';
import type { SiteviralFeatureKey, SiteviralType } from '@/types/database';
import { showServiceSurfaces } from '@/lib/siteviral/visibility';

/**
 * Unified professional signed-in sidebar — compact, low-saturation design.
 *
 * Visual system:
 *  • Dark navy background (bg-sidebar)
 *  • Small uppercase group labels (ACCOUNT / WORKSPACE)
 *  • Compact ~44px rows, colored icon left, label right
 *  • Active row: subtle filled background + 3px left accent bar
 *  • Inactive rows: no borders, no background — just hover state
 *  • Collapsed: 64px icon rail with tooltips
 */
export function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { user, isSuperadmin, signOut } = useAuth();
  const { currentOrg, canManage, userOrgs } = useOrg();
  const { t, locale } = useI18n();
  const isFr = locale === 'fr';
  const { hasPurchases, hasOrgs } = useUserProfile();

  const hasManageableOrg = userOrgs.some((o) => canManage(o.id));
  const canManageCurrentOrg = currentOrg ? canManage(currentOrg.id) : false;

  const { has, org: featureOrg, type: siteviralType } = useOrgFeatures();
  const typeConfirmed = !!featureOrg?.type_confirmed_at;
  const enabledFeatures = (featureOrg?.enabled_features ?? []) as SiteviralFeatureKey[];

  const workspaceNav: ActionNavItem[] =
    currentOrg && canManageCurrentOrg
      ? (() => {
          const built = buildFeatureNavItems(
            { isAuthenticated: !!user, hasPurchases, hasManageableOrg, hasOrgs, isSuperadmin },
            enabledFeatures,
            siteviralType as SiteviralType | null,
          );
          if (built && built.length > 0) return built;
          return getActionNavItems(
            { isAuthenticated: !!user, hasPurchases, hasManageableOrg, hasOrgs, isSuperadmin },
          )
            .filter((it) => !['purchases', 'discover', 'claim'].includes(it.id))
            .filter((it) => {
              if (!it.featureKey) return true;
              if (!typeConfirmed) return true;
              return has(it.featureKey);
            })
            .map((it) => applyNavOverride(it, siteviralType));
        })()
      : [];

  const accountNav: ActionNavItem[] = user
    ? [
        {
          id: 'acc-explore', icon: Compass, emoji: '',
          titleFr: 'Explorer', titleEn: 'Explore',
          descFr: 'Découvrir', descEn: 'Discover',
          route: '/dashboard/explore',
          borderClass: '', iconBg: '', iconColor: 'text-violet-400',
        },
        {
          id: 'acc-purchases', icon: ShoppingBag, emoji: '',
          titleFr: 'Mes achats', titleEn: 'My purchases',
          descFr: 'Tous vos produits achetés', descEn: 'Everything you bought',
          route: '/my-purchases',
          borderClass: '', iconBg: '', iconColor: 'text-primary',
        },
        {
          id: 'acc-programs', icon: GraduationCap, emoji: '',
          titleFr: 'Mes cours', titleEn: 'My courses',
          descFr: 'Formations suivies et progression', descEn: 'Courses & progress',
          route: '/my-programs',
          borderClass: '', iconBg: '', iconColor: 'text-sky-400',
        },
        ...(showServiceSurfaces() ? [{
          id: 'acc-messages', icon: MessageSquare, emoji: '',
          titleFr: 'Messages', titleEn: 'Messages',
          descFr: 'Vos conversations', descEn: 'Your conversations',
          route: '/dashboard/messages',
          borderClass: '', iconBg: '', iconColor: 'text-cyan-400',
        }] : []),
        {
          id: 'acc-earn', icon: HandCoins, emoji: '',
          titleFr: 'Gagner', titleEn: 'Earn',
          descFr: 'Affiliation et commissions', descEn: 'Affiliate commissions',
          route: '/gagner',
          borderClass: '', iconBg: '', iconColor: 'text-emerald-400',
        },
      ]
    : [];

  /**
   * ONE dashboard: overview first, then what you own, then what you sell.
   * Deduped by route so nothing appears twice.
   */
  const unifiedNav: ActionNavItem[] = (() => {
    const overview = workspaceNav.filter((it) => it.route.split('?')[0] === '/admin');
    const rest = workspaceNav.filter((it) => it.route.split('?')[0] !== '/admin');
    const merged = [...overview, ...accountNav, ...rest];
    const seen = new Set<string>();
    return merged.filter((it) => {
      const key = it.route.split('?')[0];
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  })();




  const isActive = (route: string) => {
    if (route === '/') return location.pathname === '/';
    const clean = route.split('?')[0];
    if (clean === '/admin') return location.pathname === '/admin' || location.pathname === '/admin/';
    if (clean === '/dashboard/messages') return location.pathname.startsWith('/dashboard/messages');
    if (clean === '/my-purchases') return location.pathname === '/my-purchases';
    if (clean === '/my-programs') return location.pathname.startsWith('/my-programs');
    if (clean === '/gagner') return location.pathname === '/gagner';
    if (clean === '/dashboard/explore') return location.pathname.startsWith('/dashboard/explore');
    return location.pathname.startsWith(clean);
  };

  const settingsAlreadyInNav = workspaceNav.some((it) => it.route.split('?')[0] === '/admin/settings');

  const renderNavItem = (item: ActionNavItem) => {
    const active = isActive(item.route);
    const Icon = item.icon;

    const rowExpanded = (
      <Link
        to={item.route}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'group relative flex items-center gap-3 h-11 px-3 rounded-xl text-[13px] transition-all duration-200',
          active
            ? 'bg-primary/15 text-sidebar-foreground font-semibold border border-primary/25 shadow-[inset_0_1px_0_0_hsl(var(--sidebar-foreground)/0.08)]'
            : 'font-medium text-sidebar-foreground/70 border border-transparent hover:text-sidebar-foreground hover:bg-sidebar-foreground/5 hover:translate-x-0.5',
        )}
      >
        <Icon
          className={cn(
            'h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110',
            item.iconColor || 'text-sidebar-foreground/70',
          )}
        />
        <span className="truncate">{isFr ? item.titleFr : item.titleEn}</span>
        {active && (
          <span
            aria-hidden
            className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_10px_2px_hsl(var(--primary)/0.7)]"
          />
        )}
      </Link>
    );

    const rowCollapsed = (
      <Link
        to={item.route}
        aria-current={active ? 'page' : undefined}
        aria-label={isFr ? item.titleFr : item.titleEn}
        className={cn(
          'relative flex items-center justify-center h-11 w-11 mx-auto rounded-xl transition-all duration-200',
          active
            ? 'bg-primary/15 border border-primary/25 shadow-[inset_0_1px_0_0_hsl(var(--sidebar-foreground)/0.08)]'
            : 'border border-transparent hover:bg-sidebar-foreground/5',
        )}
      >
        <Icon className={cn('h-[18px] w-[18px]', item.iconColor || 'text-sidebar-foreground/80')} />
      </Link>
    );


    if (collapsed) {
      return (
        <Tooltip key={item.id} delayDuration={0}>
          <TooltipTrigger asChild>{rowCollapsed}</TooltipTrigger>
          <TooltipContent side="right">
            <p className="text-xs font-semibold">{isFr ? item.titleFr : item.titleEn}</p>
          </TooltipContent>
        </Tooltip>
      );
    }
    return <div key={item.id}>{rowExpanded}</div>;
  };

  const renderGroupLabel = (label: string) =>
    !collapsed ? (
      <div className="px-2.5 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-[0.08em] text-sidebar-foreground/45">
        {label}
      </div>
    ) : (
      <div className="my-2 mx-3 h-px bg-sidebar-foreground/10" />
    );

  return (
    <aside
      className={cn(
        'relative h-screen sticky top-0 flex flex-col border-r border-sidebar-foreground/10 bg-sidebar shadow-2xl transition-all duration-300 overflow-hidden',
        collapsed ? 'w-[68px]' : 'w-[248px]',
      )}
    >
      {/* Ambient glow — pure decoration */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(120%_60%_at_0%_0%,hsl(var(--primary)/0.16),transparent_60%)]"
      />
      <div
        aria-hidden
        className="pointer-events-none absolute inset-y-0 right-0 w-px bg-gradient-to-b from-transparent via-sidebar-foreground/15 to-transparent"
      />

      {/* Logo */}
      <div className={cn('relative flex items-center h-16 px-4', collapsed && 'justify-center px-0')}>
        <SiteLogo size={collapsed ? 'sm' : 'md'} animate />
      </div>

      {/* Workspace switcher */}
      {user && (
        <div className={cn('relative', collapsed ? 'px-1.5 pb-1' : 'px-3 pb-2')}>
          <OrgSwitcher variant="sidebar" collapsed={collapsed} />
        </div>
      )}

      <nav className={cn('relative flex-1 overflow-y-auto py-2 scrollbar-hide', collapsed ? 'px-1.5' : 'px-3')}>
        {/* ONE unified dashboard nav — no groups, no separate workspace section */}
        <div className="space-y-1">{unifiedNav.map(renderNavItem)}</div>
      </nav>


      {/* Superadmin + Settings + Sign out */}
      <div className={cn('relative border-t border-sidebar-foreground/10 bg-sidebar-foreground/[0.03] backdrop-blur-sm', collapsed ? 'px-1.5 py-2' : 'px-3 py-2')}>

        {isSuperadmin && (
          collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  to="/superadmin"
                  aria-label="Super admin"
                  className="flex items-center justify-center h-10 w-10 mx-auto rounded-md text-amber-400 hover:bg-sidebar-accent/50"
                >
                  <ShieldCheck className="h-[18px] w-[18px]" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right"><p className="text-xs font-semibold">Super admin</p></TooltipContent>
            </Tooltip>
          ) : (
            <Link
              to="/superadmin"
              className="flex items-center gap-2.5 h-10 px-2.5 rounded-md text-[13px] font-semibold text-amber-400 hover:bg-sidebar-accent/50"
            >
              <ShieldCheck className="h-[18px] w-[18px] shrink-0" />
              <span>Super admin</span>
            </Link>
          )
        )}

        {user && !settingsAlreadyInNav && canManageCurrentOrg && (
          collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  to="/admin/settings"
                  aria-label={isFr ? 'Paramètres' : 'Settings'}
                  className="flex items-center justify-center h-10 w-10 mx-auto rounded-md text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
                >
                  <Settings className="h-[18px] w-[18px]" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right"><p className="text-xs font-semibold">{isFr ? 'Paramètres' : 'Settings'}</p></TooltipContent>
            </Tooltip>
          ) : (
            <Link
              to="/admin/settings"
              className="flex items-center gap-2.5 h-10 px-2.5 rounded-md text-[13px] font-medium text-sidebar-foreground/75 hover:text-sidebar-foreground hover:bg-sidebar-accent/50"
            >
              <Settings className="h-[18px] w-[18px] shrink-0" />
              <span>{isFr ? 'Paramètres' : 'Settings'}</span>
            </Link>
          )
        )}
        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={signOut}
                aria-label={t('sidebar.sign_out')}
                className="flex items-center justify-center h-10 w-10 mx-auto rounded-md text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right"><p className="text-xs font-semibold">{t('sidebar.sign_out')}</p></TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={signOut}
            className="flex items-center gap-2.5 h-10 w-full px-2.5 rounded-md text-[13px] font-medium text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            <span>{t('sidebar.sign_out')}</span>
          </button>
        )}
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-9 w-full border-t border-sidebar-foreground/10 text-sidebar-foreground/60 hover:text-sidebar-foreground hover:bg-sidebar-accent/50 transition-colors"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
