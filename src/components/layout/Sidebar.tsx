import { Link, useLocation } from 'react-router-dom';
import { SiteLogo } from '@/components/ui/SiteLogo';
import {
  Home, Eye, Settings, ChevronLeft, ChevronRight, Shield,
  FileCheck, LogOut, BarChart3, Building2, Users, Wallet,
  PenLine, Store, Package, User, Heart, Handshake, Plus, Share2,
  Sparkles, Coins, GraduationCap, Bookmark, Star
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

interface NavItem {
  to: string;
  icon: typeof Home;
  label: string;
  desc?: string;
  badge?: boolean;
}

export function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { user, isSuperadmin, signOut } = useAuth();
  const { currentOrg, canManage, userOrgs } = useOrg();
  const { t } = useI18n();
  const { data: myPartner } = useMyPartner();
  const isApprovedPartner = myPartner?.status === 'approved';

  const hasOrgs = userOrgs.length > 0;
  const canManageCurrentOrg = currentOrg ? canManage(currentOrg.id) : false;

  // Check KYC status for verification badge
  const { data: kycStatus } = useQuery({
    queryKey: ['sidebar-kyc-status', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return null;
      const { data } = await db
        .from('organizations')
        .select('kyc_status')
        .eq('id', currentOrg.id)
        .single();
      return data?.kyc_status || 'none';
    },
    enabled: !!currentOrg?.id && canManageCurrentOrg,
    staleTime: 120_000,
  });

  const kycIncomplete = !kycStatus || kycStatus === 'none' || kycStatus === 'pending';

  // Single "My Page" link for the current org
  const myPageItem: NavItem | null = (() => {
    if (!currentOrg || !canManageCurrentOrg) return null;
    return { to: `/org/${currentOrg.slug}/store`, icon: Eye, label: t('sidebar.my_page'), desc: t('sidebar.my_page_desc') };
  })();

  const isSA = location.pathname.startsWith('/superadmin');

  // ═══ SUPERADMIN NAV ═══
  const superadminNav: NavItem[] = [
    { to: '/superadmin', icon: Shield, label: t('sidebar.overview') },
    { to: '/superadmin/orgs', icon: Users, label: t('sidebar.organizations') },
    { to: '/superadmin/kyc', icon: FileCheck, label: t('sidebar.kyc') },
    { to: '/superadmin/transactions', icon: BarChart3, label: t('sidebar.transactions') },
  ];

  const isActive = (to: string) => {
    if (to === '/admin' || to === '/dashboard' || to === '/superadmin') return location.pathname === to;
    return location.pathname.startsWith(to);
  };

  const renderNavItem = (item: NavItem) => {
    const active = isActive(item.to);
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
          {item.badge && (
            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-destructive ring-2 ring-sidebar" />
          )}
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

  const renderSectionLabel = (label: string, color?: string) => {
    if (collapsed) return null;
    return (
      <div className="px-3 pt-5 pb-1.5">
        <span className={cn('text-[10px] font-bold uppercase tracking-widest', color || 'text-muted-foreground')}>{label}</span>
      </div>
    );
  };

  const renderSeparator = () => (
    <div className="mx-3 my-2 border-t border-border/50" />
  );

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

      <nav className="flex-1 overflow-y-auto py-1 px-2 space-y-0.5 scrollbar-hide">
        {isSA ? (
          superadminNav.map(renderNavItem)
        ) : (
          <>
            {/* ═══ CREATOR ZONE ═══ */}
            {hasOrgs && canManageCurrentOrg ? (
              <>
                {renderSectionLabel(t('sidebar.creator_space'), 'text-primary')}
                <OrgSwitcher variant="sidebar" collapsed={collapsed} />
                <div className="mt-3 space-y-0.5">
                  {renderNavItem({ to: '/dashboard', icon: Home, label: t('sidebar.home'), desc: t('sidebar.home_desc') })}
                  {myPageItem && renderNavItem(myPageItem)}
                  {renderNavItem({ to: '/admin/create', icon: Plus, label: 'Viral AI Studio', desc: t('sidebar.create_desc') })}
                  {renderNavItem({ to: '/admin/sales', icon: Wallet, label: t('sidebar.sales_payouts'), desc: t('sidebar.sales_payouts_desc') })}
                  {renderNavItem({ to: '/admin/people', icon: Users, label: t('sidebar.people'), desc: t('sidebar.people_desc') })}
                  {renderNavItem({ to: '/admin/affiliation', icon: Share2, label: t('sidebar.ambassadors'), desc: t('sidebar.ambassadors_desc') })}
                  {renderNavItem({ to: '/admin/viral-tools', icon: Zap, label: 'Viral Tools', desc: t('sidebar.viral_tools_desc') })}
                  {renderNavItem({ to: '/admin/analytics', icon: BarChart3, label: t('sidebar.analytics') })}
                  {renderNavItem({ to: '/admin/kyc', icon: FileCheck, label: t('sidebar.verification'), badge: kycIncomplete })}
                  {renderNavItem({ to: '/admin/settings', icon: Settings, label: t('sidebar.settings') })}
                </div>

                {isApprovedPartner && (
                  <>
                    {renderSeparator()}
                    {renderNavItem({ to: '/partner', icon: Handshake, label: t('sidebar.partner_space'), desc: t('sidebar.partner_space_desc') })}
                  </>
                )}

                {/* ═══ CONSUMER ZONE ═══ */}
                {renderSeparator()}
                <div className="space-y-0.5">
                  {renderNavItem({ to: '/discover', icon: Store, label: t('sidebar.discover'), desc: t('sidebar.discover_desc') })}
                  {renderNavItem({ to: '/spotlight', icon: Star, label: t('sidebar.spotlight'), desc: t('sidebar.spotlight_desc') })}
                  {renderNavItem({ to: user ? '/affiliation' : '/gagner', icon: Share2, label: t('sidebar.earn_sharing'), desc: t('sidebar.earn_sharing_desc') })}
                  {renderNavItem({ to: '/resources', icon: Package, label: t('sidebar.purchases'), desc: t('sidebar.purchases_desc') })}
                  {renderNavItem({ to: '/my-programs', icon: GraduationCap, label: t('sidebar.my_programs'), desc: t('sidebar.my_programs_desc') })}
                  {renderNavItem({ to: '/credits', icon: Coins, label: t('sidebar.credits'), desc: t('sidebar.credits_desc') })}
                  {renderNavItem({ to: '/bookmarks', icon: Bookmark, label: t('sidebar.bookmarks'), desc: t('sidebar.bookmarks_desc') })}
                  {renderNavItem({ to: '/profile', icon: User, label: t('sidebar.profile'), desc: t('sidebar.profile_desc') })}
                </div>
              </>
            ) : (
              <>
                {/* ═══ NON-CREATOR: simple nav ═══ */}
                {renderSectionLabel(t('sidebar.my_space'))}
                <div className="space-y-0.5">
                  {renderNavItem({ to: '/dashboard', icon: Home, label: t('sidebar.home'), desc: t('sidebar.home_desc') })}
                  {renderNavItem({ to: '/discover', icon: Store, label: t('sidebar.discover'), desc: t('sidebar.discover_desc') })}
                  {renderNavItem({ to: '/spotlight', icon: Star, label: t('sidebar.spotlight'), desc: t('sidebar.spotlight_desc') })}
                  {renderNavItem({ to: '/resources', icon: Package, label: t('sidebar.purchases'), desc: t('sidebar.purchases_desc') })}
                  {renderNavItem({ to: '/my-programs', icon: GraduationCap, label: t('sidebar.my_programs'), desc: t('sidebar.my_programs_desc') })}
                  {renderNavItem({ to: '/my-donations', icon: Heart, label: t('sidebar.my_donations'), desc: t('sidebar.my_donations_desc') })}
                  {renderNavItem({ to: '/credits', icon: Coins, label: t('sidebar.credits'), desc: t('sidebar.credits_desc') })}
                  {renderNavItem({ to: '/bookmarks', icon: Bookmark, label: t('sidebar.bookmarks'), desc: t('sidebar.bookmarks_desc') })}
                  {renderNavItem({ to: '/profile', icon: User, label: t('sidebar.profile'), desc: t('sidebar.profile_desc') })}
                </div>

                {/* Write/Sell/Earn section */}
                {renderSeparator()}
                {renderSectionLabel(t('sidebar.write_sell_earn'), 'text-emerald-500')}
                <div className="space-y-0.5">
                  {renderNavItem({ to: '/ecrire', icon: PenLine, label: t('sidebar.write'), desc: t('sidebar.write_desc') })}
                  {renderNavItem({ to: user ? '/create-org' : '/vendre', icon: Store, label: t('sidebar.sell_action'), desc: t('sidebar.sell_action_desc') })}
                  {renderNavItem({ to: user ? '/affiliation' : '/gagner', icon: Wallet, label: t('sidebar.earn_sharing'), desc: t('sidebar.earn_sharing_desc') })}
                </div>

                {isApprovedPartner && (
                  <>
                    {renderSeparator()}
                    {renderNavItem({ to: '/partner', icon: Handshake, label: t('sidebar.partner_space'), desc: t('sidebar.partner_space_desc') })}
                  </>
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

      {/* Footer */}
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
