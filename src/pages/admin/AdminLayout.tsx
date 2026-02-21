import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useOrg } from '@/contexts/OrgContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import {
  BarChart3, Play, Megaphone, CalendarDays, Heart, ShoppingBag,
  Users, Link2, FileCheck, Settings, ChevronDown, ArrowLeft, Loader2,
  Camera
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

const adminLinks = [
  { to: '/admin', label: 'Overview', icon: BarChart3, end: true },
  { to: '/admin/media', label: 'Media', icon: Play },
  { to: '/admin/announcements', label: 'Announcements', icon: Megaphone },
  { to: '/admin/events', label: 'Events', icon: CalendarDays },
  { to: '/admin/campaigns', label: 'Campaigns', icon: Heart },
  { to: '/admin/products', label: 'Store', icon: ShoppingBag },
  { to: '/admin/photos', label: 'Photos', icon: Camera },
  { to: '/admin/members', label: 'Members', icon: Users },
  { to: '/admin/affiliation', label: 'Affiliation', icon: Link2 },
  { to: '/admin/kyc', label: 'KYC', icon: FileCheck },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const { currentOrg, userOrgs, setCurrentOrg, isLoadingOrgs } = useOrg();
  const navigate = useNavigate();

  // Show spinner only while loading AND we have no org yet to show
  // If currentOrg is already set (e.g. just created), render immediately
  if (isLoadingOrgs && !currentOrg) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <EmptyState
        title="No organization selected"
        description="Create or select an organization to access the admin panel."
        action={{ label: 'Create organization', onClick: () => navigate('/create-org') }}
        className="min-h-screen"
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin sub-header */}
      <div className="border-b border-border/60 bg-card px-3 py-2 flex items-center gap-2">
        {/* Back to app */}
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/feed')}
          title="Back to app"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </Button>

        <span className="text-xs text-muted-foreground hidden sm:block shrink-0">Managing:</span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold gap-1 max-w-[140px] sm:max-w-none">
              <span className="truncate">{currentOrg.name}</span>
              <ChevronDown className="h-3 w-3 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {userOrgs.map((o) => (
              <DropdownMenuItem
                key={o.id}
                onClick={() => setCurrentOrg(o)}
                className={cn('text-xs', o.id === currentOrg.id && 'text-primary font-medium')}
              >
                {o.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem className="text-xs text-muted-foreground" onClick={() => navigate('/create-org')}>
              + Create organization
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Mobile horizontal nav */}
        <nav className="flex lg:hidden items-center gap-0.5 ml-1 overflow-x-auto scrollbar-hide flex-1">
          {adminLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted'
                )
              }
            >
              <Icon className="h-3 w-3" />
              <span className="hidden xs:inline">{label}</span>
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-52 border-r border-border/60 min-h-[calc(100vh-5rem)] p-3 gap-0.5 shrink-0 bg-card/30">
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-3 mb-1 mt-1">Navigation</p>
          {adminLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all',
                  isActive
                    ? 'bg-primary text-primary-foreground shadow-gold'
                    : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                )
              }
            >
              <Icon className="h-3.5 w-3.5 shrink-0" />
              {label}
            </NavLink>
          ))}
        </aside>

        <main className="flex-1 min-w-0 p-3 sm:p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
