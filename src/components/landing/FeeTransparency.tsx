import { useI18n } from '@/i18n/I18nContext';
import { Reveal } from './Reveal';

/**
 * Plain-language fee band. No hidden costs, no invented numbers:
 * 10% all-inclusive on sales, 0% SiteViral margin on offerings/donations.
 */
export function FeeTransparency() {
  const { locale } = useI18n();
  const fr = locale === 'fr';

  const rows = fr
    ? [
        { k: 'Le client paie', v: '3 000 FCFA' },
        { k: 'Frais SiteViral (10 % tout compris)', v: '- 300 FCFA' },
        { k: 'Tu reçois', v: '2 700 FCFA', strong: true },
      ]
    : [
        { k: 'The customer pays', v: '3,000 FCFA' },
        { k: 'SiteViral fee (10% all-inclusive)', v: '- 300 FCFA' },
        { k: 'You receive', v: '2,700 FCFA', strong: true },
      ];

  return (
    <section className="border-y border-border bg-muted/30">
      <div className="container max-w-5xl px-4 sm:px-6 py-14 sm:py-20">
        <Reveal className="grid gap-8 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary">
              {fr ? 'Les prix, sans surprise' : 'Pricing, no surprises'}
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-black tracking-tight text-balance">
              {fr
                ? 'Gratuit pour commencer. 10 % tout compris quand tu vends.'
                : 'Free to start. 10% all-inclusive when you sell.'}
            </h2>
            <p className="mt-3 max-w-lg text-sm sm:text-base leading-relaxed text-muted-foreground">
              {fr
                ? "Pas d'abonnement obligatoire, pas de frais cachés. Les frais Mobile Money sont déjà inclus dans les 10 %. Sur les offrandes et les dons, SiteViral ne prend aucune marge — seulement le coût exact du processeur."
                : 'No mandatory subscription, no hidden fees. Mobile Money costs are already inside the 10%. On offerings and donations SiteViral takes no margin — only the exact processor cost.'}
            </p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-5 sm:p-6">
            <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              {fr ? 'Exemple sur une vente' : 'Example on one sale'}
            </p>
            <dl className="mt-4 space-y-2">
              {rows.map((r) => (
                <div
                  key={r.k}
                  className={
                    r.strong
                      ? 'flex items-center justify-between gap-4 rounded-xl bg-primary/10 px-4 py-3'
                      : 'flex items-center justify-between gap-4 rounded-xl bg-muted/60 px-4 py-3'
                  }
                >
                  <dt className={r.strong ? 'text-sm font-bold' : 'text-sm text-muted-foreground'}>{r.k}</dt>
                  <dd className={r.strong ? 'text-sm font-black text-primary' : 'text-sm font-semibold'}>{r.v}</dd>
                </div>
              ))}
            </dl>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
