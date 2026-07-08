import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  Sidebar, SidebarContent, SidebarGroup, SidebarGroupContent, SidebarGroupLabel,
  SidebarMenu, SidebarMenuButton, SidebarMenuItem, SidebarProvider, SidebarTrigger,
  useSidebar,
} from '@/components/ui/sidebar';
import { LayoutDashboard, MessageSquare, Bell, Settings, Sliders } from 'lucide-react';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { useAuth } from '@/contexts/AuthContext';
import { useEnabledModules } from '@/hooks/useEnabledModules';
import { MODULES } from '@/lib/dashboardModules';
import { useI18n } from '@/i18n/I18nContext';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import { Navigate } from 'react-router-dom';

function DashboardSidebar() {
  const { state } = useSidebar();
  const collapsed = state === 'collapsed';
  const { pathname } = useLocation();
  const { modules, isLoading } = useEnabledModules();
  const { locale } = useI18n();
  const fr = locale === 'fr';

  const alwaysOn = [
    { url: '/dashboard',               icon: LayoutDashboard, label: fr ? 'Accueil'       : 'Overview' },
    { url: '/dashboard/messages',      icon: MessageSquare,   label: fr ? 'Messagerie'    : 'Messages' },
    { url: '/dashboard/notifications', icon: Bell,            label: fr ? 'Notifications' : 'Notifications' },
  ];

  const settingsItems = [
    { url: '/dashboard/settings/modules', icon: Sliders,  label: fr ? 'Mes modules' : 'My modules' },
    { url: '/dashboard/settings',         icon: Settings, label: fr ? 'Paramètres'  : 'Settings' },
  ];

  const isActive = (url: string) =>
    url === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(url);

  const activeModules = modules
    .map((id) => MODULES[id])
    .filter(Boolean);

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
              {alwaysOn.map((it) => (
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

        <SidebarGroup>
          <SidebarGroupLabel>{fr ? 'Mes modules' : 'My modules'}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {isLoading && (
                <>
                  <Skeleton className="h-7 w-full mb-1" />
                  <Skeleton className="h-7 w-full mb-1" />
                </>
              )}
              {!isLoading && activeModules.length === 0 && !collapsed && (
                <div className="px-3 py-2 text-[11px] text-muted-foreground">
                  {fr
                    ? 'Aucun module actif. Active-en dans « Mes modules ».'
                    : 'No modules active. Turn some on in “My modules”.'}
                </div>
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

        <SidebarGroup>
          <SidebarGroupLabel>{fr ? 'Paramètres' : 'Settings'}</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {settingsItems.map((it) => (
                <SidebarMenuItem key={it.url}>
                  <SidebarMenuButton asChild isActive={isActive(it.url)} tooltip={it.label}>
                    <NavLink to={it.url} className="flex items-center gap-2">
                      <it.icon className="h-4 w-4" />
                      {!collapsed && <span>{it.label}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
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
