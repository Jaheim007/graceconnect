import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Church, ShieldCheck, Ban, CheckCircle2, ExternalLink, Loader2, Flag, Award } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { toast } from 'sonner';

export default function SuperadminChurch() {
  return (
    <div className="mx-auto max-w-7xl space-y-6 p-4 md:p-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-black tracking-tight">
          <Church className="h-6 w-6 text-primary" /> Church console
        </h1>
        <p className="text-sm text-muted-foreground">Verify, moderate, suspend churches and review reports.</p>
      </header>

      <StatsRow />

      <Tabs defaultValue="churches">
        <TabsList>
          <TabsTrigger value="churches"><Church className="mr-1.5 h-3.5 w-3.5" /> Churches</TabsTrigger>
          <TabsTrigger value="reports"><Flag className="mr-1.5 h-3.5 w-3.5" /> Reports</TabsTrigger>
        </TabsList>
        <TabsContent value="churches" className="mt-4"><ChurchesPanel /></TabsContent>
        <TabsContent value="reports" className="mt-4"><ReportsPanel /></TabsContent>
      </Tabs>
    </div>
  );
}

function StatsRow() {
  const { data } = useQuery({
    queryKey: ['superadmin-church-stats'],
    queryFn: async () => {
      const [total, pending, suspended, official, reports, sermons] = await Promise.all([
        supabase.from('church_providers').select('*', { count: 'exact', head: true }),
        supabase.from('church_providers').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
        supabase.from('church_providers').select('*', { count: 'exact', head: true }).eq('status', 'suspended'),
        supabase.from('church_providers').select('*', { count: 'exact', head: true }).eq('is_official', true),
        supabase.from('church_content_reports').select('*', { count: 'exact', head: true }).eq('status', 'new'),
        supabase.from('church_sermons').select('*', { count: 'exact', head: true }),
      ]);
      return {
        total: total.count ?? 0, pending: pending.count ?? 0, suspended: suspended.count ?? 0,
        official: official.count ?? 0, reports: reports.count ?? 0, sermons: sermons.count ?? 0,
      };
    },
  });
  const items = [
    { label: 'Churches', value: data?.total ?? 0 },
    { label: 'Pending', value: data?.pending ?? 0 },
    { label: 'Suspended', value: data?.suspended ?? 0 },
    { label: 'Official', value: data?.official ?? 0 },
    { label: 'Sermons', value: data?.sermons ?? 0 },
    { label: 'Open reports', value: data?.reports ?? 0 },
  ];
  return (
    <div className="grid grid-cols-2 md:grid-cols-6 gap-3">
      {items.map((s) => (
        <div key={s.label} className="rounded-xl border border-border bg-card p-3">
          <p className="text-xl font-bold">{s.value}</p>
          <p className="text-[10px] uppercase text-muted-foreground mt-0.5">{s.label}</p>
        </div>
      ))}
    </div>
  );
}

