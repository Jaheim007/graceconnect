import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';
import { useI18n } from '@/i18n/I18nContext';

export default function PourConsultantsPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <PersonaLandingPage
      seo={{
        title: isFr ? 'Siteviral pour les Consultants — Vendez votre expertise en ligne' : 'Siteviral for Consultants — Sell Your Expertise Online',
        description: isFr ? 'Plateforme pour consultants et experts. Vendez vos frameworks, audits, templates et formations par Mobile Money.' : 'Platform for consultants and experts. Sell your frameworks, audits, templates, and training via Mobile Money.',
        url: 'https://siteviral.com/pour/consultants',
      }}
      badge={isFr ? '💼 Pour les Consultants' : '💼 For Consultants'}
      headline={isFr
        ? <>Vendez votre <span className="text-primary">expertise</span> à grande échelle</>
        : <>Sell your <span className="text-primary">expertise</span> at scale</>}
      subheadline={isFr
        ? 'Vous facturez votre temps mais il est limité. Transformez vos méthodologies, frameworks et connaissances en produits digitaux qui se vendent 24h/24 sans vous.'
        : 'You bill for your time but it\'s limited. Turn your methodologies, frameworks, and knowledge into digital products that sell 24/7 without you.'}
      painPoints={isFr ? [
        { icon: '⏰', title: 'Temps = argent (limité)', desc: 'Vous échangez du temps contre de l\'argent. Vos revenus plafonnent avec vos heures disponibles.' },
        { icon: '📋', title: 'Expertise non packageable', desc: 'Vos frameworks et méthodes restent dans votre tête ou vos fichiers clients confidentiels.' },
        { icon: '🌍', title: 'Portée locale', desc: 'Vous ne touchez que les entreprises de votre réseau direct. Des centaines d\'autres auraient besoin de vous.' },
        { icon: '💸', title: 'Revenus irréguliers', desc: 'Entre deux missions, c\'est le creux. Pas de revenus passifs pour lisser votre trésorerie.' },
        { icon: '🏗️', title: 'Site web complexe', desc: 'Créer un site e-commerce pour vendre vos produits digitaux est coûteux et technique.' },
        { icon: '📱', title: 'Clients mobiles', desc: 'Vos prospects africains sont sur mobile et payent par Mobile Money, pas par carte Stripe.' },
      ] : [
        { icon: '⏰', title: 'Time = money (limited)', desc: 'You trade time for money. Your revenue caps with your available hours.' },
        { icon: '📋', title: 'Unpackaged expertise', desc: 'Your frameworks and methods stay in your head or confidential client files.' },
        { icon: '🌍', title: 'Local reach only', desc: 'You only reach companies in your direct network. Hundreds more need your help.' },
        { icon: '💸', title: 'Irregular income', desc: 'Between engagements, revenue drops. No passive income to smooth cash flow.' },
        { icon: '🏗️', title: 'Complex website', desc: 'Building an e-commerce site to sell digital products is costly and technical.' },
        { icon: '📱', title: 'Mobile-first clients', desc: 'Your African prospects are on mobile and pay via Mobile Money, not Stripe.' },
      ]}
      solutions={isFr ? [
        { title: 'Templates & frameworks', desc: 'Vendez vos grilles d\'audit, canevas stratégiques, modèles Excel et PDF méthodologiques.' },
        { title: 'Formations asynchrones', desc: 'Créez des modules vidéo/audio que vos clients suivent à leur rythme. Revenus passifs.' },
        { title: 'Bundles conseil', desc: 'Packagez diagnostic + template + formation dans des offres à forte valeur perçue.' },
        { title: 'Page professionnelle', desc: 'Vitrine qui inspire confiance : votre parcours, méthode, témoignages et produits.' },
        { title: 'Mobile Money & carte', desc: 'Vos clients payent par Orange Money, Wave ou carte bancaire. Tout est automatisé.' },
        { title: 'Récurrence & abonnements', desc: 'Proposez un accès mensuel à votre bibliothèque de ressources. Revenus prévisibles.' },
      ] : [
        { title: 'Templates & frameworks', desc: 'Sell your audit grids, strategic canvases, Excel models, and methodology PDFs.' },
        { title: 'Async training', desc: 'Create video/audio modules clients follow at their pace. Passive income.' },
        { title: 'Consulting bundles', desc: 'Package diagnostic + template + training into high-value offers.' },
        { title: 'Professional page', desc: 'A storefront that inspires trust: your background, method, testimonials, and products.' },
        { title: 'Mobile Money & card', desc: 'Your clients pay via Orange Money, Wave, or credit card. Fully automated.' },
        { title: 'Subscriptions', desc: 'Offer monthly access to your resource library. Predictable revenue.' },
      ]}
      steps={isFr ? [
        { step: '1', title: 'Créez votre vitrine', desc: 'Inscription gratuite. Présentez votre expertise et votre parcours.' },
        { step: '2', title: 'Packagez vos produits', desc: 'Templates, formations, guides. Transformez votre savoir en produits vendables.' },
        { step: '3', title: 'Vendez automatiquement', desc: 'Partagez votre lien sur LinkedIn, WhatsApp et email. Les ventes tournent 24h/24.' },
      ] : [
        { step: '1', title: 'Create your storefront', desc: 'Free sign-up. Showcase your expertise and background.' },
        { step: '2', title: 'Package your products', desc: 'Templates, training, guides. Turn your knowledge into sellable products.' },
        { step: '3', title: 'Sell automatically', desc: 'Share your link on LinkedIn, WhatsApp, and email. Sales run 24/7.' },
      ]}
      testimonial={{
        name: 'Dr. K. B.',
        role: isFr ? 'Consultant en stratégie' : 'Strategy consultant',
        text: isFr
          ? 'Mon pack "Diagnostic PME" se vend pendant que je suis en mission. 300 000 FCFA de revenus passifs par mois en plus de mes honoraires.'
          : 'My "SME Diagnostic" pack sells while I\'m on assignment. 300,000 FCFA in passive income per month on top of my fees.',
        flag: '🇸🇳',
      }}
      stats={isFr ? [
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: '24/7', label: 'ventes automatiques' },
        { value: '10%', label: 'commission Siteviral' },
      ] : [
        { value: '$0', label: 'subscription fee' },
        { value: '24/7', label: 'automatic sales' },
        { value: '10%', label: 'Siteviral commission' },
      ]}
      faq={isFr ? [
        { q: 'Quels types de produits puis-je vendre ?', a: 'Tout ce qui est numérique : PDF, Excel, PowerPoint, vidéos, audio. Templates, frameworks, formations, audits.' },
        { q: 'Mes clients entreprises peuvent-ils payer par virement ?', a: 'Oui, carte bancaire et Mobile Money sont acceptés. Factures automatiques disponibles.' },
        { q: 'Peut-on créer des offres à différents prix ?', a: 'Oui, créez des produits individuels et des bundles à prix dégressif. Vous fixez tous les prix.' },
        { q: 'Comment protéger ma propriété intellectuelle ?', a: 'Watermark automatique sur les PDF et accès sécurisé. Seuls les acheteurs peuvent télécharger.' },
        { q: 'Puis-je proposer des abonnements ?', a: 'Oui, créez des plans mensuels/annuels pour un accès récurrent à vos ressources.' },
        { q: 'Comment recevoir mes revenus ?', a: 'Mobile Money ou virement bancaire. Versements après 72h de sécurité.' },
      ] : [
        { q: 'What types of products can I sell?', a: 'Anything digital: PDF, Excel, PowerPoint, videos, audio. Templates, frameworks, training, audits.' },
        { q: 'Can my enterprise clients pay by transfer?', a: 'Yes, credit card and Mobile Money are accepted. Automatic invoices available.' },
        { q: 'Can I create offers at different prices?', a: 'Yes, create individual products and discounted bundles. You set all prices.' },
        { q: 'How is my intellectual property protected?', a: 'Automatic watermark on PDFs and secured access. Only buyers can download.' },
        { q: 'Can I offer subscriptions?', a: 'Yes, create monthly/annual plans for recurring access to your resources.' },
        { q: 'How do I receive my earnings?', a: 'Mobile Money or bank transfer. Payouts after 72-hour security hold.' },
      ]}
      cta={{ label: isFr ? 'Vendre mon expertise' : 'Sell my expertise', path: '/auth?mode=signup' }}
      secondaryCta={{ label: isFr ? 'Voir comment ça marche' : 'See how it works', path: '/features' }}
    />
  );
}
