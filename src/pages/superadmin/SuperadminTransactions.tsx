/**
 * SuperadminTransactions — Premium transaction dashboard for platform superadmins.
 * Clean banking-style design with grouped filters, stat cards, and a refined table.
 */
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState, useMemo } from 'react';
import { downloadCSV } from '@/lib/csvExport';
import { Input } from '@/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { format, startOfDay, startOfWeek, startOfMonth, subDays, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { Download, Search, CalendarIcon, DollarSign, TrendingUp, Users, BarChart3, ArrowUpRight, ArrowDownRight, CreditCard, Smartphone, Gift, ShoppingCart, SlidersHorizontal, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type TxFilter = 'all' | 'purchase' | 'donation';
type StatusFilter = 'all' | 'completed' | 'pending' | 'failed';
type GatewayFilter = 'all' | 'stripe' | 'paystack' | 'free';
type PeriodFilter = 'all' | 'today' | '7d' | '30d' | '90d' | 'this_month' | 'this_week' | 'custom';

const PERIOD_OPTIONS: { key: PeriodFilter; label: string }[] = [
  { key: 'all', label: 'Tout' },
  { key: 'today', label: "Aujourd'hui" },
  { key: 'this_week', label: 'Cette semaine' },
  { key: 'this_month', label: 'Ce mois' },
  { key: '7d', label: '7 jours' },
  { key: '30d', label: '30 jours' },
  { key: '90d', label: '90 jours' },
  { key: 'custom', label: 'Personnalisé' },
];

function detectGateway(ref: string | null): string {
  if (!ref) return 'unknown';
  if (ref.startsWith('free-')) return 'free';
  if (ref.includes('STRIPE')) return 'stripe';
  return 'paystack';
}

function getDateRange(periodFilter: PeriodFilter, customFrom?: Date, customTo?: Date) {
  const now = new Date();
  switch (periodFilter) {
    case 'today': return { from: startOfDay(now), to: now };
    case 'this_week': return { from: startOfWeek(now, { weekStartsOn: 1 }), to: now };
    case 'this_month': return { from: startOfMonth(now), to: now };
    case '7d': return { from: subDays(now, 7), to: now };
    case '30d': return { from: subDays(now, 30), to: now };
    case '90d': return { from: subMonths(now, 3), to: now };
    case 'custom': return { from: customFrom || null, to: customTo || null };
    default: return { from: null, to: null };
  }
}

/* ─── Stat Card ─── */
function StatCard({ label, value, icon: Icon, trend, accent }: {
  label: string; value: string; icon: any; trend?: number; accent?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'relative overflow-hidden rounded-2xl border border-border/60 bg-card p-5',
        'hover:shadow-lg hover:shadow-primary/5 transition-all duration-300'
      )}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{label}</p>
          <p className="text-2xl font-bold tracking-tight">{value}</p>
        </div>
        <div className={cn(
          'flex items-center justify-center h-10 w-10 rounded-xl',
          accent || 'bg-primary/10'
        )}>
          <Icon className={cn('h-5 w-5', accent ? 'text-white' : 'text-primary')} />
        </div>
      </div>
      {trend !== undefined && (
        <div className="flex items-center gap-1 mt-3">
          {trend >= 0 ? (
            <ArrowUpRight className="h-3 w-3 text-emerald-500" />
          ) : (
            <ArrowDownRight className="h-3 w-3 text-red-400" />
          )}
          <span className={cn('text-xs font-medium', trend >= 0 ? 'text-emerald-500' : 'text-red-400')}>
            {Math.abs(trend)}%
          </span>
          <span className="text-xs text-muted-foreground">vs période préc.</span>
        </div>
      )}
    </motion.div>
  );
}

