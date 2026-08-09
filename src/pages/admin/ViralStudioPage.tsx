import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mic, MicOff, Send, Loader2, Volume2, VolumeX, RotateCcw, Coins, BookOpen, ShieldCheck } from 'lucide-react';
import { AdminPageShell } from '@/pages/admin/AdminPageShell';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { useI18n } from '@/i18n/I18nContext';
import { useOrg } from '@/contexts/OrgContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { supabase } from '@/integrations/supabase/client';
import { assistantCopy, ASSISTANT_NAME } from '@/lib/viralStudio/assistant';
import { useStudioConversation, type GenerationProposal } from '@/hooks/useStudioConversation';
import { useVoiceDictation } from '@/hooks/useVoiceDictation';
import { useCreditsBalance } from '@/hooks/useCredits';

/** Conversational creation surface. Chat is free; generation reuses the existing pipeline. */
export default function ViralStudioPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const copy = assistantCopy(isFr);
  const { currentOrg } = useOrg();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: creditSummary } = useCreditsBalance();

  const [input, setInput] = useState('');
  const [readAloud, setReadAloud] = useState(false);
  const baseTextRef = useRef('');
  const composerRef = useRef<HTMLTextAreaElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const { messages, thinking, error, send, reset } = useStudioConversation({
    language: isFr ? 'fr' : 'en',
    greeting: copy.greeting,
  });

  const dictation = useVoiceDictation({
    language: isFr ? 'fr' : 'en',
    onTranscript: (text) => {
      const base = baseTextRef.current;
      setInput(base ? `${base} ${text}` : text);
      composerRef.current?.focus();
    },
    onError: (message) => toast({ title: message, variant: 'destructive' }),
  });

  useEffect(() => { composerRef.current?.focus(); }, []);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length, thinking]);
  useEffect(() => { if (error) toast({ title: error, variant: 'destructive' }); }, [error, toast]);

  const speak = async (text: string) => {
    if (!text) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const { data, error: fnErr } = await supabase.functions.invoke('viral-studio-speak', {
        headers: session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : undefined,
        body: { text, language: isFr ? 'fr' : 'en' },
      });
      const b64 = !fnErr ? (data as any)?.audio_base64 : null;
      if (b64) {
        const audio = new Audio(`data:${(data as any).mime || 'audio/mpeg'};base64,${b64}`);
        await audio.play();
        return;
      }
      throw new Error('tts_unavailable');
    } catch {
      // Graceful fallback: browser speech synthesis
      if ('speechSynthesis' in window) {
        const utter = new SpeechSynthesisUtterance(text);
        utter.lang = isFr ? 'fr-FR' : 'en-US';
        window.speechSynthesis.speak(utter);
      }
    }
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || thinking) return;
    if (dictation.recording) await dictation.stop();
    setInput('');
    baseTextRef.current = '';
    const reply = await send(text);
    composerRef.current?.focus();
    if (readAloud && reply) speak(reply);
  };

  const startGeneration = (proposal: GenerationProposal) => {
    if (!currentOrg) {
      toast({ title: isFr ? 'Choisis une plateforme d’abord.' : 'Pick a platform first.', variant: 'destructive' });
      return;
    }
    const balance = creditSummary?.balance;
    if (typeof balance === 'number' && typeof proposal.cost === 'number' && balance < proposal.cost) {
      toast({
        title: isFr ? 'Crédits insuffisants' : 'Not enough credits',
        description: isFr
          ? `${proposal.cost} crédits requis, ${balance.toFixed(1)} disponibles.`
          : `${proposal.cost} credits required, ${balance.toFixed(1)} available.`,
        variant: 'destructive',
      });
      return;
    }
    // Reuses the EXISTING pipeline + draft review flow (no parallel engine).
    navigate('/admin/programs/generating', {
      state: {
        mode: proposal.input.source === 'document' ? 'convert' : 'ai',
        input: { org_id: currentOrg.id, ...proposal.input },
      },
    });
  };

  const micLabel = dictation.recording
    ? (isFr ? 'Arrêter la dictée' : 'Stop dictation')
    : (isFr ? 'Dicter' : 'Dictate');

  return (
    <AdminPageShell
      title={ASSISTANT_NAME}
      subtitle={copy.tagline}
      backRoute="/admin/programs"
    >
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        {/* Reassurance */}
        <div className="flex items-center justify-between gap-3 rounded-xl border border-border/60 bg-muted/30 px-4 py-2.5">
          <p className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" />
            {isFr ? 'Tu confirmes toujours avant la génération' : 'You always confirm before generating'}
          </p>
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              {readAloud ? <Volume2 className="h-3.5 w-3.5" /> : <VolumeX className="h-3.5 w-3.5" />}
              <span className="hidden sm:inline">{isFr ? 'Lire les réponses' : 'Read replies'}</span>
              <Switch checked={readAloud} onCheckedChange={setReadAloud} aria-label={isFr ? 'Lire les réponses à voix haute' : 'Read replies aloud'} />
            </label>
            <Button variant="ghost" size="sm" onClick={reset} className="h-7 gap-1.5 text-xs">
              <RotateCcw className="h-3.5 w-3.5" />
              {isFr ? 'Nouvelle discussion' : 'New chat'}
            </Button>
          </div>
        </div>

        {/* Transcript */}
        <div className="flex-1 space-y-4 rounded-2xl border border-border/60 bg-card/40 p-4 min-h-[46vh]">
          {messages.map((m) => (
            <div key={m.id} className={cn('flex flex-col gap-2', m.role === 'user' ? 'items-end' : 'items-start')}>
              {m.content && (
                <div
                  className={cn(
                    'max-w-[88%] whitespace-pre-wrap rounded-2xl px-3.5 py-2 text-sm leading-relaxed',
                    m.role === 'user'
                      ? 'bg-primary text-primary-foreground rounded-br-sm'
                      : 'text-foreground',
                  )}
                >
                  {m.content}
                </div>
              )}

              {m.proposal && (
                <div className="w-full max-w-md rounded-2xl border border-amber-500/30 bg-amber-500/5 p-4">
                  <p className="flex items-center gap-2 text-sm font-semibold">
                    <BookOpen className="h-4 w-4 text-amber-500" />
                    {m.proposal.input.title || (isFr ? 'Nouveau cours' : 'New course')}
                  </p>
                  <ul className="mt-2 space-y-1 text-xs text-muted-foreground">
                    <li>{isFr ? 'Formule' : 'Tier'}: <span className="font-medium text-foreground capitalize">{m.proposal.input.tier}</span></li>
                    <li>{isFr ? 'Niveau' : 'Level'}: <span className="font-medium text-foreground">{m.proposal.input.level}</span></li>
                    <li>{isFr ? 'Langue' : 'Language'}: <span className="font-medium text-foreground">{m.proposal.input.language.toUpperCase()}</span></li>
                    <li>{isFr ? 'Illustrations IA' : 'AI illustrations'}: <span className="font-medium text-foreground">{m.proposal.input.generate_images ? (isFr ? 'Oui' : 'Yes') : (isFr ? 'Non' : 'No')}</span></li>
                  </ul>
                  <div className="mt-3 flex items-center gap-2 rounded-lg bg-background/70 px-3 py-2 text-xs">
                    <Coins className="h-3.5 w-3.5 text-amber-500" />
                    <span>
                      {isFr ? 'Coût' : 'Cost'}: <span className="font-semibold text-foreground">{m.proposal.cost ?? '—'} {isFr ? 'crédits' : 'credits'}</span>
                      {typeof (creditSummary?.balance ?? m.proposal.balance) === 'number' && (
                        <span className="text-muted-foreground">
                          {' '}· {isFr ? 'solde' : 'balance'} {(creditSummary?.balance ?? m.proposal.balance)?.toFixed?.(1) ?? m.proposal.balance}
                        </span>
                      )}
                    </span>
                  </div>
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    {isFr
                      ? 'Tu pourras relire et modifier le brouillon avant publication.'
                      : 'You will review and edit the draft before publishing.'}
                  </p>
                  <Button className="mt-3 w-full" onClick={() => startGeneration(m.proposal!)}>
                    {isFr ? 'Confirmer et générer' : 'Confirm & generate'}
                  </Button>
                </div>
              )}
            </div>
          ))}

          {thinking && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              {isFr ? 'Réflexion…' : 'Thinking…'}
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Composer — dictation lands here, never auto-sent */}
        <div className="rounded-2xl border border-border/60 bg-card p-2">
          <Textarea
            ref={composerRef}
            value={input}
            onChange={(e) => { setInput(e.target.value); if (!dictation.recording) baseTextRef.current = e.target.value; }}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={copy.placeholder}
            rows={2}
            className="resize-none border-0 bg-transparent focus-visible:ring-0"
          />
          <div className="flex items-center justify-between gap-2 px-1 pb-1">
            <div className="flex items-center gap-2">
              <Button
                type="button"
                size="icon"
                variant={dictation.recording ? 'destructive' : 'outline'}
                className="h-9 w-9 shrink-0"
                aria-label={micLabel}
                title={micLabel}
                onClick={() => { if (!dictation.recording) baseTextRef.current = input; dictation.toggle(); }}
              >
                {dictation.recording ? <MicOff className="h-4 w-4" /> : <Mic className="h-4 w-4" />}
              </Button>
              {(dictation.recording || dictation.transcribing) && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                  {dictation.recording && <span className="h-2 w-2 animate-pulse rounded-full bg-red-500" />}
                  {dictation.recording
                    ? (isFr ? 'À l’écoute… relis avant d’envoyer' : 'Listening… review before sending')
                    : (isFr ? 'Transcription…' : 'Transcribing…')}
                </span>
              )}
            </div>
            <Button size="icon" className="h-9 w-9" onClick={handleSend} disabled={thinking || !input.trim()} aria-label={isFr ? 'Envoyer' : 'Send'}>
              {thinking ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </div>
    </AdminPageShell>
  );
}
