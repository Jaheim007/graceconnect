import { Link, useLocation } from 'react-router-dom';
import { SiteLogo } from '@/components/ui/SiteLogo';
import {
  Home, Play, Bell, User, BookOpen, Store,
  Settings, ChevronLeft, ChevronRight, Shield, Handshake, HandHeart,
  Megaphone, CalendarDays, ShoppingBag, Heart, Users, BarChart3, FileCheck, Link2, Sun, Moon,
  UserPlus, Camera, ChevronDown, Wallet, LifeBuoy, ShieldAlert, LayoutDashboard, Building2,
  Trophy, CreditCard, Clock, Sparkles, GraduationCap, Share2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useMode } from '@/contexts/ModeContext';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useTheme } from '@/contexts/ThemeContext';
import { useI18n } from '@/i18n/I18nContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';

interface NavItem {
  to: string;
  icon: typeof Home;
  label: string;
  desc?: string;
}

interface NavGroup {
  label: string;
  icon: typeof Home;
  key: string;
  items: NavItem[];
}

export function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { user, isSuperadmin } = useAuth();
  const { currentOrg, canManage, userOrgs, getRoleFor } = useOrg();
  const { mode } = useMode();
  const { data: unread = 0 } = useUnreadCount(user?.id);
  const { theme, toggleTheme } = useTheme();
  const { t } = useI18n();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Content: true, Commerce: true, Management: true,
  });

  const isAdmin = location.pathname.startsWith('/admin');
  const isSA = location.pathname.startsWith('/superadmin');
  const canManageCurrentOrg = currentOrg ? canManage(currentOrg.id) : false;

  const ownedOrgs = useMemo(
    () => userOrgs.filter(o => ['owner', 'admin'].includes(getRoleFor(o.id) || '')),
    [userOrgs, getRoleFor]
  );

  // ── MODE AMBASSADOR nav ──
  const ambassadorItems: NavItem[] = [
    { to: '/marketplace', icon: Store, label: 'Marketplace', desc: 'Explorez et partagez des produits' },
    { to: '/affiliation', icon: Link2, label: 'Mes liens', desc: 'Vos liens de partage et commissions' },
    { to: '/dashboard', icon: Wallet, label: 'Mes gains', desc: 'Commissions et retraits' },
    { to: '/resources', icon: BookOpen, label: 'Mes achats', desc: 'Vos téléchargements' },
    { to: '/leaderboard', icon: Trophy, label: 'Classement', desc: 'Top ambassadeurs' },
    { to: '/profile', icon: User, label: 'Profil', desc: 'Votre compte' },
    { to: '/support', icon: LifeBuoy, label: 'Aide', desc: 'Besoin d\'aide ?' },
  ];

  // ── MODE CREATOR nav (no org selected → CTA) ──
  const creatorItemsNoOrg: NavItem[] = [
    { to: '/create-org', icon: Building2, label: 'Créer mon centre', desc: 'Lancez votre plateforme' },
    { to: '/marketplace', icon: Store, label: 'Marketplace', desc: 'Explorer les produits' },
    { to: '/profile', icon: User, label: 'Profil', desc: 'Votre compte' },
  ];

  const adminGroups: NavGroup[] = [
    {
      label: t('sidebar.content'),
      icon: Play,
      key: 'Content',
      items: [
        { to: '/admin/media', icon: Play, label: t('sidebar.media') },
        { to: '/admin/photos', icon: Camera, label: t('sidebar.photos') },
        { to: '/admin/announcements', icon: Megaphone, label: t('sidebar.announcements') },
        { to: '/admin/events', icon: CalendarDays, label: t('sidebar.events') },
      ],
    },
    {
      label: t('sidebar.commerce'),
      icon: ShoppingBag,
      key: 'Commerce',
      items: [
        { to: '/admin/products', icon: ShoppingBag, label: t('sidebar.products') },
        { to: '/admin/offerings', icon: HandHeart, label: 'Dons' },
        { to: '/admin/campaigns', icon: Heart, label: t('sidebar.campaigns') },
        { to: '/admin/affiliation', icon: Link2, label: 'Ambassadeurs' },
        { to: '/admin/promo-codes', icon: FileCheck, label: t('sidebar.promo_codes') },
        { to: '/admin/subscriptions', icon: CreditCard, label: t('sidebar.subscriptions') },
        { to: '/admin/sales', icon: Wallet, label: 'Mes Ventes' },
        { to: '/admin/waitlists', icon: Clock, label: t('sidebar.waitlists') },
        { to: '/admin/webhooks', icon: Link2, label: 'Webhooks' },
      ],
    },
    {
      label: t('sidebar.management'),
      icon: Settings,
      key: 'Management',
      items: [
        { to: '/admin/members', icon: Users, label: t('sidebar.members') },
        { to: '/admin/crm', icon: UserPlus, label: t('sidebar.crm') },
        { to: '/admin/notifications', icon: Bell, label: t('sidebar.notifications') },
        { to: '/admin/payouts', icon: Wallet, label: t('sidebar.payouts') },
        { to: '/admin/analytics', icon: BarChart3, label: t('sidebar.analytics') },
        { to: '/admin/kyc', icon: FileCheck, label: t('sidebar.verification') },
        { to: '/admin/settings', icon: Settings, label: t('sidebar.settings') },
        { to: '/admin/experiments', icon: Sparkles, label: 'Tests A/B' },
        { to: '/admin/programs', icon: GraduationCap, label: 'Programmes' },
      ],
    },
  ];

  const superadminNav: NavItem[] = [
    { to: '/superadmin', icon: Shield, label: t('sidebar.overview') },
    { to: '/superadmin/orgs', icon: Users, label: t('sidebar.organizations') },
    { to: '/superadmin/kyc', icon: FileCheck, label: t('sidebar.kyc') },
    { to: '/superadmin/transactions', icon: BarChart3, label: t('sidebar.transactions') },
    { to: '/superadmin/reports', icon: Megaphone, label: t('sidebar.reports') },
    { to: '/superadmin/risk', icon: ShieldAlert, label: t('sidebar.risk_aml') },
    { to: '/superadmin/metrics', icon: BarChart3, label: t('sidebar.metrics') },
  ];

  const isActive = (to: string) => {
    if (to === '/admin' || to === '/superadmin') return location.pathname === to;
    return location.pathname.startsWith(to);
  };

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.to);
    const showBadge = item.to === '/notifications' && unread > 0;
    const Icon = item.icon;

    const link = (
      <Link
        key={item.to}
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
          {showBadge && <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-destructive" />}
        </div>
        {!collapsed && <span className="truncate">{item.label}</span>}
      </Link>
    );

    if (collapsed || item.desc) {
      return (
        <Tooltip key={item.to} delayDuration={collapsed ? 0 : 400}>
          <TooltipTrigger asChild>{link}</TooltipTrigger>
          <TooltipContent side="right" className="max-w-[220px]">
            <p className="font-semibold text-xs">{item.label}</p>
            {item.desc && <p className="text-[11px] text-muted-foreground mt-0.5">{item.desc}</p>}
          </TooltipContent>
        </Tooltip>
      );
    }

    return link;
  };

  const renderGroups = (groups: NavGroup[]) => (
    <>
      {groups.map((group) => {
        const hasActiveItem = group.items.some(i => isActive(i.to));
        const isOpen = openGroups[group.key] ?? hasActiveItem;

        return (
          <div key={group.key} className="mt-3">
            {!collapsed ? (
              <>
                <button
                  onClick={() => toggleGroup(group.key)}
                  className="flex items-center justify-between w-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                >
                  {group.label}
                  <ChevronDown className={cn('h-3 w-3 transition-transform', isOpen && 'rotate-180')} />
                </button>
                {isOpen && (
                  <div className="space-y-0.5 mt-0.5">
                    {group.items.map(renderNavItem)}
                  </div>
                )}
              </>
            ) : (
              <div className="space-y-0.5">
                {group.items.map(renderNavItem)}
              </div>
            )}
          </div>
        );
      })}
    </>
  );

  // Determine which items to show based on mode
  const getMainItems = () => {
    if (mode === 'creator') {
      if (canManageCurrentOrg) return []; // Show admin groups instead
      return creatorItemsNoOrg;
    }
    return ambassadorItems;
  };

  const mainItems = getMainItems();
  const showAdminInCreatorMode = mode === 'creator' && canManageCurrentOrg;

  return (
    <aside
      className={cn(
        'h-screen sticky top-0 flex flex-col border-r border-border bg-sidebar transition-all duration-300 overflow-hidden',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-border', collapsed && 'justify-center px-0')}>
        <SiteLogo size={collapsed ? 'sm' : 'md'} animate />
      </div>

      {/* Mode label */}
      {!collapsed && !isAdmin && !isSA && (
        <div className="mx-3 mt-3 px-3 py-1.5">
          <div className="flex items-center gap-2">
            {mode === 'ambassador' ? (
              <>
                <Share2 className="h-3.5 w-3.5 text-accent" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-accent">Espace Ambassadeur</span>
              </>
            ) : (
              <>
                <Building2 className="h-3.5 w-3.5 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Espace Créateur</span>
              </>
            )}
          </div>
        </div>
      )}

      {/* Org context (admin/creator mode) */}
      {(isAdmin || showAdminInCreatorMode) && currentOrg && !collapsed && (
        <div className="mx-3 mt-2 p-2 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{t('sidebar.managing')}</p>
          <p className="text-xs font-semibold text-primary truncate">{currentOrg.name}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-hide">
        {isSA ? (
          superadminNav.map(renderNavItem)
        ) : isAdmin ? (
          <>
            {renderNavItem({ to: '/admin', icon: BarChart3, label: t('sidebar.overview') })}
            {renderGroups(adminGroups)}
          </>
        ) : showAdminInCreatorMode ? (
          <>
            {/* Creator mode with org: show admin nav directly */}
            {renderNavItem({ to: '/admin', icon: LayoutDashboard, label: 'Vue d\'ensemble' })}
            {renderGroups(adminGroups)}
            <div className="mt-4 space-y-0.5">
              {renderNavItem({ to: '/marketplace', icon: Store, label: 'Marketplace' })}
              {renderNavItem({ to: '/profile', icon: User, label: 'Profil' })}
            </div>
          </>
        ) : (
          <>
            <div className="space-y-0.5">
              {mainItems.map(renderNavItem)}
            </div>

            {/* In ambassador mode, show "Gérer ma plateforme" shortcut if has org */}
            {mode === 'ambassador' && canManageCurrentOrg && !collapsed && (
              <div className="mt-3 mx-1">
                <Link
                  to="/admin"
                  className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 bg-primary/10 text-primary hover:bg-primary/20 border border-primary/20"
                >
                  <Settings className="h-4 w-4 shrink-0" />
                  <span className="truncate">Gérer ma plateforme</span>
                </Link>
              </div>
            )}

            {/* Owned orgs list (creator mode only, no active org) */}
            {mode === 'creator' && ownedOrgs.length > 0 && !canManageCurrentOrg && !collapsed && (
              <div className="mt-3 mx-1">
                <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                  🏢 Mes plateformes
                </p>
                <div className="space-y-0.5 mt-0.5">
                  {ownedOrgs.map(org => (
                    <Link
                      key={org.id}
                      to={`/org/${org.slug}`}
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    >
                      {org.logo_url ? (
                        <img src={org.logo_url} alt="" className="h-5 w-5 rounded object-cover shrink-0" />
                      ) : (
                        <Building2 className="h-4 w-4 shrink-0" />
                      )}
                      <span className="truncate">{org.name}</span>
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {/* Superadmin link */}
            {isSuperadmin && !collapsed && (
              <div className="mt-3">
                {renderNavItem({ to: '/superadmin', icon: Shield, label: 'Superadmin', desc: 'Panneau superadmin' })}
              </div>
            )}
          </>
        )}
      </nav>

      {/* Bottom */}
      <div className={cn('border-t border-border space-y-0.5', collapsed ? 'px-1 py-2' : 'px-3 py-3')}>
        <button
          onClick={toggleTheme}
          className={cn(
            'flex items-center gap-3 rounded-lg text-sm font-medium transition-all w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'
          )}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
          {!collapsed && <span>{theme === 'dark' ? t('sidebar.light_mode') : t('sidebar.dark_mode')}</span>}
        </button>

        {(isAdmin || isSA) && (
          <Link
            to="/marketplace"
            className={cn(
              'flex items-center gap-3 rounded-lg text-sm font-medium transition-all text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'
            )}
          >
            <Home className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{t('sidebar.back_to_app')}</span>}
          </Link>
        )}
      </div>

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 w-full border-t border-border text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
