import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { ShieldAlert, Flag, Snowflake, AlertTriangle, CheckCircle, Search, LifeBuoy } from 'lucide-react';
import { onPayoutsFrozen, onTicketResolved } from '@/lib/notifications';

export default function SuperadminRiskAML() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const [search, setSearch] = useState('');

  // Fraud flags
  const { data: flags = [], isLoading: loadingFlags } = useQuery({
    queryKey: ['sa-fraud-flags'],
    queryFn: async () => {
      const { data } = await db.from('fraud_flags').select('*').order('created_at', { ascending: false }).limit(100);
      return data || [];
    },
  });

  // Orgs with frozen payouts
  const { data: frozenOrgs = [], isLoading: loadingFrozen } = useQuery({
    queryKey: ['sa-frozen-orgs'],
    queryFn: async () => {
      const { data } = await db.from('organizations').select('id, name, slug, payouts_frozen, payout_freeze_reason, payouts_frozen_until')
        .eq('payouts_frozen', true).order('updated_at', { ascending: false });
      return data || [];
    },
  });

  // High-volume orgs (top by transaction count)
  const { data: highVolumeOrgs = [] } = useQuery({
    queryKey: ['sa-high-volume-orgs'],
    queryFn: async () => {
      const { data } = await db.from('organizations')
        .select('id, name, slug, currency, kyc_status, payouts_frozen')
        .order('created_at', { ascending: true }).limit(50);
      return data || [];
    },
  });

  // Support tickets
  const { data: tickets = [], isLoading: loadingTickets } = useQuery({
    queryKey: ['sa-support-tickets'],
    queryFn: async () => {
      const { data } = await db.from('support_tickets').select('*').order('created_at', { ascending: false }).limit(100);
      return data || [];
    },
  });

  const resolveFlag = useMutation({
    mutationFn: async (id: string) => {
      await db.from('fraud_flags').update({ resolved: true, resolved_at: new Date().toISOString() }).eq('id', id);
    },
    onSuccess: () => { toast({ title: 'Flag resolved' }); qc.invalidateQueries({ queryKey: ['sa-fraud-flags'] }); },
  });

  const freezeOrg = useMutation({
    mutationFn: async ({ orgId, freeze, reason }: { orgId: string; freeze: boolean; reason?: string }) => {
      await db.from('organizations').update({
        payouts_frozen: freeze,
        payout_freeze_reason: freeze ? (reason || 'Under review') : null,
        payouts_frozen_until: null,
      }).eq('id', orgId);
    },
    onSuccess: (_, vars) => {
      toast({ title: 'Payout status updated' });
      qc.invalidateQueries({ queryKey: ['sa-frozen-orgs'] });
      qc.invalidateQueries({ queryKey: ['sa-high-volume-orgs'] });
      if (vars.freeze) {
        // Find org name
        const org = highVolumeOrgs.find((o: any) => o.id === vars.orgId) || frozenOrgs.find((o: any) => o.id === vars.orgId);
        onPayoutsFrozen(vars.orgId, (org as any)?.name || 'Organization', vars.reason || 'Under review');
      }
    },
  });

  const updateTicketStatus = useMutation({
    mutationFn: async ({ id, status }: { id: string; status: string }) => {
      await db.from('support_tickets').update({ status, resolved_at: status === 'resolved' ? new Date().toISOString() : null }).eq('id', id);
    },
    onSuccess: (_, vars) => {
      toast({ title: 'Ticket updated' });
      qc.invalidateQueries({ queryKey: ['sa-support-tickets'] });
      // Send resolved notification
      if (vars.status === 'resolved') {
        const ticket = tickets.find((t: any) => t.id === vars.id);
        if (ticket && (ticket as any).user_id) {
          onTicketResolved((ticket as any).user_id, (ticket as any).email, vars.id, (ticket as any).subject || '');
        }
      }
    },
  });

  const unresolvedFlags = flags.filter((f: any) => !f.resolved);

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <ShieldAlert className="h-5 w-5 text-destructive" />
        <h1 className="text-xl font-bold">Risk & AML Center</h1>
        <Badge className="text-[10px] bg-destructive/15 text-destructive border-0">{unresolvedFlags.length} open flags</Badge>
      </div>

      <Tabs defaultValue="flags">
        <TabsList>
          <TabsTrigger value="flags" className="gap-1"><Flag className="h-3.5 w-3.5" /> Fraud Flags ({unresolvedFlags.length})</TabsTrigger>
          <TabsTrigger value="frozen" className="gap-1"><Snowflake className="h-3.5 w-3.5" /> Frozen Payouts ({frozenOrgs.length})</TabsTrigger>
          <TabsTrigger value="orgs" className="gap-1"><AlertTriangle className="h-3.5 w-3.5" /> Orgs</TabsTrigger>
          <TabsTrigger value="tickets" className="gap-1"><LifeBuoy className="h-3.5 w-3.5" /> Support ({tickets.filter((t: any) => t.status !== 'resolved' && t.status !== 'closed').length})</TabsTrigger>
        </TabsList>

        {/* Fraud Flags */}
        <TabsContent value="flags" className="space-y-3 mt-4">
          {loadingFlags ? <SkeletonRow count={3} /> : flags.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No fraud flags 🎉</div>
          ) : (
            <div className="space-y-2">
              {flags.map((f: any) => (
                <div key={f.id} className={`p-3 rounded-xl border bg-card ${f.resolved ? 'opacity-50' : 'border-destructive/20'}`}>
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium">{f.reason}</p>
                    <Badge className={`text-[10px] border-0 ${f.resolved ? 'bg-emerald-500/15 text-emerald-600' : 'bg-destructive/15 text-destructive'}`}>
                      {f.resolved ? 'Resolved' : 'Open'}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(f.created_at).toLocaleString()}</p>
                  {!f.resolved && (
                    <div className="flex gap-2 mt-2">
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => resolveFlag.mutate(f.id)}>
                        <CheckCircle className="h-3 w-3 mr-1" /> Resolve
                      </Button>
                      <Button size="sm" variant="outline" className="h-7 text-xs text-destructive border-destructive/30"
                        onClick={() => {
                          if (f.organization_id) freezeOrg.mutate({ orgId: f.organization_id, freeze: true, reason: f.reason });
                        }}>
                        <Snowflake className="h-3 w-3 mr-1" /> Freeze Payouts
                      </Button>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Frozen Payouts */}
        <TabsContent value="frozen" className="space-y-3 mt-4">
          {loadingFrozen ? <SkeletonRow count={3} /> : frozenOrgs.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No frozen organizations</div>
          ) : (
            <div className="space-y-2">
              {frozenOrgs.map((o: any) => (
                <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl border border-blue-500/20 bg-card">
                  <Snowflake className="h-4 w-4 text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{o.name}</p>
                    <p className="text-xs text-muted-foreground">{o.payout_freeze_reason || 'No reason'}</p>
                  </div>
                  <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => freezeOrg.mutate({ orgId: o.id, freeze: false })}>
                    Unfreeze
                  </Button>
                </div>
              ))}
            </div>
          )}
        </TabsContent>

        {/* Orgs overview */}
        <TabsContent value="orgs" className="space-y-3 mt-4">
          <div className="relative max-w-sm mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input placeholder="Search org..." value={search} onChange={e => setSearch(e.target.value)} className="pl-9 h-9" />
          </div>
          <div className="space-y-2">
            {highVolumeOrgs
              .filter((o: any) => !search || o.name.toLowerCase().includes(search.toLowerCase()))
              .map((o: any) => (
                <div key={o.id} className="flex items-center gap-3 p-3 rounded-xl border border-border bg-card">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{o.name}</p>
                    <p className="text-xs text-muted-foreground">{o.slug} · Vérification: {o.kyc_status || 'none'}</p>
                  </div>
                  {o.payouts_frozen ? (
                    <Badge className="text-[10px] bg-blue-500/15 text-blue-600 border-0">Frozen</Badge>
                  ) : (
                    <Button size="sm" variant="outline" className="h-6 text-[10px] text-destructive border-destructive/30"
                      onClick={() => {
                        const reason = prompt('Freeze reason:');
                        if (reason) freezeOrg.mutate({ orgId: o.id, freeze: true, reason });
                      }}>
                      Freeze
                    </Button>
                  )}
                </div>
              ))}
          </div>
        </TabsContent>

        {/* Support Tickets */}
        <TabsContent value="tickets" className="space-y-3 mt-4">
          {loadingTickets ? <SkeletonRow count={3} /> : tickets.length === 0 ? (
            <div className="p-8 text-center text-muted-foreground text-sm">No support tickets</div>
          ) : (
            <div className="space-y-2">
              {tickets.map((t: any) => (
                <div key={t.id} className="p-3 rounded-xl border border-border bg-card">
                  <div className="flex items-center justify-between mb-1">
                    <p className="text-sm font-medium truncate flex-1">{t.subject}</p>
                    <Badge className={`text-[10px] border-0 ml-2 capitalize ${
                      t.status === 'open' ? 'bg-amber-500/15 text-amber-600' :
                      t.status === 'in_progress' ? 'bg-blue-500/15 text-blue-600' :
                      t.status === 'resolved' ? 'bg-emerald-500/15 text-emerald-600' : 'bg-muted text-muted-foreground'
                    }`}>{t.status?.replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-xs text-muted-foreground line-clamp-2 mb-2">{t.message}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{t.category}</span>
                    <span>·</span>
                    <span>{new Date(t.created_at).toLocaleDateString()}</span>
                    <div className="ml-auto flex gap-1">
                      {t.status === 'open' && (
                        <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => updateTicketStatus.mutate({ id: t.id, status: 'in_progress' })}>
                          In Progress
                        </Button>
                      )}
                      {t.status !== 'resolved' && t.status !== 'closed' && (
                        <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => updateTicketStatus.mutate({ id: t.id, status: 'resolved' })}>
                          Resolve
                        </Button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
