import { BookOpen, Globe, Wallet } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { Reveal } from './Reveal';

/**
 * "The product, right under the fold": a light in-browser mock showing the real
 * path — write with AI, publish a public page, get paid by Mobile Money.
 */
export function ProductShot() {
  const { locale } = useI18n();
  const fr = locale === 'fr';

  const panels = [
    {
      icon: BookOpen,
      step: '1',
      title: fr ? 'Tu écris avec l’IA' : 'You write with AI',
      lines: fr
        ? ['Sujet : Discipline financière', '12 chapitres générés', 'Couverture créée']
        : ['Topic: Financial discipline', '12 chapters generated', 'Cover created'],
    },
    {
      icon: Globe,
      step: '2',
      title: fr ? 'Ta page publique est prête' : 'Your public page is live',
      lines: fr
        ? ['siteviral.com/ton-nom', 'Prix : 3 000 FCFA', 'Paiement en 2 clics']
        : ['siteviral.com/your-name', 'Price: 3,000 FCFA', 'Checkout in 2 taps'],
    },
    {
      icon: Wallet,
      step: '3',
      title: fr ? 'Tu reçois ton argent' : 'You get your money',
      lines: fr
        ? ['Wave · Orange · MTN', 'Vente : 3 000 FCFA', 'Tu gardes 2 700 FCFA']
        : ['Wave · Orange · MTN', 'Sale: 3,000 FCFA', 'You keep 2,700 FCFA'],
    },
  ];

  return (
    <section className="container max-w-6xl px-4 sm:px-6 py-14 sm:py-20">
      <Reveal className="overflow-hidden rounded-3xl border border-border bg-card shadow-sm">
        {/* browser chrome */}
        <div className="flex items-center gap-2 border-b border-border bg-muted/50 px-4 py-3">
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <span className="h-2.5 w-2.5 rounded-full bg-muted-foreground/30" />
          <div className="ml-3 flex-1 truncate rounded-md bg-background px-3 py-1 text-[11px] font-medium text-muted-foreground">
            siteviral.com
          </div>
        </div>

        <div className="grid gap-4 p-4 sm:p-6 md:grid-cols-3">
          {panels.map((p) => (
            <div key={p.step} className="rounded-2xl border border-border bg-background p-5">
              <div className="flex items-center justify-between">
                <span className="grid h-9 w-9 place-items-center rounded-xl bg-primary/10 text-primary">
                  <p.icon className="h-4.5 w-4.5" />
                </span>
                <span className="text-[11px] font-bold uppercase tracking-wider text-muted-foreground">
                  {fr ? 'Étape' : 'Step'} {p.step}
                </span>
              </div>
              <h2 className="mt-4 text-base font-bold tracking-tight">{p.title}</h2>
              <ul className="mt-3 space-y-2">
                {p.lines.map((l) => (
                  <li
                    key={l}
                    className="rounded-lg bg-muted/60 px-3 py-2 text-xs font-medium text-muted-foreground"
                  >
                    {l}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </Reveal>
    </section>
  );
}
