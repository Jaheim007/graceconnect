import { useState, useEffect } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import { Webhook, Save, TestTube, Loader2, Plus, Trash2, Eye, Copy, CheckCircle, RefreshCw } from 'lucide-react';
import { AdminPageShell } from './AdminPageShell';
import { useI18n } from '@/i18n/I18nContext';
import { callFn } from '@/lib/api';
import { EmptyState } from '@/components/ui/EmptyState';

const WEBHOOK_EVENTS = [
  { value: 'purchase.completed', label: 'Achat complété', labelEn: 'Purchase completed' },
  { value: 'purchase.failed', label: 'Achat échoué', labelEn: 'Purchase failed' },
  { value: 'donation.completed', label: 'Don reçu', labelEn: 'Donation received' },
  { value: 'affiliate.sale', label: 'Vente affilié', labelEn: 'Affiliate sale' },
  { value: 'member.joined', label: 'Nouveau membre', labelEn: 'New member' },
  { value: 'payout.requested', label: 'Payout demandé', labelEn: 'Payout requested' },
  { value: 'review.created', label: 'Nouvel avis', labelEn: 'New review' },
  { value: 'subscription.started', label: 'Abonnement créé', labelEn: 'Subscription started' },
];

export default function AdminWebhooks() {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const { toast } = useToast();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const qc = useQueryClient();
  const orgId = currentOrg?.id;

  const [showAdd, setShowAdd] = useState(false);
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [newEvents, setNewEvents] = useState<string[]>([]);

  // Fetch webhooks
  const { data: webhooks = [], isLoading } = useQuery({
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
      const { data } = await db.from('webhook_deliveries').select('*').in('webhook_id', ids).order('created_at', { ascending: false }).limit(50);
      return data || [];
    },
    enabled: !!orgId && webhooks.length > 0,
  });

  const addWebhook = useMutation({
    mutationFn: async () => {
      if (!orgId || !newUrl.trim()) throw new Error('URL required');
      await db.from('org_webhooks').insert({
        org_id: orgId,
        name: newName.trim() || 'Webhook',
        url: newUrl.trim(),
        events: newEvents,
      });
    },
    onSuccess: () => {
      toast({ title: '✅ Webhook créé' });
      setShowAdd(false);
      setNewUrl('');
      setNewName('');
      setNewEvents([]);
      qc.invalidateQueries({ queryKey: ['org-webhooks'] });
    },
    onError: () => toast({ title: 'Erreur', variant: 'destructive' }),
  });

  const deleteWebhook = useMutation({
    mutationFn: async (id: string) => {
      await db.from('org_webhooks').delete().eq('id', id);
    },
    onSuccess: () => {
      toast({ title: '🗑️ Webhook supprimé' });
      qc.invalidateQueries({ queryKey: ['org-webhooks'] });
    },
  });

  const toggleWebhook = useMutation({
    mutationFn: async ({ id, active }: { id: string; active: boolean }) => {
      await db.from('org_webhooks').update({ is_active: active }).eq('id', id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['org-webhooks'] }),
  });

  const testWebhook = async (webhookId: string) => {
    try {
      await callFn('outgoing-webhook', { org_id: orgId, event: 'test.ping', data: { message: 'Test from SiteViral', timestamp: new Date().toISOString() } });
      toast({ title: '📤 Test envoyé !', description: isFr ? 'Vérifiez votre endpoint.' : 'Check your endpoint.' });
      qc.invalidateQueries({ queryKey: ['webhook-deliveries'] });
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' });
    }
  };

  const toggleEvent = (value: string) => {
    setNewEvents(prev => prev.includes(value) ? prev.filter(e => e !== value) : [...prev, value]);
  };

  const [copiedSecret, setCopiedSecret] = useState('');
  const copySecret = async (secret: string, id: string) => {
    await navigator.clipboard.writeText(secret);
    setCopiedSecret(id);
    toast({ title: isFr ? 'Secret copié' : 'Secret copied' });
    setTimeout(() => setCopiedSecret(''), 2000);
  };

  return (
    <AdminPageShell
      title={isFr ? 'Webhooks (Pulse)' : 'Webhooks (Pulse)'}
      subtitle={isFr ? 'Envoyez des événements en temps réel vers Zapier, Make, n8n ou vos propres serveurs.' : 'Send real-time events to Zapier, Make, n8n or your own servers.'}
    >
      <Tabs defaultValue="webhooks" className="space-y-4">
        <TabsList className="grid grid-cols-2 w-full max-w-xs h-9">
          <TabsTrigger value="webhooks" className="text-xs">{isFr ? 'Endpoints' : 'Endpoints'}</TabsTrigger>
          <TabsTrigger value="logs" className="text-xs">{isFr ? 'Historique' : 'Delivery logs'}</TabsTrigger>
        </TabsList>

        <TabsContent value="webhooks" className="space-y-4">
          <div className="flex justify-end">
            <Button size="sm" className="gap-1.5" onClick={() => setShowAdd(true)}>
              <Plus className="h-3.5 w-3.5" /> {isFr ? 'Ajouter un webhook' : 'Add webhook'}
            </Button>
          </div>

          {/* Add form */}
          {showAdd && (
            <Card className="shadow-card border-primary/20">
              <CardContent className="pt-4 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isFr ? 'Nom' : 'Name'}</Label>
                    <Input value={newName} onChange={e => setNewName(e.target.value)} placeholder="Mon webhook Zapier" className="h-8 text-xs" />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs">URL</Label>
                    <Input value={newUrl} onChange={e => setNewUrl(e.target.value)} placeholder="https://hooks.zapier.com/..." className="h-8 text-xs" type="url" />
                  </div>
                </div>

                <div>
                  <Label className="text-xs mb-2 block">{isFr ? 'Événements (vide = tous)' : 'Events (empty = all)'}</Label>
                  <div className="grid grid-cols-2 gap-1.5">
                    {WEBHOOK_EVENTS.map(evt => (
                      <label key={evt.value} className="flex items-center gap-2 p-2 rounded-lg border border-border hover:bg-muted/50 cursor-pointer text-xs">
                        <Checkbox checked={newEvents.includes(evt.value)} onCheckedChange={() => toggleEvent(evt.value)} />
                        {isFr ? evt.label : evt.labelEn}
                      </label>
                    ))}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button size="sm" onClick={() => addWebhook.mutate()} disabled={!newUrl.trim() || addWebhook.isPending} className="gap-1">
                    {addWebhook.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
                    {isFr ? 'Créer' : 'Create'}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => setShowAdd(false)}>{isFr ? 'Annuler' : 'Cancel'}</Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Webhook list */}
          {webhooks.length === 0 && !showAdd ? (
            <EmptyState variant="empty" title={isFr ? 'Aucun webhook configuré' : 'No webhooks configured'} description={isFr ? 'Ajoutez un webhook pour recevoir les événements de votre boutique en temps réel.' : 'Add a webhook to receive your store events in real-time.'} />
          ) : (
            <div className="space-y-3">
              {webhooks.map((wh: any) => (
                <Card key={wh.id} className="shadow-card">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between gap-3">
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <Webhook className="h-4 w-4 text-primary shrink-0" />
                          <p className="text-sm font-semibold truncate">{wh.name}</p>
                          <Badge variant={wh.is_active ? 'default' : 'secondary'} className="text-[10px]">
                            {wh.is_active ? (isFr ? 'Actif' : 'Active') : (isFr ? 'Inactif' : 'Inactive')}
                          </Badge>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate font-mono">{wh.url}</p>
                        {wh.events?.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-1.5">
                            {wh.events.map((e: string) => <Badge key={e} variant="outline" className="text-[9px]">{e}</Badge>)}
                          </div>
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => copySecret(wh.secret, wh.id)} title={isFr ? 'Copier le secret' : 'Copy secret'}>
                          {copiedSecret === wh.id ? <CheckCircle className="h-3.5 w-3.5 text-green-500" /> : <Copy className="h-3.5 w-3.5" />}
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => testWebhook(wh.id)} title="Test">
                          <TestTube className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => toggleWebhook.mutate({ id: wh.id, active: !wh.is_active })}>
                          <RefreshCw className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => deleteWebhook.mutate(wh.id)}>
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}

          {/* Payload format */}
          <Card className="shadow-card bg-muted/30">
            <CardContent className="p-4">
              <p className="text-xs font-semibold mb-2">{isFr ? 'Format du payload' : 'Payload format'}</p>
              <pre className="text-[10px] text-muted-foreground overflow-x-auto font-mono">{`{
  "event": "purchase.completed",
  "timestamp": "2026-03-19T10:00:00Z",
  "organization_id": "uuid",
  "data": { "amount": 5000, "currency": "XOF", ... }
}

Header: X-SiteViral-Signature (HMAC-SHA256)`}</pre>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-3">
          {deliveries.length === 0 ? (
            <EmptyState icon="list" title={isFr ? 'Aucune livraison' : 'No deliveries'} description={isFr ? 'Les livraisons de webhooks apparaîtront ici.' : 'Webhook deliveries will appear here.'} />
          ) : (
            <div className="space-y-2">
              {deliveries.map((d: any) => (
                <div key={d.id} className="flex items-center gap-3 p-3 bg-card border border-border rounded-xl text-xs">
                  <Badge variant={d.status === 'delivered' ? 'default' : d.status === 'failed' ? 'destructive' : 'secondary'} className="text-[10px] shrink-0">
                    {d.status === 'delivered' ? '✅' : d.status === 'failed' ? '❌' : '⏳'} {d.status}
                  </Badge>
                  <span className="font-mono text-muted-foreground">{d.event}</span>
                  {d.response_code && <span className="text-muted-foreground">HTTP {d.response_code}</span>}
                  <span className="ml-auto text-muted-foreground text-[10px]">
                    {new Date(d.created_at).toLocaleString(isFr ? 'fr-FR' : 'en-US', { dateStyle: 'short', timeStyle: 'short' })}
                  </span>
                </div>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </AdminPageShell>
  );
}
