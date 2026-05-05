import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useOrg } from '@/contexts/OrgContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { Download, Search, CalendarIcon, DollarSign, TrendingUp, Users, BarChart3, ShoppingCart, Heart, CreditCard, Zap, ArrowUpRight, Wallet, ChevronRight } from 'lucide-react';
import { format, startOfDay, startOfWeek, startOfMonth, subDays, subMonths } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { downloadCSV } from '@/lib/csvExport';
import { formatCurrency } from '@/lib/currency';
import { useI18n } from '@/i18n/I18nContext';
import { CurrencyIcon } from '@/components/ui/CurrencyIcon';
import { motion } from 'framer-motion';
import { useAuth } from '@/contexts/AuthContext';

type PeriodKey = 'all' | 'today' | '7d' | '30d' | '90d' | 'this_month' | 'this_week' | 'custom';

export default function AdminSales() {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const dateFnsLocale = isFr ? fr : enUS;
  const orgId = currentOrg?.id;
  const orgCurrency = currentOrg?.currency || 'XOF';
  const fmt = (amount: number, _src?: string | null) => formatCurrency(amount, orgCurrency, locale);

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
        buyer_display: r.buyer_name || profileMap[r.user_id]?.display_name || r.buyer_email?.split('@')[0] || (isFr ? 'Client' : 'Customer'),
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
        buyer_display: r.donor_name || profileMap[r.user_id]?.display_name || r.donor_email?.split('@')[0] || (isFr ? 'Donateur' : 'Donor'),
        buyer_email: r.donor_email || null,
        buyer_phone: profileMap[r.user_id]?.phone || null,
        affiliate_name: r.affiliate_link_id ? (affLinkMap[r.affiliate_link_id]?.name || '—') : null,
      }));
    },
    enabled: !!orgId,
  });

  const { data: earnedCommissionStats = { amount: 0, count: 0 }, isLoading: loadingC } = useQuery({
    queryKey: ['admin-sales-earned-commissions', orgId, user?.id],
    queryFn: async () => {
      if (!orgId || !user) return { amount: 0, count: 0 };

      const { data, error } = await db.from('affiliate_sales')
        .select('id, commission_amount')
        .eq('organization_id', orgId)
        .eq('affiliate_user_id', user.id);

      if (error) {
        console.error('admin-earned-commissions error:', error);
        return { amount: 0, count: 0 };
      }

      const rows = data || [];
      return {
        amount: rows.reduce((s: number, r: any) => s + (r.commission_amount || 0), 0),
        count: rows.length,
      };
    },
    enabled: !!orgId && !!user,
  });

  const isLoading = loadingP || loadingD || loadingC;

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
  const completedSales = completedTx.filter(t => t.type === 'purchase');
  const completedDonations = completedTx.filter(t => t.type === 'donation');
  const totalGMV = completedTx.reduce((s, t) => s + (t.amount || 0), 0);
  const totalOrgReceived = completedTx.reduce((s, t) => s + (t.organization_amount || 0), 0);
  const totalEarnedCommissions = earnedCommissionStats.amount;

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
      ambassadeur: t.affiliate_name || '',
      commission_ambassadeur: t.affiliate_commission,
      passerelle: t.gateway,
      statut: t.status,
      reference: t.paystack_reference,
      date: t.created_at,
    })), `${isFr ? 'ventes-dons' : 'sales-donations'}-${currentOrg?.slug || 'org'}`);
  };

  const totalSalesAmount = completedSales.reduce((s, t) => s + (t.amount || 0), 0);
  const totalDonationsAmount = completedDonations.reduce((s, t) => s + (t.amount || 0), 0);
  const totalRevenue = totalSalesAmount + totalDonationsAmount + totalEarnedCommissions;
  const totalYourShare = totalOrgReceived + totalEarnedCommissions;

  const statCards = [
    { label: isFr ? 'Ventes' : 'Sales', value: fmt(totalSalesAmount, orgCurrency), sub: `${completedSales.length} ${isFr ? 'transaction' : 'transaction'}${completedSales.length !== 1 ? 's' : ''}`, icon: ShoppingCart, color: 'blue' as const },
    { label: isFr ? 'Dons reçus' : 'Donations received', value: fmt(totalDonationsAmount, orgCurrency), sub: `${completedDonations.length} ${isFr ? 'don' : 'donation'}${completedDonations.length !== 1 ? 's' : ''}`, icon: Heart, color: 'rose' as const },
    { label: isFr ? 'Commissions gagnées' : 'Earned commissions', value: fmt(totalEarnedCommissions, orgCurrency), sub: `${earnedCommissionStats.count} ${isFr ? 'commission' : 'commission'}${earnedCommissionStats.count !== 1 ? 's' : ''}`, icon: Users, color: 'amber' as const },
    { label: isFr ? 'Revenus total' : 'Total revenue', value: fmt(totalRevenue, orgCurrency), sub: isFr ? `${completedSales.length} ventes + ${completedDonations.length} dons + ${earnedCommissionStats.count} commissions` : `${completedSales.length} sales + ${completedDonations.length} donations + ${earnedCommissionStats.count} commissions`, icon: DollarSign, renderIcon: <CurrencyIcon currency={orgCurrency} className="h-4 w-4 text-primary" />, color: 'primary' as const },
    { label: isFr ? 'Votre part' : 'Your share', value: fmt(totalYourShare, orgCurrency), sub: isFr ? 'Ventes/dons nets + commissions gagnées' : 'Net sales/donations + earned commissions', icon: TrendingUp, color: 'emerald' as const },
    { label: isFr ? 'Transactions' : 'Transactions', value: allTx.length.toString(), icon: BarChart3, color: 'muted' as const },
  ];

  const typeFilters = [
    { key: 'all' as const, label: isFr ? 'Tout' : 'All', icon: Zap },
    { key: 'purchase' as const, label: isFr ? 'Achats' : 'Purchases', icon: ShoppingCart },
    { key: 'donation' as const, label: isFr ? 'Dons' : 'Donations', icon: Heart },
  ];

  const statusFilters = [
    { key: 'all' as const, label: isFr ? 'Tous' : 'All' },
    { key: 'completed' as const, label: isFr ? 'Succès' : 'Success' },
    { key: 'pending' as const, label: isFr ? 'En attente' : 'Pending' },
    { key: 'failed' as const, label: isFr ? 'Échec' : 'Failed' },
  ];

  const periodOptions: { key: PeriodKey; label: string }[] = [
    { key: 'all', label: isFr ? 'Tout' : 'All' },
    { key: 'today', label: isFr ? "Auj." : 'Today' },
    { key: 'this_week', label: isFr ? 'Sem.' : 'Week' },
    { key: 'this_month', label: isFr ? 'Mois' : 'Month' },
    { key: '7d', label: '7j' },
    { key: '30d', label: '30j' },
    { key: '90d', label: '90j' },
    { key: 'custom', label: isFr ? 'Custom' : 'Custom' },
  ];

  const gatewayLabel = (g: string) =>
    g === 'stripe' ? 'Stripe' : g === 'paystack' ? 'Paystack' : isFr ? 'Gratuit' : 'Free';

  const statusLabel = (s: string) =>
    s === 'completed' ? (isFr ? 'Succès' : 'Success') :
    s === 'pending' ? (isFr ? 'Attente' : 'Pending') :
    (isFr ? 'Échec' : 'Failed');

  return (
    <div className="space-y-6 pb-8">
      {/* ── Header ── */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center justify-between gap-3 mb-1">
          <h1 className="text-xl sm:text-2xl lg:text-3xl font-extrabold tracking-tight">
            {isFr ? 'Mes ventes et dons' : 'My sales & donations'}
          </h1>
          <div className="flex items-center gap-2 shrink-0">
            <Button
              onClick={() => navigate('/admin/payouts')}
              className="gap-2 bg-foreground text-background hover:bg-foreground/90 font-bold shadow-elevated rounded-xl h-9 sm:h-10 px-3 sm:px-5 text-xs sm:text-sm"
            >
              <Wallet className="h-4 w-4" /> <span className="hidden sm:inline">{isFr ? 'Retraits' : 'Payouts'}</span>
            </Button>
            <Button
              onClick={handleExport}
              variant="outline"
              size="icon"
              className="rounded-xl h-10 w-10 border-border shrink-0"
            >
              <Download className="h-4 w-4" />
            </Button>
          </div>
        </div>
        <p className="text-sm text-muted-foreground">
          {isFr
            ? `Historique complet des ventes, dons et commissions gagnées${currentOrg?.name ? ` de ${currentOrg.name}` : ''}`
            : `Complete history of sales, donations and earned commissions${currentOrg?.name ? ` for ${currentOrg.name}` : ''}`}
        </p>
      </motion.div>

      {/* ── Stat Cards ── */}
      <div className="grid grid-cols-2 xl:grid-cols-3 gap-3 sm:gap-4">
        {statCards.map((card, i) => {
          const colorStyles = {
            primary: { bg: 'bg-primary/8', text: 'text-primary', border: 'border-primary/15' },
            emerald: { bg: 'bg-emerald-500/8', text: 'text-emerald-600', border: 'border-emerald-500/15' },
            amber: { bg: 'bg-amber-500/8', text: 'text-amber-600', border: 'border-amber-500/15' },
            blue: { bg: 'bg-blue-500/8', text: 'text-blue-600', border: 'border-blue-500/15' },
            rose: { bg: 'bg-rose-500/8', text: 'text-rose-600', border: 'border-rose-500/15' },
            muted: { bg: 'bg-muted/60', text: 'text-foreground', border: 'border-border/70' },
          }[card.color];

          return (
            <motion.div
              key={card.label}
              initial={{ opacity: 0, y: 16, filter: 'blur(4px)' }}
              animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
              transition={{ delay: 0.08 * i, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className={cn(
                'relative rounded-2xl border bg-card p-5 sm:p-6 overflow-hidden transition-shadow duration-300 hover:shadow-elevated',
                colorStyles.border
              )}
            >
              <div className={cn('h-9 w-9 rounded-xl flex items-center justify-center mb-4', colorStyles.bg)}>
                {'renderIcon' in card && card.renderIcon ? card.renderIcon : <card.icon className={cn('h-[18px] w-[18px]', colorStyles.text)} />}
              </div>
              <p className="text-lg sm:text-2xl lg:text-3xl font-extrabold tracking-tight leading-none tabular-nums">
                {card.value}
              </p>
              <p className="text-[11px] sm:text-xs text-muted-foreground mt-2 font-semibold uppercase tracking-wider">
                {card.label}
              </p>
              {'sub' in card && card.sub && (
                <p className="text-[10px] text-muted-foreground mt-1">{card.sub}</p>
              )}
            </motion.div>
          );
        })}
      </div>

      {/* ── Filters ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="space-y-3"
      >
        {/* Search */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder={isFr ? 'Rechercher un produit, acheteur, email...' : 'Search product, buyer, email...'}
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10 h-11 rounded-xl bg-muted/30 border-border/50 text-sm focus-visible:ring-primary/30"
          />
        </div>

        {/* Type + Status filters */}
        <div className="flex flex-wrap gap-2">
          <div className="flex items-center gap-0.5 bg-muted/40 rounded-xl p-1 border border-border/30">
            {typeFilters.map(f => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={cn(
                  'flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
                  filter === f.key
                    ? 'bg-primary text-primary-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                <f.icon className="h-3 w-3" />
                {f.label}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-0.5 bg-muted/40 rounded-xl p-1 border border-border/30">
            {statusFilters.map(s => (
              <button
                key={s.key}
                onClick={() => setStatusFilter(s.key)}
                className={cn(
                  'px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200',
                  statusFilter === s.key
                    ? 'bg-foreground text-background shadow-sm'
                    : 'text-muted-foreground hover:text-foreground'
                )}
              >
                {s.label}
              </button>
            ))}
          </div>
        </div>

        {/* Period */}
        <div className="flex items-center gap-1 overflow-x-auto scrollbar-hide pb-0.5">
          <CalendarIcon className="h-3.5 w-3.5 text-muted-foreground mr-1 shrink-0" />
          {periodOptions.map(p => (
            <button
              key={p.key}
              onClick={() => setPeriodFilter(p.key)}
              className={cn(
                'px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 whitespace-nowrap shrink-0',
                periodFilter === p.key
                  ? 'bg-primary/10 text-primary ring-1 ring-primary/20'
                  : 'text-muted-foreground hover:text-foreground hover:bg-muted/40'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>

        {periodFilter === 'custom' && (
          <div className="flex flex-wrap items-center gap-2.5 p-3 rounded-xl bg-muted/20 border border-border/30">
            <span className="text-xs text-muted-foreground font-medium">{isFr ? 'Du :' : 'From:'}</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1.5 rounded-lg", !customDateFrom && "text-muted-foreground")}>
                  <CalendarIcon className="h-3 w-3" />
                  {customDateFrom ? format(customDateFrom, 'dd MMM yyyy', { locale: dateFnsLocale }) : (isFr ? 'Début' : 'Start')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customDateFrom} onSelect={setCustomDateFrom} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            <span className="text-xs text-muted-foreground font-medium">{isFr ? 'Au :' : 'To:'}</span>
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1.5 rounded-lg", !customDateTo && "text-muted-foreground")}>
                  <CalendarIcon className="h-3 w-3" />
                  {customDateTo ? format(customDateTo, 'dd MMM yyyy', { locale: dateFnsLocale }) : (isFr ? 'Fin' : 'End')}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar mode="single" selected={customDateTo} onSelect={setCustomDateTo} initialFocus className="p-3 pointer-events-auto" />
              </PopoverContent>
            </Popover>
            {(customDateFrom || customDateTo) && (
              <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setCustomDateFrom(undefined); setCustomDateTo(undefined); }}>
                {isFr ? 'Réinitialiser' : 'Reset'}
              </Button>
            )}
          </div>
        )}
      </motion.div>

      {/* ── Transactions ── */}
      <motion.div
        initial={{ opacity: 0, y: 14 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4, duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      >
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            {isFr ? 'Transactions' : 'Transactions'}
          </h2>
          <span className="text-xs text-muted-foreground font-medium tabular-nums">
            {allTx.length} {isFr ? 'résultat' : 'result'}{allTx.length !== 1 ? 's' : ''}
          </span>
        </div>

        {isLoading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="rounded-xl border border-border bg-card p-4 skeleton-shimmer h-24" />
            ))}
          </div>
        ) : allTx.length === 0 ? (
          <div className="rounded-2xl border border-border bg-card p-12 sm:p-16 text-center">
            <div className="h-14 w-14 rounded-2xl bg-muted/50 flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="h-7 w-7 text-muted-foreground" />
            </div>
            <p className="font-bold text-base">{isFr ? 'Aucune transaction' : 'No transactions'}</p>
            <p className="text-sm text-muted-foreground mt-1.5 max-w-xs mx-auto">
              {isFr ? 'Les ventes et dons apparaîtront ici dès votre première transaction' : 'Sales and donations will appear here once you get your first transaction'}
            </p>
          </div>
        ) : (
          <div className="space-y-2.5">
            {allTx.map((tx, i) => (
              <motion.div
                key={tx.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3), duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
                className="rounded-xl border border-border bg-card p-4 hover:shadow-card transition-shadow duration-200 group"
              >
                {/* Row 1: Type badge + Amount + Status */}
                <div className="flex items-start justify-between gap-3 mb-2.5">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className={cn(
                      'h-9 w-9 rounded-xl flex items-center justify-center shrink-0',
                      tx.type === 'purchase' ? 'bg-primary/10' : 'bg-pink-500/10'
                    )}>
                      {tx.type === 'purchase'
                        ? <ShoppingCart className="h-4 w-4 text-primary" />
                        : <Heart className="h-4 w-4 text-pink-500" />
                      }
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold truncate">{tx.label}</p>
                      <p className="text-[11px] text-muted-foreground truncate">{tx.buyer_display}</p>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-sm font-extrabold tabular-nums">{fmt(tx.amount || 0, tx.currency)}</p>
                    <span className={cn(
                      'inline-flex items-center gap-1 px-1.5 py-0.5 rounded-md text-[10px] font-bold mt-0.5',
                      tx.status === 'completed' ? 'bg-emerald-500/10 text-emerald-600' :
                      tx.status === 'pending' ? 'bg-amber-500/10 text-amber-600' :
                      'bg-red-500/10 text-red-600'
                    )}>
                      <span className={cn(
                        'h-1.5 w-1.5 rounded-full',
                        tx.status === 'completed' ? 'bg-emerald-500' :
                        tx.status === 'pending' ? 'bg-amber-500' : 'bg-red-500'
                      )} />
                      {statusLabel(tx.status)}
                    </span>
                  </div>
                </div>

                {/* Row 2: Details grid */}
                <div className="flex items-center gap-2 sm:gap-3 text-[10px] sm:text-[11px] text-muted-foreground border-t border-border/40 pt-2.5 mt-1 flex-wrap">
                  {/* Received */}
                  <div className="flex items-center gap-1">
                    <ArrowUpRight className="h-3 w-3 text-emerald-500" />
                    <span className="font-semibold text-emerald-600 tabular-nums">{fmt(tx.organization_amount || 0, tx.currency)}</span>
                  </div>

                  <span className="text-border">•</span>

                  {/* Gateway */}
                  <span className={cn(
                    'inline-flex items-center gap-1 px-1.5 py-0.5 rounded font-semibold',
                    tx.gateway === 'stripe' ? 'bg-violet-500/8 text-violet-600' :
                    tx.gateway === 'paystack' ? 'bg-blue-500/8 text-blue-600' :
                    'bg-muted text-muted-foreground'
                  )}>
                    <CreditCard className="h-2.5 w-2.5" />
                    {gatewayLabel(tx.gateway)}
                  </span>

                  <span className="text-border">•</span>

                  {/* Date */}
                  <span className="tabular-nums">
                    {new Date(tx.created_at).toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { day: '2-digit', month: 'short' })}
                  </span>

                  {/* Affiliate if exists */}
                  {tx.affiliate_name && (
                    <>
                      <span className="text-border">•</span>
                      <span className="text-amber-600 font-semibold truncate max-w-[80px]">{tx.affiliate_name}</span>
                    </>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </motion.div>
    </div>
  );
}
