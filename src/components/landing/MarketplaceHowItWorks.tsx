import { Search, MessageSquare, ShieldCheck, Star } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

export function MarketplaceHowItWorks() {
  const { locale } = useI18n();
  const fr = locale === 'fr';

  const steps = [
    { icon: Search, fr: { t: '1. Cherchez', d: 'Décrivez ce dont vous avez besoin ou parcourez les catégories.' },
      en: { t: '1. Search', d: 'Describe what you need or browse categories.' } },
    { icon: MessageSquare, fr: { t: '2. Discutez', d: 'Comparez les pros, chattez et validez le devis.' },
      en: { t: '2. Chat', d: 'Compare pros, chat and confirm the quote.' } },
    { icon: ShieldCheck, fr: { t: '3. Payez en sécurité', d: 'Paiement bloqué, libéré à la fin du service.' },
      en: { t: '3. Pay securely', d: 'Payment held safe, released when the job is done.' } },
    { icon: Star, fr: { t: '4. Notez', d: 'Laissez un avis et retrouvez vos pros favoris.' },
      en: { t: '4. Review', d: 'Leave a review and keep your favorite pros.' } },
  ];

  return (
    <section className="bg-muted/40 border-y">
      <div className="container max-w-6xl px-4 py-14">
        <h2 className="text-2xl sm:text-3xl font-extrabold text-center">
          {fr ? 'Comment ça marche' : 'How it works'}
        </h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((s) => {
            const l = fr ? s.fr : s.en;
            return (
              <div key={l.t} className="rounded-2xl bg-card border p-5">
                <div className="h-10 w-10 rounded-xl bg-primary/10 text-primary grid place-items-center">
                  <s.icon className="h-5 w-5" />
                </div>
                <div className="mt-3 font-bold">{l.t}</div>
                <p className="text-sm text-muted-foreground mt-1">{l.d}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
