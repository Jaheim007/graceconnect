import { Outlet, NavLink, useNavigate } from 'react-router-dom';
import { useOrg } from '@/contexts/OrgContext';
import { OnboardingTour } from '@/components/onboarding/OnboardingTour';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import {
  BarChart3, Play, Megaphone, CalendarDays, Heart, ShoppingBag,
  Users, Link2, FileCheck, Settings, ChevronDown, ArrowLeft, Loader2,
  Camera, Tag, Clock, CreditCard, TrendingUp, MailCheck, Bell, HandHeart, Receipt, GraduationCap, Wallet, PenLine, MoreHorizontal
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
];

const groupLabels: Record<string, { label: string; icon: typeof BarChart3 }> = {
  main: { label: '', icon: BarChart3 },
  create: { label: 'Créer', icon: PenLine },
  sell: { label: 'Vendre', icon: Wallet },
  manage: { label: 'Gérer', icon: Settings },
  more: { label: 'Plus', icon: MoreHorizontal },
};

// Mobile: only show the 5 most critical links + a "Plus" dropdown
const mobilePrimaryLinks = [
  { to: '/admin', label: 'Aperçu', icon: BarChart3, end: true },
  { to: '/admin/products', label: 'Produits', icon: ShoppingBag },
  { to: '/admin/sales', label: 'Ventes', icon: Receipt },
  { to: '/admin/members', label: 'Membres', icon: Users },
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
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!currentOrg) {
    return (
      <EmptyState
        title="Aucune organisation sélectionnée"
        description="Créez ou sélectionnez une organisation pour accéder au panneau d'administration."
        action={{ label: 'Créer une organisation', onClick: () => navigate('/create-org') }}
        className="min-h-screen"
      />
    );
  }

  const mobileSecondaryLinks = adminLinks.filter(l => !mobilePrimaryLinks.some(p => p.to === l.to));

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
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

        {/* Mobile horizontal nav — only essential items */}
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
                <span className="hidden xs:inline">Plus</span>
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

      <div className="flex">
        {/* Desktop sidebar */}
        <aside className="hidden lg:flex flex-col w-52 border-r border-border/60 min-h-[calc(100vh-5rem)] p-3 gap-0.5 shrink-0 bg-card/30">
          {['main', 'create', 'sell', 'manage', 'more'].map((group) => {
            const groupItems = adminLinks.filter(l => l.group === group);
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
                        'flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs font-medium transition-all',
                        isActive
                          ? 'bg-primary text-primary-foreground'
                          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                      )
                    }
                  >
                    <Icon className="h-3.5 w-3.5 shrink-0" />
                    {itemLabel}
                  </NavLink>
                ))}
              </div>
            );
          })}
        </aside>

        <main className="flex-1 min-w-0 p-3 sm:p-4 lg:p-6">
          <Outlet />
        </main>
      </div>
      <OnboardingTour />
    </div>
  );
}
