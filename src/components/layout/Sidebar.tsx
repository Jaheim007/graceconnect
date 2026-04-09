import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SiteLogo } from '@/components/ui/SiteLogo';
import {
  Home, Eye, Settings, ChevronLeft, ChevronRight, Shield,
  FileCheck, LogOut, BarChart3, Users, Wallet,
  Store, Package, Handshake, Share2,
  Sparkles, Coins, Bookmark
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { OrgSwitcher } from '@/components/org/OrgSwitcher';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useMyPartner } from '@/hooks/usePartner';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useUserProfile } from '@/hooks/useUserProfile';
import { useAdaptiveLabels } from '@/hooks/useAdaptiveLabels';

interface NavItem {
  to: string;
  icon: typeof Home;
  label: string;
  desc?: string;
  badge?: boolean;
}

export function Sidebar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [collapsed, setCollapsed] = useState(false);
  const { user, isSuperadmin, signOut } = useAuth();
  const { currentOrg, canManage, userOrgs } = useOrg();
  const { t, locale } = useI18n();
  const { data: myPartner } = useMyPartner();
  const isApprovedPartner = myPartner?.status === 'approved';
  const isFr = locale === 'fr';
  const { profile } = useUserProfile();
  const labels = useAdaptiveLabels();

  const hasOrgs = userOrgs.length > 0;
  const canManageCurrentOrg = currentOrg ? canManage(currentOrg.id) : false;

  const isSA = location.pathname.startsWith('/superadmin');

  const superadminNav: NavItem[] = [
    { to: '/superadmin', icon: Shield, label: t('sidebar.overview') },
    { to: '/superadmin/orgs', icon: Users, label: t('sidebar.organizations') },
    { to: '/superadmin/kyc', icon: FileCheck, label: t('sidebar.kyc') },
    { to: '/superadmin/transactions', icon: BarChart3, label: t('sidebar.transactions') },
  ];

  const isActive = (to: string) => {
    if (to === '/' || to === '/admin' || to === '/dashboard' || to === '/superadmin') return location.pathname === to;
    return location.pathname.startsWith(to);
  };

  // ═══ FLAT NAV — minimal, context-aware ═══
  const getNavItems = (): NavItem[] => {
    const items: NavItem[] = [
      { to: '/', icon: Home, label: isFr ? 'Accueil' : 'Home' },
    ];

    // Creator/Org: create action
    if (profile === 'creator' || profile === 'org-religious') {
      items.push(
        { to: canManageCurrentOrg ? '/admin/create' : '/create-org', icon: Sparkles, label: isFr ? 'Créer' : 'Create' },
      );
    }

    // Everyone can discover
    items.push(
      { to: '/discover', icon: Store, label: isFr ? 'Découvrir' : 'Discover' },
    );

    // Earn/Share
    items.push(
      { to: '/gagner', icon: Share2, label: isFr ? 'Gagner' : 'Earn' },
    );

    // My content (creators only)
    if ((profile === 'creator' || profile === 'org-religious') && canManageCurrentOrg) {
      items.push(
        { to: '/admin/content', icon: Package, label: isFr ? 'Contenus' : 'Content' },
        { to: '/admin/sales', icon: Wallet, label: labels.sales },
      );
    }

    // Purchases for everyone
    items.push(
      { to: '/resources', icon: Package, label: isFr ? 'Achats' : 'Purchases' },
    );

    return items;
  };

  // ═══ BOTTOM ITEMS — contextual ═══
  const getBottomItems = (): NavItem[] => {
    const items: NavItem[] = [];

    if (hasOrgs && canManageCurrentOrg) {
      items.push(
        { to: '/admin/settings', icon: Settings, label: isFr ? 'Paramètres' : 'Settings' },
      );
    }

    if (isApprovedPartner) {
      items.push({ to: '/partner', icon: Handshake, label: t('sidebar.partner_space') || 'Partenaire' });
    }

    if (isSuperadmin && !isSA) {
      items.push({ to: '/superadmin', icon: Shield, label: 'Superadmin' });
    }

    return items;
  };

  const navItems = getNavItems().filter((item, idx, arr) =>
    arr.findIndex(i => i.label === item.label) === idx
  );

  const renderNavItem = (item: NavItem, index?: number) => {
    const active = isActive(item.to);
    const Icon = item.icon;
    const stableKey = `${item.label}-${index ?? item.to}`;

    const link = (
      <Link
        key={stableKey}
        to={item.to}
        aria-current={active ? 'page' : undefined}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative group',
          active
            ? 'bg-primary text-primary-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        )}
      >
        <div className="relative shrink-0">
          <Icon className="h-4 w-4" />
          {item.badge && (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive ring-2 ring-sidebar" />
          )}
        </div>
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );

    if (collapsed) {
      return (
        <Tooltip key={stableKey} delayDuration={0}>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right">
            <p className="font-semibold text-xs">{item.label}</p>
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

      <nav className="flex-1 overflow-y-auto py-2 px-2 space-y-0.5 scrollbar-hide">
        {isSA ? (
          superadminNav.map(renderNavItem)
        ) : (
          <>
            {/* Org switcher */}
            {hasOrgs && canManageCurrentOrg && (
              <OrgSwitcher variant="sidebar" collapsed={collapsed} />
            )}

            {/* Flat nav — no sections, no separators */}
            <div className="mt-1 space-y-0.5">
              {navItems.map((item, i) => renderNavItem(item, i))}
            </div>

            {/* Bottom contextual items */}
            {getBottomItems().length > 0 && (
              <>
                <div className="mx-3 my-3 border-t border-border/40" />
                <div className="space-y-0.5">
                  {getBottomItems().map(renderNavItem)}
                </div>
              </>
            )}
          </>
        )}
      </nav>

      {/* Sign out */}
      <div className={cn('border-t border-border', collapsed ? 'px-1 py-2' : 'px-3 py-3')}>
        <button
          onClick={signOut}
          className={cn(
            'flex items-center gap-3 rounded-lg text-sm font-medium transition-all w-full text-destructive hover:bg-destructive/10',
            collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'
          )}
        >
          <LogOut className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{t('sidebar.sign_out')}</span>}
        </button>
      </div>

      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 w-full border-t border-border text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
