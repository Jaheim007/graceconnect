import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { ChevronLeft, ChevronRight, LogOut, Settings } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { OrgSwitcher } from '@/components/org/OrgSwitcher';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useBuyerWorld } from '@/hooks/useBuyerWorld';
import { buyerNavForWorld, BUYER_WORLDS } from '@/lib/siteviral/buyerWorlds';
import { getActionNavItems, type ActionNavItem } from '@/lib/navigation/actionNavItems';
import { applyNavOverride } from '@/lib/navigation/actionNavItemOverrides';
import { buildFeatureNavItems } from '@/lib/navigation/featureNavBuilder';
import { useOrgFeatures } from '@/hooks/useOrgFeatures';
import type { SiteviralFeatureKey, SiteviralType } from '@/types/database';

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { user, isSuperadmin, signOut } = useAuth();
  const { currentOrg, canManage, userOrgs } = useOrg();
  const { t, locale } = useI18n();
  const isFr = locale === 'fr';
  const { hasPurchases, hasOrgs } = useUserProfile();
  const { world: buyerWorld } = useBuyerWorld();

  const hasManageableOrg = userOrgs.some(o => canManage(o.id));
  const canManageCurrentOrg = currentOrg ? canManage(currentOrg.id) : false;

  const resolveRoute = (id: string) => {
    switch (id) {
      case 'course': return hasManageableOrg ? '/admin/programs' : user ? '/create-org' : '/creer-formation';
      case 'sell': return hasManageableOrg ? '/admin/products' : user ? '/create-org' : '/vendre';
      case 'orgs': return hasManageableOrg ? '/dashboard' : '/create-org';
      default: return '';
    }
  };

  const { has, org: featureOrg, type: siteviralType } = useOrgFeatures();
  const typeConfirmed = !!featureOrg?.type_confirmed_at;

  const enabledFeatures = (featureOrg?.enabled_features ?? []) as SiteviralFeatureKey[];

  // Feature-driven nav when the org has a confirmed SiteViral type. Falls back
  // to the legacy digital-defaults (which are also per-item feature-gated).
  const featureBuilt = buildFeatureNavItems(
    { isAuthenticated: !!user, hasPurchases, hasManageableOrg, hasOrgs, isSuperadmin },
    enabledFeatures,
    siteviralType as SiteviralType | null,
  );

  const navItems: ActionNavItem[] =
    typeConfirmed && featureBuilt && featureBuilt.length > 0
      ? featureBuilt
      : getActionNavItems(
          { isAuthenticated: !!user, hasPurchases, hasManageableOrg, hasOrgs, isSuperadmin },
          resolveRoute,
        )
          .filter((item) => {
            if (!item.featureKey) return true;
            if (!typeConfirmed) return true;
            return has(item.featureKey);
          })
          .map((item) => applyNavOverride(item, siteviralType));

  const isActive = (route: string) => {
    if (route === '/') return location.pathname === '/';
    const clean = route.split('?')[0];
    // Exact match for short routes like /admin to avoid false positives
    if (clean === '/admin') return location.pathname === '/admin' || location.pathname === '/admin/';
    return location.pathname.startsWith(clean);
  };
  const settingsAlreadyInNav = navItems.some((item) => item.route.split('?')[0] === '/admin/settings');

  const renderNavItem = (item: ActionNavItem) => {
    const active = isActive(item.route);
    const Icon = item.icon;

    const link = (
      <Link
        key={item.id}
        to={item.route}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200 group border',
          active
            ? cn('bg-card text-card-foreground shadow-md dark:shadow-sm', item.borderClass.replace('hover:', ''))
            : cn('border-transparent text-sidebar-foreground hover:bg-sidebar-accent/80', item.borderClass)
        )}
      >
        <div className={cn('h-9 w-9 rounded-lg flex items-center justify-center shrink-0', item.iconBg)}>
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

    return link;
  };

  return (
    <aside
      className={cn(
        'h-screen sticky top-0 flex flex-col border-r border-border bg-sidebar transition-all duration-300 overflow-hidden',
        collapsed ? 'w-16' : 'w-56'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-14 px-4 border-b border-border', collapsed && 'justify-center px-0')}>
        <SiteLogo size={collapsed ? 'sm' : 'md'} animate />
      </div>

      {/* Org switcher */}
      {hasOrgs && canManageCurrentOrg && (
        <div className="px-2 pt-2">
          <OrgSwitcher variant="sidebar" collapsed={collapsed} />
        </div>
      )}

      {/* Navigation items */}
      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-1 scrollbar-hide">
        {/* Buyer-world layer: shown when user has no workspace but picked a world */}
        {user && !hasManageableOrg && buyerWorld && (() => {
          const meta = BUYER_WORLDS[buyerWorld];
          const items = buyerNavForWorld(buyerWorld);
          return (
            <div className="pb-2 mb-2 border-b border-border/60">
              {!collapsed && (
                <div className="px-3 py-1.5 flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">
                  <span>{meta.emoji}</span>
                  <span className="truncate">{isFr ? meta.labelFr : meta.labelEn}</span>
                </div>
              )}
              {items.map((it) => {
                const active = isActive(it.url);
                const Icon = it.icon;
                const link = (
                  <Link
                    key={it.id}
                    to={it.url}
                    aria-current={active ? 'page' : undefined}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-xl text-sm font-medium transition-all border',
                      active
                        ? 'bg-card text-card-foreground shadow-sm border-primary/30'
                        : 'border-transparent text-sidebar-foreground hover:bg-sidebar-accent/80'
                    )}
                  >
                    <div className="h-8 w-8 rounded-lg flex items-center justify-center shrink-0 bg-primary/10">
                      <Icon className="h-4 w-4 text-primary" />
                    </div>
                    {!collapsed && (
                      <span className="text-xs font-semibold truncate">{isFr ? it.labelFr : it.labelEn}</span>
                    )}
                  </Link>
                );
                return collapsed ? (
                  <Tooltip key={it.id} delayDuration={0}>
                    <TooltipTrigger asChild>{link}</TooltipTrigger>
                    <TooltipContent side="right">
                      <p className="font-semibold text-xs">{isFr ? it.labelFr : it.labelEn}</p>
                    </TooltipContent>
                  </Tooltip>
                ) : link;
              })}
              {!collapsed && (
                <Link
                  to="/looking-for"
                  className="mt-1 block px-3 py-1.5 text-[10px] text-muted-foreground hover:text-foreground"
                >
                  {isFr ? 'Changer de monde' : 'Switch world'}
                </Link>
              )}
            </div>
          );
        })()}
        {user && !hasManageableOrg && !buyerWorld && (
          <div className="pb-2 mb-2 border-b border-border/60 space-y-1">
            <Link
              to="/looking-for"
              className={cn(
                'flex items-center gap-3 rounded-xl text-sm font-medium border border-dashed border-primary/40 hover:bg-primary/5',
                collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2'
              )}
            >
              <Search className="h-4 w-4 text-primary shrink-0" />
              {!collapsed && <span className="text-xs">{isFr ? 'Que cherchez-vous ?' : 'What are you looking for?'}</span>}
            </Link>
            <Link
              to="/create-org"
              className={cn(
                'flex items-center gap-3 rounded-xl text-sm font-medium border border-dashed border-amber-500/40 hover:bg-amber-500/5',
                collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2'
              )}
            >
              <span className="text-base shrink-0">🏪</span>
              {!collapsed && <span className="text-xs">{isFr ? 'Créer mon monde' : 'Create my world'}</span>}
            </Link>
          </div>
        )}
        {navItems.map(renderNavItem)}
      </nav>

      {/* Settings + Sign out */}
      <div className={cn('border-t border-border', collapsed ? 'px-1 py-2' : 'px-2 py-2')}>
        {user && !settingsAlreadyInNav && (
          <Link
            to={hasManageableOrg ? "/admin/settings" : "/notification-preferences"}
            className={cn(
              'flex items-center gap-3 rounded-lg text-sm font-medium transition-all w-full text-sidebar-foreground opacity-80 hover:opacity-100 hover:bg-sidebar-accent',
              collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2'
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
            collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2'
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span className="text-xs">{t('sidebar.sign_out')}</span>}
        </button>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 w-full border-t border-border text-sidebar-foreground opacity-70 hover:opacity-100 hover:bg-sidebar-accent transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
