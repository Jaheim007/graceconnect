import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles, BookOpen, GraduationCap, Church, Target } from 'lucide-react';
import { motion, AnimatePresence, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { RotatingWords } from './RotatingWords';
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

const identities = {
  fr: [
    { label: 'auteur', icon: BookOpen },
    { label: 'professeur', icon: GraduationCap },
    { label: 'pasteur', icon: Church },
    { label: 'coach', icon: Target },
  ],
  en: [
    { label: 'author', icon: BookOpen },
    { label: 'teacher', icon: GraduationCap },
    { label: 'pastor', icon: Church },
    { label: 'coach', icon: Target },
  ],
};

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

  const idList = identities[fr ? 'fr' : 'en'];
  const identityWords = idList.map((i) => i.label);

  const examples = fr
    ? ['Discipline financière', 'Préparer un mariage chrétien', 'Apprendre la couture', 'Devenir un bon leader']
    : ['Financial discipline', 'Preparing a Christian marriage', 'Learn tailoring', 'Becoming a good leader'];

  const generatePreview = async (topicOverride?: string) => {
    const topic = (topicOverride ?? idea).trim();
    if (!topic) return;

    setLoading(true);
    setError(null);
    setPreview(null);

    try {
      const { functionsUrl, anonKey } = await import('@/integrations/supabase/client').then((m) => ({
        functionsUrl: m.supabase.functions.url,
        anonKey: m.supabase.supabaseKey,
      }));

      const res = await fetch(`${functionsUrl}/guest-book-outline`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          apikey: anonKey,
        },
        body: JSON.stringify({ topic, locale }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || 'Failed to generate preview');

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

  const CurrentIdentityIcon = idList.find((i) => i.label === (preview ? 'auteur' : undefined))?.icon || BookOpen;

  return (
    <section className="relative overflow-hidden border-b border-border bg-background">
      <HeroAurora />
      <div className="container relative max-w-4xl px-4 sm:px-6 pt-16 pb-14 sm:pt-24 sm:pb-20 text-center">
        <motion.div {...rise(0)} className="inline-flex items-center gap-2 rounded-full border border-border bg-card/60 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider backdrop-blur-sm">
          <CurrentIdentityIcon className="h-3 w-3 text-primary shrink-0" />
          <span className="text-muted-foreground">
            {fr ? 'Deviens le prochain' : 'Be the next'} <RotatingWords words={identityWords} interval={2600} className="text-foreground" />
          </span>
        </motion.div>

        <motion.h1
          {...rise(0.06)}
          className="mt-5 text-[2.25rem] leading-[1.08] sm:text-6xl font-black tracking-tight text-balance"
        >
          {fr ? 'Écris ton livre ici.' : 'Write your book here.'}
        </motion.h1>

        <motion.p
          {...rise(0.12)}
          className="mx-auto mt-4 max-w-xl text-sm sm:text-lg leading-relaxed text-muted-foreground text-pretty"
        >
          {fr
            ? "De l'idée au livre, généré en direct. Aperçu gratuit — pas de compte requis."
            : 'From idea to book, generated live. Free preview — no account required.'}
        </motion.p>

        <motion.div {...rise(0.18)} className="mx-auto mt-9 max-w-2xl">
          <div className="rounded-2xl border border-border bg-card/80 p-2.5 shadow-sm backdrop-blur-sm focus-within:border-primary/60 transition-colors">
            <label htmlFor="idea" className="sr-only">
              {fr ? 'Quel livre veux-tu écrire ?' : 'What book do you want to write?'}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                id="idea"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !loading && handleStart()}
                placeholder={fr ? 'Quel livre veux-tu écrire ?' : 'What book do you want to write?'}
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm sm:text-base outline-none placeholder:text-muted-foreground"
              />
              <Button
                onClick={handleStart}
                disabled={loading || !idea.trim()}
                className="h-11 shrink-0 rounded-xl px-5 font-bold gap-2"
              >
                {loading ? (
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Sparkles className="h-4 w-4" />
                )}
                {fr ? 'Écrire mon livre' : 'Write my book'}
              </Button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => {
                  setIdea(ex);
                  if (!user) generatePreview(ex);
                }}
                className="rounded-full border border-border bg-card px-3 py-1.5 text-[11px] sm:text-xs font-semibold text-muted-foreground hover:border-primary/50 hover:text-foreground transition-colors"
              >
                {ex}
              </button>
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
