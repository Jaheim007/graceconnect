import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { useToast } from '@/hooks/use-toast';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid, AreaChart, Area } from 'recharts';
import { TrendingUp, Users, DollarSign, BarChart3, Activity, ShoppingBag, Heart, Filter, Download, Search } from 'lucide-react';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useState, useMemo } from 'react';
import { downloadCSV } from '@/lib/csvExport';
import { Input } from '@/components/ui/input';

export function SuperadminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['sa-stats'],
    queryFn: async () => {
      const [orgs, kyc, donations, purchases, payouts] = await Promise.all([
        db.from('organizations').select('*', { count: 'exact', head: true }),
        db.from('kyc_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        db.from('donations').select('amount').eq('status', 'completed'),
        db.from('product_purchases').select('amount').eq('status', 'completed'),
        db.from('payout_requests').select('*', { count: 'exact', head: true }).eq('status', 'requested'),
      ]);
      const donationGMV = (donations.data || []).reduce((s: number, d: any) => s + (d.amount || 0), 0);
      const productGMV = (purchases.data || []).reduce((s: number, p: any) => s + (p.amount || 0), 0);
      return {
        orgs: orgs.count || 0,
        pendingKyc: kyc.count || 0,
        gmv: donationGMV + productGMV,
        pendingPayouts: payouts.count || 0,
      };
    },
  });

  const { data: metrics = [] } = useQuery({
    queryKey: ['sa-platform-metrics'],
    queryFn: async () => {
      const { data } = await db.from('platform_metrics_daily').select('*')
        .order('metric_date', { ascending: true }).limit(30);
      return data || [];
    },
  });

  const cards = [
    { label: 'Total Organisations', value: stats?.orgs ?? '—', icon: Users, color: 'text-blue-500' },
    { label: 'GMV Total (XOF)', value: stats?.gmv ? stats.gmv.toLocaleString('fr-FR') : '—', icon: DollarSign, color: 'text-primary' },
    { label: 'KYC en attente', value: stats?.pendingKyc ?? '—', icon: Activity, color: 'text-amber-500' },
    { label: 'Payouts en attente', value: stats?.pendingPayouts ?? '—', icon: TrendingUp, color: 'text-emerald-500' },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold flex items-center gap-2">🛡️ Superadmin Dashboard</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {cards.map(c => (
          <div key={c.label} className="bg-card border border-border rounded-2xl p-4 shadow-card">
            <div className="flex items-center gap-2 mb-2">
              <c.icon className={`h-4 w-4 ${c.color}`} />
            </div>
            <p className="text-2xl font-bold">{c.value}</p>
            <p className="text-xs text-muted-foreground">{c.label}</p>
          </div>
        ))}
      </div>

      {metrics.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-sm flex items-center gap-2"><BarChart3 className="h-4 w-4 text-primary" /> GMV quotidien</h2>
          <ResponsiveContainer width="100%" height={250}>
            <AreaChart data={metrics}>
              <defs>
                <linearGradient id="gmvGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="metric_date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Area type="monotone" dataKey="gmv" stroke="hsl(var(--primary))" fill="url(#gmvGrad)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  );
}

