import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { useToast } from '@/hooks/use-toast';

export function SuperadminDashboard() {
  const { data: stats } = useQuery({
    queryKey: ['sa-stats'],
    queryFn: async () => {
      const [orgs, kyc] = await Promise.all([
        db.from('organizations').select('*', { count: 'exact', head: true }),
        db.from('kyc_submissions').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
      ]);
      return { orgs: orgs.count || 0, pendingKyc: kyc.count || 0 };
    },
  });
  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold flex items-center gap-2">🛡️ Superadmin Dashboard</h1>
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Total Orgs', value: stats?.orgs ?? '—' },
          { label: 'Pending KYC', value: stats?.pendingKyc ?? '—' },
          { label: 'Platform GMV', value: '—' },
          { label: 'Active Users', value: '—' },
        ].map(s => (
          <div key={s.label} className="bg-card border border-border rounded-2xl p-4 shadow-card">
            <p className="text-2xl font-bold text-primary">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

export function SuperadminOrgs() {
  const { data: orgs = [], isLoading } = useQuery({
    queryKey: ['sa-orgs'],
    queryFn: async () => { const { data } = await db.from('organizations').select('*').order('created_at', { ascending: false }); return data || []; },
  });
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
              <Badge className={`text-[10px] border-0 ${o.kyc_status === 'level1' ? 'bg-green-500/15 text-green-600' : 'bg-yellow-500/15 text-yellow-600'}`}>{o.kyc_status}</Badge>
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
  const { data = [], isLoading } = useQuery({
    queryKey: ['sa-donations'],
    queryFn: async () => { const { data } = await db.from('donations').select('*').order('created_at', { ascending: false }).limit(50); return data || []; },
  });
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Transactions</h1>
      {isLoading ? <SkeletonRow count={5} /> : (
        <div className="space-y-2">
          {data.map((d: any) => (
            <div key={d.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium">{d.donor_name || 'Anonymous'}</p>
                <p className="text-xs text-muted-foreground">{new Date(d.created_at).toLocaleDateString('fr-FR')} · {d.paystack_reference?.slice(0, 16)}...</p>
              </div>
              <span className="font-semibold text-sm">{d.amount?.toLocaleString()} {d.currency}</span>
              <Badge className={`text-[10px] border-0 ${d.status === 'completed' ? 'bg-green-500/15 text-green-600' : 'bg-yellow-500/15 text-yellow-600'}`}>{d.status}</Badge>
            </div>
          ))}
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
  return (
    <div className="space-y-4">
      <h1 className="text-xl font-bold">Platform Metrics</h1>
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
        {['MRR (XOF)', 'GMV (XOF)', 'Active Orgs', 'New Users (30d)', 'Platform Fees', 'Affiliate Paid'].map(label => (
          <div key={label} className="bg-card border border-border rounded-2xl p-4 shadow-card">
            <p className="text-xl font-bold text-muted-foreground">—</p>
            <p className="text-xs text-muted-foreground">{label}</p>
            <p className="text-[10px] text-muted-foreground mt-1">Analytics coming soon</p>
          </div>
        ))}
      </div>
    </div>
  );
}
