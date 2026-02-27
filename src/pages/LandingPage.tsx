import { LandingNav } from '@/components/landing/LandingNav';
import { LandingHero } from '@/components/landing/LandingHero';
import { LandingPersonaCards } from '@/components/landing/LandingPersonaCards';
import { LandingAmbassadorSection } from '@/components/landing/LandingAmbassadorSection';
import { LandingHowItWorks } from '@/components/landing/LandingHowItWorks';
import { LandingUseCases } from '@/components/landing/LandingUseCases';
import { LandingPricing } from '@/components/landing/LandingPricing';
import { LandingTrust } from '@/components/landing/LandingTrust';
import { LandingFAQ } from '@/components/landing/LandingFAQ';
import { LandingFinalCTA } from '@/components/landing/LandingFinalCTA';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { TestimonialCarousel } from '@/components/landing/TestimonialCarousel';
import { Marquee } from '@/components/landing/Marquee';
import { BeforeAfterSection } from '@/components/landing/BeforeAfterSection';
import { PaymentLogos } from '@/components/landing/PaymentLogos';
import { StatsBar } from '@/components/landing/AnimatedCounter';
import { LandingVideoPromo } from '@/components/landing/LandingVideoPromo';
import { LandingWhitePaper } from '@/components/landing/LandingWhitePaper';
import { SEOHead } from '@/components/seo/SEOHead';
import { motion } from 'framer-motion';
import { Badge } from '@/components/ui/badge';
import { LandingExitPopup } from '@/components/landing/LandingExitPopup';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

const testimonials = [
  { name: 'K. M.', role: 'Pasteur & Leader communautaire', text: 'En une semaine, notre communauté a pu offrir plus de 200 prédications audio. Les dons arrivent aussi par Mobile Money. C\'est révolutionnaire.', flag: '🇳🇬' },
  { name: 'Marie-Claire B.', role: 'Coach & Auteure', text: 'J\'ai centralisé tous mes documents et ressources sur une seule plateforme. Mes clients achètent et téléchargent en un clic.', flag: '🇨🇲' },
  { name: 'Ibrahim T.', role: 'Ambassadeur Siteviral', text: 'Je n\'ai aucun contenu à moi. Je partage les ressources des autres et je gagne des commissions chaque semaine. C\'est incroyable.', flag: '🇸🇳' },
  { name: 'Amara D.', role: 'Créatrice digitale', text: 'En 2 mois, j\'ai vendu plus de 500 ressources numériques. Les paiements sont automatiques et les retraits rapides.', flag: '🇨🇮' },
  { name: 'Sophie N.', role: 'Responsable communautaire', text: 'La gestion de notre communauté de 2000 membres est devenue simple. Contenu, dons, événements : tout est centralisé.', flag: '🇧🇯' },
  { name: 'David K.', role: 'Directeur ONG', text: 'Nos campagnes de collecte ont levé 3x plus qu\'avant. Les donateurs paient par Mobile Money en un clic.', flag: '🇬🇭' },
];

const marqueeRow1 = ['E-books', 'Prédications', 'Podcasts', 'Vidéos', 'Guides', 'Coaching', 'Webinaires', 'Photos', 'Musique', 'Documents'];
const marqueeRow2 = ['Ressources PDF', 'Newsletters', 'Illustrations', 'Templates', 'Tutoriels', 'Audio', 'Manuels', 'Scripts', 'Contenus exclusifs', 'Albums'];

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      <SEOHead
        title="Siteviral — Créez votre plateforme digitale, vendez et gagnez"
        description="Organisations et leaders : créez votre plateforme digitale clé en main. Vendez, collectez des dons et bénéficiez d'une armée d'ambassadeurs. Tout le monde gagne, avec ou sans contenu."
        canonicalUrl="https://siteviral.com"
        keywords="créer plateforme digitale gratuit, vendre ebook en ligne Afrique, produits numériques Mobile Money, programme ambassadeur, gagner argent en partageant, organisations et leaders, tout le monde monétise, Siteviral"
        jsonLd={{
          '@context': 'https://schema.org',
          '@type': 'Organization',
          name: 'Siteviral',
          url: 'https://siteviral.com',
          logo: 'https://siteviral.com/logo-s.png',
          description: 'Plateforme digitale tout-en-un pour organisations et leaders. Créez, vendez, et bénéficiez d\'une armée d\'ambassadeurs. Tout le monde gagne.',
          foundingDate: '2024',
          sameAs: ['https://wa.me/message/siteviral'],
          potentialAction: {
            '@type': 'SearchAction',
            target: 'https://siteviral.com/discover?q={search_term_string}',
            'query-input': 'required name=search_term_string',
          },
        }}
      />
      <LandingNav />

      {/* Hero with rotating personas + social proof */}
      <LandingHero />

      {/* Promo video (hidden until YouTube ID is set) */}
      <LandingVideoPromo />

      {/* 3 Persona Cards */}
      <LandingPersonaCards />

      {/* Stats bar with animated counters */}
      <StatsBar />

      {/* White Paper / Livre Blanc — disabled until guide is ready */}
      {/* <LandingWhitePaper /> */}

      {/* Ambassador Section (prominent) */}
      <LandingAmbassadorSection />

      {/* How it works (tabbed by persona) */}
      <LandingHowItWorks />

      {/* Use Cases */}
      <LandingUseCases />

      {/* Marquee: What you can sell */}
      <section className="py-16 px-4 bg-muted/30 overflow-hidden">
        <div className="container max-w-5xl mb-10">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center">
            <h2 className="text-3xl sm:text-4xl font-extrabold mb-3">
              Monétisez tout ce que vous pouvez <span className="text-accent">imaginer</span>
            </h2>
            <p className="text-muted-foreground max-w-xl mx-auto">Ebooks, audio, vidéos, documents, templates — <strong className="text-foreground">tout type de contenu numérique</strong>.</p>
          </motion.div>
        </div>
        <div className="space-y-4">
          <Marquee items={marqueeRow1} direction="left" speed={35} />
          <Marquee items={marqueeRow2} direction="right" speed={40} />
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20 px-4 overflow-hidden">
        <div className="container max-w-6xl">
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
            <Badge variant="secondary" className="mb-4 text-xs px-3 py-1 rounded-full">Témoignages</Badge>
            <h2 className="text-3xl sm:text-4xl font-extrabold">
              Ils ont déjà <span className="text-primary">transformé leur impact</span>
            </h2>
          </motion.div>
        </div>
        <TestimonialCarousel
          testimonials={testimonials}
          statCard={{ value: '10%', label: 'Commission unique — zéro abonnement' }}
        />
      </section>

      {/* Before vs After */}
      <BeforeAfterSection />

      {/* Payment Logos */}
      <PaymentLogos />

      {/* Pricing with comparison */}
      <LandingPricing />

      {/* Trust */}
      <LandingTrust />

      {/* FAQ inline */}
      <LandingFAQ />

      {/* Final CTA + WhatsApp */}
      <LandingFinalCTA />

      <LandingFooter />
      <LandingExitPopup />
    </div>
  );
}
