import { Suspense } from 'react';
import { docLang } from '@/lib/doc-lang';
import { Outlet, NavLink, useNavigate } from '@/lib/router-compat';
import { RouteContentSkeleton } from '@/components/layout/RouteFallback';
import { useOrg } from '@/contexts/OrgContext';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import {
  BarChart3, Play, Megaphone, CalendarDays, Heart, ShoppingBag,
  Users, Link2, FileCheck, Settings, ChevronDown, ArrowLeft, Loader2,
  Camera, Tag, Clock, CreditCard, TrendingUp, MailCheck, Bell, HandHeart, Receipt, GraduationCap, Wallet, PenLine, MoreHorizontal,
  Home, Package, Plus, Share2, Store, KeyRound, LineChart
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';

// ═══════════════════════════════════════
// Admin links — reorganized by priority
// ═══════════════════════════════════════
// Progressive disclosure: items visibility depends on org state
interface AdminLink {
  to: string;
  label: string;
  icon: typeof BarChart3;
  end?: boolean;
  group: string;
  /** If set, only show when this returns true */
  showWhen?: 'always' | 'has-products' | 'has-sales' | 'affiliation-enabled';
}

const adminLinks: AdminLink[] = [
  // Overview — always visible
  { to: '/admin', label: 'Vue d\'ensemble', icon: BarChart3, end: true, group: 'main', showWhen: 'always' },
  // Créer — always visible
  { to: '/admin/products', label: 'Produits', icon: ShoppingBag, group: 'create', showWhen: 'always' },
  { to: '/admin/media', label: 'Médias', icon: Play, group: 'create', showWhen: 'always' },
  { to: '/admin/announcements', label: 'Annonces', icon: Megaphone, group: 'create', showWhen: 'always' },
  { to: '/admin/events', label: 'Événements', icon: CalendarDays, group: 'create', showWhen: 'always' },
  // Vendre — show when has products
  { to: '/admin/sales', label: 'Ventes', icon: Receipt, group: 'sell', showWhen: 'has-products' },
  { to: '/admin/campaigns', label: 'Campagnes', icon: Heart, group: 'sell', showWhen: 'always' },
  { to: '/admin/affiliation', label: 'Ambassadeurs', icon: Link2, group: 'sell', showWhen: 'affiliation-enabled' },
  { to: '/admin/payouts', label: 'Retraits', icon: TrendingUp, group: 'sell', showWhen: 'has-sales' },
  // Gérer — progressive
  { to: '/admin/members', label: 'Membres', icon: Users, group: 'manage', showWhen: 'always' },
  { to: '/admin/analytics', label: 'Analyses', icon: BarChart3, group: 'manage', showWhen: 'has-products' },
  { to: '/creator/analytics', label: 'Analyses avancées', icon: LineChart, group: 'manage', showWhen: 'has-sales' },
  { to: '/admin/kyc', label: 'Vérification', icon: FileCheck, group: 'manage', showWhen: 'always' },
  { to: '/admin/settings', label: 'Paramètres', icon: Settings, group: 'manage', showWhen: 'always' },
  // Plus — secondary, shown on expand
  { to: '/admin/photos', label: 'Photos', icon: Camera, group: 'more', showWhen: 'always' },
  { to: '/admin/promo-codes', label: 'Codes promo', icon: Tag, group: 'more', showWhen: 'has-products' },
  { to: '/admin/subscriptions', label: 'Abonnements', icon: CreditCard, group: 'more', showWhen: 'has-products' },
  { to: '/admin/crm', label: 'CRM', icon: MailCheck, group: 'more', showWhen: 'has-sales' },
  { to: '/admin/notifications', label: 'Notifications', icon: Bell, group: 'more', showWhen: 'always' },
  { to: '/admin/waitlists', label: 'Listes d\'attente', icon: Clock, group: 'more', showWhen: 'has-products' },
  { to: '/admin/programs', label: 'Programmes', icon: GraduationCap, group: 'more', showWhen: 'always' },
  { to: '/admin/offerings', label: 'Dons', icon: HandHeart, group: 'more', showWhen: 'always' },
  { to: '/admin/marketplace-templates', label: 'Templates marketplace', icon: Store, group: 'more', showWhen: 'has-products' },
  { to: '/admin/api-keys', label: 'API publique', icon: KeyRound, group: 'more', showWhen: 'always' },
];

const groupLabels: Record<string, { label: string; icon: typeof BarChart3 }> = {
  main: { label: '', icon: BarChart3 },
  create: { label: 'Créer', icon: PenLine },
  sell: { label: 'Vendre', icon: Wallet },
  manage: { label: 'Gérer', icon: Settings },
  more: { label: 'Plus', icon: MoreHorizontal },
};

// Mobile: keep the same primary navigation everywhere
const mobilePrimaryLinks = [
  { to: '/dashboard', label: 'Home', icon: Home, end: true },
  { to: '/my-purchases', label: 'Purchases', icon: Package },
  { to: '/admin/create', label: 'Create', icon: Plus },
  { to: '/gagner', label: 'Share', icon: Share2 },
];

export default function AdminLayout() {
  const { currentOrg, userOrgs, setCurrentOrg, isLoadingOrgs, getRoleFor } = useOrg();
  const navigate = useNavigate();
  const [showMore, setShowMore] = useState(false);

  // Progressive disclosure: fetch org stats for conditional visibility
  const { data: orgStats } = useQuery({
    queryKey: ['admin-layout-org-stats', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return null;
      const [{ count: productCount }, { count: saleCount }] = await Promise.all([
        db.from('digital_products').select('*', { count: 'exact', head: true }).eq('organization_id', currentOrg.id),
        db.from('product_purchases').select('*', { count: 'exact', head: true }).eq('organization_id', currentOrg.id).eq('status', 'completed'),
      ]);
      const affiliationEnabled = (currentOrg as any).affiliation_enabled ?? false;
      return { products: productCount || 0, sales: saleCount || 0, affiliationEnabled };
    },
    enabled: !!currentOrg?.id,
    staleTime: 60_000,
  });

  const shouldShow = (condition?: string) => {
    if (!condition || condition === 'always') return true;
    if (condition === 'has-products') return (orgStats?.products ?? 0) > 0;
    if (condition === 'has-sales') return (orgStats?.sales ?? 0) > 0;
    if (condition === 'affiliation-enabled') return orgStats?.affiliationEnabled ?? false;
    return true;
  };

  if (isLoadingOrgs && !currentOrg) {
    return (
      <RouteContentSkeleton />
    );
  }

  if (!currentOrg) {
    return (
      <EmptyState
        title={docLang() === 'fr' ? "Aucune organisation sélectionnée" : "No organization selected"}
        description={docLang() === 'fr' ? "Créez ou sélectionnez une organisation pour accéder au panneau d'administration." : "Create or select an organization to access the admin panel."}
        action={{ label: docLang() === 'fr' ? 'Créer une organisation' : 'Create organization', onClick: () => navigate('/create-org') }}
        className="min-h-screen"
      />
    );
  }

  const mobileSecondaryLinks = adminLinks.filter(l => !mobilePrimaryLinks.some(p => p.to === l.to) && shouldShow(l.showWhen));

  return (
    <div className="h-[100dvh] flex flex-col bg-background overflow-hidden">
      {/* Admin sub-header */}
      <div className="border-b border-border/60 bg-card px-3 py-2 flex items-center gap-2">
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7 shrink-0 text-muted-foreground hover:text-foreground"
          onClick={() => navigate('/feed')}
          title="Retour à l'app"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
        </Button>

        <span className="text-xs text-muted-foreground hidden sm:block shrink-0">Gestion :</span>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="sm" className="h-7 text-xs font-semibold gap-1 max-w-[140px] sm:max-w-none">
              <span className="truncate">{currentOrg.name}</span>
              <ChevronDown className="h-3 w-3 shrink-0" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start">
            {userOrgs.filter((o) => {
              const role = getRoleFor(o.id);
              return role === 'owner' || role === 'admin';
            }).map((o) => (
              <DropdownMenuItem
                key={o.id}
                onClick={() => setCurrentOrg(o)}
                className={cn('text-xs', o.id === currentOrg.id && 'text-primary font-medium')}
              >
                {o.name}
              </DropdownMenuItem>
            ))}
            <DropdownMenuItem className="text-xs text-muted-foreground" onClick={() => navigate('/create-org')}>
              + Créer une organisation
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        {/* Mobile horizontal nav — same primary items as the global app nav */}
        <nav className="flex lg:hidden items-center gap-0.5 ml-1 overflow-x-auto scrollbar-hide flex-1">
          {mobilePrimaryLinks.map(({ to, label, icon: Icon, end }) => (
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
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="shrink-0 flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                <MoreHorizontal className="h-3 w-3" />
                <span className="hidden xs:inline">More</span>
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {mobileSecondaryLinks.map(({ to, label: itemLabel, icon: Icon }) => (
                <DropdownMenuItem key={to} onClick={() => navigate(to)} className="text-xs gap-2">
                  <Icon className="h-3.5 w-3.5" />
                  {itemLabel}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>

      <div className="flex flex-1 min-h-0">
        {/* Desktop sidebar */}
        <aside className="relative hidden lg:flex flex-col w-56 border-r border-border/60 p-3 gap-0.5 shrink-0 bg-card/40 overflow-y-auto before:pointer-events-none before:absolute before:inset-0 before:bg-[radial-gradient(120%_50%_at_0%_0%,hsl(var(--primary)/0.07),transparent_60%)]">
          {['main', 'create', 'sell', 'manage', 'more'].map((group) => {
            const groupItems = adminLinks.filter(l => l.group === group && shouldShow(l.showWhen));
            const { label, icon: GroupIcon } = groupLabels[group];
            const isMoreGroup = group === 'more';

            return (
              <div key={group}>
                {label && (
                  <button
                    onClick={isMoreGroup ? () => setShowMore(!showMore) : undefined}
                    className={cn(
                      'flex items-center gap-1.5 w-full text-[10px] uppercase tracking-wider text-muted-foreground font-semibold px-3 mb-1 mt-3',
                      isMoreGroup && 'hover:text-foreground cursor-pointer transition-colors'
                    )}
                  >
                    <GroupIcon className="h-3 w-3" />
                    {label}
                    {isMoreGroup && (
                      <ChevronDown className={cn('h-3 w-3 ml-auto transition-transform', showMore && 'rotate-180')} />
                    )}
                  </button>
                )}
                {(!isMoreGroup || showMore) && groupItems.map(({ to, label: itemLabel, icon: Icon, end }) => (
                  <NavLink
                    key={to}
                    to={to}
                    end={end}
                    className={({ isActive }) =>
                      cn(
                        'group relative flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs transition-all duration-200',
                        isActive
                          ? 'bg-primary/15 text-primary font-semibold border border-primary/25 shadow-[inset_0_1px_0_0_hsl(var(--primary)/0.12)]'
                          : 'font-medium text-muted-foreground border border-transparent hover:bg-muted/70 hover:text-foreground hover:translate-x-0.5'
                      )
                    }
                  >
                    {({ isActive }) => (
                      <>
                        <Icon className="h-3.5 w-3.5 shrink-0 transition-transform duration-200 group-hover:scale-110" />
                        <span className="truncate">{itemLabel}</span>
                        {isActive && (
                          <span aria-hidden className="ml-auto h-1.5 w-1.5 shrink-0 rounded-full bg-primary shadow-[0_0_10px_2px_hsl(var(--primary)/0.6)]" />
                        )}
                      </>
                    )}
                  </NavLink>
                ))}

              </div>
            );
          })}
        </aside>

        <main className="flex-1 min-w-0 p-3 sm:p-4 lg:p-6 overflow-y-auto">
          <Suspense fallback={<RouteContentSkeleton />}>
            <Outlet />
          </Suspense>
        </main>
      </div>
      <OnboardingTour />
    </div>
  );
}
