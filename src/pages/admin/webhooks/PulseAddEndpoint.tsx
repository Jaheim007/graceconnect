import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { Save, Loader2, X, Shield, TestTube } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { WEBHOOK_EVENT_GROUPS } from './pulse-constants';

interface AddEndpointProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (name: string, url: string, events: string[]) => void;
  isPending: boolean;
  isFr: boolean;
}

export function PulseAddEndpoint({ open, onClose, onSubmit, isPending, isFr }: AddEndpointProps) {
  const [step, setStep] = useState(0);
  const [name, setName] = useState('');
  const [url, setUrl] = useState('');
  const [events, setEvents] = useState<string[]>([]);
  const [urlError, setUrlError] = useState('');

  const toggle = (v: string) => setEvents(prev => prev.includes(v) ? prev.filter(e => e !== v) : [...prev, v]);

  const validateUrl = (u: string) => {
    try {
      const parsed = new URL(u);
      if (!['http:', 'https:'].includes(parsed.protocol)) return false;
      return true;
    } catch { return false; }
  };

  const handleNext = () => {
    if (step === 0) {
      if (!url.trim()) { setUrlError(isFr ? 'URL requise' : 'URL is required'); return; }
      if (!validateUrl(url.trim())) { setUrlError(isFr ? 'URL invalide' : 'Invalid URL'); return; }
      setUrlError('');
    }
    setStep(s => s + 1);
  };

  const handleSubmit = () => {
    onSubmit(name.trim() || 'Webhook', url.trim(), events);
    setStep(0); setName(''); setUrl(''); setEvents([]);
  };

  const reset = () => { setStep(0); setName(''); setUrl(''); setEvents([]); setUrlError(''); onClose(); };

  const steps = [
    isFr ? 'Endpoint' : 'Endpoint',
    isFr ? 'Événements' : 'Events',
    isFr ? 'Sécurité & Test' : 'Security & Test',
  ];

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) reset(); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="text-base">{isFr ? 'Ajouter un endpoint' : 'Add endpoint'}</DialogTitle>
          <DialogDescription className="text-xs">{isFr ? 'Configurez votre webhook en 3 étapes' : 'Configure your webhook in 3 steps'}</DialogDescription>
        </DialogHeader>

        {/* Step indicators */}
        <div className="flex items-center gap-2 mb-2">
          {steps.map((s, i) => (
            <div key={i} className="flex items-center gap-2">
              <div className={`flex items-center justify-center h-6 w-6 rounded-full text-[10px] font-bold transition-colors ${i <= step ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                {i + 1}
              </div>
              <span className={`text-[11px] font-medium ${i <= step ? 'text-foreground' : 'text-muted-foreground'}`}>{s}</span>
              {i < steps.length - 1 && <div className={`h-px w-6 ${i < step ? 'bg-primary' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        {/* Step 0: Endpoint setup */}
        {step === 0 && (
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{isFr ? 'Nom de l\'endpoint' : 'Endpoint name'}</Label>
              <Input value={name} onChange={e => setName(e.target.value)} placeholder={isFr ? 'Mon webhook Zapier' : 'My Zapier webhook'} className="h-9 text-sm" />
              <p className="text-[10px] text-muted-foreground">{isFr ? 'Optionnel — pour vous aider à l\'identifier' : 'Optional — helps you identify it'}</p>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">URL *</Label>
              <Input
                value={url}
                onChange={e => { setUrl(e.target.value); setUrlError(''); }}
                placeholder="https://hooks.zapier.com/..."
                className={`h-9 text-sm font-mono ${urlError ? 'border-destructive' : ''}`}
                type="url"
              />
              {urlError && <p className="text-[10px] text-destructive">{urlError}</p>}
            </div>
          </div>
        )}

        {/* Step 1: Events selection */}
        {step === 1 && (
          <div className="space-y-3 max-h-[340px] overflow-y-auto pr-1">
            <p className="text-[11px] text-muted-foreground">{isFr ? 'Sélectionnez les événements à écouter (vide = tous)' : 'Select events to listen to (empty = all)'}</p>
            {WEBHOOK_EVENT_GROUPS.map(group => (
              <div key={group.key}>
                <p className="text-xs font-semibold mb-1.5 flex items-center gap-1.5">
                  <span>{group.icon}</span> {isFr ? group.labelFr : group.labelEn}
                </p>
                <div className="space-y-1">
                  {group.events.map(evt => (
                    <label
                      key={evt.value}
                      className={`flex items-start gap-2.5 p-2.5 rounded-lg border cursor-pointer transition-colors ${events.includes(evt.value) ? 'border-primary/40 bg-primary/5' : 'border-border hover:bg-muted/50'}`}
                    >
                      <Checkbox checked={events.includes(evt.value)} onCheckedChange={() => toggle(evt.value)} className="mt-0.5" />
                      <div className="min-w-0">
                        <p className="text-xs font-medium">{isFr ? evt.labelFr : evt.labelEn}</p>
                        <p className="text-[10px] text-muted-foreground font-mono">{evt.value}</p>
                        <p className="text-[10px] text-muted-foreground">{isFr ? evt.descFr : evt.descEn}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Step 2: Security & test */}
        {step === 2 && (
          <div className="space-y-4">
            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-primary" />
                <p className="text-xs font-semibold">{isFr ? 'Signature de sécurité' : 'Security signature'}</p>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {isFr
                  ? 'Chaque requête inclut un header X-SiteViral-Signature (HMAC-SHA256) pour vérifier l\'authenticité. Le secret sera généré automatiquement.'
                  : 'Every request includes an X-SiteViral-Signature header (HMAC-SHA256) to verify authenticity. The secret will be auto-generated.'}
              </p>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
              <div className="flex items-center gap-2">
                <TestTube className="h-4 w-4 text-primary" />
                <p className="text-xs font-semibold">{isFr ? 'Test automatique' : 'Auto test'}</p>
              </div>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                {isFr
                  ? 'Un événement de test sera envoyé à votre endpoint après la création pour vérifier la connectivité.'
                  : 'A test event will be sent to your endpoint after creation to verify connectivity.'}
              </p>
            </div>

            <div className="rounded-xl border border-primary/20 bg-primary/5 p-3">
              <p className="text-xs font-medium">{isFr ? 'Récapitulatif' : 'Summary'}</p>
              <div className="mt-1.5 space-y-1 text-[11px] text-muted-foreground">
                <p><span className="font-medium text-foreground">{isFr ? 'Nom' : 'Name'}:</span> {name || 'Webhook'}</p>
                <p className="font-mono truncate"><span className="font-sans font-medium text-foreground">URL:</span> {url}</p>
                <p><span className="font-medium text-foreground">{isFr ? 'Événements' : 'Events'}:</span> {events.length > 0 ? events.join(', ') : (isFr ? 'Tous' : 'All')}</p>
              </div>
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-2">
          <Button variant="ghost" size="sm" onClick={step === 0 ? reset : () => setStep(s => s - 1)} className="text-xs">
            {step === 0 ? (isFr ? 'Annuler' : 'Cancel') : (isFr ? 'Retour' : 'Back')}
          </Button>
          {step < 2 ? (
            <Button size="sm" onClick={handleNext} className="text-xs gap-1">{isFr ? 'Suivant' : 'Next'} →</Button>
          ) : (
            <Button size="sm" onClick={handleSubmit} disabled={!url.trim() || isPending} className="text-xs gap-1.5">
              {isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Save className="h-3 w-3" />}
              {isFr ? 'Créer l\'endpoint' : 'Create endpoint'}
            </Button>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
