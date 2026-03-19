import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useOrg } from '@/contexts/OrgContext';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Download, Search, CalendarIcon, DollarSign, TrendingUp, Users, BarChart3, ShoppingCart, Heart, CreditCard, Zap, ArrowUpRight, ArrowDownRight, Filter } from 'lucide-react';
import { format, startOfDay, startOfWeek, startOfMonth, subDays, subMonths } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { downloadCSV } from '@/lib/csvExport';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { useI18n } from '@/i18n/I18nContext';
import { motion } from 'framer-motion';

type PeriodKey = 'all' | 'today' | '7d' | '30d' | '90d' | 'this_month' | 'this_week' | 'custom';

export default function AdminSales() {
  const { currentOrg } = useOrg();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const dateFnsLocale = isFr ? fr : enUS;
  const { fmt } = useDisplayCurrency();
  const orgId = currentOrg?.id;
  const orgCurrency = currentOrg?.currency || 'XOF';

  const [filter, setFilter] = useState<'all' | 'purchase' | 'donation'>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodKey>('all');
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();

  const getDateRange = (): { from: Date | null; to: Date | null } => {
    const now = new Date();
    switch (periodFilter) {
      case 'today': return { from: startOfDay(now), to: now };
      case 'this_week': return { from: startOfWeek(now, { weekStartsOn: 1 }), to: now };
      case 'this_month': return { from: startOfMonth(now), to: now };
      case '7d': return { from: subDays(now, 7), to: now };
      case '30d': return { from: subDays(now, 30), to: now };
      case '90d': return { from: subMonths(now, 3), to: now };
      case 'custom': return { from: customDateFrom || null, to: customDateTo || null };
      default: return { from: null, to: null };
    }
  };

  const detectGateway = (ref: string | null): string => {
    if (!ref) return 'unknown';
    if (ref.startsWith('free-')) return 'free';
    if (ref.includes('STRIPE')) return 'stripe';
    return 'paystack';
  };

  const { data: purchases = [], isLoading: loadingP } = useQuery({
    queryKey: ['admin-sales-purchases', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await db.from('product_purchases')
        .select('id, amount, currency, status, created_at, completed_at, paystack_reference, platform_fee, affiliate_commission, organization_amount, user_id, affiliate_link_id, product_id, buyer_name, buyer_email, digital_products(title)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) { console.error('admin-purchases error:', error); return []; }

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
        label: r.digital_products?.title || (isFr ? 'Produit' : 'Product'),
        gateway: detectGateway(r.paystack_reference),
        buyer_display: r.buyer_name || profileMap[r.user_id]?.display_name || '—',
        buyer_email: r.buyer_email || null,
        buyer_phone: profileMap[r.user_id]?.phone || null,
        affiliate_name: r.affiliate_link_id ? (affLinkMap[r.affiliate_link_id]?.name || '—') : null,
      }));
    },
    enabled: !!orgId,
  });

  const { data: donations = [], isLoading: loadingD } = useQuery({
    queryKey: ['admin-sales-donations', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data, error } = await db.from('donations')
        .select('id, amount, currency, status, created_at, completed_at, paystack_reference, platform_fee, affiliate_commission, organization_amount, donor_name, donor_email, user_id, affiliate_link_id, donation_campaigns(title)')
        .eq('organization_id', orgId)
        .order('created_at', { ascending: false })
        .limit(500);
      if (error) { console.error('admin-donations error:', error); return []; }

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
        label: r.donation_campaigns?.title || (isFr ? 'Don (sans campagne)' : 'Donation (no campaign)'),
        gateway: detectGateway(r.paystack_reference),
        buyer_display: r.donor_name || profileMap[r.user_id]?.display_name || r.donor_email || (isFr ? 'Anonyme' : 'Anonymous'),
        buyer_email: r.donor_email || null,
        buyer_phone: profileMap[r.user_id]?.phone || null,
        affiliate_name: r.affiliate_link_id ? (affLinkMap[r.affiliate_link_id]?.name || '—') : null,
      }));
    },
    enabled: !!orgId,
  });

  const isLoading = loadingP || loadingD;

  const allTx = useMemo(() => {
    let merged = [...purchases, ...donations].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (filter !== 'all') merged = merged.filter(t => t.type === filter);
    if (statusFilter !== 'all') merged = merged.filter(t => t.status === statusFilter);

    const { from, to } = getDateRange();
    if (from) merged = merged.filter(t => new Date(t.created_at) >= from);
    if (to) merged = merged.filter(t => new Date(t.created_at) <= to);

    if (search.trim()) {
      const q = search.toLowerCase();
      merged = merged.filter(t =>
        t.label?.toLowerCase().includes(q) ||
        t.paystack_reference?.toLowerCase().includes(q) ||
        t.buyer_display?.toLowerCase().includes(q) ||
        t.buyer_email?.toLowerCase().includes(q) ||
        t.buyer_phone?.toLowerCase().includes(q) ||
        t.affiliate_name?.toLowerCase().includes(q)
      );
    }
    return merged;
  }, [purchases, donations, filter, statusFilter, search, periodFilter, customDateFrom, customDateTo]);

  const completedTx = allTx.filter(t => t.status === 'completed');
  const totalGMV = completedTx.reduce((s, t) => s + (t.amount || 0), 0);
  const totalOrgReceived = completedTx.reduce((s, t) => s + (t.organization_amount || 0), 0);
  const totalAffComm = completedTx.reduce((s, t) => s + (t.affiliate_commission || 0), 0);
  const totalFees = completedTx.reduce((s, t) => s + (t.platform_fee || 0), 0);

  const handleExport = () => {
    downloadCSV(allTx.map(t => ({
      type: t.type === 'purchase' ? (isFr ? 'Achat' : 'Purchase') : (isFr ? 'Don' : 'Donation'),
      produit: t.label,
      acheteur: t.buyer_display,
      email: t.buyer_email || '',
      telephone: t.buyer_phone || '',
      montant: t.amount,
      devise: t.currency,
      recu_org: t.organization_amount,
      frais_plateforme: t.platform_fee,
      affilié: t.affiliate_name || '',
      commission_affilié: t.affiliate_commission,
      passerelle: t.gateway,
      statut: t.status,
      reference: t.paystack_reference,
      date: t.created_at,
    })), `${isFr ? 'ventes' : 'sales'}-${currentOrg?.slug || 'org'}`);
  };

  const statCards = [
    {
      label: isFr ? "Chiffre d'affaires" : 'Revenue',
      value: fmt(totalGMV, orgCurrency),
      icon: DollarSign,
      gradient: 'from-primary/20 via-primary/5 to-transparent',
      iconBg: 'bg-primary/20',
      iconColor: 'text-primary',
      border: 'border-primary/20',
    },
    {
      label: isFr ? 'Reçu (net)' : 'Received (net)',
      value: fmt(totalOrgReceived, orgCurrency),
      icon: TrendingUp,
      gradient: 'from-emerald-500/20 via-emerald-500/5 to-transparent',
      iconBg: 'bg-emerald-500/20',
      iconColor: 'text-emerald-500',
      border: 'border-emerald-500/20',
    },
    {
      label: isFr ? 'Comm. Affiliés' : 'Affiliate Comm.',
      value: fmt(totalAffComm, orgCurrency),
      icon: Users,
      gradient: 'from-amber-500/20 via-amber-500/5 to-transparent',
      iconBg: 'bg-amber-500/20',
      iconColor: 'text-amber-500',
      border: 'border-amber-500/20',
    },
    {
      label: 'Transactions',
      value: allTx.length.toString(),
      icon: BarChart3,
      gradient: 'from-violet-500/20 via-violet-500/5 to-transparent',
      iconBg: 'bg-violet-500/20',
      iconColor: 'text-violet-500',
      border: 'border-violet-500/20',
    },
  ];

  const typeFilters = [
    { key: 'all' as const, label: isFr ? 'Tout' : 'All', icon: Zap },
    { key: 'purchase' as const, label: isFr ? 'Achats' : 'Purchases', icon: ShoppingCart },
    { key: 'donation' as const, label: isFr ? 'Dons' : 'Donations', icon: Heart },
  ];

  const statusFilters = [
    { key: 'all' as const, label: isFr ? 'Tous' : 'All', color: '' },
    { key: 'completed' as const, label: isFr ? 'Succès' : 'Success', color: 'text-emerald-500' },
    { key: 'pending' as const, label: isFr ? 'En attente' : 'Pending', color: 'text-amber-500' },
    { key: 'failed' as const, label: isFr ? 'Échec' : 'Failed', color: 'text-red-500' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight">{isFr ? 'Mes Ventes' : 'My Sales'}</h1>
          <p className="text-sm text-muted-foreground mt-1">{isFr ? 'Historique complet des transactions de votre boutique' : 'Complete transaction history for your store'}</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => navigate('/admin/payouts')} className="gap-2">
            <ArrowUpRight className="h-4 w-4" /> {isFr ? 'Retraits' : 'Payouts'}
          </Button>
          <Button onClick={handleExport} className="gap-2 shadow-lg shadow-primary/20">
            <Download className="h-4 w-4" /> Export CSV
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card, i) => (
          <motion.div
            key={card.label}
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.08 }}
            className={cn(
              'relative overflow-hidden rounded-2xl border p-5 bg-card',
              card.border
            )}
          >
            <div className={cn('absolute inset-0 bg-gradient-to-br opacity-60', card.gradient)} />
            <div className="relative">
              <div className={cn('h-10 w-10 rounded-xl flex items-center justify-center mb-3', card.iconBg)}>
                <card.icon className={cn('h-5 w-5', card.iconColor)} />
              </div>
              <p className="text-2xl font-extrabold tracking-tight">{card.value}</p>
              <p className="text-xs text-muted-foreground mt-1 font-medium">{card.label}</p>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters Bar */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="rounded-2xl border border-border bg-card p-4 space-y-4"
      >
        <div className="flex flex-wrap items-center gap-3">
          <div className="relative flex-1 min-w-[220px] max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder={isFr ? "Rechercher acheteur, produit, référence..." : "Search buyer, product, reference..."}
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 h-10 rounded-xl bg-muted/50 border-0 focus-visible:ring-primary/30"
            />
          </div>

          <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1">
            {typeFilters.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  filter === f.key
                    ? 'bg-primary text-primary-foreground shadow-md shadow-primary/25'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <f.icon className="h-3.5 w-3.5" />
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-1 bg-muted/50 rounded-xl p-1">
            {statusFilters.map(s => (
              <button
                key={s.key}
                onClick={() => setStatusFilter(s.key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all',
                  statusFilter === s.key
                    ? 'bg-foreground text-background shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Period Filter */}
        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mr-1">
            <CalendarIcon className="h-3.5 w-3.5" />
            {isFr ? 'Période' : 'Period'}
          </div>
          {([
            { key: 'all', label: isFr ? 'Tout' : 'All' },
            { key: 'today', label: isFr ? "Aujourd'hui" : 'Today' },
            { key: 'this_week', label: isFr ? 'Semaine' : 'Week' },
            { key: 'this_month', label: isFr ? 'Mois' : 'Month' },
            { key: '7d', label: '7d' },
            { key: '30d', label: '30d' },
            { key: '90d', label: '90d' },
            { key: 'custom', label: isFr ? 'Personnalisé' : 'Custom' },
          ] as { key: PeriodKey; label: string }[]).map(p => (
            <button
              key={p.key}
              onClick={() => setPeriodFilter(p.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all',
                periodFilter === p.key
                  ? 'bg-primary/10 text-primary ring-1 ring-primary/30'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {periodFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl bg-muted/30">
            <span className="text-xs text-muted-foreground font-medium">{isFr ? 'Du :' : 'From:'}</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-9 text-xs gap-2 min-w-[140px] justify-start rounded-lg", !customDateFrom && "text-muted-foreground")}>
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {customDateFrom ? format(customDateFrom, 'dd MMM yyyy', { locale: dateFnsLocale }) : (isFr ? 'Date début' : 'Start date')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customDateFrom} onSelect={setCustomDateFrom} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <span className="text-xs text-muted-foreground font-medium">{isFr ? 'Au :' : 'To:'}</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-9 text-xs gap-2 min-w-[140px] justify-start rounded-lg", !customDateTo && "text-muted-foreground")}>
                  <CalendarIcon className="h-3.5 w-3.5" />
                  {customDateTo ? format(customDateTo, 'dd MMM yyyy', { locale: dateFnsLocale }) : (isFr ? 'Date fin' : 'End date')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customDateTo} onSelect={setCustomDateTo} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            {(customDateFrom || customDateTo) && (
              <Button size="sm" variant="ghost" className="h-8 text-xs" onClick={() => { setCustomDateFrom(undefined); setCustomDateTo(undefined); }}>
                {isFr ? 'Réinitialiser' : 'Reset'}
              </Button>
            )}
          </div>
        )}
      </motion.div>

      {/* Transaction History */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-sm font-bold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            {isFr ? 'Historique des transactions' : 'Transaction history'}
          </h2>
          <span className="text-xs text-muted-foreground font-medium">
            {allTx.length} {isFr ? 'résultat' : 'result'}{allTx.length !== 1 ? 's' : ''}
          </span>
        </div>

        {isLoading ? <SkeletonRow count={8} /> : allTx.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-bold text-lg">{isFr ? 'Aucune transaction' : 'No transactions'}</p>
            <p className="text-sm text-muted-foreground mt-1">{isFr ? 'Les ventes et dons apparaîtront ici' : 'Sales and donations will appear here'}</p>
          </div>
        ) : (
          <div className="rounded-2xl border border-border overflow-hidden bg-card overflow-x-auto">
            <Table className="w-full table-fixed">
              <TableHeader>
                <TableRow className="bg-muted/40 hover:bg-muted/40">
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Type</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{isFr ? 'Produit / Campagne' : 'Product / Campaign'}</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{isFr ? 'Acheteur / Donateur' : 'Buyer / Donor'}</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{isFr ? 'Passerelle' : 'Gateway'}</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">{isFr ? 'Montant' : 'Amount'}</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">{isFr ? 'Reçu (net)' : 'Received (net)'}</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground text-right">{isFr ? 'Frais' : 'Fees'}</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{isFr ? 'Affilié' : 'Affiliate'}</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">{isFr ? 'Statut' : 'Status'}</TableHead>
                  <TableHead className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Date</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {allTx.map((tx, idx) => (
                  <TableRow key={tx.id} className="group hover:bg-muted/20 transition-colors">
                    <TableCell>
                      <div className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold',
                        tx.type === 'purchase'
                          ? 'bg-primary/10 text-primary'
                          : 'bg-pink-500/10 text-pink-500'
                      )}>
                        {tx.type === 'purchase' ? <ShoppingCart className="h-3 w-3" /> : <Heart className="h-3 w-3" />}
                        {tx.type === 'purchase' ? (isFr ? 'Achat' : 'Purchase') : (isFr ? 'Don' : 'Donation')}
                      </div>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-semibold truncate max-w-[180px]">{tx.label}</p>
                      <p className="text-[10px] text-muted-foreground font-mono mt-0.5">{tx.paystack_reference?.slice(0, 20)}</p>
                    </TableCell>
                    <TableCell>
                      <p className="text-sm font-medium truncate max-w-[140px]">{tx.buyer_display}</p>
                      {tx.buyer_email && <p className="text-[10px] text-muted-foreground truncate max-w-[140px] mt-0.5">{tx.buyer_email}</p>}
                    </TableCell>
                    <TableCell>
                      <div className={cn(
                        'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-semibold',
                        tx.gateway === 'stripe' ? 'bg-violet-500/10 text-violet-500' :
                        tx.gateway === 'paystack' ? 'bg-cyan-500/10 text-cyan-500' :
                        'bg-muted text-muted-foreground'
                      )}>
                        <CreditCard className="h-3 w-3" />
                        {tx.gateway === 'stripe' ? 'Stripe' : tx.gateway === 'paystack' ? 'Paystack' : (isFr ? 'Gratuit' : 'Free')}
                      </div>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold">{fmt(tx.amount || 0, tx.currency)}</span>
                    </TableCell>
                    <TableCell className="text-right">
                      <span className="text-sm font-bold text-emerald-500 flex items-center justify-end gap-1">
                        <ArrowUpRight className="h-3 w-3" />
                        {fmt(tx.organization_amount || 0, tx.currency)}
                      </span>
                    </TableCell>
                    <TableCell className="text-right text-xs text-muted-foreground">{fmt(tx.platform_fee || 0, tx.currency)}</TableCell>
                    <TableCell>
                      {tx.affiliate_name ? (
                        <div>
                          <p className="text-xs font-semibold">{tx.affiliate_name}</p>
                          <p className="text-[10px] text-amber-500 font-medium">{fmt(tx.affiliate_commission || 0, tx.currency)}</p>
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground/50">—</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <span className={cn(
                        'inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold',
                        tx.status === 'completed' ? 'bg-emerald-500/15 text-emerald-500' :
                        tx.status === 'pending' ? 'bg-amber-500/15 text-amber-500' :
                        'bg-red-500/15 text-red-500'
                      )}>
                        <span className={cn(
                          'h-1.5 w-1.5 rounded-full',
                          tx.status === 'completed' ? 'bg-emerald-500' :
                          tx.status === 'pending' ? 'bg-amber-500' :
                          'bg-red-500'
                        )} />
                        {tx.status === 'completed' ? (isFr ? 'Succès' : 'Success') : tx.status === 'pending' ? (isFr ? 'En attente' : 'Pending') : (isFr ? 'Échec' : 'Failed')}
                      </span>
                    </TableCell>
                    <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                      <p className="font-medium">{new Date(tx.created_at).toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short', year: '2-digit' })}</p>
                      <p className="text-[10px] mt-0.5">{new Date(tx.created_at).toLocaleTimeString(isFr ? 'fr-FR' : 'en-US', { hour: '2-digit', minute: '2-digit' })}</p>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </motion.div>
    </div>
  );
}
