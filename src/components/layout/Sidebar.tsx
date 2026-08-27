import { Link, useLocation } from '@/lib/router-compat';
import { SiteLogo } from '@/components/ui/SiteLogo';
import {
  ChevronLeft, ChevronRight, LogOut, Settings, ShieldCheck,
  Compass, ShoppingBag, GraduationCap, MessageSquare, Share2, LayoutDashboard, HandCoins,
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

  const hasWorkspaceHome = workspaceNav.some((it) => it.route.split('?')[0] === '/dashboard');

  const accountNav: ActionNavItem[] = user
    ? [
        ...(hasWorkspaceHome ? [] : [{
          id: 'acc-home', icon: LayoutDashboard, emoji: '',
          titleFr: 'Accueil', titleEn: 'Home',
          descFr: 'Tableau de bord', descEn: 'Dashboard',
          route: '/dashboard',
          borderClass: '', iconBg: '', iconColor: 'text-primary',
        } as ActionNavItem]),
        {
          id: 'acc-explore', icon: Compass, emoji: '',
          titleFr: 'Explorer', titleEn: 'Explore',
          descFr: 'Découvrir', descEn: 'Discover',
          route: '/dashboard/explore',
          borderClass: '', iconBg: '', iconColor: 'text-violet-400',
        },
        {
          id: 'acc-purchases', icon: ShoppingBag, emoji: '',
          titleFr: 'Ma bibliothèque', titleEn: 'My library',
          descFr: 'Tous vos produits achetés', descEn: 'Everything you bought',
          route: '/my-purchases',
          borderClass: '', iconBg: '', iconColor: 'text-primary',
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
          descFr: 'Programme ambassadeur SiteViral', descEn: 'SiteViral ambassador program',
          route: '/gagner',
          borderClass: '', iconBg: '', iconColor: 'text-amber-400',
        },
        ...(isSuperadmin ? [{
          id: 'acc-affiliation', icon: Share2, emoji: '',
          titleFr: 'Parrainage', titleEn: 'Affiliate',
          descFr: 'Programme de parrainage (bêta)', descEn: 'Referral program (beta)',
          route: '/affiliation',
          borderClass: '', iconBg: '', iconColor: 'text-emerald-400',
        } as ActionNavItem] : []),
      ]
    : [];

  /**
   * ONE dashboard: overview first, then what you own, then what you sell.
   * Deduped by route so nothing appears twice.
   */
  const unifiedNav: ActionNavItem[] = (() => {
    const overview = workspaceNav.filter((it) => it.route.split('?')[0] === '/dashboard');
    const rest = workspaceNav.filter((it) => it.route.split('?')[0] !== '/dashboard');
    // Settings belongs in the menu itself (last row), not stranded in the footer.
    const settingsItem: ActionNavItem[] = canManageCurrentOrg
      ? [{
          id: 'settings', icon: Settings, emoji: '',
          titleFr: 'Paramètres', titleEn: 'Settings',
          descFr: 'Gérer ma plateforme', descEn: 'Manage my platform',
          route: '/admin/settings',
          borderClass: '', iconBg: '', iconColor: 'text-sidebar-foreground/75',
        } as ActionNavItem]
      : [];
    const merged = [...overview, ...accountNav, ...rest, ...settingsItem];
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
    if (clean === '/dashboard') return location.pathname === '/dashboard';
    if (clean === '/dashboard/messages') return location.pathname.startsWith('/dashboard/messages');
    if (clean === '/my-purchases') return location.pathname === '/my-purchases';
    if (clean === '/affiliation') return location.pathname === '/affiliation';
    if (clean === '/gagner') return location.pathname === '/gagner';
    if (clean === '/dashboard/explore') return location.pathname.startsWith('/dashboard/explore');
    return location.pathname.startsWith(clean);
  };


  /**
   * The sidebar is always dark navy, so `text-primary` (deep navy in light
   * theme) becomes invisible there. Remap it to a sidebar-safe blue.
   */
  const sidebarIconColor = (c?: string) => {
    if (!c || c === 'text-primary') return 'text-blue-400';
    return c.replace(/-500$/, '-400');
  };

  const renderNavItem = (item: ActionNavItem) => {
    const active = isActive(item.route);
    const Icon = item.icon;

    const rowExpanded = (
      <Link
        to={item.route}
        aria-current={active ? 'page' : undefined}
        data-nav-route={item.route.split('?')[0]}
        data-tour={`nav-${item.id}`}
        className={cn(
          'group relative flex items-center gap-3 h-11 px-3 rounded-2xl text-[13px] transition-all duration-200',
          active
            ? 'bg-gradient-to-r from-sidebar-foreground/[0.14] via-sidebar-foreground/[0.08] to-transparent text-sidebar-foreground font-semibold border border-sidebar-foreground/15 backdrop-blur-md shadow-[inset_0_1px_0_0_hsl(var(--sidebar-foreground)/0.18),0_8px_24px_-12px_hsl(var(--sidebar-background)/0.9)]'
            : 'font-medium text-sidebar-foreground/70 border border-transparent hover:text-sidebar-foreground hover:bg-sidebar-foreground/5 hover:translate-x-0.5',
        )}
      >
        <Icon
          className={cn(
            'h-[18px] w-[18px] shrink-0 transition-transform duration-200 group-hover:scale-110',
            sidebarIconColor(item.iconColor),
          )}
        />
        <span className="truncate">{isFr ? item.titleFr : item.titleEn}</span>
        {active && (
          <span
            aria-hidden
            className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-blue-400 shadow-[0_0_10px_2px_hsl(217_91%_60%/0.7)]"
          />
        )}
      </Link>
    );


    const rowCollapsed = (
      <Link
        to={item.route}
        aria-current={active ? 'page' : undefined}
        aria-label={isFr ? item.titleFr : item.titleEn}
        data-nav-route={item.route.split('?')[0]}
        data-tour={`nav-${item.id}`}
        className={cn(
          'relative flex items-center justify-center h-11 w-11 mx-auto rounded-2xl transition-all duration-200',
          active
            ? 'bg-sidebar-foreground/[0.12] border border-sidebar-foreground/15 backdrop-blur-md shadow-[inset_0_1px_0_0_hsl(var(--sidebar-foreground)/0.18)]'
            : 'border border-transparent hover:bg-sidebar-foreground/5',
        )}
      >
        <Icon className={cn('h-[18px] w-[18px]', sidebarIconColor(item.iconColor))} />

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
        'relative h-full max-h-[100dvh] min-h-0 sticky top-0 flex flex-col border-r border-sidebar-foreground/10 bg-sidebar shadow-2xl transition-all duration-300 overflow-hidden',
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

      {/* Logo + collapse toggle */}
      <div
        className={cn(
          'relative flex shrink-0',
          collapsed
            ? 'flex-col items-center justify-center gap-2 px-0 py-3'
            : 'h-16 flex-row items-center justify-between px-4',
        )}
      >
        <div className={cn('flex items-center justify-center', collapsed && 'w-full')}>
          <SiteLogo size={collapsed ? 'sm' : 'md'} animate />
        </div>
        <button
          onClick={() => setCollapsed(!collapsed)}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          className={cn(
            'flex items-center justify-center rounded-xl text-sidebar-foreground/60 transition-colors hover:text-sidebar-foreground hover:bg-sidebar-foreground/10',
            collapsed ? 'h-7 w-7' : 'h-8 w-8',
          )}
        >
          {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>


      {/* Workspace switcher */}
      {user && (
        <div className={cn('relative', collapsed ? 'px-1.5 pb-1' : 'px-3 pb-2')} data-tour="org-switcher">
          <OrgSwitcher variant="sidebar" collapsed={collapsed} />
        </div>
      )}

      <nav className={cn('relative flex-1 min-h-0 overflow-y-auto overscroll-contain py-2', collapsed ? 'px-1.5' : 'px-3')}>
        {/* ONE unified dashboard nav — no groups, no separate workspace section */}
        <div className="space-y-1">{unifiedNav.map(renderNavItem)}</div>
      </nav>


      {/* Superadmin + Settings + Sign out */}
      <div className={cn('relative shrink-0 border-t border-sidebar-foreground/10 bg-sidebar-foreground/[0.03] backdrop-blur-xs', collapsed ? 'px-1.5 py-2' : 'px-3 py-2')}>

        {isSuperadmin && (
          collapsed ? (
            <Tooltip delayDuration={0}>
              <TooltipTrigger asChild>
                <Link
                  to="/superadmin"
                  aria-label="Super admin"
                  className="flex items-center justify-center h-11 w-11 mx-auto rounded-xl text-amber-400 hover:bg-sidebar-foreground/5"
                >
                  <ShieldCheck className="h-[18px] w-[18px]" />
                </Link>
              </TooltipTrigger>
              <TooltipContent side="right"><p className="text-xs font-semibold">Super admin</p></TooltipContent>
            </Tooltip>
          ) : (
            <Link
              to="/superadmin"
              className="flex items-center gap-2.5 h-11 px-3 rounded-xl text-[13px] font-semibold text-amber-400 hover:bg-sidebar-foreground/5"
            >
              <ShieldCheck className="h-[18px] w-[18px] shrink-0" />
              <span>Super admin</span>
            </Link>
          )
        )}

        {collapsed ? (
          <Tooltip delayDuration={0}>
            <TooltipTrigger asChild>
              <button
                onClick={signOut}
                aria-label={t('sidebar.sign_out')}
                className="flex items-center justify-center h-11 w-11 mx-auto rounded-xl text-destructive hover:bg-destructive/10"
              >
                <LogOut className="h-[18px] w-[18px]" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right"><p className="text-xs font-semibold">{t('sidebar.sign_out')}</p></TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={signOut}
            className="flex items-center gap-2.5 h-11 w-full px-3 rounded-xl text-[13px] font-medium text-destructive hover:bg-destructive/10"
          >
            <LogOut className="h-[18px] w-[18px] shrink-0" />
            <span>{t('sidebar.sign_out')}</span>
          </button>
        )}
      </div>

    </aside>
  );
}