/* ─── Filter Chip ─── */
function FilterChip({ active, onClick, children, variant = 'default' }: {
  active: boolean; onClick: () => void; children: React.ReactNode; variant?: 'default' | 'success' | 'warning' | 'danger';
}) {
  const activeClasses = {
    default: 'bg-primary text-primary-foreground shadow-md shadow-primary/20',
    success: 'bg-emerald-500 text-white shadow-md shadow-emerald-500/20',
    warning: 'bg-amber-500 text-white shadow-md shadow-amber-500/20',
    danger: 'bg-red-500 text-white shadow-md shadow-red-500/20',
  };

  return (
    <button
      onClick={onClick}
      className={cn(
        'inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all duration-200',
        active
          ? activeClasses[variant]
          : 'bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      {children}
    </button>
  );
}

/* ─── Gateway Badge ─── */
function GatewayBadge({ gateway }: { gateway: string }) {
  const config = {
    stripe: { label: 'Stripe', icon: CreditCard, className: 'bg-violet-500/10 text-violet-500 border-violet-500/20' },
    paystack: { label: 'Paystack', icon: Smartphone, className: 'bg-cyan-500/10 text-cyan-500 border-cyan-500/20' },
    free: { label: 'Gratuit', icon: Gift, className: 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' },
  }[gateway] || { label: gateway, icon: CreditCard, className: 'bg-muted text-muted-foreground border-border' };

  const Icon = config.icon;
  return (
    <span className={cn('inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-medium border', config.className)}>
      <Icon className="h-3 w-3" />
      {config.label}
    </span>
  );
}

/* ─── Status Dot ─── */
function StatusIndicator({ status }: { status: string }) {
  const config: Record<string, { dot: string; label: string; bg: string }> = {
    completed: { dot: 'bg-emerald-500', label: 'Succès', bg: 'bg-emerald-500/10 text-emerald-600' },
    pending: { dot: 'bg-amber-500', label: 'En attente', bg: 'bg-amber-500/10 text-amber-600' },
    failed: { dot: 'bg-red-500', label: 'Échoué', bg: 'bg-red-500/10 text-red-600' },
  };
  const c = config[status] || { dot: 'bg-muted-foreground', label: status, bg: 'bg-muted text-muted-foreground' };

  return (
    <span className={cn('inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[11px] font-medium', c.bg)}>
      <span className={cn('h-1.5 w-1.5 rounded-full', c.dot)} />
      {c.label}
    </span>
  );
}

/* ─── Settlement Badge ─── */
function SettlementBadge({ status }: { status: string | null }) {
  if (!status) return <span className="text-muted-foreground text-xs">—</span>;
  const config: Record<string, string> = {
    held: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
    released: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
    frozen: 'bg-red-500/10 text-red-600 border-red-500/20',
  };
  return (
    <span className={cn('inline-flex items-center px-2 py-0.5 rounded-md text-[11px] font-medium border', config[status] || 'bg-muted text-muted-foreground border-border')}>
      {status === 'held' ? '⏳ Retenu' : status === 'released' ? '✓ Libéré' : status === 'frozen' ? '❄ Gelé' : status}
    </span>
  );
}

/* ════════════════════════════════════════════════════════════
   MAIN COMPONENT
   ════════════════════════════════════════════════════════════ */
export function SuperadminTransactions() {
  const [filter, setFilter] = useState<TxFilter>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [gatewayFilter, setGatewayFilter] = useState<GatewayFilter>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodFilter>('all');
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();
  const [showFilters, setShowFilters] = useState(false);

  const hasActiveFilters = statusFilter !== 'all' || gatewayFilter !== 'all' || periodFilter !== 'all';
  const activeFilterCount = [statusFilter !== 'all', gatewayFilter !== 'all', periodFilter !== 'all'].filter(Boolean).length;

  /* ─── Data fetching (purchases) ─── */
  const { data: purchases = [], isLoading: loadingP } = useQuery({
    queryKey: ['sa-all-purchases'],
    queryFn: async () => {
      const { data, error } = await db.from('product_purchases')
        .select('id, amount, currency, status, created_at, completed_at, paystack_reference, platform_fee, affiliate_commission, organization_amount, settlement_status, user_id, organization_id, affiliate_link_id, buyer_email, buyer_name, digital_products!left(title, organization_id, organizations!left(name))')
        .order('created_at', { ascending: false })
        .limit(2000);
      if (error) { console.error('sa-purchases error:', error); return []; }

      const userIds = [...new Set((data || []).map((r: any) => r.user_id).filter(Boolean))];
      let profileMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await db.from('profiles').select('id, display_name, phone').in('id', userIds);
        (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });
      }

      const affLinkIds = [...new Set((data || []).map((r: any) => r.affiliate_link_id).filter(Boolean))];
      let affLinkMap: Record<string, any> = {};
      if (affLinkIds.length > 0) {
        const { data: affLinks } = await db.from('affiliate_links').select('id, user_id, code').in('id', affLinkIds);
        const affUserIds = [...new Set((affLinks || []).map((a: any) => a.user_id).filter(Boolean))];
        let affProfileMap: Record<string, any> = {};
        if (affUserIds.length > 0) {
          const { data: affProfiles } = await db.from('profiles').select('id, display_name').in('id', affUserIds);
          (affProfiles || []).forEach((p: any) => { affProfileMap[p.id] = p; });
        }
        (affLinks || []).forEach((a: any) => {
          affLinkMap[a.id] = { code: a.code, name: affProfileMap[a.user_id]?.display_name || a.code };
        });
      }

      return (data || []).map((r: any) => ({
        ...r,
        type: 'purchase' as const,
        label: r.digital_products?.title || 'Produit',
        org_name: r.digital_products?.organizations?.name || '—',
        gateway: detectGateway(r.paystack_reference),
        buyer_display: r.buyer_name || profileMap[r.user_id]?.display_name || r.buyer_email || '—',
        buyer_phone: profileMap[r.user_id]?.phone || null,
        affiliate_name: r.affiliate_link_id ? (affLinkMap[r.affiliate_link_id]?.name || '—') : null,
      }));
    },
  });

  /* ─── Data fetching (donations) ─── */
  const { data: donations = [], isLoading: loadingD } = useQuery({
    queryKey: ['sa-all-donations'],
    queryFn: async () => {
      const { data, error } = await db.from('donations')
        .select('id, amount, currency, status, created_at, completed_at, paystack_reference, platform_fee, affiliate_commission, organization_amount, settlement_status, donor_name, donor_email, user_id, affiliate_link_id, organizations!left(name), donation_campaigns!left(title)')
        .order('created_at', { ascending: false })
        .limit(2000);
      if (error) { console.error('sa-donations error:', error); return []; }

      const userIds = [...new Set((data || []).map((r: any) => r.user_id).filter(Boolean))];
      let profileMap: Record<string, any> = {};
      if (userIds.length > 0) {
        const { data: profiles } = await db.from('profiles').select('id, display_name, phone').in('id', userIds);
        (profiles || []).forEach((p: any) => { profileMap[p.id] = p; });
      }

      const affLinkIds = [...new Set((data || []).map((r: any) => r.affiliate_link_id).filter(Boolean))];
      let affLinkMap: Record<string, any> = {};
      if (affLinkIds.length > 0) {
        const { data: affLinks } = await db.from('affiliate_links').select('id, user_id, code').in('id', affLinkIds);
        const affUserIds = [...new Set((affLinks || []).map((a: any) => a.user_id).filter(Boolean))];
        let affProfileMap: Record<string, any> = {};
        if (affUserIds.length > 0) {
          const { data: affProfiles } = await db.from('profiles').select('id, display_name').in('id', affUserIds);
          (affProfiles || []).forEach((p: any) => { affProfileMap[p.id] = p; });
        }
        (affLinks || []).forEach((a: any) => {
          affLinkMap[a.id] = { code: a.code, name: affProfileMap[a.user_id]?.display_name || a.code };
        });
      }

      return (data || []).map((r: any) => ({
        ...r,
        type: 'donation' as const,
        label: r.donation_campaigns?.title || r.donor_name || 'Don anonyme',
        org_name: r.organizations?.name || '—',
        gateway: detectGateway(r.paystack_reference),
        buyer_display: r.donor_name || profileMap[r.user_id]?.display_name || r.donor_email || 'Anonyme',
        buyer_phone: profileMap[r.user_id]?.phone || null,
        affiliate_name: r.affiliate_link_id ? (affLinkMap[r.affiliate_link_id]?.name || '—') : null,
      }));
    },
  });

  const isLoading = loadingP || loadingD;

  /* ─── Filtering ─── */
  const allTx = useMemo(() => {
    let merged = [...purchases, ...donations].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (filter !== 'all') merged = merged.filter(t => t.type === filter);
    if (statusFilter !== 'all') merged = merged.filter(t => t.status === statusFilter);
    if (gatewayFilter !== 'all') merged = merged.filter(t => t.gateway === gatewayFilter);

    const { from, to } = getDateRange(periodFilter, customDateFrom, customDateTo);
    if (from) merged = merged.filter(t => new Date(t.completed_at || t.created_at) >= from);
    if (to) merged = merged.filter(t => new Date(t.completed_at || t.created_at) <= to);

    if (search.trim()) {
      const q = search.toLowerCase();
      merged = merged.filter(t =>
        t.label?.toLowerCase().includes(q) ||
        t.org_name?.toLowerCase().includes(q) ||
        t.paystack_reference?.toLowerCase().includes(q) ||
        t.donor_name?.toLowerCase().includes(q) ||
        t.donor_email?.toLowerCase().includes(q) ||
        t.buyer_display?.toLowerCase().includes(q) ||
        t.affiliate_name?.toLowerCase().includes(q)
      );
    }
    return merged;
  }, [purchases, donations, filter, statusFilter, gatewayFilter, search, periodFilter, customDateFrom, customDateTo]);

  /* ─── Stats ─── */
  const dateRange = getDateRange(periodFilter, customDateFrom, customDateTo);
  const { data: txStats } = useQuery({
    queryKey: ['sa-tx-stats', periodFilter, customDateFrom?.toISOString(), customDateTo?.toISOString()],
    queryFn: async () => {
      const { data } = await db.rpc('get_transaction_stats', {
        _from: dateRange.from?.toISOString() || null,
        _to: dateRange.to?.toISOString() || null,
      });
      return (data || { gmv: 0, platform_fees: 0, affiliate_commissions: 0, total_count: 0 }) as any;
    },
  });

  const fmt = (n: number) => n.toLocaleString() + ' XOF';

  const handleExport = () => {
    downloadCSV(allTx.map(t => ({
      type: t.type,
      gateway: t.gateway,
      label: t.label,
      acheteur: t.buyer_display,
      telephone: t.buyer_phone || '',
      org: t.org_name,
      amount: t.amount,
      currency: t.currency,
      platform_fee: t.platform_fee,
      affiliate_name: t.affiliate_name || '',
      affiliate_commission: t.affiliate_commission,
      organization_amount: t.organization_amount,
      status: t.status,
      settlement: t.settlement_status,
      reference: t.paystack_reference,
      date: t.created_at,
    })), 'transactions-superadmin');
  };

  const clearFilters = () => {
    setStatusFilter('all');
    setGatewayFilter('all');
    setPeriodFilter('all');
    setCustomDateFrom(undefined);
    setCustomDateTo(undefined);
  };

  return (
    <div className="space-y-6">
      {/* ─── Header ─── */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Transactions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Vue d'ensemble de toutes les transactions de la plateforme
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" className="gap-2 rounded-xl h-10">
          <Download className="h-4 w-4" />
          Exporter CSV
        </Button>
      </div>

      {/* ─── Stat Cards ─── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard
          label="Volume total"
          value={fmt(txStats?.gmv || 0)}
          icon={DollarSign}
          accent="bg-primary"
        />
        <StatCard
          label="Frais plateforme"
          value={fmt(txStats?.platform_fees || 0)}
          icon={TrendingUp}
          accent="bg-emerald-500"
        />
        <StatCard
          label="Comm. affiliés"
          value={fmt(txStats?.affiliate_commissions || 0)}
          icon={Users}
          accent="bg-violet-500"
        />
        <StatCard
          label="Transactions"
          value={((txStats as any)?.total_count ?? allTx.length).toLocaleString()}
          icon={BarChart3}
          accent="bg-amber-500"
        />
      </div>

      {/* ─── Search + Type Tabs + Filter Toggle ─── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-0 w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher par nom, référence, org..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-9 h-10 rounded-xl bg-muted/30 border-border/50 focus:bg-background"
          />
        </div>

        {/* Type tabs */}
        <Tabs value={filter} onValueChange={(v) => setFilter(v as TxFilter)} className="shrink-0">
          <TabsList className="h-10 rounded-xl bg-muted/50 p-1">
            <TabsTrigger value="all" className="rounded-lg text-xs px-4 data-[state=active]:shadow-sm">
              Tout
            </TabsTrigger>
            <TabsTrigger value="purchase" className="rounded-lg text-xs px-4 data-[state=active]:shadow-sm gap-1.5">
              <ShoppingCart className="h-3.5 w-3.5" /> Achats
            </TabsTrigger>
            <TabsTrigger value="donation" className="rounded-lg text-xs px-4 data-[state=active]:shadow-sm gap-1.5">
              <Gift className="h-3.5 w-3.5" /> Dons
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Filter toggle */}
        <Button
          variant={showFilters ? 'default' : 'outline'}
          size="sm"
          onClick={() => setShowFilters(!showFilters)}
          className="gap-2 rounded-xl h-10 shrink-0"
        >
          <SlidersHorizontal className="h-4 w-4" />
          Filtres
          {activeFilterCount > 0 && (
            <span className="flex items-center justify-center h-5 w-5 rounded-full bg-primary-foreground/20 text-[10px] font-bold">
              {activeFilterCount}
            </span>
          )}
        </Button>
      </div>

      {/* ─── Advanced Filters Panel ─── */}
      <AnimatePresence>
        {showFilters && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden"
          >
            <div className="p-4 rounded-2xl border border-border/60 bg-card/50 backdrop-blur-sm space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold">Filtres avancés</h3>
                {hasActiveFilters && (
                  <Button variant="ghost" size="sm" onClick={clearFilters} className="text-xs gap-1 h-7 text-muted-foreground">
                    <X className="h-3 w-3" /> Réinitialiser
                  </Button>
                )}
              </div>

              {/* Status */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Statut</label>
                <div className="flex flex-wrap gap-2">
                  <FilterChip active={statusFilter === 'all'} onClick={() => setStatusFilter('all')}>Tous</FilterChip>
                  <FilterChip active={statusFilter === 'completed'} onClick={() => setStatusFilter('completed')} variant="success">
                    ✓ Succès
                  </FilterChip>
                  <FilterChip active={statusFilter === 'pending'} onClick={() => setStatusFilter('pending')} variant="warning">
                    ⏳ En attente
                  </FilterChip>
                  <FilterChip active={statusFilter === 'failed'} onClick={() => setStatusFilter('failed')} variant="danger">
                    ✕ Échoué
                  </FilterChip>
                </div>
              </div>

              {/* Gateway */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Passerelle</label>
                <div className="flex flex-wrap gap-2">
                  <FilterChip active={gatewayFilter === 'all'} onClick={() => setGatewayFilter('all')}>Toutes</FilterChip>
                  <FilterChip active={gatewayFilter === 'stripe'} onClick={() => setGatewayFilter('stripe')}>
                    <CreditCard className="h-3 w-3" /> Stripe
                  </FilterChip>
                  <FilterChip active={gatewayFilter === 'paystack'} onClick={() => setGatewayFilter('paystack')}>
                    <Smartphone className="h-3 w-3" /> Paystack
                  </FilterChip>
                  <FilterChip active={gatewayFilter === 'free'} onClick={() => setGatewayFilter('free')}>
                    <Gift className="h-3 w-3" /> Gratuit
                  </FilterChip>
                </div>
              </div>

              {/* Period */}
              <div className="space-y-2">
                <label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Période</label>
                <div className="flex flex-wrap gap-2">
                  {PERIOD_OPTIONS.map(p => (
                    <FilterChip key={p.key} active={periodFilter === p.key} onClick={() => setPeriodFilter(p.key)}>
                      {p.key === 'custom' && <CalendarIcon className="h-3 w-3" />}
                      {p.label}
                    </FilterChip>
                  ))}
                </div>
              </div>

              {/* Custom date pickers */}
              {periodFilter === 'custom' && (
                <div className="flex flex-wrap items-center gap-3 pt-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">Du</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className={cn("h-9 text-xs gap-2 min-w-[140px] justify-start rounded-xl", !customDateFrom && "text-muted-foreground")}>
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {customDateFrom ? format(customDateFrom, 'dd MMM yyyy', { locale: fr }) : 'Date début'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={customDateFrom} onSelect={setCustomDateFrom} initialFocus className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">au</span>
                    <Popover>
                      <PopoverTrigger asChild>
                        <Button variant="outline" size="sm" className={cn("h-9 text-xs gap-2 min-w-[140px] justify-start rounded-xl", !customDateTo && "text-muted-foreground")}>
                          <CalendarIcon className="h-3.5 w-3.5" />
                          {customDateTo ? format(customDateTo, 'dd MMM yyyy', { locale: fr }) : 'Date fin'}
                        </Button>
                      </PopoverTrigger>
                      <PopoverContent className="w-auto p-0" align="start">
                        <Calendar mode="single" selected={customDateTo} onSelect={setCustomDateTo} initialFocus className="p-3 pointer-events-auto" />
                      </PopoverContent>
                    </Popover>
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Results count ─── */}
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">
          {allTx.length} transaction{allTx.length !== 1 ? 's' : ''}
          {filter !== 'all' && <> · {filter === 'purchase' ? 'Achats' : 'Dons'}</>}
        </p>
      </div>

      {/* ─── Table ─── */}
      {isLoading ? <SkeletonRow count={8} /> : allTx.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="h-12 w-12 rounded-2xl bg-muted flex items-center justify-center mb-3">
            <Search className="h-5 w-5 text-muted-foreground" />
          </div>
          <p className="text-sm font-medium">Aucune transaction trouvée</p>
          <p className="text-xs text-muted-foreground mt-1">Essayez de modifier vos filtres</p>
        </div>
      ) : (
        <div className="rounded-2xl border border-border/60 overflow-hidden bg-card">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30 hover:bg-muted/30">
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground w-[70px]">Type</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Détail</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Acheteur</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Organisation</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Passerelle</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Montant</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Frais</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Affilié</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Statut</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Règlement</TableHead>
                <TableHead className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground text-right">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allTx.map((tx, i) => (
                <motion.tr
                  key={tx.id}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: Math.min(i * 0.015, 0.3) }}
                  className="border-b border-border/40 hover:bg-muted/20 transition-colors"
                >
                  <TableCell className="py-3">
                    <span className={cn(
                      'inline-flex items-center justify-center h-8 w-8 rounded-lg text-xs font-bold',
                      tx.type === 'purchase'
                        ? 'bg-primary/10 text-primary'
                        : 'bg-pink-500/10 text-pink-500'
                    )}>
                      {tx.type === 'purchase' ? <ShoppingCart className="h-3.5 w-3.5" /> : <Gift className="h-3.5 w-3.5" />}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    <p className="text-sm font-medium truncate max-w-[180px]">{tx.label}</p>
                    <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{tx.paystack_reference?.slice(0, 22)}</p>
                  </TableCell>
                  <TableCell className="py-3">
                    <p className="text-sm font-medium truncate max-w-[130px]">{tx.buyer_display}</p>
                    {tx.buyer_phone && <p className="text-[10px] text-muted-foreground mt-0.5">{tx.buyer_phone}</p>}
                  </TableCell>
                  <TableCell className="py-3">
                    <p className="text-sm truncate max-w-[120px]">{tx.org_name}</p>
                  </TableCell>
                  <TableCell className="py-3">
                    <GatewayBadge gateway={tx.gateway} />
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <span className="text-sm font-semibold tabular-nums">
                      {(tx.amount || 0).toLocaleString()}
                    </span>
                    <span className="text-[10px] text-muted-foreground ml-1">{tx.currency}</span>
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <span className="text-xs text-muted-foreground tabular-nums">
                      {(tx.platform_fee || 0).toLocaleString('fr-FR')}
                    </span>
                  </TableCell>
                  <TableCell className="py-3">
                    {tx.affiliate_name ? (
                      <div>
                        <p className="text-xs font-medium truncate max-w-[100px]">{tx.affiliate_name}</p>
                        <p className="text-[10px] text-muted-foreground">{(tx.affiliate_commission || 0).toLocaleString('fr-FR')} XOF</p>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell className="py-3">
                    <StatusIndicator status={tx.status} />
                  </TableCell>
                  <TableCell className="py-3">
                    <SettlementBadge status={tx.settlement_status} />
                  </TableCell>
                  <TableCell className="py-3 text-right">
                    <p className="text-xs tabular-nums">
                      {new Date(tx.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' })}
                    </p>
                    <p className="text-[10px] text-muted-foreground">
                      {new Date(tx.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </TableCell>
                </motion.tr>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}

export default SuperadminTransactions;
