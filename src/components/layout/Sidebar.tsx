import { Link, useLocation } from 'react-router-dom';
import {
  Home, Compass, Play, Bell, User, BookOpen, Store,
  Settings, ChevronLeft, ChevronRight, Shield,
  Megaphone, CalendarDays, ShoppingBag, Heart, Users, BarChart3, FileCheck, Link2, Sun, Moon,
  GraduationCap, UserPlus, Camera, ChevronDown, Wallet, LifeBuoy, ShieldAlert
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useTheme } from '@/contexts/ThemeContext';

const mainNav = [
  { to: '/feed', icon: Home, label: 'Accueil' },
  { to: '/discover', icon: Compass, label: 'Explorer' },
  { to: '/reels', icon: Play, label: 'Reels' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/dashboard', icon: BookOpen, label: 'Tableau de bord' },
  { to: '/support', icon: LifeBuoy, label: 'Support' },
  { to: '/profile', icon: User, label: 'Mon Compte' },
];

type AdminGroup = { label: string; items: { to: string; icon: typeof Home; label: string }[] };

const adminGroups: AdminGroup[] = [
  {
    label: 'Contenu',
    items: [
      { to: '/admin/media', icon: Play, label: 'Médias' },
      { to: '/admin/photos', icon: Camera, label: 'Photos' },
      { to: '/admin/announcements', icon: Megaphone, label: 'Annonces' },
      { to: '/admin/events', icon: CalendarDays, label: 'Événements' },
      { to: '/admin/programs', icon: GraduationCap, label: 'Programmes' },
    ],
  },
  {
    label: 'Commerce',
    items: [
      { to: '/admin/products', icon: ShoppingBag, label: 'Boutique' },
      { to: '/admin/campaigns', icon: Heart, label: 'Campagnes' },
      { to: '/admin/affiliation', icon: Link2, label: 'Affiliation' },
      { to: '/admin/promo-codes', icon: FileCheck, label: 'Codes promo' },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { to: '/admin/members', icon: Users, label: 'Membres' },
      { to: '/admin/crm', icon: UserPlus, label: 'CRM' },
      { to: '/admin/payouts', icon: Wallet, label: 'Retraits' },
      { to: '/admin/analytics', icon: BarChart3, label: 'Analytiques' },
      { to: '/admin/kyc', icon: FileCheck, label: 'Vérification' },
      { to: '/admin/settings', icon: Settings, label: 'Paramètres' },
    ],
  },
];

const superadminNav = [
  { to: '/superadmin', icon: Shield, label: 'Vue d\'ensemble' },
  { to: '/superadmin/orgs', icon: Users, label: 'Organisations' },
  { to: '/superadmin/kyc', icon: FileCheck, label: 'KYC' },
  { to: '/superadmin/transactions', icon: BarChart3, label: 'Transactions' },
  { to: '/superadmin/reports', icon: Megaphone, label: 'Signalements' },
  { to: '/superadmin/risk', icon: ShieldAlert, label: 'Risk & AML' },
  { to: '/superadmin/metrics', icon: BarChart3, label: 'Métriques' },
];

export function Sidebar() {
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const { user, isSuperadmin } = useAuth();
  const { currentOrg, canManage } = useOrg();
  const { data: unread = 0 } = useUnreadCount(user?.id);
  const { theme, toggleTheme } = useTheme();
  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ Contenu: true, Commerce: true, Gestion: true });

  const isAdmin = location.pathname.startsWith('/admin');
  const isSA = location.pathname.startsWith('/superadmin');
  const canManageCurrentOrg = currentOrg ? canManage(currentOrg.id) : false;

  const isActive = (to: string) => {
    if (to === '/admin' || to === '/superadmin') return location.pathname === to;
    return location.pathname.startsWith(to);
  };

  const toggleGroup = (label: string) => {
    setOpenGroups((prev) => ({ ...prev, [label]: !prev[label] }));
  };

  const renderNavItem = (item: { to: string; icon: typeof Home; label: string }) => {
    const active = isActive(item.to);
    const showBadge = item.label === 'Notifications' && unread > 0;
    const Icon = item.icon;
    return (
      <Link
        key={item.to}
        to={item.to}
        title={collapsed ? item.label : undefined}
        className={cn(
          'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative group',
          active
            ? 'bg-primary text-primary-foreground'
            : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
        )}
      >
        <div className="relative shrink-0">
          <Icon className="h-4 w-4" />
          {showBadge && (
            <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-destructive" />
          )}
        </div>
        {!collapsed && <span className="truncate">{item.label}</span>}
        {collapsed && (
          <div className="absolute left-full ml-2 px-2 py-1 bg-popover border border-border rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-elevated">
            {item.label}
          </div>
        )}
      </Link>
    );
  };

  return (
    <aside
      className={cn(
        'h-screen sticky top-0 flex flex-col border-r border-border bg-sidebar transition-all duration-300 overflow-hidden',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-border', collapsed && 'justify-center px-0')}>
        {!collapsed ? (
          <Link to="/" className="flex items-center gap-2">
            <span className="text-xl font-extrabold tracking-tight text-foreground">Siteviral</span>
          </Link>
        ) : (
          <Link to="/" className="text-base font-extrabold text-foreground">S</Link>
        )}
      </div>

      {/* Org context (admin only) */}
      {isAdmin && currentOrg && !collapsed && (
        <div className="mx-3 mt-3 p-2 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Gestion de</p>
          <p className="text-xs font-semibold text-primary truncate">{currentOrg.name}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-hide">
        {isSA ? (
          superadminNav.map(renderNavItem)
        ) : isAdmin ? (
          <>
            {renderNavItem({ to: '/admin', icon: BarChart3, label: "Vue d'ensemble" })}
            
            {!collapsed ? (
              adminGroups.map((group) => (
                <div key={group.label} className="mt-3">
                  <button
                    onClick={() => toggleGroup(group.label)}
                    className="flex items-center justify-between w-full px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground hover:text-foreground transition-colors"
                  >
                    {group.label}
                    <ChevronDown className={cn('h-3 w-3 transition-transform', openGroups[group.label] && 'rotate-180')} />
                  </button>
                  {openGroups[group.label] && (
                    <div className="space-y-0.5 mt-0.5">
                      {group.items.map(renderNavItem)}
                    </div>
                  )}
                </div>
              ))
            ) : (
              adminGroups.flatMap((g) => g.items).map(renderNavItem)
            )}
          </>
        ) : (
          mainNav.map(renderNavItem)
        )}
      </nav>

      {/* Bottom links */}
      <div className={cn('border-t border-border space-y-0.5', collapsed ? 'px-1 py-2' : 'px-3 py-3')}>
        <button
          onClick={toggleTheme}
          title={collapsed ? (theme === 'dark' ? 'Mode clair' : 'Mode sombre') : undefined}
          className={cn(
            'flex items-center gap-3 rounded-lg text-sm font-medium transition-all w-full text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
            collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'
          )}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4 shrink-0" /> : <Moon className="h-4 w-4 shrink-0" />}
          {!collapsed && <span>{theme === 'dark' ? 'Mode clair' : 'Mode sombre'}</span>}
        </button>

        {!isAdmin && !isSA && isSuperadmin && (
          <Link
            to="/superadmin"
            title={collapsed ? 'Superadmin' : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg text-sm font-medium transition-all text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'
            )}
          >
            <Shield className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Superadmin</span>}
          </Link>
        )}

        {!isAdmin && !isSA && canManageCurrentOrg && (
          <Link
            to="/admin"
            title={collapsed ? "Gérer l'organisation" : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg text-sm font-medium transition-all text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'
            )}
          >
            <Settings className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Gérer l'organisation</span>}
          </Link>
        )}

        {(isAdmin || isSA) && (
          <Link
            to="/feed"
            title={collapsed ? "Retour à l'app" : undefined}
            className={cn(
              'flex items-center gap-3 rounded-lg text-sm font-medium transition-all text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground',
              collapsed ? 'px-0 py-2.5 justify-center' : 'px-3 py-2.5'
            )}
          >
            <Home className="h-4 w-4 shrink-0" />
            {!collapsed && <span>Retour à l'app</span>}
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
