import { useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Plus, Radio, Code } from 'lucide-react';
import { AdminPageShell } from './AdminPageShell';
import { useI18n } from '@/i18n/I18nContext';
import { callFn } from '@/lib/api';
import { EmptyState } from '@/components/ui/EmptyState';
import { PulseHealthCards } from './webhooks/PulseHealthCards';
import { PulseEndpointCard } from './webhooks/PulseEndpointCard';
import { PulseAddEndpoint } from './webhooks/PulseAddEndpoint';
import { PulseEndpointDetail } from './webhooks/PulseEndpointDetail';
import { PulseDevTab } from './webhooks/PulseDevTab';
import { SAMPLE_PAYLOADS } from './webhooks/pulse-constants';

export default function AdminWebhooks() {
  const { currentOrg } = useOrg();
  const { toast } = useToast();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const qc = useQueryClient();
  const orgId = currentOrg?.id;

  const [showAdd, setShowAdd] = useState(false);
  const [detailWh, setDetailWh] = useState<any>(null);
  const [copiedId, setCopiedId] = useState('');

  // Fetch webhooks
  const { data: webhooks = [] } = useQuery({
    queryKey: ['org-webhooks', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db.from('org_webhooks').select('*').eq('org_id', orgId).order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!orgId,
  });

  // Fetch recent deliveries
  const { data: deliveries = [] } = useQuery({
    queryKey: ['webhook-deliveries', orgId],
    queryFn: async () => {
      if (!orgId || !webhooks.length) return [];
      const ids = webhooks.map((w: any) => w.id);
      const { data } = await db.from('webhook_deliveries').select('*').in('webhook_id', ids).order('created_at', { ascending: false }).limit(100);
      return data || [];
    },
    enabled: !!orgId && webhooks.length > 0,
  });

  // Health metrics
  const totalSent = deliveries.length;
  const successCount = deliveries.filter((d: any) => d.status === 'delivered').length;
  const failedCount = deliveries.filter((d: any) => d.status === 'failed').length;
  const successRate = totalSent > 0 ? (successCount / totalSent) * 100 : 0;
  const activeEndpoints = webhooks.filter((w: any) => w.is_active).length;

  const addWebhook = useMutation({
    mutationFn: async ({ name, url, events }: { name: string; url: string; events: string[] }) => {
      if (!orgId || !url) throw new Error('URL required');
      await db.from('org_webhooks').insert({ org_id: orgId, name, url, events });
    },
    onSuccess: () => {
      toast({ title: isFr ? '✅ Endpoint créé' : '✅ Endpoint created' });
      setShowAdd(false);
      qc.invalidateQueries({ queryKey: ['org-webhooks'] });
    },
    onError: () => toast({ title: isFr ? 'Erreur' : 'Error', variant: 'destructive' }),
  });

  const deleteWebhook = useMutation({
    mutationFn: async (id: string) => { await db.from('org_webhooks').delete().eq('id', id); },
    onSuccess: () => {
      toast({ title: isFr ? '🗑️ Endpoint supprimé' : '🗑️ Endpoint deleted' });
      qc.invalidateQueries({ queryKey: ['org-webhooks'] });
    },
  });

  const toggleWebhook = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await db.from('org_webhooks').update({ is_active: active }).eq('id', id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['org-webhooks'] }),
  });

  const testWebhook = async (webhookId: string, eventType: string) => {
    try {
      await callFn('outgoing-webhook', {
        org_id: orgId,
        event: eventType,
        data: SAMPLE_PAYLOADS[eventType] || SAMPLE_PAYLOADS['purchase.completed'],
      });
      toast({ title: '📤 Test sent!', description: `${eventType} — ${isFr ? 'Vérifiez votre endpoint.' : 'Check your endpoint.'}` });
      qc.invalidateQueries({ queryKey: ['webhook-deliveries'] });
    } catch {
      toast({ title: isFr ? 'Erreur' : 'Error', variant: 'destructive' });
    }
  };

  const copyText = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedId(id);
    toast({ title: isFr ? 'Copié !' : 'Copied!' });
    setTimeout(() => setCopiedId(''), 2000);
  };

  const getLastDelivery = (whId: string) => deliveries.find((d: any) => d.webhook_id === whId);

  return (
    <AdminPageShell
      title="Pulse"
      subtitle={isFr ? 'Événements en temps réel vers Zapier, Make, n8n ou vos serveurs' : 'Real-time events to Zapier, Make, n8n or your servers'}
      actions={
        <div className="flex items-center gap-2">
          {webhooks.length > 0 && (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-200 text-[10px] font-medium text-emerald-700">
              <Radio className="h-3 w-3" />
              {activeEndpoints} {isFr ? 'actif(s)' : 'active'}
            </div>
          )}
          <Button size="sm" className="gap-1.5 text-xs" onClick={() => setShowAdd(true)}>
            <Plus className="h-3.5 w-3.5" /> {isFr ? 'Ajouter un endpoint' : 'Add endpoint'}
          </Button>
        </div>
      }
    >
      {/* Health overview */}
      {webhooks.length > 0 && (
        <PulseHealthCards
          totalSent={totalSent}
          successRate={successRate}
          failedCount={failedCount}
          activeEndpoints={activeEndpoints}
          isFr={isFr}
        />
      )}

      <Tabs defaultValue="endpoints" className="space-y-4">
        <TabsList className="grid grid-cols-3 w-full max-w-sm h-9">
          <TabsTrigger value="endpoints" className="text-xs">{isFr ? 'Endpoints' : 'Endpoints'}</TabsTrigger>
          <TabsTrigger value="logs" className="text-xs">{isFr ? 'Historique' : 'Delivery logs'}</TabsTrigger>
          <TabsTrigger value="developer" className="text-xs gap-1"><Code className="h-3 w-3" /> {isFr ? 'Développeur' : 'Developer'}</TabsTrigger>
        </TabsList>

        {/* Endpoints tab */}
        <TabsContent value="endpoints" className="space-y-3">
          {webhooks.length === 0 ? (
            <EmptyState
              variant="generic"
              title={isFr ? 'Aucun endpoint configuré' : 'No endpoints configured'}
              description={isFr ? 'Ajoutez votre premier endpoint pour recevoir les événements de votre plateforme en temps réel.' : 'Add your first endpoint to receive your platform events in real-time.'}
              action={
                <Button size="sm" className="gap-1.5 mt-3" onClick={() => setShowAdd(true)}>
                  <Plus className="h-3.5 w-3.5" /> {isFr ? 'Ajouter un endpoint' : 'Add endpoint'}
                </Button>
              }
            />
          ) : (
            <div className="space-y-3">
              {webhooks.map((wh: any) => (
                <PulseEndpointCard
                  key={wh.id}
                  webhook={wh}
                  lastDelivery={getLastDelivery(wh.id)}
                  isFr={isFr}
                  onToggle={() => toggleWebhook.mutate({ id: wh.id, active: !wh.is_active })}
                  onDelete={() => deleteWebhook.mutate(wh.id)}
                  onCopyUrl={() => copyText(wh.url, `url-${wh.id}`)}
                  onCopySecret={() => copyText(wh.secret, `secret-${wh.id}`)}
                  onViewDetails={() => setDetailWh(wh)}
                  copiedId={copiedId}
                />
              ))}
            </div>
          )}
        </TabsContent>

        {/* Delivery logs tab */}
        <TabsContent value="logs" className="space-y-3">
          {deliveries.length === 0 ? (
            <EmptyState
              variant="generic"
              title={isFr ? 'Aucune livraison' : 'No deliveries'}
              description={isFr ? 'Les livraisons de webhooks apparaîtront ici après le premier envoi.' : 'Webhook deliveries will appear here after the first send.'}
            />
          ) : (
            <div className="border border-border rounded-xl overflow-hidden">
              <table className="w-full text-xs">
                <thead>
                  <tr className="bg-muted/30 border-b border-border">
                    <th className="text-left p-3 font-medium text-muted-foreground">{isFr ? 'Événement' : 'Event'}</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">{isFr ? 'Statut' : 'Status'}</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">HTTP</th>
                    <th className="text-left p-3 font-medium text-muted-foreground">{isFr ? 'Endpoint' : 'Endpoint'}</th>
                    <th className="text-right p-3 font-medium text-muted-foreground">{isFr ? 'Quand' : 'When'}</th>
                  </tr>
                </thead>
                <tbody>
                  {deliveries.map((d: any) => {
                    const wh = webhooks.find((w: any) => w.id === d.webhook_id);
                    return (
                      <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                        <td className="p-3 font-mono text-muted-foreground">{d.event}</td>
                        <td className="p-3">
                          <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${d.status === 'delivered' ? 'text-emerald-600' : d.status === 'failed' ? 'text-destructive' : 'text-amber-500'}`}>
                            <span className={`h-1.5 w-1.5 rounded-full ${d.status === 'delivered' ? 'bg-emerald-500' : d.status === 'failed' ? 'bg-destructive' : 'bg-amber-500'}`} />
                            {d.status}
                          </span>
                        </td>
                        <td className="p-3 font-mono text-muted-foreground">{d.response_code || '—'}</td>
                        <td className="p-3 text-muted-foreground truncate max-w-[160px]">{wh?.name || '—'}</td>
                        <td className="p-3 text-right text-muted-foreground text-[10px]">
                          {new Date(d.created_at).toLocaleString(isFr ? 'fr-FR' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Developer tab */}
        <TabsContent value="developer">
          <PulseDevTab isFr={isFr} />
        </TabsContent>
      </Tabs>

      {/* Modals */}
      <PulseAddEndpoint
        open={showAdd}
        onClose={() => setShowAdd(false)}
        onSubmit={(name, url, events) => addWebhook.mutate({ name, url, events })}
        isPending={addWebhook.isPending}
        isFr={isFr}
      />

      {detailWh && (
        <PulseEndpointDetail
          webhook={detailWh}
          deliveries={deliveries}
          isFr={isFr}
          open={!!detailWh}
          onClose={() => setDetailWh(null)}
          onTest={testWebhook}
        />
      )}
    </AdminPageShell>
  );
}
