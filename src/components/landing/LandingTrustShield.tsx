import { ShieldCheck, Lock, MessageSquareLock, FileKey } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { Reveal } from './Reveal';

/**
 * Broad marketplace trust/security section.
 * Real capabilities only — spans products, services, bookings and church payments.
 */
export function LandingTrustShield() {
  const { locale } = useI18n();
  const fr = locale === 'fr';

  const cards = fr ? [
    {
      icon: Lock,
      title: 'Paiements sécurisés',
      text: 'Mobile Money et cartes internationales via des prestataires établis.',
    },
    {
      icon: MessageSquareLock,
      title: 'Communication protégée',
      text: 'Échanges intégrés entre clients et professionnels sur la plateforme.',
    },
    {
      icon: FileKey,
      title: 'Protection des contenus digitaux',
      text: "Prévisualisations sécurisées, marquage individualisé et traçabilité sur les ressources compatibles.",
    },
    {
      icon: ShieldCheck,
      title: 'Compte et pros',
      text: "Vérifications de paiement, gestion des rôles et outils de signalement.",
    },
  ] : [
    {
      icon: Lock,
      title: 'Secure payments',
      text: 'Mobile Money and international cards via established providers.',
    },
    {
      icon: MessageSquareLock,
      title: 'Protected communication',
      text: 'Buyers and providers exchange messages through the platform.',
    },
    {
      icon: FileKey,
      title: 'Digital-content protection',
      text: 'Secure previews, individualised watermarking and traceability for supported digital resources.',
    },
    {
      icon: ShieldCheck,
      title: 'Account and provider safeguards',
      text: 'Payout verification, role management and reporting tools.',
    },
  ];

  return (
    <section className="container max-w-6xl px-4 sm:px-6 py-14 sm:py-16">
      <div className="rounded-3xl border border-border bg-card p-6 sm:p-10">
        <Reveal className="max-w-2xl mb-8">
          <div className="inline-flex items-center justify-center h-11 w-11 rounded-2xl bg-primary/10 mb-4">
            <ShieldCheck className="h-5 w-5 text-primary" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-black tracking-tight">
            {fr ? 'Conçu pour des transactions sûres et de confiance' : 'Built for secure, trusted transactions'}
          </h2>
          <p className="mt-3 text-sm sm:text-base text-muted-foreground leading-relaxed">
            {fr
              ? "Des achats digitaux aux réservations de services et aux paiements d'église, SiteViral aide les gens à se connecter, payer, communiquer et suivre leur activité en toute confiance."
              : 'From digital purchases to service bookings and church payments, SiteViral helps people connect, pay, communicate and manage activity with confidence.'}
          </p>
        </Reveal>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
          {cards.map((c, i) => (
            <Reveal
              key={c.title}
              delay={i * 0.08}
              className="group rounded-2xl border border-border/70 bg-background p-4 sm:p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg hover:border-primary/30"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0 mb-3 transition-transform duration-300 group-hover:scale-110">
                <c.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="font-bold text-sm">{c.title}</p>
              <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">{c.text}</p>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
