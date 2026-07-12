import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight, ShoppingBag, Calendar, MessageSquare, GraduationCap, Wrench, Building2 } from 'lucide-react';
import { motion, useReducedMotion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';
import { setIntent } from '@/lib/intent';

/**
 * Editorial marketplace hero.
 * - Deep navy surface (bg-sidebar), warm accent, generous spacing.
 * - Real SiteViral UI concept cards on the right (silent motion, static on mobile).
 * - Reduced-motion aware.
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

  return (
    <section className="relative overflow-hidden bg-sidebar text-sidebar-foreground">
      {/* Soft brand-tinted glow */}
      <div className="absolute inset-0 pointer-events-none opacity-70"
        style={{
          backgroundImage:
            'radial-gradient(circle at 12% 15%, hsl(var(--accent)/0.28), transparent 55%), radial-gradient(circle at 90% 80%, hsl(var(--primary)/0.35), transparent 60%)',
        }}
      />
      {/* Fine grid texture */}
      <div className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='0.5'%3E%3Cpath d='M0 0h48v48H0z'/%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative container max-w-6xl px-4 sm:px-6 pt-16 sm:pt-24 pb-16 sm:pb-24">
        <div className="grid lg:grid-cols-[1.05fr_1fr] gap-10 lg:gap-14 items-center">
          {/* Copy + search */}
          <div>
            <h1 className="text-[2.5rem] sm:text-5xl lg:text-[64px] font-black leading-[1.02] tracking-[-0.02em]">
              {fr ? (
                <>Trouvez le bon <span className="text-accent">produit</span>,<br className="hidden sm:block" /> service ou professionnel.</>
              ) : (
                <>Find the right <span className="text-accent">product</span>,<br className="hidden sm:block" /> service or professional.</>
              )}
            </h1>

            <p className="mt-5 text-base sm:text-lg text-sidebar-foreground/70 max-w-xl leading-relaxed">
              {fr
                ? "Achetez des produits digitaux dès aujourd'hui et découvrez un réseau grandissant d'artisans, professionnels de la beauté, tuteurs, coachs, musiciens et créateurs."
                : 'Buy digital products today and discover a growing network of artisans, beauty professionals, tutors, coaches, musicians and creators.'}
            </p>

            <form onSubmit={submit} className="mt-8 flex items-stretch gap-2 max-w-xl bg-background rounded-2xl p-1.5 shadow-2xl shadow-black/30">
              <div className="flex items-center flex-1 min-w-0 pl-3">
                <Search className="h-5 w-5 text-muted-foreground shrink-0" />
                <input
                  value={q}
                  onChange={e => setQ(e.target.value)}
                  placeholder={fr ? 'Rechercher produits, services ou professionnels' : 'Search products, services or professionals'}
                  className="flex-1 min-w-0 bg-transparent border-0 outline-none px-3 py-3 text-sm text-foreground placeholder:text-muted-foreground"
                  aria-label={fr ? 'Recherche' : 'Search'}
                />
              </div>
              <Button type="submit" className="h-11 px-5 sm:px-6 rounded-xl text-sm font-bold shrink-0">
                {fr ? 'Rechercher' : 'Search'}
              </Button>
            </form>

            {/* Provider CTA */}
            <div className="mt-10 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-5 max-w-xl">
              <div className="flex-1">
                <p className="text-sm font-bold text-sidebar-foreground">
                  {fr ? 'Prêt à proposer vos compétences ?' : 'Ready to offer your skills?'}
                </p>
                <p className="text-xs sm:text-sm text-sidebar-foreground/60 mt-0.5">
                  {fr ? 'Créez votre espace pro et commencez à toucher des clients.' : 'Create your service space and start reaching customers.'}
                </p>
              </div>
              <Button
                variant="outline"
                onClick={() => { setIntent('provider', '/start'); navigate('/start'); }}
                className="h-11 px-5 rounded-xl border-white/25 bg-white/5 text-sidebar-foreground hover:bg-white/10 font-semibold gap-1.5 shrink-0"
              >
                {fr ? 'Proposer mes services' : 'Offer your services'}
                <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Visual: product UI montage */}
          <HeroMontage reduce={!!reduce} fr={fr} />
        </div>
      </div>
    </section>
  );
}

function HeroMontage({ reduce, fr }: { reduce: boolean; fr: boolean }) {
  const cards = [
    {
      icon: ShoppingBag,
      title: fr ? 'Ebook · Achat instantané' : 'Ebook · Instant purchase',
      sub: fr ? 'Téléchargement protégé' : 'Protected download',
      tint: 'from-emerald-500/25 to-emerald-500/5',
      iconTint: 'text-emerald-400',
    },
    {
      icon: Calendar,
      title: fr ? 'Rendez-vous beauté' : 'Beauty booking',
      sub: fr ? 'Samedi · 14h30' : 'Saturday · 2:30 PM',
      tint: 'from-pink-500/25 to-pink-500/5',
      iconTint: 'text-pink-300',
    },
    {
      icon: Wrench,
      title: fr ? 'Devis artisan' : 'Artisan quote',
      sub: fr ? 'Réponse en 2h' : 'Reply in 2h',
      tint: 'from-sky-500/25 to-sky-500/5',
      iconTint: 'text-sky-300',
    },
    {
      icon: GraduationCap,
      title: fr ? 'Session tuteur' : 'Tutor session',
      sub: fr ? 'Mathématiques · 1h' : 'Mathematics · 1h',
      tint: 'from-indigo-500/25 to-indigo-500/5',
      iconTint: 'text-indigo-300',
    },
    {
      icon: MessageSquare,
      title: fr ? 'Nouvelle demande' : 'New enquiry',
      sub: fr ? 'Reçue à l\'instant' : 'Just received',
      tint: 'from-amber-500/25 to-amber-500/5',
      iconTint: 'text-amber-300',
    },
    {
      icon: Building2,
      title: fr ? 'Personnel ↔ Espace pro' : 'Personal ↔ Workspace',
      sub: fr ? 'Basculer en un clic' : 'Switch in one click',
      tint: 'from-violet-500/25 to-violet-500/5',
      iconTint: 'text-violet-300',
    },
  ];

  return (
    <div
      className="relative h-[420px] sm:h-[480px] hidden md:block"
      aria-hidden="true"
    >
      {/* Backdrop panel */}
      <div className="absolute inset-4 rounded-3xl bg-white/[0.03] border border-white/10 backdrop-blur-sm" />

      <div className="relative h-full grid grid-cols-2 gap-3 p-6">
        {cards.map((c, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: reduce ? 0 : 0.15 + i * 0.08, duration: 0.5, ease: 'easeOut' }}
            className={`relative rounded-2xl border border-white/10 bg-gradient-to-br ${c.tint} backdrop-blur-md p-4 flex flex-col justify-between overflow-hidden`}
          >
            {!reduce && (
              <motion.div
                className="absolute -inset-1 opacity-0"
                animate={{ opacity: [0, 0.5, 0] }}
                transition={{ delay: i * 0.6, duration: 3.6, repeat: Infinity, ease: 'easeInOut' }}
                style={{
                  background: 'radial-gradient(circle at 50% 0%, rgba(255,255,255,0.15), transparent 60%)',
                }}
              />
            )}
            <div className={`h-9 w-9 rounded-xl bg-white/10 grid place-items-center ${c.iconTint}`}>
              <c.icon className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[13px] font-bold text-sidebar-foreground">{c.title}</div>
              <div className="text-[11px] text-sidebar-foreground/60 mt-0.5">{c.sub}</div>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
