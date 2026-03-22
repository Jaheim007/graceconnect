import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Copy, CheckCircle, Eye, EyeOff, TestTube, Shield, Loader2 } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { ALL_EVENTS, SAMPLE_PAYLOADS } from './pulse-constants';

interface EndpointDetailProps {
  webhook: any;
  deliveries: any[];
  isFr: boolean;
  open: boolean;
  onClose: () => void;
  onTest: (webhookId: string, eventType: string) => Promise<void>;
}

export function PulseEndpointDetail({ webhook: wh, deliveries, isFr, open, onClose, onTest }: EndpointDetailProps) {
  const [showSecret, setShowSecret] = useState(false);
  const [copied, setCopied] = useState('');
  const [testEvent, setTestEvent] = useState('purchase.completed');
  const [testing, setTesting] = useState(false);
  const [viewPayload, setViewPayload] = useState<any>(null);

  const copy = async (text: string, id: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(id);
    setTimeout(() => setCopied(''), 2000);
  };

  const handleTest = async () => {
    setTesting(true);
    try { await onTest(wh.id, testEvent); } finally { setTesting(false); }
  };

  const whDeliveries = deliveries.filter((d: any) => d.webhook_id === wh.id);

  const statusBadge = (s: string) => {
    if (s === 'delivered') return <Badge className="text-[10px] bg-emerald-500/10 text-emerald-700 border-emerald-200 hover:bg-emerald-500/10">✓ {isFr ? 'Livré' : 'Delivered'}</Badge>;
    if (s === 'failed') return <Badge variant="destructive" className="text-[10px]">✗ {isFr ? 'Échoué' : 'Failed'}</Badge>;
    return <Badge variant="secondary" className="text-[10px]">⟳ {isFr ? 'En cours' : 'Retrying'}</Badge>;
  };

  return (
    <>
      <Dialog open={open} onOpenChange={o => { if (!o) onClose(); }}>
        <DialogContent className="max-w-2xl max-h-[85vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-base flex items-center gap-2">
              <span className={`h-2.5 w-2.5 rounded-full ${wh?.is_active ? 'bg-emerald-500' : 'bg-muted-foreground'}`} />
              {wh?.name}
            </DialogTitle>
            <DialogDescription className="text-[11px] font-mono truncate">{wh?.url}</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="info" className="flex-1 overflow-hidden flex flex-col">
            <TabsList className="w-full grid grid-cols-3 h-9">
              <TabsTrigger value="info" className="text-xs">{isFr ? 'Infos' : 'Info'}</TabsTrigger>
              <TabsTrigger value="history" className="text-xs">{isFr ? 'Historique' : 'History'} ({whDeliveries.length})</TabsTrigger>
              <TabsTrigger value="test" className="text-xs">{isFr ? 'Tester' : 'Test'}</TabsTrigger>
            </TabsList>

            {/* Info tab */}
            <TabsContent value="info" className="overflow-y-auto flex-1 space-y-4 mt-3">
              <div className="space-y-3">
                <div className="rounded-lg border border-border p-3 space-y-2">
                  <p className="text-xs font-semibold flex items-center gap-1.5"><Shield className="h-3.5 w-3.5 text-primary" /> {isFr ? 'Secret de signature' : 'Signing secret'}</p>
                  <div className="flex items-center gap-2">
                    <Input
                      readOnly
                      type={showSecret ? 'text' : 'password'}
                      value={wh?.secret || ''}
                      className="h-8 text-xs font-mono flex-1"
                    />
                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => setShowSecret(!showSecret)}>
                      {showSecret ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                    <Button size="icon" variant="ghost" className="h-8 w-8 shrink-0" onClick={() => copy(wh?.secret || '', 'secret')}>
                      {copied === 'secret' ? <CheckCircle className="h-3.5 w-3.5 text-emerald-500" /> : <Copy className="h-3.5 w-3.5" />}
                    </Button>
                  </div>
                </div>

                <div className="rounded-lg border border-border p-3">
                  <p className="text-xs font-semibold mb-2">{isFr ? 'Événements souscrits' : 'Subscribed events'}</p>
                  {wh?.events?.length > 0 ? (
                    <div className="flex flex-wrap gap-1.5">
                      {wh.events.map((e: string) => (
                        <Badge key={e} variant="outline" className="text-[10px] font-mono">{e}</Badge>
                      ))}
                    </div>
                  ) : (
                    <p className="text-[11px] text-muted-foreground italic">{isFr ? 'Tous les événements' : 'All events'}</p>
                  )}
                </div>
              </div>
            </TabsContent>

            {/* History tab */}
            <TabsContent value="history" className="overflow-y-auto flex-1 mt-3">
              {whDeliveries.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground text-xs">{isFr ? 'Aucune livraison' : 'No deliveries yet'}</div>
              ) : (
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="border-b border-border bg-muted/30">
                        <th className="text-left p-2.5 font-medium text-muted-foreground">{isFr ? 'Événement' : 'Event'}</th>
                        <th className="text-left p-2.5 font-medium text-muted-foreground">{isFr ? 'Statut' : 'Status'}</th>
                        <th className="text-left p-2.5 font-medium text-muted-foreground">HTTP</th>
                        <th className="text-left p-2.5 font-medium text-muted-foreground">{isFr ? 'Tentatives' : 'Attempts'}</th>
                        <th className="text-right p-2.5 font-medium text-muted-foreground">{isFr ? 'Quand' : 'When'}</th>
                        <th className="p-2.5"></th>
                      </tr>
                    </thead>
                    <tbody>
                      {whDeliveries.map((d: any) => (
                        <tr key={d.id} className="border-b border-border last:border-0 hover:bg-muted/20 transition-colors">
                          <td className="p-2.5 font-mono text-muted-foreground">{d.event}</td>
                          <td className="p-2.5">{statusBadge(d.status)}</td>
                          <td className="p-2.5 font-mono text-muted-foreground">{d.response_code || '—'}</td>
                          <td className="p-2.5 text-muted-foreground">{d.attempts || 1}</td>
                          <td className="p-2.5 text-right text-muted-foreground text-[10px]">
                            {formatDistanceToNow(new Date(d.created_at), { addSuffix: true, locale: isFr ? fr : enUS })}
                          </td>
                          <td className="p-2.5">
                            {d.payload && (
                              <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={() => setViewPayload(d)}>
                                {isFr ? 'Payload' : 'Payload'}
                              </Button>
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </TabsContent>

            {/* Test tab */}
            <TabsContent value="test" className="overflow-y-auto flex-1 space-y-4 mt-3">
              <div className="space-y-3">
                <div>
                  <p className="text-xs font-semibold mb-1.5">{isFr ? 'Type d\'événement' : 'Event type'}</p>
                  <Select value={testEvent} onValueChange={setTestEvent}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {ALL_EVENTS.map(e => (
                        <SelectItem key={e.value} value={e.value} className="text-xs">{isFr ? e.labelFr : e.labelEn} ({e.value})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-lg border border-border bg-muted/30 p-3">
                  <p className="text-[10px] font-semibold mb-1.5 text-muted-foreground">{isFr ? 'Payload de test' : 'Test payload'}</p>
                  <pre className="text-[10px] font-mono text-muted-foreground overflow-x-auto max-h-32">
                    {JSON.stringify(SAMPLE_PAYLOADS[testEvent] || {}, null, 2)}
                  </pre>
                </div>

                <Button size="sm" onClick={handleTest} disabled={testing} className="gap-1.5 w-full">
                  {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TestTube className="h-3.5 w-3.5" />}
                  {isFr ? 'Envoyer le test' : 'Send test event'}
                </Button>
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>

      {/* Payload viewer modal */}
      <Dialog open={!!viewPayload} onOpenChange={() => setViewPayload(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">{isFr ? 'Détail de la livraison' : 'Delivery detail'}</DialogTitle>
            <DialogDescription className="text-[11px] font-mono">{viewPayload?.event}</DialogDescription>
          </DialogHeader>
          <Tabs defaultValue="payload">
            <TabsList className="grid grid-cols-2 h-8">
              <TabsTrigger value="payload" className="text-xs">Payload</TabsTrigger>
              <TabsTrigger value="response" className="text-xs">{isFr ? 'Réponse' : 'Response'}</TabsTrigger>
            </TabsList>
            <TabsContent value="payload">
              <div className="relative">
                <pre className="text-[10px] font-mono p-3 bg-muted/30 rounded-lg overflow-x-auto max-h-60">
                  {JSON.stringify(viewPayload?.payload, null, 2)}
                </pre>
                <Button
                  size="icon"
                  variant="ghost"
                  className="absolute top-1 right-1 h-6 w-6"
                  onClick={() => copy(JSON.stringify(viewPayload?.payload, null, 2), 'payload')}
                >
                  {copied === 'payload' ? <CheckCircle className="h-3 w-3 text-emerald-500" /> : <Copy className="h-3 w-3" />}
                </Button>
              </div>
            </TabsContent>
            <TabsContent value="response">
              <div className="text-xs space-y-2 p-3 bg-muted/30 rounded-lg">
                <p><span className="font-medium">HTTP:</span> {viewPayload?.response_code || '—'}</p>
                <p><span className="font-medium">{isFr ? 'Tentatives' : 'Attempts'}:</span> {viewPayload?.attempts || 1}</p>
                {viewPayload?.response_body && (
                  <pre className="text-[10px] font-mono text-muted-foreground overflow-x-auto max-h-40 mt-2">
                    {viewPayload.response_body}
                  </pre>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
