import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { Bell, Sun, Moon, LogOut, User, Shield, Plus, Search, Building2, Check, CreditCard } from 'lucide-react';
import { PlanBadge } from '@/components/billing/PlanBadge';
import { GlobalSearch } from '@/components/search/GlobalSearch';
import { OrgSwitcher } from '@/components/org/OrgSwitcher';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useI18n } from '@/i18n/I18nContext';
import { CreditBalance } from '@/components/credits/CreditBalance';
import { GlobalPreferencesSelector } from '@/components/global/GlobalPreferencesSelector';
import { brandUrl } from '@/lib/storageUrl';
import { cn } from '@/lib/utils';
import { Organization } from '@/types/database';

export function TopBar() {
  const { theme, toggleTheme } = useTheme();
  const { user, profile, isSuperadmin, signOut } = useAuth();
  const { currentOrg, userOrgs, setCurrentOrg, getRoleFor } = useOrg();
  const { data: unread = 0 } = useUnreadCount(user?.id);
  const navigate = useNavigate();
  const { t, locale } = useI18n();
  const isFr = locale === 'fr';
  const [switchDialogOpen, setSwitchDialogOpen] = useState(false);

  const googleAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const avatarUrl = profile?.avatar_url || googleAvatar;
  const initials = profile?.display_name
    ? profile.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  const managedOrgs = userOrgs.filter((o) => {
    const role = getRoleFor(o.id);
    return role === 'owner' || role === 'admin';
  });

  const handleSelectOrg = (org: Organization) => {
    const role = getRoleFor(org.id);
    setCurrentOrg(org);
    setSwitchDialogOpen(false);
    if (role === 'owner' || role === 'admin') {
      navigate('/dashboard');
    } else {
      navigate(`/org/${org.slug}`);
    }
  };

  return (
    <>
      <header className="h-12 sm:h-14 shrink-0 z-40 glass border-b border-border flex items-center px-3 sm:px-4 gap-1.5 sm:gap-2">
        <div className="flex lg:hidden items-center mr-0.5">
          <SiteLogo size="sm" animate />
        </div>

        <div className="hidden sm:block">
          <GlobalSearch />
        </div>

        <button
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
          className="hidden lg:flex items-center gap-1.5 h-7 px-2.5 rounded-md border border-border bg-muted/50 text-muted-foreground hover:text-foreground hover:border-primary/30 transition-colors text-xs shrink-0"
        >
          <Search className="h-3 w-3" />
          <span className="text-[11px]">Cmd+K</span>
        </button>

        <div className="flex-1 min-w-0" />

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8 sm:hidden shrink-0"
          onClick={() => document.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
        >
          <Search className="h-4 w-4" />
        </Button>

        <OrgSwitcher variant="topbar" />
        <CreditBalance />
        <GlobalPreferencesSelector />

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
                  <div className="mt-1"><PlanBadge /></div>
                </div>
              </div>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => navigate('/profile')}><User className="h-3.5 w-3.5 mr-2" /> {t('topbar.profile')}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => navigate('/billing')}>
                <CreditCard className="h-3.5 w-3.5 mr-2" />
                {isFr ? 'Abonnement & facturation' : 'Subscription & billing'}
              </DropdownMenuItem>
              {/* Workspace controls only appear when they're useful:
                  superadmin, or the user manages 2+ orgs. Single-org service pros
                  (artisan, beauty, tutor…) don't need workspace-switching noise. */}
              {(isSuperadmin || managedOrgs.length >= 2) && (
                <DropdownMenuItem onClick={() => navigate('/create-org')}>
                  <Plus className="h-3.5 w-3.5 mr-2" />
                  {isFr ? 'Créer un espace/page' : 'Create a workspace/page'}
                </DropdownMenuItem>
              )}
              {(isSuperadmin || managedOrgs.length >= 2) && (
                <DropdownMenuItem onClick={() => setSwitchDialogOpen(true)}>
                  <Building2 className="h-3.5 w-3.5 mr-2" />
                  {isFr ? 'Changer d’espace/page' : 'Switch workspace/page'}
                </DropdownMenuItem>
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

      {/* Switch workspace/page dialog */}
      <Dialog open={switchDialogOpen} onOpenChange={setSwitchDialogOpen}>
        <DialogContent className="sm:max-w-[380px] p-0 gap-0 overflow-hidden rounded-2xl">
          <DialogHeader className="px-5 pt-5 pb-3">
            <DialogTitle className="text-base font-bold flex items-center gap-2">
              <Building2 className="h-4 w-4 text-primary" />
              {isFr ? 'Changer d’espace/page' : 'Switch workspace/page'}
            </DialogTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {managedOrgs.length} {isFr ? 'espace(s)' : 'workspace(s)'}
            </p>
          </DialogHeader>

          <div className="px-3 pb-3 max-h-[50vh] overflow-y-auto space-y-1">
            {managedOrgs.map((org) => {
              const isActive = org.id === currentOrg?.id;
              const logo = brandUrl(org.logo_url);
              const orgInitials = org.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2);
              return (
                <button
                  key={org.id}
                  onClick={() => handleSelectOrg(org)}
                  className={cn(
                    'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all',
                    isActive
                      ? 'bg-primary/10 border border-primary/25'
                      : 'hover:bg-muted/60 border border-transparent'
                  )}
                >
                  <div className={cn(
                    'h-9 w-9 rounded-lg overflow-hidden shrink-0 ring-2 transition-all',
                    isActive ? 'ring-primary' : 'ring-transparent'
                  )}>
                    {logo ? (
                      <img src={logo} alt={org.name} className="h-full w-full object-cover" />
                    ) : (
                      <div className="h-full w-full bg-gradient-to-br from-primary/80 to-primary flex items-center justify-center text-xs font-bold text-primary-foreground">
                        {orgInitials}
                      </div>
                    )}
                  </div>
                  <span className={cn(
                    'text-sm font-medium truncate flex-1',
                    isActive ? 'text-primary' : 'text-foreground'
                  )}>
                    {org.name}
                  </span>
                  {isActive && <Check className="h-4 w-4 text-primary shrink-0" />}
                </button>
              );
            })}
          </div>

          <div className="border-t border-border/60 px-4 py-3 bg-muted/30">
            <Button
              variant="outline"
              size="sm"
              className="w-full text-xs gap-2 rounded-lg border-dashed border-primary/30 text-primary hover:bg-primary/10 hover:border-primary/50"
              onClick={() => { setSwitchDialogOpen(false); navigate('/create-org'); }}
            >
              <Plus className="h-3.5 w-3.5" />
              {isFr ? 'Créer un nouvel espace/page' : 'Create a new workspace/page'}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
