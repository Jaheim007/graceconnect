import { Link, useLocation } from 'react-router-dom';
import {
  Home, Compass, Play, Bell, User, LayoutDashboard, BookOpen,
  Settings, ChevronLeft, ChevronRight, Shield,
  Megaphone, CalendarDays, ShoppingBag, Heart, Users, BarChart3, FileCheck, Link2
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useUnreadCount } from '@/hooks/useNotifications';

const mainNav = [
  { to: '/feed', icon: Home, label: 'Feed' },
  { to: '/discover', icon: Compass, label: 'Discover' },
  { to: '/reels', icon: Play, label: 'Reels' },
  { to: '/notifications', icon: Bell, label: 'Notifications' },
  { to: '/resources', icon: BookOpen, label: 'My Resources' },
  { to: '/dashboard', icon: LayoutDashboard, label: 'My Dashboard' },
  { to: '/profile', icon: User, label: 'Profile' },
];

const adminNav = [
  { to: '/admin', icon: BarChart3, label: 'Overview' },
  { to: '/admin/media', icon: Play, label: 'Media' },
  { to: '/admin/announcements', icon: Megaphone, label: 'Announcements' },
  { to: '/admin/events', icon: CalendarDays, label: 'Events' },
  { to: '/admin/campaigns', icon: Heart, label: 'Campaigns' },
  { to: '/admin/products', icon: ShoppingBag, label: 'Store' },
  { to: '/admin/members', icon: Users, label: 'Members' },
  { to: '/admin/affiliation', icon: Link2, label: 'Affiliation' },
  { to: '/admin/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/admin/kyc', icon: FileCheck, label: 'KYC' },
  { to: '/admin/settings', icon: Settings, label: 'Settings' },
];

const superadminNav = [
  { to: '/superadmin', icon: Shield, label: 'Overview' },
  { to: '/superadmin/orgs', icon: Users, label: 'Organizations' },
  { to: '/superadmin/kyc', icon: FileCheck, label: 'KYC Review' },
  { to: '/superadmin/transactions', icon: BarChart3, label: 'Transactions' },
  { to: '/superadmin/reports', icon: Megaphone, label: 'Reports' },
  { to: '/superadmin/metrics', icon: BarChart3, label: 'Metrics' },
];

export function Sidebar() {
  const location = useLocation();
  
  const [collapsed, setCollapsed] = useState(false);
  const { user, isSuperadmin } = useAuth();
  // canManage checks if user has owner/admin/editor role for the given org
  const { currentOrg, canManage } = useOrg();
  const { data: unread = 0 } = useUnreadCount(user?.id);

  const isAdmin = location.pathname.startsWith('/admin');
  const isSA = location.pathname.startsWith('/superadmin');
  const items = isSA ? superadminNav : isAdmin ? adminNav : mainNav;

  // Only show "Manage Org" to users with a management role (owner/admin/editor).
  // A plain "member" who joined a church must NOT see or be able to access /admin.
  const canManageCurrentOrg = currentOrg ? canManage(currentOrg.id) : false;

  const isActive = (to: string) => location.pathname.startsWith(to);

  return (
    <aside
      className={cn(
        'h-screen sticky top-0 flex flex-col border-r border-border/60 bg-sidebar transition-all duration-300 overflow-hidden',
        collapsed ? 'w-16' : 'w-60'
      )}
    >
      {/* Logo */}
      <div className={cn('flex items-center h-16 px-4 border-b border-border/60', collapsed && 'justify-center px-0')}>
        {!collapsed ? (
          <Link to="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg gold-gradient flex items-center justify-center shadow-gold">
              <span className="text-sm font-bold text-primary-foreground">SV</span>
            </div>
            <span className="font-bold text-lg tracking-tight">Siteviral</span>
          </Link>
        ) : (
          <Link to="/" className="h-8 w-8 rounded-lg gold-gradient flex items-center justify-center shadow-gold">
            <span className="text-sm font-bold text-primary-foreground">GC</span>
          </Link>
        )}
      </div>

      {/* Org context (admin only) */}
      {isAdmin && currentOrg && !collapsed && (
        <div className="mx-3 mt-3 p-2 rounded-lg bg-primary/10 border border-primary/20">
          <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-0.5">Managing</p>
          <p className="text-xs font-semibold text-primary truncate">{currentOrg.name}</p>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 px-2 space-y-0.5 scrollbar-hide">
        {items.map(({ to, icon: Icon, label }) => {
          const active = isActive(to);
          const showBadge = label === 'Notifications' && unread > 0;
          return (
            <Link
              key={to}
              to={to}
              title={collapsed ? label : undefined}
              className={cn(
                'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-150 relative group',
                active
                  ? 'bg-primary text-primary-foreground shadow-gold'
                  : 'text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground'
              )}
            >
              <div className="relative shrink-0">
                <Icon className="h-4 w-4" />
                {showBadge && (
                  <span className="absolute -top-1 -right-1 h-1.5 w-1.5 rounded-full bg-destructive" />
                )}
              </div>
              {!collapsed && <span className="truncate">{label}</span>}
              {collapsed && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-popover border border-border rounded-md text-xs whitespace-nowrap opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity z-50 shadow-elevated">
                  {label}
                </div>
              )}
            </Link>
          );
        })}
      </nav>

      {/* Section links */}
      {!collapsed && (
        <div className="px-3 py-2 border-t border-border/60 space-y-0.5">
          {!isAdmin && !isSA && isSuperadmin && (
            <Link
              to="/superadmin"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
            >
              <Shield className="h-3.5 w-3.5" />
              Superadmin
            </Link>
          )}

          {/* Only show "Manage Org" if the user has owner/admin/editor role */}
          {!isAdmin && !isSA && canManageCurrentOrg && (
            <Link
              to="/admin"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
            >
              <Settings className="h-3.5 w-3.5" />
              Manage Org
            </Link>
          )}

          {(isAdmin || isSA) && (
            <Link
              to="/feed"
              className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
            >
              <Home className="h-3.5 w-3.5" />
              Back to App
            </Link>
          )}
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={() => setCollapsed(!collapsed)}
        className="flex items-center justify-center h-10 w-full border-t border-border/60 text-muted-foreground hover:text-foreground hover:bg-sidebar-accent transition-colors"
      >
        {collapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
      </button>
    </aside>
  );
}
