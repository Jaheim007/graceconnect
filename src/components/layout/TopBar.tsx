import { Link, useNavigate } from 'react-router-dom';
import { Bell, Sun, Moon, LogOut, User, Settings, LayoutDashboard, Shield, ChevronDown, Plus } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useUnreadCount } from '@/hooks/useNotifications';
import { cn } from '@/lib/utils';

export function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const { user, profile, isSuperadmin, signOut } = useAuth();
  const { userOrgs, currentOrg, setCurrentOrg, canManage } = useOrg();
  const canManageCurrentOrg = currentOrg ? canManage(currentOrg.id) : false;
  const { data: unread = 0 } = useUnreadCount(user?.id);
  const navigate = useNavigate();

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <header className="h-14 sticky top-0 z-40 glass border-b border-border/60 flex items-center px-4 gap-3">
      {/* Logo (mobile) */}
      <Link to="/" className="flex lg:hidden items-center gap-2 mr-1">
        <span className="text-lg font-extrabold tracking-tight italic bg-clip-text text-transparent gold-gradient">Siteviral</span>
      </Link>

      <div className="flex-1" />

      {/* Org switcher */}
      {user && userOrgs.length > 0 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-1.5 h-8 text-xs max-w-[160px]">
              <span className="truncate">{currentOrg?.name || 'Select Org'}</span>
              <ChevronDown className="h-3 w-3 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            {userOrgs.map((org) => (
              <DropdownMenuItem
                key={org.id}
                onClick={() => setCurrentOrg(org)}
                className={cn('text-xs', currentOrg?.id === org.id && 'text-primary font-medium')}
              >
                {org.name}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Theme toggle */}
      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      {/* Notifications */}
      {user && (
        <Button variant="ghost" size="icon" className="h-8 w-8 relative" onClick={() => navigate('/notifications')}>
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive animate-pulse" />
          )}
        </Button>
      )}

      {/* User menu */}
      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-8 w-8 rounded-full gold-gradient flex items-center justify-center text-xs font-bold text-primary-foreground hover:opacity-90 transition-opacity shrink-0">
              {profile?.avatar_url ? (
                <img src={profile.avatar_url} alt={initials} className="h-full w-full rounded-full object-cover" />
              ) : initials}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-2 py-1.5">
              <p className="text-sm font-medium truncate">{profile?.display_name || 'User'}</p>
              <p className="text-xs text-muted-foreground truncate">{user.email}</p>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}>
              <User className="h-3.5 w-3.5 mr-2" /> Profile
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/dashboard')}>
              <LayoutDashboard className="h-3.5 w-3.5 mr-2" /> My Dashboard
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/create-org')}>
              <Plus className="h-3.5 w-3.5 mr-2" /> Create Org
            </DropdownMenuItem>
            {/* Only show Manage Org to owner/admin/editor — not plain members */}
            {canManageCurrentOrg && (
              <DropdownMenuItem onClick={() => navigate('/admin')}>
                <Settings className="h-3.5 w-3.5 mr-2" /> Manage Org
              </DropdownMenuItem>
            )}
            {isSuperadmin && (
              <DropdownMenuItem onClick={() => navigate('/superadmin')}>
                <Shield className="h-3.5 w-3.5 mr-2" /> Superadmin
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive">
              <LogOut className="h-3.5 w-3.5 mr-2" /> Sign out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button size="sm" className="h-8 text-xs gold-gradient text-primary-foreground border-0 shadow-gold" onClick={() => navigate('/auth')}>
          Sign In
        </Button>
      )}
    </header>
  );
}
