import { useNavigate } from 'react-router-dom';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { Bell, Sun, Moon, LogOut, User, Settings, Shield, Plus, ChevronDown, Building2, Search } from 'lucide-react';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger, DropdownMenuLabel,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useI18n } from '@/i18n/I18nContext';
import { cn } from '@/lib/utils';
import { CreditBalance } from '@/components/credits/CreditBalance';

export function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const { user, profile, isSuperadmin, signOut } = useAuth();
  const { currentOrg, userOrgs, setCurrentOrg, getRoleFor } = useOrg();
  const { data: unread = 0 } = useUnreadCount(user?.id);
  const navigate = useNavigate();
  const { t } = useI18n();

  const googleAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const avatarUrl = profile?.avatar_url || googleAvatar;
  const initials = profile?.display_name
    ? profile.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  // Separate managed orgs (owner/admin) from member-only orgs
  const managedOrgs = userOrgs.filter((o) => {
    const role = getRoleFor(o.id);
    return role === 'owner' || role === 'admin';
  });
  const memberOrgs = userOrgs.filter((o) => {
    const role = getRoleFor(o.id);
    return role !== 'owner' && role !== 'admin';
  });

  const handleOrgSelect = (org: typeof currentOrg) => {
    if (!org) return;
    const role = getRoleFor(org.id);
    const isManager = role === 'owner' || role === 'admin';
    if (isManager) {
      setCurrentOrg(org);
      navigate('/admin');
    } else {
      // Navigate to public page for member-only orgs
      navigate(`/org/${org.slug}`);
    }
  };

  return (
    <header className="h-14 shrink-0 z-40 glass border-b border-border flex items-center px-3 sm:px-4 gap-2">
      <div className="flex lg:hidden items-center mr-0.5">
        <SiteLogo size="sm" animate />
      </div>

      {/* Search — hidden on very small screens */}
      <div className="hidden sm:block">
        <GlobalSearch />
      </div>

      {/* Cmd+K hint — desktop only */}
      <button
        onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
        className="hidden lg:flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-border bg-muted/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors text-xs shrink-0"
      >
        <Search className="h-3 w-3" />
        <span className="text-[11px]">Cmd+K</span>
      </button>

      <div className="flex-1 min-w-0" />

      {/* Mobile search icon */}
      <Button
        variant="ghost"
        size="icon"
        className="h-8 w-8 sm:hidden shrink-0"
        onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
      >
        <Search className="h-4 w-4" />
      </Button>

      {/* Org switcher (mobile) */}
      {user && currentOrg && userOrgs.length > 1 && (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 text-[11px] font-semibold gap-1 max-w-[100px] lg:hidden border border-border px-2 shrink-0">
              <Building2 className="h-3 w-3 shrink-0 text-primary" />
              <span className="truncate">{currentOrg.name}</span>
              <ChevronDown className="h-2.5 w-2.5 shrink-0 text-muted-foreground" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-56">
            {managedOrgs.length > 0 && (
              <>
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {t('sidebar.managing') || 'Mes organisations'}
                </DropdownMenuLabel>
                {managedOrgs.map((o) => (
                  <DropdownMenuItem
                    key={o.id}
                    onClick={() => handleOrgSelect(o)}
                    className={cn('text-xs gap-2', o.id === currentOrg.id && 'text-primary font-semibold')}
                  >
                    <Building2 className="h-3 w-3 shrink-0" />
                    {o.name}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            {memberOrgs.length > 0 && (
              <>
                {managedOrgs.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Membre de
                </DropdownMenuLabel>
                {memberOrgs.map((o) => (
                  <DropdownMenuItem
                    key={o.id}
                    onClick={() => handleOrgSelect(o)}
                    className="text-xs gap-2 text-muted-foreground"
                  >
                    <User className="h-3 w-3 shrink-0" />
                    {o.name}
                  </DropdownMenuItem>
                ))}
              </>
            )}
          </DropdownMenuContent>
        </DropdownMenu>
      )}

      {/* Credits — always visible with enough room */}
      <CreditBalance />

      <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={toggleTheme}>
        {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
      </Button>

      {user && (
        <Button variant="ghost" size="icon" className="h-8 w-8 relative shrink-0" data-tour="nav-notifications" onClick={() => navigate('/notifications')}>
          <Bell className="h-4 w-4" />
          {unread > 0 && <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive animate-pulse" />}
        </Button>
      )}

      {user ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button data-tour="nav-profile" className="flex items-center gap-1.5 h-8 px-1.5 rounded-full ring-1 ring-border hover:ring-primary/40 transition-all bg-card/60 shrink-0">
              <div className="h-6 w-6 rounded-full overflow-hidden flex items-center justify-center text-[10px] font-bold shrink-0">
                {avatarUrl ? <img src={avatarUrl} alt={initials} className="h-full w-full rounded-full object-cover" /> : (
                  <div className="h-full w-full bg-primary flex items-center justify-center text-primary-foreground">{initials}</div>
                )}
              </div>
              <span className="hidden md:block text-xs font-medium truncate max-w-[90px]">{profile?.display_name || 'User'}</span>
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
            <DropdownMenuItem onClick={() => navigate('/dashboard')}><Settings className="h-3.5 w-3.5 mr-2" /> {t('topbar.my_space')}</DropdownMenuItem>
            {userOrgs.length === 0 && (
              <DropdownMenuItem onClick={() => navigate('/create-org')}><Plus className="h-3.5 w-3.5 mr-2" /> {t('topbar.create_org')}</DropdownMenuItem>
            )}
            {isSuperadmin && (
              <DropdownMenuItem onClick={() => navigate('/superadmin')}><Shield className="h-3.5 w-3.5 mr-2" /> {t('topbar.superadmin')}</DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={signOut} className="text-destructive focus:text-destructive"><LogOut className="h-3.5 w-3.5 mr-2" /> {t('topbar.sign_out')}</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <Button size="sm" className="h-7 text-xs shrink-0" onClick={() => navigate('/auth')}>{t('topbar.sign_in')}</Button>
      )}
    </header>
  );
}
