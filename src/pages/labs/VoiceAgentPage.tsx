import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { Mic, MicOff, PhoneOff, Loader2, ShieldAlert, Radio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { canUseVoiceAgent } from '@/lib/access/voiceAgentAccess';
import { ASSISTANT_NAME } from '@/lib/viralStudio/assistant';
import { useVoiceAgent } from '@/hooks/useVoiceAgent';
import { cn } from '@/lib/utils';

/**
 * Internal voice-agent test bench. Rendered only for allowlisted UIDs; any other
 * account gets a 404-equivalent redirect (the backend refuses too).
 */
export default function VoiceAgentPage() {
  const { user, loading } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const allowed = canUseVoiceAgent(user?.id);

  const agent = useVoiceAgent({ language: isFr ? 'fr' : 'en', assistantName: ASSISTANT_NAME });
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    if (agent.status !== 'live') { setElapsed(0); return; }
    const t = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(t);
  }, [agent.status]);

  if (loading) return null;
  if (!allowed) return <Navigate to="/404" replace />;

  const live = agent.status === 'live';

  return (
    <div className="mx-auto w-full max-w-3xl px-4 py-8 space-y-6">
      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-2xl font-semibold tracking-tight">Voice Agent</h1>
          <Badge variant="secondary">Internal test</Badge>
        </div>
        <p className="text-sm text-muted-foreground">
          {isFr
            ? 'Deepgram Voice Agent · Flux Multilingual (FR/EN auto) · raisonnement sur notre clé Gemini · même filtre de sécurité que le chat.'
            : 'Deepgram Voice Agent · Flux Multilingual (auto FR/EN) · reasoning on our own Gemini key · same safety filter as chat.'}
        </p>
      </header>

      <Card className="p-6 space-y-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className={cn(
                'relative flex h-12 w-12 items-center justify-center rounded-full border',
                live ? 'border-primary/50 bg-primary/10' : 'border-border bg-muted',
              )}
            >
              {agent.status === 'connecting' ? (
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
              ) : (
                <Radio className={cn('h-5 w-5', live ? 'text-primary' : 'text-muted-foreground')} />
              )}
              {agent.speaking && <span className="absolute inset-0 rounded-full border-2 border-primary animate-ping" />}
            </span>
            <div className="text-sm">
              <p className="font-medium">
                {agent.status === 'live'
                  ? agent.speaking
                    ? isFr ? 'L’agent parle…' : 'Agent speaking…'
                    : isFr ? 'À l’écoute' : 'Listening'
                  : agent.status === 'connecting'
                    ? isFr ? 'Connexion…' : 'Connecting…'
                    : isFr ? 'Prêt' : 'Ready'}
              </p>
              <p className="text-muted-foreground">
                {live ? `${String(Math.floor(elapsed / 60)).padStart(2, '0')}:${String(elapsed % 60).padStart(2, '0')}` : 'flux-multilingual'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {live && (
              <Button variant="outline" size="sm" onClick={() => agent.setMuted(!agent.muted)}>
                {agent.muted ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
                <span className="ml-2">{agent.muted ? (isFr ? 'Micro coupé' : 'Muted') : (isFr ? 'Micro' : 'Mic')}</span>
              </Button>
            )}
            {live ? (
              <Button variant="destructive" size="sm" onClick={agent.stop}>
                <PhoneOff className="h-4 w-4 mr-2" />
                {isFr ? 'Terminer' : 'End'}
              </Button>
            ) : (
              <Button size="sm" onClick={agent.start} disabled={agent.status === 'connecting'}>
                <Mic className="h-4 w-4 mr-2" />
                {isFr ? 'Démarrer la conversation' : 'Start conversation'}
              </Button>
            )}
          </div>
        </div>

        {agent.error && (
          <p className="text-sm text-destructive">{agent.error}</p>
        )}

        <div className="space-y-3 max-h-[50vh] overflow-y-auto">
          {agent.turns.length === 0 && (
            <p className="text-sm text-muted-foreground">
              {isFr
                ? 'Parle en français ou en anglais — la transcription apparaîtra ici.'
                : 'Speak in English or French — the transcript appears here.'}
            </p>
          )}
          {agent.turns.map((t, i) => (
            <div
              key={i}
              className={cn(
                'rounded-lg border px-3 py-2 text-sm whitespace-pre-wrap',
                t.role === 'user' ? 'bg-muted/50' : 'bg-primary/5 border-primary/20',
                t.blocked && 'bg-destructive/5 border-destructive/30',
              )}
            >
              <span className="mb-1 flex items-center gap-2 text-[11px] font-medium uppercase tracking-wide text-muted-foreground">
                {t.blocked && <ShieldAlert className="h-3 w-3 text-destructive" />}
                {t.role === 'user' ? (isFr ? 'Toi' : 'You') : ASSISTANT_NAME}
              </span>
              {t.content}
            </div>
          ))}
        </div>
      </Card>
    </div>
  );
}