function ChurchesPanel() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'all' | 'pending' | 'active' | 'suspended'>('all');

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['superadmin-churches', filter],
    queryFn: async () => {
      let q = supabase.from('church_providers').select('*').order('created_at', { ascending: false }).limit(200);
      if (filter !== 'all') q = q.eq('status', filter);
      const { data } = await q;
      return data ?? [];
    },
  });

  const patch = async (id: string, changes: any, msg: string) => {
    const { error } = await supabase.from('church_providers').update(changes).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success(msg);
    qc.invalidateQueries({ queryKey: ['superadmin-churches'] });
    qc.invalidateQueries({ queryKey: ['superadmin-church-stats'] });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2 flex-wrap">
        {(['all', 'pending', 'active', 'suspended'] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}>{f}</Button>
        ))}
      </div>
      {isLoading ? <div className="min-h-[20vh] flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div> :
        rows.length === 0 ? <p className="text-sm text-muted-foreground text-center py-10">No churches.</p> :
        <div className="space-y-2">
          {rows.map((c: any) => (
            <div key={c.id} className="rounded-xl border border-border bg-card p-4 flex items-center gap-4 flex-wrap">
              <div className="h-10 w-10 rounded-lg bg-muted overflow-hidden shrink-0">
                {c.logo_url && <img src={c.logo_url} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <p className="font-semibold text-sm">{c.name}</p>
                  <span className={`text-[10px] uppercase rounded-full px-2 py-0.5 ${
                    c.status === 'active' ? 'bg-emerald-500/15 text-emerald-700' :
                    c.status === 'suspended' ? 'bg-red-500/15 text-red-700' :
                    'bg-amber-500/15 text-amber-700'}`}>{c.status}</span>
                  {c.is_official && <span className="text-[10px] uppercase rounded-full bg-primary/15 text-primary px-2 py-0.5 inline-flex items-center gap-1"><Award className="h-3 w-3" /> Official</span>}
                  {c.payout_verified && <span className="text-[10px] uppercase rounded-full bg-blue-500/15 text-blue-700 px-2 py-0.5 inline-flex items-center gap-1"><ShieldCheck className="h-3 w-3" /> Payout</span>}
                </div>
                <p className="text-xs text-muted-foreground truncate">{[c.city, c.country].filter(Boolean).join(', ')} · /{c.slug}</p>
              </div>
              <div className="flex gap-1.5 flex-wrap">
                <Button size="sm" variant="outline" asChild><Link to={`/church/${c.slug}`} target="_blank"><ExternalLink className="h-3.5 w-3.5" /></Link></Button>
                <Button size="sm" variant="outline" onClick={() => patch(c.id, { is_official: !c.is_official }, c.is_official ? 'Unmarked official' : 'Marked official')}>
                  <Award className="mr-1.5 h-3.5 w-3.5" /> {c.is_official ? 'Unofficial' : 'Official'}
                </Button>
                <Button size="sm" variant="outline" onClick={() => patch(c.id, { payout_verified: !c.payout_verified }, 'Payout toggled')}>
                  <ShieldCheck className="mr-1.5 h-3.5 w-3.5" /> {c.payout_verified ? 'Revoke payout' : 'Verify payout'}
                </Button>
                {c.status !== 'suspended' ? (
                  <Button size="sm" variant="outline" className="text-red-600" onClick={() => { if (confirm('Suspend?')) patch(c.id, { status: 'suspended' }, 'Suspended'); }}>
                    <Ban className="mr-1.5 h-3.5 w-3.5" /> Suspend
                  </Button>
                ) : (
                  <Button size="sm" variant="outline" onClick={() => patch(c.id, { status: 'active' }, 'Reactivated')}>
                    <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> Reactivate
                  </Button>
                )}
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}

function ReportsPanel() {
  const qc = useQueryClient();
  const [filter, setFilter] = useState<'new' | 'all'>('new');

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ['superadmin-church-reports', filter],
    queryFn: async () => {
      let q = supabase.from('church_content_reports').select('*, church:church_providers(name, slug)').order('created_at', { ascending: false }).limit(200);
      if (filter === 'new') q = q.eq('status', 'new');
      const { data } = await q;
      return data ?? [];
    },
  });

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from('church_content_reports').update({ status, reviewed_at: new Date().toISOString() }).eq('id', id);
    if (error) return toast.error(error.message);
    toast.success('Updated');
    qc.invalidateQueries({ queryKey: ['superadmin-church-reports'] });
    qc.invalidateQueries({ queryKey: ['superadmin-church-stats'] });
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        {(['new', 'all'] as const).map((f) => (
          <Button key={f} size="sm" variant={filter === f ? 'default' : 'outline'} onClick={() => setFilter(f)}>{f}</Button>
        ))}
      </div>
      {isLoading ? <div className="min-h-[20vh] flex items-center justify-center"><Loader2 className="h-5 w-5 animate-spin" /></div> :
        rows.length === 0 ? <p className="text-sm text-muted-foreground text-center py-10">No reports.</p> :
        <div className="space-y-2">
          {rows.map((r: any) => (
            <div key={r.id} className="rounded-xl border border-border bg-card p-4 space-y-2">
              <div className="flex items-start justify-between gap-3 flex-wrap">
                <div className="min-w-0">
                  <p className="font-semibold text-sm">{r.church?.name || '—'}</p>
                  <p className="text-xs text-muted-foreground">{new Date(r.created_at).toLocaleString()} · {r.reason}</p>
                </div>
                <span className={`text-[10px] uppercase rounded-full px-2 py-0.5 ${r.status === 'new' ? 'bg-amber-500/15 text-amber-700' : 'bg-muted text-muted-foreground'}`}>{r.status}</span>
              </div>
              {r.message && <p className="text-sm whitespace-pre-wrap">{r.message}</p>}
              <div className="flex gap-2 flex-wrap">
                {r.church?.slug && <Button size="sm" variant="outline" asChild><Link to={`/church/${r.church.slug}`} target="_blank"><ExternalLink className="mr-1.5 h-3.5 w-3.5" /> View</Link></Button>}
                {r.status === 'new' && <>
                  <Button size="sm" variant="outline" onClick={() => setStatus(r.id, 'actioned')}>Mark actioned</Button>
                  <Button size="sm" variant="ghost" onClick={() => setStatus(r.id, 'dismissed')}>Dismiss</Button>
                </>}
              </div>
            </div>
          ))}
        </div>
      }
    </div>
  );
}
