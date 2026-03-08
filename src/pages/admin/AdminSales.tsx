import { useState, useMemo } from 'react';
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
import { Download, Search, CalendarIcon, DollarSign, TrendingUp, Users, BarChart3 } from 'lucide-react';
import { format, startOfDay, startOfWeek, startOfMonth, subDays, subMonths } from 'date-fns';
import { fr } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { downloadCSV } from '@/lib/csvExport';
import { formatCurrency } from '@/lib/currency';

type PeriodKey = 'all' | 'today' | '7d' | '30d' | '90d' | 'this_month' | 'this_week' | 'custom';

export default function AdminSales() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const orgCurrency = currentOrg?.currency || 'XOF';

  const [filter, setFilter] = useState<'all' | 'purchase' | 'donation'>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');
  const [periodFilter, setPeriodFilter] = useState<PeriodKey>('all');
  const [customDateFrom, setCustomDateFrom] = useState<Date | undefined>();
  const [customDateTo, setCustomDateTo] = useState<Date | undefined>();

  const fmt = (n: number) => formatCurrency(n, orgCurrency);

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

  // Fetch purchases for this org
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
        label: r.digital_products?.title || 'Produit',
        gateway: detectGateway(r.paystack_reference),
        buyer_display: r.buyer_name || profileMap[r.user_id]?.display_name || '—',
        buyer_email: r.buyer_email || null,
        buyer_phone: profileMap[r.user_id]?.phone || null,
        affiliate_name: r.affiliate_link_id ? (affLinkMap[r.affiliate_link_id]?.name || '—') : null,
      }));
    },
    enabled: !!orgId,
  });

  // Fetch donations for this org
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
        const { data: profiles } = await db.from('profiles').select('id, display_name, phone, email').in('id', userIds);
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
        label: r.donation_campaigns?.title || r.donor_name || 'Don',
        gateway: detectGateway(r.paystack_reference),
        buyer_display: r.donor_name || profileMap[r.user_id]?.display_name || r.donor_email || 'Anonyme',
        buyer_email: r.donor_email || profileMap[r.user_id]?.email || null,
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

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      completed: 'bg-green-500/15 text-green-400',
      pending: 'bg-yellow-500/15 text-yellow-400',
      failed: 'bg-red-500/15 text-red-400',
    };
    return map[status] || 'bg-muted text-muted-foreground';
  };

  const handleExport = () => {
    downloadCSV(allTx.map(t => ({
      type: t.type === 'purchase' ? 'Achat' : 'Don',
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
    })), `ventes-${currentOrg?.slug || 'org'}`);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold">Mes Ventes</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Historique complet des transactions de votre boutique</p>
        </div>
        <Button size="sm" variant="outline" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Chiffre d\'affaires', value: fmt(totalGMV), icon: DollarSign },
          { label: 'Reçu (net)', value: fmt(totalOrgReceived), icon: TrendingUp },
          { label: 'Comm. Affiliés', value: fmt(totalAffComm), icon: Users },
          { label: 'Transactions', value: allTx.length.toString(), icon: BarChart3 },
        ].map(c => (
          <div key={c.label} className="p-4 rounded-xl border border-border bg-card">
            <div className="flex items-center gap-2 mb-1">
              <c.icon className="h-4 w-4 text-primary" />
              <span className="text-xs text-muted-foreground">{c.label}</span>
            </div>
            <p className="text-lg font-bold">{c.value}</p>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative flex-1 min-w-[200px] max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Rechercher acheteur, produit, référence..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
        </div>
        <div className="flex gap-1">
          {(['all', 'purchase', 'donation'] as const).map(f => (
            <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)} className="text-xs h-8">
              {f === 'all' ? 'Tout' : f === 'purchase' ? '🛒 Achats' : '❤️ Dons'}
            </Button>
          ))}
        </div>
        <div className="flex gap-1">
          {(['all', 'completed', 'pending', 'failed'] as const).map(s => (
            <Button key={s} size="sm" variant={statusFilter === s ? 'default' : 'outline'} onClick={() => setStatusFilter(s)} className="text-xs h-8">
              {s === 'all' ? 'Tous' : s === 'completed' ? '✅ Succès' : s === 'pending' ? '⏳ En attente' : '❌ Échec'}
            </Button>
          ))}
        </div>
      </div>

      {/* Period Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <CalendarIcon className="h-4 w-4 text-muted-foreground" />
        <span className="text-xs text-muted-foreground font-medium">Période :</span>
        {([
          { key: 'all', label: 'Tout' },
          { key: 'today', label: "Aujourd'hui" },
          { key: 'this_week', label: 'Cette semaine' },
          { key: 'this_month', label: 'Ce mois' },
          { key: '7d', label: '7 jours' },
          { key: '30d', label: '30 jours' },
          { key: '90d', label: '90 jours' },
          { key: 'custom', label: '📅 Personnalisé' },
        ] as { key: PeriodKey; label: string }[]).map(p => (
          <Button key={p.key} size="sm" variant={periodFilter === p.key ? 'default' : 'outline'} onClick={() => setPeriodFilter(p.key)} className="text-xs h-7">
            {p.label}
          </Button>
        ))}
      </div>

      {periodFilter === 'custom' && (
        <div className="flex flex-wrap items-center gap-3 p-3 rounded-xl border border-border bg-muted/30">
          <span className="text-xs text-muted-foreground">Du :</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-2 min-w-[140px] justify-start", !customDateFrom && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5" />
                {customDateFrom ? format(customDateFrom, 'dd MMM yyyy', { locale: fr }) : 'Date début'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customDateFrom} onSelect={setCustomDateFrom} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          <span className="text-xs text-muted-foreground">Au :</span>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-2 min-w-[140px] justify-start", !customDateTo && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5" />
                {customDateTo ? format(customDateTo, 'dd MMM yyyy', { locale: fr }) : 'Date fin'}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={customDateTo} onSelect={setCustomDateTo} initialFocus className="p-3 pointer-events-auto" />
            </PopoverContent>
          </Popover>
          {(customDateFrom || customDateTo) && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => { setCustomDateFrom(undefined); setCustomDateTo(undefined); }}>
              Réinitialiser
            </Button>
          )}
        </div>
      )}

      {/* Table */}
      {isLoading ? <SkeletonRow count={8} /> : allTx.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">Aucune transaction trouvée</div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Produit / Campagne</TableHead>
                <TableHead className="text-xs">Acheteur / Donateur</TableHead>
                <TableHead className="text-xs">Passerelle</TableHead>
                <TableHead className="text-xs text-right">Montant</TableHead>
                <TableHead className="text-xs text-right">Reçu (net)</TableHead>
                <TableHead className="text-xs text-right">Frais</TableHead>
                <TableHead className="text-xs">Affilié</TableHead>
                <TableHead className="text-xs">Statut</TableHead>
                <TableHead className="text-xs">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allTx.map(tx => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${tx.type === 'purchase' ? 'border-primary/40 text-primary' : 'border-pink-400/40 text-pink-400'}`}>
                      {tx.type === 'purchase' ? '🛒 Achat' : '❤️ Don'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium truncate max-w-[180px]">{tx.label}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{tx.paystack_reference?.slice(0, 20)}</p>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium truncate max-w-[140px]">{tx.buyer_display}</p>
                    {tx.buyer_email && <p className="text-[10px] text-muted-foreground truncate max-w-[140px]">✉️ {tx.buyer_email}</p>}
                    {tx.buyer_phone && <p className="text-[10px] text-muted-foreground">📞 {tx.buyer_phone}</p>}
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${tx.gateway === 'stripe' ? 'border-violet-400/40 text-violet-400' : tx.gateway === 'paystack' ? 'border-cyan-400/40 text-cyan-400' : 'border-muted-foreground/40 text-muted-foreground'}`}>
                      {tx.gateway === 'stripe' ? '💳 Stripe' : tx.gateway === 'paystack' ? '📱 Paystack' : '🆓 Gratuit'}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-sm">{(tx.amount || 0).toLocaleString('fr-FR')} {tx.currency}</TableCell>
                  <TableCell className="text-right text-sm text-emerald-500 font-medium">{(tx.organization_amount || 0).toLocaleString('fr-FR')}</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">{(tx.platform_fee || 0).toLocaleString('fr-FR')}</TableCell>
                  <TableCell>
                    {tx.affiliate_name ? (
                      <div>
                        <p className="text-xs font-medium">{tx.affiliate_name}</p>
                        <p className="text-[10px] text-muted-foreground">{(tx.affiliate_commission || 0).toLocaleString('fr-FR')} {tx.currency}</p>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground">—</span>
                    )}
                  </TableCell>
                  <TableCell><Badge className={`text-[10px] border-0 ${statusBadge(tx.status)}`}>{tx.status}</Badge></TableCell>
                  <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                    {new Date(tx.created_at).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: '2-digit' })}
                    <br />
                    <span className="text-[10px]">{new Date(tx.created_at).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
