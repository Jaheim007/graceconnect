import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';

/**
 * Landing hero written for ONE person: the author / teacher who wants to turn
 * what they know into a book or a formation and get paid by Mobile Money.
 * One promise, one input, one action.
 */
export function AuthorHero() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const reduce = useReducedMotion();
  const [idea, setIdea] = useState('');

  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 18 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay },
        };

  const start = () => {
    const q = idea.trim();
    navigate(q ? `/ecrire?idea=${encodeURIComponent(q)}` : '/ecrire');
  };

  const examples = fr
    ? ['Discipline financière', 'Préparer un mariage chrétien', 'Apprendre la couture', 'Devenir un bon leader']
    : ['Financial discipline', 'Preparing a Christian marriage', 'Learn tailoring', 'Becoming a good leader'];

  return (
    <section className="relative overflow-hidden border-b border-border bg-background">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            'radial-gradient(65% 50% at 50% 0%, hsl(var(--primary)/0.12), transparent 70%)',
        }}
      />
      <div className="container relative max-w-3xl px-4 sm:px-6 pt-16 pb-14 sm:pt-24 sm:pb-20 text-center">
        <motion.h1
          {...rise(0)}
          className="text-[2rem] leading-[1.08] sm:text-6xl font-black tracking-tight text-balance"
        >
          {fr ? 'Deviens le prochain auteur qui ' : 'Be the next author who '}
          <span className="text-primary">
            {fr ? 'vit de ce qu’il enseigne.' : 'lives off what they teach.'}
          </span>
        </motion.h1>

        <motion.p
          {...rise(0.07)}
          className="mx-auto mt-5 max-w-xl text-sm sm:text-lg leading-relaxed text-muted-foreground text-pretty"
        >
          {fr
            ? "Écris ton livre ou ta formation avec l'IA, publie-le sur ta propre page, et reçois ton argent par Wave, Orange Money ou MTN."
            : 'Write your book or your formation with AI, publish it on your own page, and get paid by Wave, Orange Money or MTN.'}
        </motion.p>

        <motion.div {...rise(0.14)} className="mx-auto mt-9 max-w-xl">
          <div className="rounded-2xl border border-border bg-card p-2.5 shadow-sm focus-within:border-primary/60 transition-colors">
            <label htmlFor="idea" className="sr-only">
              {fr ? 'Que veux-tu enseigner ?' : 'What do you want to teach?'}
            </label>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
              <input
                id="idea"
                value={idea}
                onChange={(e) => setIdea(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && start()}
                placeholder={fr ? 'Que veux-tu enseigner ?' : 'What do you want to teach?'}
                className="min-w-0 flex-1 bg-transparent px-3 py-3 text-sm sm:text-base outline-none placeholder:text-muted-foreground"
              />
              <Button onClick={start} className="h-11 shrink-0 rounded-xl px-5 font-bold gap-2">
                <Sparkles className="h-4 w-4" />
                {fr ? 'Commencer' : 'Start'}
              </Button>
            </div>
          </div>

          <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
            {examples.map((ex) => (
              <button
                key={ex}
                type="button"
                onClick={() => setIdea(ex)}
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
      </div>
    </section>
  );
}
