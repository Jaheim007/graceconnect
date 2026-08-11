import { Link } from 'react-router-dom';
import { Compass, HandCoins, Rocket, ArrowRight } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import type { Capability } from '@/hooks/useUserCapabilities';

/**
 * First run — the account has zero activity (no purchase, no space, no
 * affiliate link). Instead of showing three empty blocks, we show ONE primary
 * action derived from the stored welcome intent, plus a quiet secondary row.
 */
export function FirstRunHero({ primary }: { primary: Capability }) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const cards: Record<Capability, {
    icon: typeof Compass;
    title: string;
    desc: string;
    cta: string;
    to: string;
    iconBg: string;
    iconColor: string;
    glow: string;
  }> = {
    learn: {
      icon: Compass,
      title: isFr ? 'Trouve ton premier contenu' : 'Find your first content',
      desc: isFr
        ? 'Livres, formations et ressources publiés par des créateurs.'
        : 'Books, courses and resources published by creators.',
      cta: isFr ? 'Explorer maintenant' : 'Explore now',
      to: '/dashboard/explore',
      iconBg: 'bg-violet-500/15',
      iconColor: 'text-violet-500',
      glow: 'from-violet-500/15',
    },
    create: {
      icon: Rocket,
      title: isFr ? 'Crée ton espace en 1 minute' : 'Create your space in 1 minute',
      desc: isFr
        ? 'Publie et vends tes livres, formations et produits digitaux.'
        : 'Publish and sell your books, courses and digital products.',
      cta: isFr ? 'Créer mon espace' : 'Create my space',
      to: '/create-org',
      iconBg: 'bg-amber-500/15',
      iconColor: 'text-amber-500',
      glow: 'from-amber-500/15',
    },
    earn: {
      icon: HandCoins,
      title: isFr ? 'Gagne dès ton premier partage' : 'Earn from your first share',
      desc: isFr
        ? 'Active ton lien ambassadeur et touche une commission sur chaque vente.'
        : 'Activate your ambassador link and earn a commission on every sale.',
      cta: isFr ? 'Activer mon lien' : 'Activate my link',
      to: '/gagner',
      iconBg: 'bg-emerald-500/15',
      iconColor: 'text-emerald-500',
      glow: 'from-emerald-500/15',
    },
  };

  const main = cards[primary];
  const others = (['learn', 'create', 'earn'] as Capability[]).filter((c) => c !== primary);

  return (
    <section className="space-y-3">
      <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-5 sm:p-6">
        <div
          className={`pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-gradient-to-br ${main.glow} to-transparent blur-2xl`}
        />
        <div className="relative space-y-4">
          <span className={`grid h-12 w-12 place-items-center rounded-2xl ${main.iconBg}`}>
            <main.icon className={`h-6 w-6 ${main.iconColor}`} />
          </span>
          <div className="space-y-1">
            <h2 className="text-lg sm:text-xl font-bold leading-tight">{main.title}</h2>
            <p className="text-sm text-muted-foreground">{main.desc}</p>
          </div>
          <Link
            to={main.to}
            className="inline-flex h-11 items-center gap-2 rounded-2xl bg-primary px-5 text-sm font-semibold text-primary-foreground transition hover:opacity-90"
          >
            {main.cta}
            <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>

      {/* Quiet secondary row — everything else stays one tap away */}
      <div className="grid gap-2 sm:grid-cols-2">
        {others.map((key) => {
          const c = cards[key];
          return (
            <Link
              key={key}
              to={c.to}
              className="flex items-center gap-3 rounded-2xl border border-border bg-card/50 px-4 py-3 transition hover:border-primary/40"
            >
              <c.icon className={`h-4 w-4 shrink-0 ${c.iconColor}`} />
              <span className="min-w-0 flex-1 text-sm font-medium truncate">{c.cta}</span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