export function SuperadminOrgs() {
  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['sa-orgs'],
    queryFn: async () => { const { data } = await db.from('organizations').select('*').order('created_at', { ascending: false }); return data || []; },
  });
  const { toast } = useToast();
  const suspend = async (orgId: string, suspend: boolean) => {
    await db.from('organizations').update({ is_suspended: suspend, suspension_reason: suspend ? 'Admin decision' : null }).eq('id', orgId);
    toast({ title: suspend ? 'Organisation suspendue' : 'Suspension levée' });
  };
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Organizations</h1>
      {isLoading ? <SkeletonRow count={5} /> : (
        <div className="space-y-2">
          {orgs.map((o: any) => (
            <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{o.name}</p>
                <p className="text-xs text-muted-foreground">{o.slug} · {o.country} · {o.category}</p>
              </div>
              <Badge variant="outline" className="text-[10px] capitalize">{o.plan_type}</Badge>
              <Badge className={`text-[10px] border-0 ${o.kyc_status === 'level1' ? 'bg-green-500/15 text-green-600' : o.kyc_status === 'level2' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-yellow-500/15 text-yellow-600'}`}>
                {o.kyc_status === 'none' ? 'Non vérifié' : o.kyc_status === 'level1' ? 'KYC Niveau 1' : o.kyc_status === 'level2' ? 'KYC Niveau 2' : o.kyc_status || 'Non vérifié'}
              </Badge>
              {o.is_suspended ? (
                <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => suspend(o.id, false)}>Unsuspend</Button>
              ) : (
                <Button size="sm" variant="outline" className="h-6 text-[10px] text-destructive border-destructive/30" onClick={() => suspend(o.id, true)}>Suspend</Button>
              )}
              <Badge variant={o.is_active ? 'secondary' : 'destructive'} className="text-[10px]">{o.is_active ? 'Active' : 'Inactive'}</Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SuperadminKYC() {
  const { toast } = useToast();
  const { data: submissions = [], isLoading, refetch } = useQuery({
    queryKey: ['sa-kyc'],
    queryFn: async () => { const { data } = await db.from('kyc_submissions').select('*').eq('status', 'pending').order('submitted_at', { ascending: true }); return data || []; },
  });
  const approve = async (id: string, orgId: string) => {
    await db.from('kyc_submissions').update({ status: 'approved', reviewed_at: new Date().toISOString() }).eq('id', id);
    await db.from('organizations').update({ kyc_status: 'level1', monetization_enabled: true }).eq('id', orgId);
    toast({ title: 'KYC approved ✅' }); refetch();
  };
  const reject = async (id: string) => {
    const reason = prompt('Rejection reason:');
    if (!reason) return;
    await db.from('kyc_submissions').update({ status: 'rejected', rejection_reason: reason, reviewed_at: new Date().toISOString() }).eq('id', id);
    toast({ title: 'KYC rejected' }); refetch();
  };
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">KYC Review ({submissions.length} pending)</h1>
      {isLoading ? <SkeletonRow count={3} /> : submissions.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm">No pending KYC submissions 🎉</div>
      ) : (
        <div className="space-y-3">
          {submissions.map((s: any) => (
            <div key={s.id} className="p-4 rounded-2xl border border-border bg-card space-y-2">
              <div className="flex items-center justify-between">
                <p className="font-medium text-sm">Level {s.kyc_level} submission</p>
                <p className="text-xs text-muted-foreground">{new Date(s.submitted_at).toLocaleDateString('fr-FR')}</p>
              </div>
              {s.bank_name && <p className="text-xs text-muted-foreground">Bank: {s.bank_name} · {s.bank_account_name}</p>}
              <div className="flex gap-2">
                <Button size="sm" className="h-7 text-xs bg-green-500 hover:bg-green-600 text-white border-0" onClick={() => approve(s.id, s.organization_id)}>Approve</Button>
                <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive/30" onClick={() => reject(s.id)}>Reject</Button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SuperadminTransactions() {
  const [filter, setFilter] = useState<'all' | 'purchase' | 'donation'>('all');
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'completed' | 'pending' | 'failed'>('all');

  const { data: purchases = [], isLoading: loadingP } = useQuery({
    queryKey: ['sa-all-purchases'],
    queryFn: async () => {
      const { data } = await db.from('product_purchases')
        .select('id, amount, currency, status, created_at, completed_at, paystack_reference, platform_fee, affiliate_commission, organization_amount, settlement_status, user_id, digital_products(title), organizations(name)')
        .order('created_at', { ascending: false })
        .limit(200);
      return (data || []).map((r: any) => ({
        ...r,
        type: 'purchase' as const,
        label: r.digital_products?.title || 'Produit',
        org_name: r.organizations?.name || '—',
      }));
    },
  });

  const { data: donations = [], isLoading: loadingD } = useQuery({
    queryKey: ['sa-all-donations'],
    queryFn: async () => {
      const { data } = await db.from('donations')
        .select('id, amount, currency, status, created_at, completed_at, paystack_reference, platform_fee, affiliate_commission, organization_amount, settlement_status, donor_name, donor_email, user_id, organizations(name), donation_campaigns(title)')
        .order('created_at', { ascending: false })
        .limit(200);
      return (data || []).map((r: any) => ({
        ...r,
        type: 'donation' as const,
        label: r.donation_campaigns?.title || r.donor_name || 'Don anonyme',
        org_name: r.organizations?.name || '—',
      }));
    },
  });

  const isLoading = loadingP || loadingD;

  const allTx = useMemo(() => {
    let merged = [...purchases, ...donations].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    if (filter !== 'all') merged = merged.filter(t => t.type === filter);
    if (statusFilter !== 'all') merged = merged.filter(t => t.status === statusFilter);
    if (search.trim()) {
      const q = search.toLowerCase();
      merged = merged.filter(t =>
        t.label?.toLowerCase().includes(q) ||
        t.org_name?.toLowerCase().includes(q) ||
        t.paystack_reference?.toLowerCase().includes(q) ||
        t.donor_name?.toLowerCase().includes(q) ||
        t.donor_email?.toLowerCase().includes(q)
      );
    }
    return merged;
  }, [purchases, donations, filter, statusFilter, search]);

  const completedTx = allTx.filter(t => t.status === 'completed');
  const totalGMV = completedTx.reduce((s, t) => s + (t.amount || 0), 0);
  const totalFees = completedTx.reduce((s, t) => s + (t.platform_fee || 0), 0);
  const totalAffComm = completedTx.reduce((s, t) => s + (t.affiliate_commission || 0), 0);

  const fmt = (n: number) => n.toLocaleString('fr-FR') + ' XOF';

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      completed: 'bg-green-500/15 text-green-400',
      pending: 'bg-yellow-500/15 text-yellow-400',
      failed: 'bg-red-500/15 text-red-400',
    };
    return map[status] || 'bg-muted text-muted-foreground';
  };

  const settlementBadge = (s: string | null) => {
    if (!s) return null;
    const map: Record<string, string> = {
      held: 'bg-orange-500/15 text-orange-400',
      released: 'bg-blue-500/15 text-blue-400',
      frozen: 'bg-red-500/15 text-red-400',
    };
    return map[s] || 'bg-muted text-muted-foreground';
  };

  const handleExport = () => {
    downloadCSV(allTx.map(t => ({
      type: t.type,
      label: t.label,
      org: t.org_name,
      amount: t.amount,
      currency: t.currency,
      platform_fee: t.platform_fee,
      affiliate_commission: t.affiliate_commission,
      organization_amount: t.organization_amount,
      status: t.status,
      settlement: t.settlement_status,
      reference: t.paystack_reference,
      date: t.created_at,
    })), 'transactions-superadmin');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <h1 className="text-xl font-bold">Transactions</h1>
        <Button size="sm" variant="outline" onClick={handleExport} className="gap-2">
          <Download className="h-4 w-4" /> Export CSV
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {[
          { label: 'Total GMV', value: fmt(totalGMV), icon: DollarSign },
          { label: 'Frais Plateforme', value: fmt(totalFees), icon: TrendingUp },
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
          <Input placeholder="Rechercher..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
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
              {s === 'all' ? 'Tous' : s === 'completed' ? '✅' : s === 'pending' ? '⏳' : '❌'}
            </Button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? <SkeletonRow count={8} /> : allTx.length === 0 ? (
        <div className="p-12 text-center text-muted-foreground">Aucune transaction trouvée</div>
      ) : (
        <div className="rounded-xl border border-border overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/30">
                <TableHead className="text-xs">Type</TableHead>
                <TableHead className="text-xs">Détail</TableHead>
                <TableHead className="text-xs">Organisation</TableHead>
                <TableHead className="text-xs text-right">Montant</TableHead>
                <TableHead className="text-xs text-right">Frais</TableHead>
                <TableHead className="text-xs text-right">Affilié</TableHead>
                <TableHead className="text-xs">Statut</TableHead>
                <TableHead className="text-xs">Règlement</TableHead>
                <TableHead className="text-xs">Date</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {allTx.map(tx => (
                <TableRow key={tx.id}>
                  <TableCell>
                    <Badge variant="outline" className={`text-[10px] ${tx.type === 'purchase' ? 'border-primary/40 text-primary' : 'border-pink-400/40 text-pink-400'}`}>
                      {tx.type === 'purchase' ? '🛒' : '❤️'} {tx.type === 'purchase' ? 'Achat' : 'Don'}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <p className="text-sm font-medium truncate max-w-[200px]">{tx.label}</p>
                    <p className="text-[10px] text-muted-foreground font-mono">{tx.paystack_reference?.slice(0, 20)}</p>
                  </TableCell>
                  <TableCell className="text-sm">{tx.org_name}</TableCell>
                  <TableCell className="text-right font-semibold text-sm">{(tx.amount || 0).toLocaleString('fr-FR')} {tx.currency}</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">{(tx.platform_fee || 0).toLocaleString('fr-FR')}</TableCell>
                  <TableCell className="text-right text-xs text-muted-foreground">{(tx.affiliate_commission || 0).toLocaleString('fr-FR')}</TableCell>
                  <TableCell><Badge className={`text-[10px] border-0 ${statusBadge(tx.status)}`}>{tx.status}</Badge></TableCell>
                  <TableCell>
                    {tx.settlement_status && (
                      <Badge className={`text-[10px] border-0 ${settlementBadge(tx.settlement_status)}`}>{tx.settlement_status}</Badge>
                    )}
                  </TableCell>
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

export function SuperadminReports() {
  const { data = [], isLoading } = useQuery({
    queryKey: ['sa-reports'],
    queryFn: async () => { const { data } = await db.from('content_reports').select('*').order('created_at', { ascending: false }); return data || []; },
  });
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Content Reports</h1>
      {isLoading ? <SkeletonRow count={3} /> : data.length === 0 ? (
        <div className="p-8 text-center text-muted-foreground text-sm">No reports 🎉</div>
      ) : (
        <div className="space-y-2">
          {data.map((r: any) => (
            <div key={r.id} className="p-3 rounded-xl border border-border bg-card">
              <div className="flex items-center justify-between mb-1">
                <Badge variant="outline" className="text-[10px] capitalize">{r.content_type}</Badge>
                <Badge className={`text-[10px] border-0 ${r.status === 'pending' ? 'bg-yellow-500/15 text-yellow-600' : 'bg-green-500/15 text-green-600'}`}>{r.status}</Badge>
              </div>
              <p className="text-xs">{r.reason}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function SuperadminMetrics() {
  const { data: metrics = [], isLoading } = useQuery({
    queryKey: ['sa-platform-metrics-full'],
    queryFn: async () => {
      const { data } = await db.from('platform_metrics_daily').select('*')
        .order('metric_date', { ascending: false }).limit(60);
      return (data || []).reverse();
    },
  });

  // Compute summaries from last 30 days
  const last30 = metrics.slice(-30);
  const totalGMV = last30.reduce((s: number, m: any) => s + (m.gmv || 0), 0);
  const totalFees = last30.reduce((s: number, m: any) => s + (m.platform_fees || 0), 0);
  const totalTx = last30.reduce((s: number, m: any) => s + (m.total_transactions || 0), 0);
  const activeOrgs = last30.length > 0 ? last30[last30.length - 1]?.active_orgs || 0 : 0;
  const newUsers30d = last30.reduce((s: number, m: any) => s + (m.new_users || 0), 0);
  const takeRate = totalGMV > 0 ? ((totalFees / totalGMV) * 100).toFixed(1) : '0';

  const summaryCards = [
    { label: 'GMV 30j (XOF)', value: totalGMV.toLocaleString('fr-FR') },
    { label: 'Platform Fees 30j', value: totalFees.toLocaleString('fr-FR') },
    { label: 'Take Rate', value: `${takeRate}%` },
    { label: 'Transactions 30j', value: totalTx.toLocaleString() },
    { label: 'Orgs actives', value: activeOrgs },
    { label: 'Nouveaux users 30j', value: newUsers30d },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold">📈 Platform Metrics (VC-Ready)</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {summaryCards.map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4 shadow-card">
            <p className="text-xl font-bold">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>

      {metrics.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-sm">Évolution GMV & Fees</h2>
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={metrics}>
              <defs>
                <linearGradient id="gmvG" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="metric_date" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip />
              <Area type="monotone" dataKey="gmv" stroke="hsl(var(--primary))" fill="url(#gmvG)" strokeWidth={2} name="GMV" />
              <Line type="monotone" dataKey="platform_fees" stroke="hsl(var(--destructive))" strokeWidth={1.5} dot={false} name="Fees" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      )}

      {!isLoading && metrics.length === 0 && (
        <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-2">
          <p className="text-sm text-muted-foreground">Aucune donnée métrique encore.</p>
          <p className="text-xs text-muted-foreground">Configurez le cron job <code>aggregate-metrics</code> pour alimenter cette vue.</p>
        </div>
      )}
    </div>
  );
}
