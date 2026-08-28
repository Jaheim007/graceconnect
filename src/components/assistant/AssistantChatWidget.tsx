import { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from '@/lib/router-compat';
import { X, Mic, Send, Loader2, Coins, RotateCcw, BookOpen, GraduationCap, Image as ImageIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { assistantCopy, ASSISTANT_NAME } from '@/lib/viralStudio/assistant';
import { useStudioConversation, type GenerationProposal } from '@/hooks/useStudioConversation';
import { useVoiceDictation } from '@/hooks/useVoiceDictation';
import { useCreditsBalance } from '@/hooks/useCredits';
import { BOOK_PREFILL_KEY } from '@/lib/viralStudio/handoff';
import botAsset from '@/assets/viral-studio-bot.gif.asset.json';
import { useIsTyping } from '@/hooks/useIsTyping';
import { useNavAutoHide } from '@/hooks/useNavAutoHide';


/**
 * Global creation chatbot — sits just above the Support button on every
 * signed-in screen. Chatting is free; a confirmed proposal hands the brief
 * straight to the existing course / book pipelines (no parallel engine).
 */
export function AssistantChatWidget() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const copy = assistantCopy(isFr);
  const { user } = useAuth();
  const typing = useIsTyping();

  const { currentOrg } = useOrg();
  const { toast } = useToast();
  const navigate = useNavigate();
  const { data: creditSummary } = useCreditsBalance();

  const [open, setOpen] = useState(false);
  const scrolling = useNavAutoHide();
  const [showNudge, setShowNudge] = useState(false);
  const [input, setInput] = useState('');
  const [imageChoice, setImageChoice] = useState<Record<string, boolean>>({});
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

  useEffect(() => { if (open) composerRef.current?.focus(); }, [open]);
  useEffect(() => { bottomRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages.length, thinking]);
  useEffect(() => { if (error) toast({ title: error, variant: 'destructive' }); }, [error, toast]);

  // Periodic "How can I help you today?" nudge — gentle, never while chatting.
  useEffect(() => {
    let mounted = true;
    const show = () => { if (mounted && !open) setShowNudge(true); };
    const hide = () => { if (mounted) setShowNudge(false); };
    let hideTimer: ReturnType<typeof setTimeout> | undefined;
    const scheduleHide = () => { hideTimer = setTimeout(hide, 6000); };
    const showAndSchedule = () => { show(); scheduleHide(); };
    const first = setTimeout(showAndSchedule, 12000);
    const cycle = setInterval(showAndSchedule, 50000);
    const onVisibility = () => { if (document.hidden) hide(); };
    document.addEventListener('visibilitychange', onVisibility);
    return () => {
      mounted = false;
      clearTimeout(first);
      clearTimeout(hideTimer);
      clearInterval(cycle);
      document.removeEventListener('visibilitychange', onVisibility);
    };
  }, [open]);

  if (!user) return null;

  const handleSend = async () => {
    const text = input.trim();
    if (!text || thinking) return;
    if (dictation.recording) await dictation.stop();
    setInput('');
    baseTextRef.current = '';
    await send(text);
    composerRef.current?.focus();
  };

  const startGeneration = (proposal: GenerationProposal, withImages?: boolean) => {
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

    setOpen(false);

    if (proposal.kind === 'book') {
      // Hand the brief to the existing writing wizard, pre-loaded and ready to generate.
      sessionStorage.setItem(BOOK_PREFILL_KEY, JSON.stringify({
        source: proposal.input.source === 'document' ? 'document' : 'idea',
        topic: proposal.input.prompt,
        title: proposal.input.title,
        style: proposal.input.style || 'ebook',
        tone: proposal.input.tone || 'professional',
        targetAudience: proposal.input.audience || 'general',
        language: proposal.input.language,
        languageManuallySelected: true,
        chapterCount: proposal.input.chapter_count || 8,
      }));
      navigate('/ecrire');
      return;
    }

    if (!currentOrg) {
      toast({ title: isFr ? 'Choisis une plateforme d’abord.' : 'Pick a platform first.', variant: 'destructive' });
      return;
    }
    navigate('/admin/programs/generating', {
      state: {
        mode: proposal.input.source === 'document' ? 'convert' : 'ai',
        input: {
          org_id: currentOrg.id,
          ...proposal.input,
          generate_images: withImages ?? proposal.input.generate_images ?? false,
        },
      },
    });
  };

  return (
    <div
      className={cn(
        'fixed right-3 z-[56] transition-opacity duration-200 md:right-6',
        typing && !open ? 'pointer-events-none opacity-0' : 'opacity-100',
        !open && scrolling && 'opacity-30 md:opacity-100',
      )}
      style={{ bottom: 'calc(var(--sv-fab-offset) + 3.75rem)' }}
    >

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 12, scale: 0.96 }}
            transition={{ type: 'spring', stiffness: 380, damping: 26 }}
            className="mb-3 flex h-[min(72dvh,32rem)] w-[calc(100vw-2rem)] max-w-[24rem] flex-col overflow-hidden rounded-2xl border border-amber-500/25 bg-card shadow-2xl sm:w-[24rem] md:h-[min(70dvh,34rem)] md:w-[26rem] md:max-w-[26rem]"
          >
            <div className="flex items-center justify-between gap-2 border-b border-border bg-muted/30 px-3.5 py-2.5">
              <div>
                <p className="text-xs font-bold">{ASSISTANT_NAME}</p>
                <p className="text-[10px] text-muted-foreground">{copy.free}</p>
              </div>
              <div className="flex items-center gap-1">

                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={reset} aria-label={isFr ? 'Nouvelle discussion' : 'New chat'}>
                  <RotateCcw className="h-3.5 w-3.5" />
                </Button>
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setOpen(false)} aria-label={isFr ? 'Fermer' : 'Close'}>
                  <X className="h-3.5 w-3.5" />
                </Button>
              </div>
            </div>

            <div className="flex-1 space-y-3 overflow-y-auto overscroll-contain px-3 py-3.5">
              {messages.map((m) => (
                <div key={m.id} className={cn('flex flex-col gap-2', m.role === 'user' ? 'items-end' : 'items-start')}>
                  {m.content && (
                    <div
                      className={cn(
                        'max-w-[88%] whitespace-pre-wrap break-words rounded-2xl text-[13px] leading-relaxed',
                        m.role === 'user'
                          ? 'rounded-br-sm bg-primary px-3 py-2 text-primary-foreground'
                          : 'px-0.5 text-foreground',
                      )}
                    >
                      {m.content}
                    </div>
                  )}

                  {m.proposal && (
                    <div className="w-full rounded-xl border border-amber-500/30 bg-amber-500/5 p-3">
                      <p className="flex items-center gap-2 text-[13px] font-semibold">
                        {m.proposal.kind === 'book'
                          ? <BookOpen className="h-4 w-4 shrink-0 text-amber-500" />
                          : <GraduationCap className="h-4 w-4 shrink-0 text-amber-500" />}
                        <span className="min-w-0 break-words">{m.proposal.input.title || (isFr ? 'Nouveau contenu' : 'New content')}</span>
                      </p>
                      <p className="mt-1.5 flex flex-wrap items-center gap-x-1.5 text-[11px] text-muted-foreground">
                        <Coins className="h-3 w-3 text-amber-500" />
                        {isFr ? 'Coût' : 'Cost'}: <span className="font-semibold text-foreground">{m.proposal.cost ?? '—'}</span>
                        {typeof (creditSummary?.balance ?? m.proposal.balance) === 'number' && (
                          <span>· {isFr ? 'solde' : 'balance'} {(creditSummary?.balance ?? m.proposal.balance)?.toFixed?.(1)}</span>
                        )}
                      </p>

                      {/* Recap of everything gathered in the conversation */}
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        {[
                          m.proposal.input.tier === 'premium'
                            ? (isFr ? 'Détaillé' : 'Detailed')
                            : (isFr ? 'Essentiel' : 'Essential'),
                          m.proposal.input.language === 'fr' ? 'Français' : 'English',
                          m.proposal.kind === 'book' ? m.proposal.input.style : m.proposal.input.level,
                          m.proposal.kind === 'book' ? m.proposal.input.audience : m.proposal.input.teaching_style,
                          m.proposal.input.tone,
                          m.proposal.kind === 'book' && m.proposal.input.chapter_count
                            ? `${m.proposal.input.chapter_count} ${isFr ? 'chapitres' : 'chapters'}`
                            : null,
                        ].filter(Boolean).map((chip, i) => (
                          <span
                            key={i}
                            className="rounded-full border border-border/60 bg-background/60 px-2 py-0.5 text-[10px] capitalize text-muted-foreground"
                          >
                            {chip as string}
                          </span>
                        ))}
                      </div>


                      {m.proposal.kind !== 'book' && (
                        <label className="mt-2.5 flex items-center justify-between gap-2 rounded-lg border border-border/60 bg-background/60 px-2.5 py-2">
                          <span className="flex items-center gap-2 text-[11px] font-medium">
                            <ImageIcon className="h-3.5 w-3.5 text-amber-500" />
                            {isFr ? 'Illustrations par leçon' : 'Illustrations per lesson'}
                          </span>
                          <Switch
                            checked={imageChoice[m.id] ?? m.proposal.input.generate_images ?? false}
                            onCheckedChange={(v) => setImageChoice((prev) => ({ ...prev, [m.id]: v }))}
                            aria-label={isFr ? 'Générer des illustrations' : 'Generate illustrations'}
                          />
                        </label>
                      )}

                      <p className="mt-2 text-[10px] text-muted-foreground">
                        {isFr
                          ? 'Tu pourras relire et modifier avant publication.'
                          : 'You can review and edit before publishing.'}
                      </p>
                      <Button
                        size="sm"
                        className="mt-2.5 h-9 w-full text-xs"
                        onClick={() => startGeneration(m.proposal!, imageChoice[m.id] ?? m.proposal!.input.generate_images ?? false)}
                      >
                        {isFr ? 'Confirmer et générer' : 'Confirm & generate'}
                      </Button>
                    </div>
                  )}
                </div>
              ))}

              {thinking && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  {isFr ? 'Réflexion…' : 'Thinking…'}
                </div>
              )}
              <div ref={bottomRef} />
            </div>

            <div className="border-t border-border bg-muted/20 p-2">
              <div className="flex items-end gap-1.5">
                <Textarea
                  ref={composerRef}
                  value={input}
                  onChange={(e) => { setInput(e.target.value); baseTextRef.current = e.target.value; }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
                  }}
                  placeholder={copy.placeholder}
                  rows={1}
                  className="max-h-28 min-h-[2.5rem] flex-1 resize-none border-0 bg-transparent px-2 py-2.5 text-[13px] shadow-none focus-visible:ring-0"
                />
                <Button
                  variant={dictation.recording ? 'destructive' : 'ghost'}
                  size="icon"
                  className="h-9 w-9 shrink-0"
                  onClick={() => dictation.toggle()}
                  aria-label={dictation.recording ? (isFr ? 'Arrêter la dictée' : 'Stop dictation') : (isFr ? 'Dicter' : 'Dictate')}
                >
                  {dictation.transcribing
                    ? <Loader2 className="h-4 w-4 animate-spin" />
                    : <Mic className="h-4 w-4" />}
                </Button>
                <Button size="icon" className="h-9 w-9 shrink-0" onClick={handleSend} disabled={!input.trim() || thinking} aria-label={isFr ? 'Envoyer' : 'Send'}>
                  <Send className="h-4 w-4" />
                </Button>
              </div>
              {dictation.recording && (
                <p className="px-2 pt-1 text-[10px] text-muted-foreground">
                  {isFr ? 'Parle — relis le texte avant d’envoyer.' : 'Speak — review the text before sending.'}
                </p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="relative flex flex-col items-end gap-2">
        <AnimatePresence>
          {!open && showNudge && (
            <motion.div
              initial={{ opacity: 0, y: 8, scale: 0.96 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 8, scale: 0.96 }}
              transition={{ type: 'spring', stiffness: 380, damping: 26 }}
              className="mb-1 hidden max-w-[14rem] rounded-xl md:block border border-amber-500/20 bg-card px-3 py-2 text-xs shadow-lg"
            >
              <p className="font-medium text-foreground">{copy.nudge}</p>
              <div className="absolute -bottom-1 right-5 h-2 w-2 rotate-45 border-b border-r border-amber-500/20 bg-card" />
            </motion.div>
          )}
        </AnimatePresence>

        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpen((o) => !o)}
          aria-label={ASSISTANT_NAME}
          className={cn(
            'relative flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground md:h-14 md:w-14',
            'ring-2 ring-background shadow-[0_10px_30px_-8px_hsl(var(--primary)/0.55)] transition-shadow hover:shadow-[0_14px_40px_-8px_hsl(var(--primary)/0.7)]'
          )}
        >
          {/* Soft halo so the mascot floats above content */}
          <span
            aria-hidden
            className="pointer-events-none absolute -inset-2 rounded-full bg-primary/15 blur-md"
          />
          {open ? (
            <X className="relative h-5 w-5" />
          ) : (
            <svg viewBox="0 0 32 32" className="relative h-7 w-7 md:h-8 md:w-8" fill="none" aria-hidden>
              {/* antenna */}
              <path d="M16 4.5v2.6" stroke="hsl(var(--gold))" strokeWidth="1.8" strokeLinecap="round" />
              <circle cx="16" cy="3.4" r="1.6" fill="hsl(var(--gold))" />
              {/* head */}
              <rect x="5.5" y="7.5" width="21" height="16" rx="6.5" fill="currentColor" fillOpacity="0.16" stroke="currentColor" strokeWidth="1.8" />
              {/* eyes */}
              <circle cx="12" cy="15" r="2.1" fill="hsl(var(--gold))" />
              <circle cx="20" cy="15" r="2.1" fill="hsl(var(--gold))" />
              {/* smile */}
              <path d="M12.8 19.4c1.9 1.3 4.5 1.3 6.4 0" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
              {/* ears */}
              <path d="M3.6 13.4v4.2M28.4 13.4v4.2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
            </svg>
          )}
        </motion.button>

      </div>
    </div>
  );
}
