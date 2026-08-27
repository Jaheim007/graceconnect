import { Link } from '@/lib/router-compat';
import { ShoppingBag, Briefcase, Church, ArrowRight } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { Reveal } from './Reveal';

/**
 * Three-path final CTA: buyer, provider, church.
 */
export function LandingFinalCTA() {
  const { locale } = useI18n();
  const fr = locale === 'fr';

  const paths = fr ? [
    { icon: ShoppingBag, title: 'Trouver des produits et services', text: 'Parcourir la marketplace.', cta: 'Explorer', to: '/discover', tone: 'default' as const },
    { icon: Briefcase, title: 'Proposer mes services', text: 'Créer un espace professionnel.', cta: 'Commencer', to: '/start', tone: 'primary' as const },
    { icon: Church, title: 'Créer un espace église', text: 'Gérer votre communauté.', cta: 'Découvrir', to: '/churches', tone: 'default' as const },
  ] : [
    { icon: ShoppingBag, title: 'Find products and services', text: 'Browse the marketplace.', cta: 'Explore', to: '/discover', tone: 'default' as const },
    { icon: Briefcase, title: 'Offer your services', text: 'Create a professional workspace.', cta: 'Get started', to: '/start', tone: 'primary' as const },
    { icon: Church, title: 'Create a church space', text: 'Manage your church community.', cta: 'Learn more', to: '/churches', tone: 'default' as const },
  ];

  return (
    <section className="container max-w-6xl px-4 sm:px-6 py-16 sm:py-24">
      <Reveal className="text-center max-w-2xl mx-auto mb-10">
        <h2 className="text-3xl sm:text-4xl font-black tracking-tight">
          {fr ? 'Que voulez-vous faire ?' : 'What would you like to do?'}
        </h2>
      </Reveal>

      <div className="grid md:grid-cols-3 gap-4 sm:gap-5">
        {paths.map((p, i) => (
          <Reveal key={p.to} delay={i * 0.08}>
            <Link
              to={p.to}
              className={`group relative block rounded-3xl border p-6 sm:p-7 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ${
                p.tone === 'primary'
                  ? 'border-transparent bg-foreground text-background'
                  : 'border-border bg-card hover:border-foreground/25'
              }`}
            >
              <div className={`h-12 w-12 rounded-2xl grid place-items-center mb-5 transition-transform duration-300 group-hover:scale-110 ${
                p.tone === 'primary' ? 'bg-background/10 text-background' : 'bg-muted text-foreground'
              }`}>
                <p.icon className="h-6 w-6" />
              </div>
              <div className="text-lg font-black leading-tight">{p.title}</div>
              <p className={`text-sm mt-1.5 ${p.tone === 'primary' ? 'text-background/70' : 'text-muted-foreground'}`}>
                {p.text}
              </p>
              <div className={`mt-6 inline-flex items-center gap-1.5 text-sm font-bold ${
                p.tone === 'primary' ? 'text-background' : 'text-foreground'
              }`}>
                {p.cta}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </div>
            </Link>
          </Reveal>
        ))}
      </div>
    </section>
  );
}
