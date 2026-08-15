import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, ArrowUp, BookOpen, Wallet, Zap } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { HeroAurora } from './HeroAurora';
import { setPendingAction } from '@/lib/pendingAction';
import { cn } from '@/lib/utils';


const GUEST_PREVIEW_KEY = 'sv_guest_book_preview';

interface GuestChapter {
  title: string;
  summary?: string;
}

interface GuestPreview {
  topic: string;
  title: string;
  subtitle: string;
  chapters: GuestChapter[];
  openingChapter: string;
  locale: string;
}


export function AuthorHero() {
  const navigate = useNavigate();
  const { locale, t } = useI18n();
  const fr = locale === 'fr';
  const { user } = useAuth();
  const reduce = useReducedMotion();
  const [idea, setIdea] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<GuestPreview | null>(null);
  const [error, setError] = useState<string | null>(null);

  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay },
        };

  const examples = fr
    ? ['Discipline financière', 'Préparer un mariage chrétien', 'Apprendre la couture', 'Devenir un bon leader']
    : ['Financial discipline', 'Preparing a Christian marriage', 'Learn tailoring', 'Becoming a good leader'];

  // Rotating placeholder — shows real book ideas instead of a static prompt.
  const [phIndex, setPhIndex] = useState(0);
  useEffect(() => {
    if (reduce) return;
    const id = setInterval(() => setPhIndex((i) => (i + 1) % examples.length), 3000);
    return () => clearInterval(id);
  }, [reduce, examples.length]);


  const generatePreview = async (topicOverride?: string) => {
    const topic = (topicOverride ?? idea).trim();
    if (!topic) return;

    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      const { data, error: fnErr } = await supabase.functions.invoke('guest-book-outline', {
        body: { topic, locale },
      });

      if (fnErr) throw fnErr;

      const result: GuestPreview = {
        topic,
        title: data.title || topic,
        subtitle: data.subtitle || '',
        chapters: data.chapters || [],
        openingChapter: data.openingChapter || '',
        locale,
      };

      try {
        sessionStorage.setItem(GUEST_PREVIEW_KEY, JSON.stringify(result));
      } catch {
        // ignore storage errors
      }

      setPreview(result);
    } catch (e: any) {
      setError(e?.message || (fr ? "Une erreur s'est produite" : 'Something went wrong'));
    } finally {
      setLoading(false);
    }
  };

  const handleStart = () => {
    if (user) {
      // Signed-in users jump straight into the wizard with their topic.
      const q = idea.trim();
      navigate(q ? `/ecrire?idea=${encodeURIComponent(q)}` : '/ecrire');
      return;
    }
    generatePreview();
  };

  const handleKeepGoing = () => {
    setPendingAction('generic', '/ecrire');
    navigate('/auth?mode=signup');
  };

  const proofs = fr
    ? [
        { icon: Zap, label: 'Plan + chapitre 1 en 30 secondes' },
        { icon: BookOpen, label: 'Aucun compte pour essayer' },
        { icon: Wallet, label: 'Vends en Mobile Money' },
      ]
    : [
        { icon: Zap, label: 'Outline + chapter 1 in 30 seconds' },
        { icon: BookOpen, label: 'No account to try' },
        { icon: Wallet, label: 'Sell with Mobile Money' },
      ];

  return (
    <section className="relative overflow-hidden border-b border-border bg-background">
      <HeroAurora />
      <div className="container relative max-w-4xl px-4 sm:px-6 pt-16 pb-14 sm:pt-24 sm:pb-20 text-center">
        <motion.div {...rise(0)} className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/[0.07] px-3.5 py-1.5 text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm">
          <span className="relative flex h-1.5 w-1.5">
            <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-primary opacity-75" />
            <span className="relative inline-flex h-1.5 w-1.5 rounded-full bg-primary" />
          </span>
          <span className="text-primary">
            {fr ? 'Aperçu gratuit · sans compte' : 'Free preview · no account'}
          </span>
        </motion.div>

        <motion.h1
          {...rise(0.06)}
          className="mt-6 text-[2.35rem] leading-[1.06] sm:text-[4.25rem] sm:leading-[1.02] font-black tracking-tight text-balance"
        >
          {fr ? 'Tout le monde a un livre en soi.' : 'Everyone has a book inside them.'}
          <span className="mt-1 block bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
            {fr ? 'Le tien commence ici.' : 'Yours starts here.'}
          </span>
        </motion.h1>

        <motion.p
          {...rise(0.12)}
          className="mx-auto mt-5 max-w-xl text-sm sm:text-lg leading-relaxed text-muted-foreground text-pretty"
        >
          {fr
            ? "Tu as déjà l'idée. Écris une phrase, et on écrit le plan et le premier chapitre devant toi — gratuitement."
            : 'You already have the idea. Write one sentence and we write the outline and first chapter in front of you — free.'}
        </motion.p>

        <motion.div {...rise(0.18)} className="mx-auto mt-9 max-w-3xl">
          <div className="group relative rounded-[26px] border border-border/80 bg-card/70 p-3.5 sm:p-4 shadow-[0_24px_70px_-40px_hsl(var(--primary)/0.55)] backdrop-blur-xl transition-all duration-500 hover:border-primary/40 focus-within:border-primary/60 focus-within:shadow-[0_30px_90px_-40px_hsl(var(--primary)/0.7)]">
            <span
              aria-hidden
              className="pointer-events-none absolute -inset-px rounded-[26px] bg-gradient-to-r from-primary/25 via-transparent to-accent/25 opacity-0 blur-[2px] transition-opacity duration-500 group-focus-within:opacity-100"
            />

            <label htmlFor="idea" className="sr-only">
              {fr ? 'Quel livre veux-tu écrire ?' : 'What book do you want to write?'}
            </label>
            <div className="flex flex-col">
              <textarea
                id="idea"
                rows={3}
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    if (!loading) handleStart();
                  }
                }}
                placeholder={
                  fr
                    ? `Ex. : ${examples[phIndex]}`
                    : `e.g. ${examples[phIndex]}`
                }
                className="min-h-[92px] w-full resize-none bg-transparent px-3 pt-3 text-left text-base sm:text-lg leading-relaxed outline-none placeholder:text-muted-foreground/70"
              />
              <div className="mt-1 flex items-end justify-between gap-3 px-1.5 pb-0.5">
                <span className="hidden select-none text-[11px] font-medium text-muted-foreground/70 sm:block">
                  {fr ? 'Entrée pour écrire · Maj + Entrée pour une nouvelle ligne' : 'Enter to write · Shift + Enter for a new line'}
                </span>
                <button
                  type="button"
                  onClick={handleStart}
                  disabled={loading || !idea.trim()}
                  aria-label={fr ? 'Écrire mon livre' : 'Write my book'}
                  className="group/send relative grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary text-primary-foreground shadow-lg shadow-primary/25 transition-all duration-300 hover:scale-105 hover:shadow-xl hover:shadow-primary/35 active:scale-95 disabled:pointer-events-none disabled:bg-muted disabled:text-muted-foreground disabled:shadow-none"
                >
                  {loading ? (
                    <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                  ) : (
                    <ArrowUp className="h-5 w-5 transition-transform duration-300 group-hover/send:-translate-y-0.5" />
                  )}
                </button>
              </div>
            </div>

          </div>

          <div className="mt-3.5 flex flex-wrap items-center justify-center gap-2">
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setIdea(ex);
                  if (!user) generatePreview(ex);
                }}
                className="rounded-full border border-border bg-card/70 px-3 py-1.5 text-[11px] sm:text-xs font-semibold text-muted-foreground backdrop-blur-sm transition-all hover:-translate-y-0.5 hover:border-primary/50 hover:text-foreground hover:shadow-sm"
              >
                {ex}
              </button>
            ))}
          </div>

          <div className="mt-7 flex flex-wrap items-center justify-center gap-x-6 gap-y-2.5">
            {proofs.map((p) => (
              <span key={p.label} className="inline-flex items-center gap-1.5 text-[11px] sm:text-xs font-semibold text-muted-foreground">
                <p.icon className="h-3.5 w-3.5 text-primary shrink-0" />
                {p.label}
              </span>
            ))}
          </div>

          <button
            type="button"
            onClick={() => navigate('/create-org')}
            className="mt-6 inline-flex items-center gap-1.5 text-xs sm:text-sm font-semibold text-muted-foreground hover:text-foreground transition-colors"
          >
            {fr ? "J'ai déjà mon contenu" : 'I already have my content'}
            <ArrowRight className="h-3.5 w-3.5" />
          </button>
        </motion.div>


        <AnimatePresence>
          {error && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="mx-auto mt-6 max-w-xl rounded-xl border border-destructive/20 bg-destructive/10 px-4 py-3 text-sm text-destructive"
            >
              {error}
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {preview && (
            <motion.div
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="mx-auto mt-10 max-w-3xl text-left"
            >
              <div className="rounded-2xl border border-border bg-card p-5 sm:p-7 shadow-sm backdrop-blur-sm">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-lg sm:text-xl font-bold">{preview.title}</h2>
                    {preview.subtitle && (
                      <p className="mt-1 text-sm text-muted-foreground">{preview.subtitle}</p>
                    )}
                  </div>
                  <div className="rounded-full bg-primary/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-primary">
                    {fr ? 'Aperçu' : 'Preview'}
                  </div>
                </div>

                <div className="mt-6">
                  <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                    {fr ? 'Plan du livre' : 'Book outline'}
                  </h3>
                  <ol className="space-y-2.5">
                    {preview.chapters.map((chapter, idx) => (
                      <li key={idx} className="flex gap-3 text-sm">
                        <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-muted text-[10px] font-bold text-muted-foreground">
                          {idx + 1}
                        </span>
                        <div>
                          <span className="font-semibold text-foreground">{chapter.title}</span>
                          {chapter.summary && (
                            <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{chapter.summary}</p>
                          )}
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                {preview.openingChapter && (
                  <div className="mt-6">
                    <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-3">
                      {fr ? 'Début du chapitre 1' : 'Chapter 1 opening'}
                    </h3>
                    <div className="rounded-xl bg-muted/50 p-4 text-sm leading-relaxed text-foreground/90">
                      {preview.openingChapter.split('\n\n').map((p, i) => (
                        <p key={i} className={cn(i > 0 && 'mt-3')}>{p}</p>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-7 rounded-xl border border-primary/20 bg-primary/5 p-4 sm:p-5">
                  <p className="text-sm font-medium text-foreground">
                    {fr
                      ? 'Ton livre est prêt. Crée ton compte pour le garder, le finir et le vendre.'
                      : 'Your book is ready. Create an account to keep it, finish it, and sell it.'}
                  </p>
                  <div className="mt-4 flex flex-col sm:flex-row gap-2.5">
                    <Button onClick={handleKeepGoing} className="h-11 rounded-xl px-5 font-bold gap-2">
                      {fr ? 'Créer mon compte' : 'Create my account'}
                      <ArrowRight className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="outline"
                      onClick={() => navigate('/auth?mode=signin')}
                      className="h-11 rounded-xl px-5 font-semibold"
                    >
                      {fr ? 'Se connecter' : 'Sign in'}
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </section>
  );
}
