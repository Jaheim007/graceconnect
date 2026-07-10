import { NavLink, Outlet, useLocation, useNavigate, Navigate } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarFooter, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import {
  LayoutDashboard, Package, Store, BookOpen, Megaphone, Compass, HandCoins,
  Wallet, Settings, LogOut, MessageSquare,
} from 'lucide-react';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useUserKind } from '@/hooks/useUserKind';
import { useEnabledModules } from '@/hooks/useEnabledModules';
import { MODULES } from '@/lib/dashboardModules';
import { useI18n } from '@/i18n/I18nContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';

interface NavItem { url: string; icon: any; label: string }

function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { signOut } = useAuth();
  const { kind } = useUserKind();
  const { modules, isLoading } = useEnabledModules();
  const { locale } = useI18n();
  const fr = locale === 'fr';

  const isProvider = kind === 'provider';

  // Baseline items shown to everyone (order matters).
  const baseline: NavItem[] = [
    { url: '/dashboard',             icon: LayoutDashboard, label: fr ? 'Aperçu'                    : 'Overview' },
    { url: '/dashboard/purchases',   icon: Package,         label: fr ? 'Mes achats'                : 'My purchases' },
  ];

  const providerOnly: NavItem[] = [
    { url: '/dashboard/products',    icon: Store,           label: fr ? 'Vendre'                    : 'Sell' },
  ];

  const middleShared: NavItem[] = [
    { url: '/ecrire',                icon: BookOpen,        label: fr ? 'Écrire un livre en 5 min'  : 'Write a book in 5 min' },
  ];

  const providerPromo: NavItem[] = [
    { url: '/dashboard/promotions',  icon: Megaphone,       label: fr ? 'Créer une promotion'       : 'Create a promotion' },
  ];

  const tail: NavItem[] = [
    { url: '/dashboard/explore',     icon: Compass,         label: fr ? 'Explorer'                  : 'Explore' },
    { url: '/dashboard/claim',       icon: HandCoins,       label: fr ? 'Réclamer'                  : 'Claim' },
    { url: '/dashboard/revenue',     icon: Wallet,          label: fr ? 'Revenus'                   : 'Revenue' },
  ];

  const providerNav: NavItem[] = [
    ...baseline,
    ...providerOnly,
    ...middleShared,
    ...providerPromo,
    ...tail,
  ];

  const nonProviderNav: NavItem[] = [
    ...baseline,
    { url: '/dashboard/explore',     icon: Compass,         label: fr ? 'Explorer'                  : 'Explore' },
    ...middleShared,
    { url: '/dashboard/claim',       icon: HandCoins,       label: fr ? 'Réclamer'                  : 'Claim' },
    { url: '/dashboard/revenue',     icon: Wallet,          label: fr ? 'Revenus'                   : 'Revenue' },
  ];

  const primaryNav = isProvider ? providerNav : nonProviderNav;

  const settingsItem: NavItem =
    { url: '/dashboard/settings',   icon: Settings,        label: fr ? 'Paramètres'                : 'Settings' };

  // Optional add-on modules the user turned on in Settings → Modules.
  const activeModules = modules.map((id) => MODULES[id]).filter(Boolean);

  const isActive = (url: string) =>
    url === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(url);

  const handleSignOut = async () => {
    try { await signOut(); } finally { navigate('/'); }
  };

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <div className="flex items-center gap-2 px-3 py-4">
          <SiteLogo size="sm" />
          {!collapsed && <span className="font-bold text-sm tracking-tight">SiteViral</span>}
        </div>

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {primaryNav.map((it) => (
                <SidebarMenuItem key={it.url}>
                  <SidebarMenuButton asChild isActive={isActive(it.url)} tooltip={it.label}>
                    <NavLink to={it.url} end={it.url === '/dashboard'} className="flex items-center gap-2">
                      <it.icon className="h-4 w-4" />
                      {!collapsed && <span>{it.label}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>

        {/* Add-on modules activated from Settings → Modules */}
        {(activeModules.length > 0 || isLoading) && (
          <SidebarGroup>
            <SidebarGroupLabel>{fr ? 'Modules activés' : 'Active modules'}</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {isLoading && (
                  <>
                    <Skeleton className="h-7 w-full mb-1" />
                    <Skeleton className="h-7 w-full mb-1" />
                  </>
                )}
                {activeModules.map((m) => (
                  <SidebarMenuItem key={m.id}>
                    <SidebarMenuButton asChild isActive={isActive(m.route)} tooltip={fr ? m.labelFr : m.labelEn}>
                      <NavLink to={m.route} className="flex items-center gap-2">
                        <m.icon className="h-4 w-4" />
                        {!collapsed && <span>{fr ? m.labelFr : m.labelEn}</span>}
                      </NavLink>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        )}

        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton asChild isActive={isActive(settingsItem.url)} tooltip={settingsItem.label}>
                  <NavLink to={settingsItem.url} className="flex items-center gap-2">
                    <settingsItem.icon className="h-4 w-4" />
                    {!collapsed && <span>{settingsItem.label}</span>}
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter>
        <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton
              onClick={handleSignOut}
              tooltip={fr ? 'Se déconnecter' : 'Sign out'}
              className="text-destructive hover:text-destructive"
            >
              <LogOut className="h-4 w-4" />
              {!collapsed && <span>{fr ? 'Se déconnecter' : 'Sign out'}</span>}
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}

export default function UnifiedDashboardLayout() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-[60dvh] grid place-items-center">
        <Skeleton className="h-24 w-64 rounded-2xl" />
      </div>
    );
  }
  if (!user) return <Navigate to="/auth?returnTo=/dashboard" replace />;

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-12 flex items-center justify-between border-b bg-background/80 backdrop-blur px-2 sticky top-0 z-40">
            <div className="flex items-center gap-2">
              <SidebarTrigger />
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/')} className="text-xs">
              ← Site
            </Button>
          </header>
          <main className="flex-1 min-w-0">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
