import { Link, useLocation } from 'react-router-dom';
import { SiteLogo } from '@/components/ui/SiteLogo';
import {
  Home, Play, Bell, User, Store, Eye,
  Settings, ChevronLeft, ChevronRight, Shield,
  Megaphone, CalendarDays, ShoppingBag, Heart, Users, BarChart3, FileCheck, Link2, LogOut,
  UserPlus, ChevronDown, Wallet, LayoutDashboard, Building2,
  Share2, Package, Handshake, PenLine, Receipt, TrendingUp, MoreHorizontal,
  Camera, CreditCard, Clock, GraduationCap, MailCheck, Tag
} from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useI18n } from '@/i18n/I18nContext';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { isOrgVerifiedOrKyc, getVerifiedLabel } from '@/lib/verifiedLabel';
import { useMyPartner } from '@/hooks/usePartner';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';

interface NavItem {
  to: string;
  icon: typeof Home;
  label: string;
  desc?: string;
  comingSoon?: boolean;
}

interface NavGroup {
  label: string;
  icon: typeof Home;
  key: string;
  items: NavItem[];
  defaultOpen?: boolean;
}

export function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { user, isSuperadmin, signOut } = useAuth();
  const { currentOrg, canManage, userOrgs, getRoleFor, setCurrentOrg } = useOrg();
  const { data: unread = 0 } = useUnreadCount(user?.id);
  const { t } = useI18n();
  const { data: myPartner } = useMyPartner();
  const isApprovedPartner = myPartner?.status === 'approved';
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({
    Create: true, Sell: true,
  });
  const [showMoreTools, setShowMoreTools] = useState(false);

  const hasOrgs = userOrgs.length > 0;
  const canManageCurrentOrg = currentOrg ? canManage(currentOrg.id) : false;

  // Progressive disclosure: fetch org stats for conditional visibility
  const { data: orgStats } = useQuery({
    queryKey: ['sidebar-org-stats', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return null;
      const [{ count: productCount }, { count: saleCount }, { count: memberCount }] = await Promise.all([
        db.from('digital_products').select('*', { count: 'exact', head: true }).eq('organization_id', currentOrg.id),
        db.from('product_purchases').select('*', { count: 'exact', head: true }).eq('organization_id', currentOrg.id).eq('status', 'completed'),
        db.from('organization_members').select('*', { count: 'exact', head: true }).eq('organization_id', currentOrg.id),
      ]);
      return { products: productCount || 0, sales: saleCount || 0, members: memberCount || 0 };
    },
    enabled: !!currentOrg?.id && canManageCurrentOrg,
    staleTime: 60_000,
  });

  const hasProducts = (orgStats?.products ?? 0) > 0;
  const hasSales = (orgStats?.sales ?? 0) > 0;

  // ═══════════════════════════════════════
  // MON ESPACE — buyer/member items
  // ═══════════════════════════════════════
  const mySpaceItems: NavItem[] = [
    { to: '/dashboard', icon: Home, label: t('sidebar.home'), desc: t('sidebar.home_desc') },
    { to: '/marketplace', icon: Store, label: t('sidebar.discover'), desc: t('sidebar.discover_desc') },
    { to: '/resources', icon: Package, label: t('sidebar.purchases'), desc: t('sidebar.purchases_desc') },
    { to: '/my-donations', icon: Heart, label: t('sidebar.my_donations'), desc: t('sidebar.my_donations_desc') },
    { to: '/notifications', icon: Bell, label: t('sidebar.notifications'), desc: t('sidebar.notifications_desc') },
    { to: '/profile', icon: User, label: t('sidebar.profile'), desc: t('sidebar.profile_desc') },
  ];

  // ═══════════════════════════════════════
  // GAGNER — ambassador
  // ═══════════════════════════════════════
  const earnItems: NavItem[] = [
    { to: '/ecrire', icon: PenLine, label: t('sidebar.write'), desc: t('sidebar.write_desc') },
    { to: '/vendre', icon: Store, label: t('sidebar.sell_action'), desc: t('sidebar.sell_action_desc') },
    { to: '/affiliation', icon: Link2, label: t('sidebar.earn_sharing'), desc: t('sidebar.earn_sharing_desc') },
  ];

  // ═══════════════════════════════════════
  // ESPACE CRÉATEUR — overview
  // ═══════════════════════════════════════
  const platformOverview: NavItem[] = [
    { to: '/admin', icon: BarChart3, label: t('sidebar.overview') },
  ];

  // Build "Ma page" items — one per managed org
  const myPageItems: NavItem[] = (() => {
    const managedOrgs = userOrgs.filter((o) => {
      const role = getRoleFor(o.id);
      return role === 'owner' || role === 'admin';
    });
    if (managedOrgs.length === 1) {
      return [{ to: `/org/${managedOrgs[0].slug}/store`, icon: Eye, label: t('sidebar.my_page'), desc: t('sidebar.my_page_desc') }];
    }
    return managedOrgs.map((o) => ({
      to: `/org/${o.slug}/store`,
      icon: Eye,
      label: o.name,
      desc: t('sidebar.my_page_desc'),
    }));
  })();

  // ═══════════════════════════════════════
  // CREATOR GROUPS — progressive disclosure
  // ═══════════════════════════════════════
  const platformGroups: NavGroup[] = [
    {
      label: t('sidebar.create') || 'Créer',
      icon: PenLine,
      key: 'Create',
      defaultOpen: true,
      items: [
        { to: '/admin/products', icon: ShoppingBag, label: t('sidebar.products') },
        { to: '/admin/media', icon: Play, label: t('sidebar.media') },
        { to: '/admin/announcements', icon: Megaphone, label: t('sidebar.announcements') },
        { to: '/admin/events', icon: CalendarDays, label: t('sidebar.events') },
      ],
    },
    // Only show Sell group if org has products
    ...(hasProducts ? [{
      label: t('sidebar.sell') || 'Vendre',
      icon: Wallet,
      key: 'Sell',
      defaultOpen: true,
      items: [
        { to: '/admin/sales', icon: Receipt, label: t('sidebar.sales') },
        { to: '/admin/campaigns', icon: Heart, label: t('sidebar.campaigns') },
        { to: '/admin/affiliation', icon: Link2, label: t('sidebar.ambassadors') },
        { to: '/admin/payouts', icon: TrendingUp, label: t('sidebar.payouts') },
      ],
    }] as NavGroup[] : []),
    // Show Manage group if org has products or sales
    ...(hasProducts ? [{
      label: t('sidebar.manage') || 'Gérer',
      icon: Settings,
      key: 'Manage',
      defaultOpen: false,
      items: [
        { to: '/admin/members', icon: Users, label: t('sidebar.members') },
        ...(hasSales ? [{ to: '/admin/analytics', icon: BarChart3, label: t('sidebar.analytics') }] : []),
        { to: '/admin/kyc', icon: FileCheck, label: t('sidebar.verification') },
        { to: '/admin/settings', icon: Settings, label: t('sidebar.settings') },
      ],
    }] as NavGroup[] : [{
      label: t('sidebar.manage') || 'Gérer',
      icon: Settings,
      key: 'Manage',
      defaultOpen: false,
      items: [
        { to: '/admin/kyc', icon: FileCheck, label: t('sidebar.verification') },
        { to: '/admin/settings', icon: Settings, label: t('sidebar.settings') },
      ],
    }] as NavGroup[]),
    // "More" group — only visible on demand or if org has advanced usage
    ...(showMoreTools || hasSales ? [{
      label: t('sidebar.more') || 'Plus',
      icon: MoreHorizontal,
      key: 'More',
      defaultOpen: false,
      items: [
        { to: '/admin/photos', icon: Camera, label: t('sidebar.photos') },
        ...(hasProducts ? [{ to: '/admin/promo-codes', icon: Tag, label: t('sidebar.promo_codes') }] : []),
        { to: '/admin/subscriptions', icon: CreditCard, label: t('sidebar.subscriptions') },
        ...(hasProducts ? [{ to: '/admin/crm', icon: MailCheck, label: t('sidebar.crm') }] : []),
        { to: '/admin/notifications', icon: Bell, label: t('sidebar.notifications') },
        { to: '/admin/waitlists', icon: Clock, label: t('sidebar.waitlists') },
        { to: '/admin/programs', icon: GraduationCap, label: t('sidebar.programs') },
        { to: '/admin/offerings', icon: Heart, label: t('sidebar.offerings') },
      ],
    }] as NavGroup[] : []),
  ];

  // ═══════════════════════════════════════
  // SUPERADMIN
  // ═══════════════════════════════════════
  const superadminNav: NavItem[] = [
    { to: '/superadmin', icon: Shield, label: t('sidebar.overview') },
    { to: '/superadmin/orgs', icon: Users, label: t('sidebar.organizations') },
    { to: '/superadmin/kyc', icon: FileCheck, label: t('sidebar.kyc') },
    { to: '/superadmin/transactions', icon: BarChart3, label: t('sidebar.transactions') },
    { to: '/superadmin/reports', icon: Megaphone, label: t('sidebar.reports') },
    { to: '/superadmin/risk', icon: Shield, label: t('sidebar.risk_aml') },
    { to: '/superadmin/metrics', icon: BarChart3, label: t('sidebar.metrics') },
  ];

  const isSA = location.pathname.startsWith('/superadmin');

  const isActive = (to: string) => {
    if (to === '/admin' || to === '/superadmin') return location.pathname === to;
    return location.pathname.startsWith(to);
  };

  const toggleGroup = (key: string) => {
    setOpenGroups((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const renderNavItem = (item: NavItem) => {
    const active = !item.comingSoon && isActive(item.to);
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

  const renderSectionLabel = (icon: typeof Home, label: string, color?: string) => {
    if (collapsed) return null;
    const Icon = icon;
    return (
      <div className="flex items-center gap-2 px-3 pt-4 pb-1.5">
        <Icon className={cn('h-3.5 w-3.5', color || 'text-muted-foreground')} />
        <span className={cn('text-[10px] font-bold uppercase tracking-widest', color || 'text-muted-foreground')}>{label}</span>
      </div>
    );
  };

  const renderGroups = (groups: NavGroup[]) => (
    <>
      {groups.map((group) => {
        const hasActiveItem = group.items.some(i => isActive(i.to));
        const isOpen = openGroups[group.key] ?? group.defaultOpen ?? hasActiveItem;

        return (
          <div key={group.key} className="mt-1">
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

  return (
    <aside
      className={cn(
        'h-screen sticky top-0 flex flex-col border-r border-border bg-sidebar transition-all duration-300 overflow-hidden',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      <div className={cn('flex items-center h-16 px-4 border-b border-border', collapsed && 'justify-center px-0')}>
        <SiteLogo size={collapsed ? 'sm' : 'md'} animate />
      </div>

      {hasOrgs && currentOrg && !collapsed && (
        <div className="mx-3 mt-3">
          {(() => {
            const managedOrgs = userOrgs.filter((o) => {
              const role = getRoleFor(o.id);
              return role === 'owner' || role === 'admin';
            });
            return managedOrgs.length > 1 ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full p-2 rounded-lg bg-primary/10 border border-primary/20 hover:bg-primary/15 transition-colors text-left group">
                    <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{t('sidebar.managing')}</p>
                    <div className="flex items-center justify-between">
                      <p className="text-xs font-semibold text-primary truncate flex items-center gap-1">{currentOrg.name} {isOrgVerifiedOrKyc(currentOrg.is_verified, (currentOrg as any).kyc_status) && <VerifiedBadge size="xs" showTooltip={false} />}</p>
                      <ChevronDown className="h-3 w-3 text-primary shrink-0 group-hover:translate-y-0.5 transition-transform" />
                    </div>
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-52">
                  {managedOrgs.map((o) => (
                    <DropdownMenuItem
                      key={o.id}
                      onClick={() => setCurrentOrg(o)}
                      className={cn('text-xs', o.id === currentOrg.id && 'text-primary font-semibold')}
                    >
                      <span className="flex items-center gap-1">{o.name} {isOrgVerifiedOrKyc(o.is_verified, (o as any).kyc_status) && <VerifiedBadge size="xs" showTooltip={false} />}</span>
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="p-2 rounded-lg bg-primary/10 border border-primary/20">
                <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">{t('sidebar.managing')}</p>
                <p className="text-xs font-semibold text-primary truncate flex items-center gap-1">{currentOrg.name} {isOrgVerifiedOrKyc(currentOrg.is_verified, (currentOrg as any).kyc_status) && <VerifiedBadge size="xs" showTooltip={false} />}</p>
              </div>
            );
          })()}
        </div>
      )}

      <nav className="flex-1 overflow-y-auto py-1 px-2 space-y-0.5 scrollbar-hide">
        {isSA ? (
          superadminNav.map(renderNavItem)
        ) : (
          <>
            {renderSectionLabel(Home, t('sidebar.my_space'))}
            <div className="space-y-0.5">
              {mySpaceItems.map(renderNavItem)}
            </div>

            {renderSectionLabel(Share2, t('sidebar.write_sell_earn'), 'text-emerald-500')}
            <div className="space-y-0.5">
              {earnItems.map(renderNavItem)}
            </div>

            {isApprovedPartner && (
              <>
                {renderSectionLabel(Handshake, t('sidebar.partner'), 'text-blue-500')}
                <div className="space-y-0.5">
                  {renderNavItem({ to: '/partner', icon: Handshake, label: t('sidebar.partner_space'), desc: t('sidebar.partner_space_desc') })}
                </div>
              </>
            )}

            {hasOrgs && canManageCurrentOrg && (
              <>
                {renderSectionLabel(Building2, t('sidebar.creator_space'), 'text-primary')}
                <div className="space-y-0.5">
                  {platformOverview.map(renderNavItem)}
                  {myPageItems.length > 0 && (
                    myPageItems.length === 1
                      ? myPageItems.map(renderNavItem)
                      : <>
                          {!collapsed && (
                            <p className="px-3 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{t('sidebar.my_page')}</p>
                          )}
                          {myPageItems.map(renderNavItem)}
                        </>
                  )}
                </div>
                {renderGroups(platformGroups)}
                {!showMoreTools && !hasSales && !collapsed && (
                  <button
                    onClick={() => setShowMoreTools(true)}
                    className="flex items-center gap-2 px-3 py-2 mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors w-full"
                  >
                    <MoreHorizontal className="h-3 w-3" />
                    {t('sidebar.more') || 'Plus d\'outils'}
                  </button>
                )}
              </>
            )}
          </>
        )}

        {isSuperadmin && !isSA && !collapsed && (
          <div className="mt-3">
            {renderNavItem({ to: '/superadmin', icon: Shield, label: 'Superadmin' })}
          </div>
        )}
      </nav>

      <div className={cn('border-t border-border space-y-0.5', collapsed ? 'px-1 py-2' : 'px-3 py-3')}>
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
