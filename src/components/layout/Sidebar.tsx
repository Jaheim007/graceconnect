import { Link, useLocation } from 'react-router-dom';
import { SiteLogo } from '@/components/ui/SiteLogo';
import {
  ChevronLeft, ChevronRight, LogOut, Settings,
  Compass, Package, GraduationCap, MessageSquare, HandCoins,
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

/**
 * Unified professional signed-in sidebar.
 * Two visually grouped sections but ONE navigation:
 *   • ACCOUNT   — always visible (Explore, Purchases, Programs, Messages, Earn)
 *   • WORKSPACE — visible when a workspace is selected (feature-driven admin nav)
 *
 * No route-aware split. No "Personal" sidebar. Same design across all
 * signed-in routes.
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

  // WORKSPACE nav — feature-driven, only when a workspace is selected AND user can manage it.
  const workspaceNav: ActionNavItem[] =
    currentOrg && canManageCurrentOrg
      ? (() => {
          const built = buildFeatureNavItems(
            { isAuthenticated: !!user, hasPurchases, hasManageableOrg, hasOrgs, isSuperadmin },
            enabledFeatures,
            siteviralType as SiteviralType | null,
          );
          if (built && built.length > 0) return built;
          // Fallback: legacy digital defaults (kept feature-gated)
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

  // ACCOUNT nav — always visible for signed-in users.
  const accountNav: ActionNavItem[] = user
    ? [
        {
          id: 'acc-explore', icon: Compass, emoji: '',
          titleFr: 'Explorer', titleEn: 'Explore',
          descFr: 'Découvrir', descEn: 'Discover',
          route: '/dashboard/explore',
          borderClass: 'border-violet-500/30 hover:border-violet-500/60',
          iconBg: 'bg-violet-500/12', iconColor: 'text-violet-500',
        },
        {
          id: 'acc-purchases', icon: Package, emoji: '',
          titleFr: 'Mes achats', titleEn: 'My Purchases',
          descFr: 'Livres, PDFs et ressources', descEn: 'Books, PDFs & resources',
          route: '/my-purchases',
          borderClass: 'border-primary/30 hover:border-primary/60',
          iconBg: 'bg-primary/12', iconColor: 'text-primary',
        },
        {
          id: 'acc-programs', icon: GraduationCap, emoji: '',
          titleFr: 'Mes programmes', titleEn: 'My Programs',
          descFr: 'Cours et progression', descEn: 'Courses & progress',
          route: '/my-programs',
          borderClass: 'border-sky-500/30 hover:border-sky-500/60',
          iconBg: 'bg-sky-500/12', iconColor: 'text-sky-500',
        },
        {
          id: 'acc-messages', icon: MessageSquare, emoji: '',
          titleFr: 'Messages', titleEn: 'Messages',
          descFr: 'Vos conversations', descEn: 'Your conversations',
          route: '/dashboard/messages',
          borderClass: 'border-cyan-500/30 hover:border-cyan-500/60',
          iconBg: 'bg-cyan-500/12', iconColor: 'text-cyan-500',
        },
        {
          id: 'acc-earn', icon: HandCoins, emoji: '',
          titleFr: 'Gagner', titleEn: 'Earn',
          descFr: 'Affiliation et commissions', descEn: 'Affiliate commissions',
          route: '/gagner',
          borderClass: 'border-emerald-500/30 hover:border-emerald-500/60',
          iconBg: 'bg-emerald-500/12', iconColor: 'text-emerald-500',
        },
      ]
    : [];

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
    const link = (
      <Link
        to={item.route}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 border',
          active
            ? cn('bg-card text-card-foreground shadow-md dark:shadow-sm', item.borderClass.replace('hover:', ''))
            : cn('border-transparent text-sidebar-foreground hover:bg-sidebar-accent/80', item.borderClass),
        )}
      >
        <div className={cn('h-8 w-8 rounded-lg flex items-center justify-center shrink-0', item.iconBg)}>
          <Icon className={cn('h-4 w-4', item.iconColor)} />
        </div>
        {!collapsed && (
          <div className="min-w-0">
            <div className={cn('font-semibold text-xs truncate', active ? 'text-card-foreground' : 'text-sidebar-foreground')}>
              {isFr ? item.titleFr : item.titleEn}
            </div>
          </div>
        )}
      </Link>
    );
    if (collapsed) {
      return (
        <Tooltip key={item.id} delayDuration={0}>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-semibold text-xs">{isFr ? item.titleFr : item.titleEn}</p>
            <p className="text-[10px] text-muted-foreground">{isFr ? item.descFr : item.descEn}</p>
          </TooltipContent>
        </Tooltip>
      );
    }
    return <div key={item.id}>{link}</div>;
  };

  const renderGroupLabel = (label: string) =>
    !collapsed && (
      <div className="px-3 pt-3 pb-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground/70">
        {label}
      </div>
    );

  return (
    <aside
      className={cn(
        'h-screen sticky top-0 flex flex-col border-r border-border bg-sidebar transition-all duration-300 overflow-hidden',
        collapsed ? 'w-16' : 'w-60',
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-14 px-4 border-b border-border', collapsed && 'justify-center px-0')}>
        <SiteLogo size={collapsed ? 'sm' : 'md'} animate />
      </div>

      {/* Workspace switcher */}
      {user && (
        <div className="px-2 pt-2">
          <OrgSwitcher variant="sidebar" collapsed={collapsed} />
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1 scrollbar-hide">
        {/* ACCOUNT group */}
        {accountNav.length > 0 && (
          <>
            {renderGroupLabel(isFr ? 'COMPTE' : 'ACCOUNT')}
            <div className="space-y-1">{accountNav.map(renderNavItem)}</div>
          </>
        )}

        {/* WORKSPACE group */}
        {workspaceNav.length > 0 && (
          <>
            {renderGroupLabel(isFr ? 'ESPACE DE TRAVAIL' : 'WORKSPACE')}
            <div className="space-y-1">{workspaceNav.map(renderNavItem)}</div>
          </>
        )}
      </nav>

      {/* Settings + Sign out */}
      <div className={cn('border-t border-border', collapsed ? 'px-1 py-2' : 'px-2 py-2')}>
        {user && !settingsAlreadyInNav && canManageCurrentOrg && (
          <Link
            to="/admin/settings"
            className={cn(
              'flex items-center gap-3 rounded-lg text-sm font-medium transition-all w-full text-sidebar-foreground opacity-80 hover:opacity-100 hover:bg-sidebar-accent',
              collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2',
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            {!collapsed && <span className="text-xs">{isFr ? 'Paramètres' : 'Settings'}</span>}
          </Link>
        )}
        <button
          onClick={signOut}
          className={cn(
            'flex items-center gap-3 rounded-lg text-sm font-medium transition-all w-full text-destructive hover:bg-destructive/10',
            collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2',
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="text-xs">{t('sidebar.sign_out')}</span>}
        </button>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 w-full border-t border-border text-sidebar-foreground opacity-70 hover:opacity-100 hover:bg-sidebar-accent transition-colors"
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
