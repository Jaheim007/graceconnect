import { useState, useEffect } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Webhook, Save, TestTube, Loader2 } from 'lucide-react';
import { AdminPageShell } from './AdminPageShell';

const WEBHOOK_EVENTS = [
  { value: 'sale', label: 'Nouvelle vente', desc: 'Déclenché à chaque achat de produit complété' },
  { value: 'donation', label: 'Nouveau don', desc: 'Déclenché à chaque don reçu' },
  { value: 'member_joined', label: 'Nouveau membre', desc: 'Quand un utilisateur rejoint votre organisation' },
  { value: 'payout_requested', label: 'Payout demandé', desc: 'Quand un payout est demandé' },
  { value: 'subscription_started', label: 'Nouvel abonnement', desc: 'Quand un abonnement est créé' },
];

export default function AdminWebhooks() {
  const { currentOrg } = useOrg();
  const { toast } = useToast();
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>([]);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    if (!currentOrg) return;
    db.from('organizations')
      .select('webhook_url, webhook_events')
      .eq('id', currentOrg.id)
      .single()
      .then(({ data }) => {
        if (data) {
          setUrl(data.webhook_url || '');
          setEvents(data.webhook_events || []);
        }
      });
  }, [currentOrg?.id]);

  const handleSave = async () => {
    if (!currentOrg) return;
    setSaving(true);
    try {
      await db.from('organizations').update({
        webhook_url: url || null,
        webhook_events: events,
      }).eq('id', currentOrg.id);
      toast({ title: '✅ Webhook enregistré' });
    } catch {
      toast({ title: 'Erreur', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleTest = async () => {
    if (!url) return;
    setTesting(true);
    try {
      await fetch(url, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'test',
          timestamp: new Date().toISOString(),
          organization_id: currentOrg?.id,
          data: { message: 'Test webhook from SiteViral' },
        }),
      });
      toast({ title: '📤 Test envoyé', description: 'Vérifiez votre endpoint.' });
    } catch {
      toast({ title: 'Erreur d\'envoi', variant: 'destructive' });
    } finally {
      setTesting(false);
    }
  };

  const toggleEvent = (value: string) => {
    setEvents(prev => prev.includes(value) ? prev.filter(e => e !== value) : [...prev, value]);
  };

  return (
    <AdminPageShell title="Webhooks" subtitle="Configurez un webhook pour recevoir des notifications en temps réel (Zapier, Make, custom).">
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-base">
            <Webhook className="h-4 w-4 text-primary" /> Configuration du Webhook
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>URL du webhook</Label>
            <Input
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              placeholder="https://hooks.zapier.com/..."
              type="url"
            />
            <p className="text-xs text-muted-foreground mt-1">L'URL recevra un POST JSON pour chaque événement sélectionné.</p>
          </div>

          <div>
            <Label className="mb-2 block">Événements à envoyer</Label>
            <div className="space-y-2">
              {WEBHOOK_EVENTS.map((evt) => (
                <label key={evt.value} className="flex items-start gap-3 p-2.5 rounded-lg border border-border hover:bg-muted/50 cursor-pointer transition-colors">
                  <Checkbox
                    checked={events.includes(evt.value)}
                    onCheckedChange={() => toggleEvent(evt.value)}
                    className="mt-0.5"
                  />
                  <div>
                    <p className="text-sm font-medium">{evt.label}</p>
                    <p className="text-xs text-muted-foreground">{evt.desc}</p>
                  </div>
                </label>
              ))}
            </div>
            {events.length === 0 && url && (
              <p className="text-xs text-muted-foreground mt-2">⚠️ Aucun événement sélectionné = tous les événements seront envoyés.</p>
            )}
          </div>

          <div className="flex gap-2 pt-2">
            <Button onClick={handleSave} disabled={saving} className="gap-1.5">
              {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
              Enregistrer
            </Button>
            {url && (
              <Button variant="outline" onClick={handleTest} disabled={testing} className="gap-1.5">
                {testing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <TestTube className="h-3.5 w-3.5" />}
                Tester
              </Button>
            )}
          </div>

          {url && (
            <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border">
              <p className="text-xs font-semibold mb-1">Format du payload</p>
              <pre className="text-[11px] text-muted-foreground overflow-x-auto">
{`{
  "event": "sale",
  "timestamp": "2026-02-25T10:00:00Z",
  "organization_id": "${currentOrg?.id || 'uuid'}",
  "data": { ... }
}`}
              </pre>
            </div>
          )}
        </CardContent>
      </Card>
    </AdminPageShell>
  );
}
