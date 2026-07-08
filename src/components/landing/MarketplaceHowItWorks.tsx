import { Search, MessageSquare, ShieldCheck, Star } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

export function MarketplaceHowItWorks() {
  const { locale } = useI18n();
  const fr = locale === 'fr';

  const steps = [
    { icon: Search,        fr: { t: 'Cherchez',        d: 'Décrivez votre besoin ou parcourez les catégories.' },
                           en: { t: 'Search',          d: 'Describe your need or browse categories.' } },
    { icon: MessageSquare, fr: { t: 'Discutez',        d: 'Comparez, chattez et validez le devis en direct.' },
                           en: { t: 'Chat',            d: 'Compare, chat and confirm the quote live.' } },
    { icon: ShieldCheck,   fr: { t: 'Payez sécurisé',  d: 'Paiement bloqué, libéré à la fin du service.' },
                           en: { t: 'Pay securely',    d: 'Payment held safe, released when the job is done.' } },
    { icon: Star,          fr: { t: 'Notez',           d: 'Laissez un avis et retrouvez vos pros favoris.' },
                           en: { t: 'Review',          d: 'Leave a review and keep your favorites.' } },
  ];

  return (
    <section className="bg-muted/40 border-y">
      <div className="container max-w-6xl px-4 py-16 sm:py-20">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="text-xs font-bold uppercase tracking-[0.2em] text-primary mb-2">
            {fr ? 'Simple. Sécurisé. Rapide.' : 'Simple. Secure. Fast.'}
          </div>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
            {fr ? 'Comment ça marche' : 'How it works'}
          </h2>
        </div>

        <div className="relative">
          {/* Connector line desktop */}
          <div className="hidden lg:block absolute top-8 left-[12%] right-[12%] h-px bg-gradient-to-r from-transparent via-border to-transparent" />

          <div className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {steps.map((s, i) => {
              const l = fr ? s.fr : s.en;
              return (
                <div key={l.t} className="relative rounded-2xl bg-card border p-6 hover:shadow-lg hover:-translate-y-0.5 transition">
                  <div className="flex items-start justify-between mb-4">
                    <div className="h-14 w-14 rounded-2xl bg-primary/10 text-primary grid place-items-center ring-1 ring-primary/20">
                      <s.icon className="h-6 w-6" />
                    </div>
                    <span className="text-4xl font-black text-muted-foreground/20 leading-none">
                      {String(i + 1).padStart(2, '0')}
                    </span>
                  </div>
                  <div className="font-bold text-lg">{l.t}</div>
                  <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">{l.d}</p>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
}
