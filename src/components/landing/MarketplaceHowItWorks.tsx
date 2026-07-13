import { Search, MousePointerClick, Lock, Package } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { Reveal } from './Reveal';

/**
 * Four honest steps covering the full customer journey:
 * digital purchases, bookings, quotes, and messages.
 */
export function MarketplaceHowItWorks() {
  const { locale } = useI18n();
  const fr = locale === 'fr';

  const steps = fr ? [
    { icon: Search, title: 'Découvrez', text: 'Cherchez des produits, services ou professionnels.' },
    { icon: MousePointerClick, title: 'Choisissez ou contactez', text: 'Achetez, réservez un créneau, demandez un devis ou écrivez au pro.' },
    { icon: Lock, title: 'Payez en sécurité', text: 'Moyens de paiement locaux et internationaux pris en charge.' },
    { icon: Package, title: 'Accédez et suivez', text: 'Téléchargez, présentez-vous à votre rendez-vous ou suivez la prestation depuis Activité.' },
  ] : [
    { icon: Search, title: 'Discover', text: 'Search products, services or professionals.' },
    { icon: MousePointerClick, title: 'Choose or connect', text: 'Buy instantly, book a time, request a quote or message the provider.' },
    { icon: Lock, title: 'Pay securely', text: 'Supported local and international payment methods.' },
    { icon: Package, title: 'Access and manage', text: 'Download your purchase, attend your booking, follow your service, or access it from Activity.' },
  ];

  return (
    <section id="how" className="bg-muted/30 border-y border-border/60">
      <div className="container max-w-6xl px-4 sm:px-6 py-16 sm:py-20">
        <div className="max-w-2xl mb-10">
          <p className="text-xs font-bold uppercase tracking-[0.15em] text-primary mb-2">
            {fr ? 'Comment ça marche' : 'How it works'}
          </p>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            {fr ? 'De la recherche à la livraison, en quatre étapes.' : 'From search to delivery, in four steps.'}
          </h2>
        </div>

        <ol className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-5">
          {steps.map((s, i) => (
            <li key={i} className="relative rounded-2xl bg-background border border-border p-5">
              <div className="flex items-center gap-3 mb-4">
                <span className="h-8 w-8 rounded-lg bg-foreground text-background text-sm font-black grid place-items-center">
                  {i + 1}
                </span>
                <s.icon className="h-4 w-4 text-muted-foreground" />
              </div>
              <div className="font-bold text-[15px]">{s.title}</div>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{s.text}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
