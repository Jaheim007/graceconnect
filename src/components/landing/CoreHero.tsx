import { useNavigate } from 'react-router-dom';
import { ArrowRight, Zap, Compass } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';

/**
 * Restored SiteViral Core hero — Create → Sell → Earn → Discover.
 * Digital creation & monetization first; no service-marketplace search.
 */
export function CoreHero() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const reduce = useReducedMotion();

  const rise = (delay: number) =>
    reduce
      ? {}
      : {
          initial: { opacity: 0, y: 20 },
          animate: { opacity: 1, y: 0 },
          transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] as [number, number, number, number], delay },
        };

  const steps = fr
    ? ['Créer', 'Vendre', 'Gagner', 'Découvrir']
    : ['Create', 'Sell', 'Earn', 'Discover'];

  return (
    <section className="relative overflow-hidden bg-sidebar text-sidebar-foreground">
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            'radial-gradient(60% 55% at 20% 20%, hsl(var(--primary)/0.35), transparent 70%), radial-gradient(50% 45% at 80% 80%, hsl(var(--accent)/0.18), transparent 70%)',
        }}
      />
      <div className="container relative max-w-4xl px-4 sm:px-6 py-20 sm:py-28 text-center">
        <motion.div {...rise(0)} className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/10 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider">
          <Zap className="h-4 w-4 text-primary shrink-0" />
          {fr ? 'Gratuit pour commencer' : 'Free to start'}
        </motion.div>

        <motion.h1 {...rise(0.06)} className="mt-6 text-4xl sm:text-6xl font-black tracking-tight leading-[1.05]">
          {fr ? 'Crée, vends et gagne avec tes ' : 'Create, sell and earn from your '}
          <span className="bg-gradient-to-r from-primary to-accent bg-clip-text text-transparent">
            {fr ? 'contenus digitaux.' : 'digital content.'}
          </span>
        </motion.h1>

        <motion.p {...rise(0.12)} className="mx-auto mt-5 max-w-2xl text-sm sm:text-base leading-relaxed text-sidebar-foreground/75">
          {fr
            ? "Écris des livres et des formations avec l'IA, vends tes produits digitaux, construis ta propre plateforme publique et gagne grâce à l'affiliation."
            : 'Write books and formations with AI, sell your digital products, build your own public platform and earn through affiliation.'}
        </motion.p>

        <motion.div {...rise(0.18)} className="mt-8 flex flex-wrap items-center justify-center gap-3">
          <Button
            size="lg"
            className="h-12 rounded-xl px-6 font-bold gap-2"
            onClick={() => navigate('/create-org')}
          >
            {fr ? 'Créer ma plateforme' : 'Create my platform'} <ArrowRight className="h-4 w-4" />
          </Button>
          <Button
            size="lg"
            variant="outline"
            className="h-12 rounded-xl px-6 font-semibold border-white/25 bg-white/5 text-sidebar-foreground hover:bg-white/10"
            onClick={() => navigate('/ecrire')}
          >
            {fr ? 'Commencer à créer' : 'Start creating'}
          </Button>
          <Button
            size="lg"
            variant="ghost"
            className="h-12 rounded-xl px-5 font-semibold text-sidebar-foreground/85 hover:bg-white/10 gap-2"
            onClick={() => navigate('/discover')}
          >
            <Compass className="h-4 w-4" /> {fr ? 'Découvrir les produits' : 'Discover products'}
          </Button>
        </motion.div>

        <motion.ol {...rise(0.24)} className="mt-10 flex flex-wrap items-center justify-center gap-2 text-xs font-bold uppercase tracking-wider">
          {steps.map((s, i) => (
            <li key={s} className="flex items-center gap-2">
              <span className="rounded-full border border-white/15 bg-white/[0.06] px-3 py-1.5">{s}</span>
              {i < steps.length - 1 && <ArrowRight className="h-3.5 w-3.5 text-sidebar-foreground/50" />}
            </li>
          ))}
        </motion.ol>
      </div>
    </section>
  );
}
