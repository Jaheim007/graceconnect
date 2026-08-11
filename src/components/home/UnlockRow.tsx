import { Link } from 'react-router-dom';
import { Compass, HandCoins, Rocket, ArrowRight } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import type { Capability } from '@/hooks/useUserCapabilities';

/**
 * "Débloquer" — one tap to add a capability the user has not activated yet.
 * Never shows an empty block for a capability: it shows the door instead.
 */
export function UnlockRow({ capabilities }: { capabilities: Capability[] }) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  if (!capabilities.length) return null;

  const cards: Record<Capability, {
    icon: typeof Compass;
    title: string;
    desc: string;
    to: string;
    iconBg: string;
    iconColor: string;
    border: string;
  }> = {
    learn: {
      icon: Compass,
      title: isFr ? 'Découvrir du contenu' : 'Discover content',
      desc: isFr ? 'Livres, formations et ressources' : 'Books, courses and resources',
      to: '/dashboard/explore',
      iconBg: 'bg-violet-500/15',
      iconColor: 'text-violet-500',
      border: 'hover:border-violet-500/50',
    },
    earn: {
      icon: HandCoins,
      title: isFr ? 'Gagner en partageant' : 'Earn by sharing',
      desc: isFr ? 'Commission sur chaque vente' : 'Commission on every sale',
      to: '/gagner',
      iconBg: 'bg-emerald-500/15',
      iconColor: 'text-emerald-500',
      border: 'hover:border-emerald-500/50',
    },
    create: {
      icon: Rocket,
      title: isFr ? 'Créer mon espace' : 'Create my space',
      desc: isFr ? 'Vends tes livres et formations' : 'Sell your books and courses',
      to: '/create-org',
      iconBg: 'bg-amber-500/15',
      iconColor: 'text-amber-500',
      border: 'hover:border-amber-500/50',
    },
  };

  return (
    <section className="space-y-3">
      <h2 className="text-sm font-bold uppercase tracking-wider text-muted-foreground">
        {isFr ? 'Débloquer' : 'Unlock'}
      </h2>
      <div className="grid gap-2 sm:grid-cols-2">
        {capabilities.map((key) => {
          const c = cards[key];
          return (
            <Link
              key={key}
              to={c.to}
              className={`flex items-center gap-3 rounded-2xl border border-border bg-card p-4 transition ${c.border}`}
            >
              <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-xl ${c.iconBg}`}>
                <c.icon className={`h-5 w-5 ${c.iconColor}`} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold">{c.title}</span>
                <span className="block text-xs text-muted-foreground">{c.desc}</span>
              </span>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
