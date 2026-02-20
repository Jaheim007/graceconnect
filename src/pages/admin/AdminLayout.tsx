import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useOrg } from '@/contexts/OrgContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import {
  BarChart3, Play, Megaphone, CalendarDays, Heart, ShoppingBag,
  Users, Link2, FileCheck, Settings, ChevronDown
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
  { to: '/admin/members', label: 'Members', icon: Users },
  { to: '/admin/affiliation', label: 'Affiliation', icon: Link2 },
  { to: '/admin/kyc', label: 'KYC', icon: FileCheck },
  { to: '/admin/settings', label: 'Settings', icon: Settings },
];

export default function AdminLayout() {
  const { currentOrg, userOrgs, setCurrentOrg } = useOrg();
  const navigate = useNavigate();

  if (!currentOrg) {
    return (
      <EmptyState
        title="No organization selected"
        description="Select or create an organization to access the admin panel."
        action={{ label: 'Discover orgs', onClick: () => navigate('/discover') }}
        className="min-h-screen"
      />
    );
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Admin sub-header */}
      <div className="border-b border-border/60 bg-card px-4 py-2 flex items-center gap-3">
        <span className="text-xs text-muted-foreground">Managing:</span>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold gap-1">
              {currentOrg.name} <ChevronDown className="h-3 w-3" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            {userOrgs.map((o) => (
              <DropdownMenuItem key={o.id} onClick={() => setCurrentOrg(o)} className={cn('text-xs', o.id === currentOrg.id && 'text-primary font-medium')}>
                {o.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Mobile horizontal nav */}
        <nav className="flex lg:hidden items-center gap-1 ml-2 overflow-x-auto scrollbar-hide">
          {adminLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn('shrink-0 flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium transition-colors',
                  isActive ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:text-foreground')
              }
            >
              <Icon className="h-3 w-3" />{label}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-48 border-r border-border/60 min-h-[calc(100vh-7rem)] p-2 gap-0.5 shrink-0">
          {adminLinks.map(({ to, label, icon: Icon, end }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) =>
                cn('flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-colors',
                  isActive ? 'bg-primary text-primary-foreground shadow-gold' : 'text-muted-foreground hover:bg-muted hover:text-foreground')
              }
            >
              <Icon className="h-3.5 w-3.5" />{label}
            </NavLink>
          ))}
        </aside>

        <main className="flex-1 min-w-0 p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
