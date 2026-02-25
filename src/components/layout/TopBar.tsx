import { Link, useNavigate } from 'react-router-dom';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { Bell, Sun, Moon, LogOut, User, Settings, Shield, ChevronDown, Plus, BookOpen } from 'lucide-react';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useI18n } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';

export function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const { user, profile, isSuperadmin, signOut } = useAuth();
  const { userOrgs, currentOrg, setCurrentOrg, canManage } = useOrg();
  const canManageCurrentOrg = currentOrg ? canManage(currentOrg.id) : false;
  const { data: unread = 0 } = useUnreadCount(user?.id);
  const navigate = useNavigate();
  const { t } = useI18n();

  const googleAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const avatarUrl = profile?.avatar_url || googleAvatar;
  const initials = profile?.display_name
    ? profile.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <header className="h-14 sticky top-0 z-40 glass border-b border-border flex items-center px-4 gap-3">
      <div className="flex lg:hidden items-center mr-1">
        <SiteLogo size="sm" animate />
      </div>
      <GlobalSearch />
      <div className="flex-1" />

      {user && (() => {
        const ownedOrgs = userOrgs.filter((org) => org.owner_id === user.id);
        return ownedOrgs.length > 0 ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2 h-9 text-xs max-w-[200px] border-border bg-card/60 hover:bg-card">
              {currentOrg?.logo_url ? (
                <img src={currentOrg.logo_url} alt="" className="h-5 w-5 rounded-md object-cover shrink-0" />
              ) : (
                <div className="h-5 w-5 rounded-md bg-primary shrink-0 flex items-center justify-center text-[9px] font-bold text-primary-foreground">
                  {currentOrg?.name?.[0]?.toUpperCase() || 'O'}
                </div>
              )}
              <span className="truncate font-medium">{currentOrg?.name || t('org.select')}</span>
              <ChevronDown className="h-3 w-3 shrink-0 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <div className="px-2 py-1.5">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">{t('org.my_orgs')}</p>
            </div>
            {ownedOrgs.map((org) => (
              <DropdownMenuItem key={org.id} onClick={() => setCurrentOrg(org)} className={cn('flex items-center gap-2.5 py-2', currentOrg?.id === org.id && 'bg-primary/10')}>
                {org.logo_url ? (
                  <img src={org.logo_url} alt="" className="h-6 w-6 rounded-md object-cover shrink-0" />
                ) : (
                  <div className="h-6 w-6 rounded-md bg-muted flex items-center justify-center text-[10px] font-bold shrink-0">{org.name?.[0]?.toUpperCase()}</div>
                )}
                <span className={cn('text-sm truncate', currentOrg?.id === org.id && 'text-primary font-semibold')}>{org.name}</span>
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem className="text-xs text-muted-foreground" onClick={() => navigate('/create-org')}>
              + {t('topbar.create_org')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        ) : null;
      })()}

      <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      {user && (
        <Button variant="ghost" size="icon" className="h-8 w-8 relative" data-tour="nav-notifications" onClick={() => navigate('/notifications')}>
          <Bell className="h-4 w-4" />
          {unread > 0 && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive animate-pulse" />}
        </Button>
      )}

      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button data-tour="nav-profile" className="h-8 w-8 rounded-full ring-2 ring-border overflow-hidden flex items-center justify-center text-xs font-bold shrink-0 hover:ring-primary/40 transition-all">
              {avatarUrl ? <img src={avatarUrl} alt={initials} className="h-full w-full rounded-full object-cover" /> : (
                <div className="h-full w-full bg-primary flex items-center justify-center text-primary-foreground">{initials}</div>
              )}
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-52">
            <div className="px-2 py-2 flex items-center gap-2.5">
              {avatarUrl ? <img src={avatarUrl} alt="" className="h-8 w-8 rounded-full object-cover shrink-0" /> : (
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-xs font-bold text-primary-foreground shrink-0">{initials}</div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate">{profile?.display_name || 'User'}</p>
                <p className="text-xs text-muted-foreground truncate">{user.email}</p>
              </div>
            </div>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => navigate('/profile')}><User className="h-3.5 w-3.5 mr-2" /> {t('topbar.my_account')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/dashboard')}><BookOpen className="h-3.5 w-3.5 mr-2" /> {t('topbar.my_dashboard')}</DropdownMenuItem>
            <DropdownMenuItem onClick={() => navigate('/create-org')}><Plus className="h-3.5 w-3.5 mr-2" /> {t('topbar.create_org')}</DropdownMenuItem>
            {canManageCurrentOrg && (
              <DropdownMenuItem onClick={() => navigate('/admin')}><Settings className="h-3.5 w-3.5 mr-2" /> {t('topbar.manage_org')}</DropdownMenuItem>
            )}
            {isSuperadmin && (
              <DropdownMenuItem onClick={() => navigate('/superadmin')}><Shield className="h-3.5 w-3.5 mr-2" /> {t('topbar.superadmin')}</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive"><LogOut className="h-3.5 w-3.5 mr-2" /> {t('topbar.sign_out')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button size="sm" className="h-8 text-xs" onClick={() => navigate('/auth')}>{t('topbar.sign_in')}</Button>
      )}
    </header>
  );
}
