import { Link, useLocation, useNavigate } from 'react-router-dom';
import { SiteLogo } from '@/components/ui/SiteLogo';
import {
  Home, Eye, Settings, ChevronLeft, ChevronRight, Shield,
  FileCheck, LogOut, BarChart3, Building2, Users, Wallet,
  Store, Package, User, Handshake, Plus, Share2,
  Sparkles, Coins, GraduationCap, Bookmark, Star, Zap, Rss,
  ArrowLeftRight, ShoppingBag
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
import { useUserMode, MODE_LABELS, UserMode } from '@/contexts/UserModeContext';

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
  const { mode, setMode } = useUserMode();
  const isFr = locale === 'fr';

  const hasOrgs = userOrgs.length > 0;
  const canManageCurrentOrg = currentOrg ? canManage(currentOrg.id) : false;

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

  const myPageItem: NavItem | null = (() => {
    if (!currentOrg || !canManageCurrentOrg) return null;
    return { to: `/org/${currentOrg.slug}/store`, icon: Eye, label: isFr ? 'Ma page' : 'My Page' };
  })();

  const isSA = location.pathname.startsWith('/superadmin');

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

  // ═══ MODE-SPECIFIC NAV ITEMS ═══
  const getModeNavItems = (): NavItem[] => {
    const common: NavItem[] = [
      { to: '/dashboard', icon: Home, label: isFr ? 'Accueil' : 'Home' },
    ];

    const purchasesItems: NavItem[] = [
      { to: '/resources', icon: Package, label: isFr ? 'Mes achats' : 'My Purchases' },
      { to: '/my-programs', icon: GraduationCap, label: isFr ? 'Mes cours' : 'My Courses' },
      { to: '/discover', icon: Store, label: isFr ? 'Découvrir' : 'Discover' },
      { to: '/bookmarks', icon: Bookmark, label: isFr ? 'Favoris' : 'Bookmarks' },
      { to: '/profile', icon: User, label: isFr ? 'Profil' : 'Profile' },
    ];

    const sellItems: NavItem[] = [
      ...(myPageItem ? [myPageItem] : []),
      { to: '/resources', icon: Package, label: isFr ? 'Mes achats' : 'My Purchases' },
      { to: '/my-programs', icon: GraduationCap, label: isFr ? 'Mes cours' : 'My Courses' },
      { to: '/admin/create', icon: Plus, label: 'Viral AI Studio' },
      { to: '/admin/viral-tools', icon: Zap, label: 'Viral Tools' },
      { to: '/credits', icon: Coins, label: isFr ? 'Crédits' : 'Credits' },
      { to: '/admin/sales', icon: Wallet, label: isFr ? 'Ventes & revenus' : 'Sales & Revenue' },
      { to: '/admin/analytics', icon: BarChart3, label: isFr ? 'Analytics' : 'Analytics' },
      { to: '/admin/people', icon: Users, label: isFr ? 'Membres' : 'Members' },
      { to: '/admin/kyc', icon: FileCheck, label: isFr ? 'Vérification' : 'Verification', badge: canManageCurrentOrg && kycIncomplete },
      { to: '/admin/settings', icon: Settings, label: isFr ? 'Paramètres' : 'Settings' },
    ];

    const earnItems: NavItem[] = [
      { to: '/spotlight', icon: Star, label: isFr ? 'Spotlight' : 'Spotlight' },
      { to: '/discover', icon: Store, label: isFr ? 'Découvrir' : 'Discover' },
      { to: '/resources', icon: Package, label: isFr ? 'Mes achats' : 'My Purchases' },
      { to: '/my-programs', icon: GraduationCap, label: isFr ? 'Mes cours' : 'My Courses' },
      { to: '/feed', icon: Rss, label: isFr ? 'Mon Réseau' : 'My Network' },
      { to: '/bookmarks', icon: Bookmark, label: isFr ? 'Favoris' : 'Bookmarks' },
      { to: '/affiliation', icon: Share2, label: isFr ? 'Mes liens' : 'My Links' },
      { to: '/profile', icon: User, label: isFr ? 'Profil' : 'Profile' },
    ];

    const createItems: NavItem[] = [
      ...(myPageItem ? [myPageItem] : []),
      { to: '/resources', icon: Package, label: isFr ? 'Mes achats' : 'My Purchases' },
      { to: '/my-programs', icon: GraduationCap, label: isFr ? 'Mes cours' : 'My Courses' },
      { to: '/admin/create', icon: Sparkles, label: 'Viral AI Studio' },
      { to: '/admin/viral-tools', icon: Zap, label: 'Viral Tools' },
      { to: '/credits', icon: Coins, label: isFr ? 'Crédits' : 'Credits' },
      { to: '/admin/sales', icon: Wallet, label: isFr ? 'Ventes & revenus' : 'Sales & Revenue' },
      { to: '/admin/analytics', icon: BarChart3, label: isFr ? 'Analytics' : 'Analytics' },
      { to: '/admin/people', icon: Users, label: isFr ? 'Membres' : 'Members' },
      { to: '/admin/kyc', icon: FileCheck, label: isFr ? 'Vérification' : 'Verification', badge: canManageCurrentOrg && kycIncomplete },
      { to: '/admin/settings', icon: Settings, label: isFr ? 'Paramètres' : 'Settings' },
    ];

    switch (mode) {
      case 'purchases': return [...common, ...purchasesItems];
      case 'sell': return [...common, ...sellItems];
      case 'earn': return [...common, ...earnItems];
      case 'create': return [...common, ...createItems];
      default: return [...common, ...purchasesItems];
    }
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

  const modeLabel = mode ? MODE_LABELS[mode] : null;

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
            {/* Mode label */}
            {modeLabel && !collapsed && (
              <div className="px-3 pt-3 pb-1">
                <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                  {modeLabel.emoji} {isFr ? modeLabel.fr : modeLabel.en}
                </span>
              </div>
            )}

            {/* Org switcher for sell/create modes */}
            {(mode === 'sell' || mode === 'create') && hasOrgs && canManageCurrentOrg && (
              <OrgSwitcher variant="sidebar" collapsed={collapsed} />
            )}

            {/* Mode-specific nav */}
            <div className="mt-1 space-y-0.5">
              {getModeNavItems().map(renderNavItem)}
            </div>

            {isApprovedPartner && (
              <>
                <div className="mx-3 my-2 border-t border-border/50" />
                {renderNavItem({ to: '/partner', icon: Handshake, label: t('sidebar.partner_space') || 'Partenaire' })}
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

      {/* Footer: Switch mode + Sign out */}
      <div className={cn('border-t border-border space-y-0.5', collapsed ? 'px-1 py-2' : 'px-3 py-3')}>
        {/* Switch mode button */}
        <button
          onClick={() => navigate('/welcome')}
          className={cn(
            'flex items-center gap-3 rounded-lg text-sm font-medium transition-all w-full text-muted-foreground hover:bg-sidebar-accent hover:text-foreground',
            collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'
          )}
        >
          <ArrowLeftRight className="h-4 w-4 shrink-0" />
          {!collapsed && <span>{isFr ? 'Mon Espace' : 'My Space'}</span>}
        </button>

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
