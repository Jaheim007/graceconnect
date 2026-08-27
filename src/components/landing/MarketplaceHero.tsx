import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';
import { setIntent } from '@/lib/intent';

/**
 * Centered editorial hero with layered gradient background,
 * staggered entrance motion, and a benefit-led provider CTA.
 */
export function MarketplaceHero() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const [q, setQ] = useState('');
  const reduce = useReducedMotion();

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setIntent('client', '/discover');
    const target = q.trim() ? `/discover?q=${encodeURIComponent(q.trim())}` : '/discover';
    navigate(target);
  };

  const scrollToHow = (e: React.MouseEvent) => {
    e.preventDefault();
    document.getElementById('how')?.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' });
  };

  // Entrance stagger — transform + opacity only.
  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay },
        };

  return (
    <section className="relative overflow-hidden bg-sidebar text-sidebar-foreground">
      {/* Base deep-navy layered gradients */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(60% 55% at 20% 20%, hsl(var(--primary)/0.35), transparent 70%), radial-gradient(50% 45% at 80% 80%, hsl(var(--accent)/0.18), transparent 70%), radial-gradient(70% 70% at 50% 50%, transparent 55%, hsl(var(--sidebar-background)/0.7) 100%)',
        }}
      />

      {/* Very slow drifting glow — pure transform, GPU-friendly */}
      {!reduce && (
        <>
          <motion.div
            aria-hidden
            className="absolute -top-40 -left-40 h-[520px] w-[520px] rounded-full blur-3xl pointer-events-none"
            style={{ backgroundColor: 'hsl(var(--primary) / 0.22)' }}
            animate={{ x: [0, 40, 0], y: [0, 30, 0] }}
            transition={{ duration: 26, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            aria-hidden
            className="absolute -bottom-52 -right-40 h-[560px] w-[560px] rounded-full blur-3xl pointer-events-none"
            style={{ backgroundColor: 'hsl(var(--accent) / 0.18)' }}
            animate={{ x: [0, -30, 0], y: [0, -40, 0] }}
            transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
          />
        </>
      )}

      {/* Barely-visible grid */}
      <div
        className="absolute inset-0 opacity-[0.025] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='56' height='56' viewBox='0 0 56 56'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='0.5'%3E%3Cpath d='M0 0h56v56H0z'/%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      {/* Edge vignette */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background:
            'radial-gradient(120% 90% at 50% 50%, transparent 55%, hsl(220 60% 4% / 0.55) 100%)',
        }}
      />

      <div className="relative container max-w-4xl px-4 sm:px-6 pt-24 sm:pt-32 lg:pt-36 pb-20 sm:pb-28 lg:pb-32 text-center">
        <motion.h1
          {...rise(0.05)}
          className="mx-auto text-[2.25rem] sm:text-6xl lg:text-[76px] font-black leading-[1.05] tracking-[-0.02em] max-w-3xl [text-wrap:balance]"
        >
          {fr ? (
            <>Trouvez le bon <span className="text-accent">produit</span>, service ou professionnel.</>
          ) : (
            <>Find the right <span className="text-accent">product</span>, service or professional.</>
          )}
        </motion.h1>

        <motion.p
          {...rise(0.18)}
          className="mx-auto mt-5 sm:mt-6 text-base sm:text-lg text-sidebar-foreground/70 max-w-2xl leading-relaxed [text-wrap:pretty]"
        >
          {fr
            ? 'Découvrez des produits digitaux, des artisans, des professionnels de la beauté, des tuteurs, des coachs, des musiciens et des créateurs.'
            : 'Discover digital products, artisans, beauty professionals, tutors, coaches, musicians and creators.'}
        </motion.p>

        <motion.form
          {...rise(0.32)}
          onSubmit={submit}
          className="mx-auto mt-8 sm:mt-10 flex items-stretch gap-2 max-w-2xl bg-background rounded-2xl p-2 shadow-2xl shadow-black/40 ring-1 ring-white/5"
        >
          <div className="flex items-center flex-1 min-w-0 pl-3 sm:pl-4">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder={fr ? 'Rechercher produits, services ou professionnels' : 'Search products, services or professionals'}
              className="flex-1 min-w-0 bg-transparent border-0 outline-hidden px-3 py-3.5 sm:py-4 text-sm sm:text-base text-foreground placeholder:text-muted-foreground"
              aria-label={fr ? 'Recherche' : 'Search'}
            />
          </div>
          <Button type="submit" className="h-12 sm:h-14 px-5 sm:px-8 rounded-xl text-sm sm:text-base font-bold shrink-0">
            {fr ? 'Rechercher' : 'Search'}
          </Button>
        </motion.form>

        {/* Provider prompt — benefit-led, clearly secondary */}
        <motion.div
          {...rise(0.5)}
          className="mx-auto mt-14 sm:mt-20 max-w-xl flex flex-col items-center gap-3"
        >
          <p className="text-xl sm:text-2xl font-black tracking-tight text-sidebar-foreground [text-wrap:balance]">
            {fr ? 'Transformez vos compétences en revenus.' : 'Turn your skills into income.'}
          </p>
          <p className="text-sm sm:text-base text-sidebar-foreground/70 max-w-md [text-wrap:pretty]">
            {fr
              ? 'Créez votre espace professionnel, présentez vos services et commencez à recevoir des clients.'
              : 'Create your professional space, showcase your services and start reaching customers.'}
          </p>
          <div className="mt-2 flex flex-col sm:flex-row items-center gap-3">
            <Button
              onClick={() => { setIntent('provider', '/start'); navigate('/start'); }}
              className="h-12 min-h-11 px-6 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 font-bold gap-1.5 shadow-lg shadow-accent/25 transition-transform hover:-translate-y-0.5"
            >
              {fr ? 'Commencer à proposer mes services' : 'Start offering my services'}
              <ArrowRight className="h-4 w-4" />
            </Button>
            <a
              href="#how"
              onClick={scrollToHow}
              className="text-sm font-semibold text-sidebar-foreground/70 hover:text-sidebar-foreground underline-offset-4 hover:underline min-h-11 inline-flex items-center"
            >
              {fr ? 'Voir comment ça fonctionne' : 'See how it works'}
            </a>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
