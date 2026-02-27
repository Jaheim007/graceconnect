import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';

export default function PourConsultantsPage() {
  return (
    <PersonaLandingPage
      seo={{
        title: 'Siteviral pour les Consultants — Vendez votre expertise en ligne',
        description: 'Plateforme pour consultants et experts. Vendez vos frameworks, audits, templates et formations par Mobile Money.',
        url: 'https://siteviral.com/pour/consultants',
      }}
      badge="💼 Pour les Consultants"
      headline={<>Vendez votre <span className="text-primary">expertise</span> à grande échelle</>}
      subheadline="Vous facturez votre temps mais il est limité. Transformez vos méthodologies, frameworks et connaissances en produits digitaux qui se vendent 24h/24 sans vous."
      painPoints={[
        { icon: '⏰', title: 'Temps = argent (limité)', desc: 'Vous échangez du temps contre de l\'argent. Vos revenus plafonnent avec vos heures disponibles.' },
        { icon: '📋', title: 'Expertise non packageable', desc: 'Vos frameworks et méthodes restent dans votre tête ou vos fichiers clients confidentiels.' },
        { icon: '🌍', title: 'Portée locale', desc: 'Vous ne touchez que les entreprises de votre réseau direct. Des centaines d\'autres auraient besoin de vous.' },
        { icon: '💸', title: 'Revenus irréguliers', desc: 'Entre deux missions, c\'est le creux. Pas de revenus passifs pour lisser votre trésorerie.' },
        { icon: '🏗️', title: 'Site web complexe', desc: 'Créer un site e-commerce pour vendre vos produits digitaux est coûteux et technique.' },
        { icon: '📱', title: 'Clients mobiles', desc: 'Vos prospects africains sont sur mobile et payent par Mobile Money, pas par carte Stripe.' },
      ]}
      solutions={[
        { title: 'Templates & frameworks', desc: 'Vendez vos grilles d\'audit, canevas stratégiques, modèles Excel et PDF méthodologiques.' },
        { title: 'Formations asynchrones', desc: 'Créez des modules vidéo/audio que vos clients suivent à leur rythme. Revenus passifs.' },
        { title: 'Bundles conseil', desc: 'Packagez diagnostic + template + formation dans des offres à forte valeur perçue.' },
        { title: 'Page professionnelle', desc: 'Vitrine qui inspire confiance : votre parcours, méthode, témoignages et produits.' },
        { title: 'Mobile Money & carte', desc: 'Vos clients payent par Orange Money, Wave ou carte bancaire. Tout est automatisé.' },
        { title: 'Récurrence & abonnements', desc: 'Proposez un accès mensuel à votre bibliothèque de ressources. Revenus prévisibles.' },
      ]}
      steps={[
        { step: '1', title: 'Créez votre vitrine', desc: 'Inscription gratuite. Présentez votre expertise et votre parcours.' },
        { step: '2', title: 'Packagez vos produits', desc: 'Templates, formations, guides. Transformez votre savoir en produits vendables.' },
        { step: '3', title: 'Vendez automatiquement', desc: 'Partagez votre lien sur LinkedIn, WhatsApp et email. Les ventes tournent 24h/24.' },
      ]}
      testimonial={{
        name: 'Dr. K. B.',
        role: 'Consultant en stratégie',
        text: 'Mon pack "Diagnostic PME" se vend pendant que je suis en mission. 300 000 FCFA de revenus passifs par mois en plus de mes honoraires.',
        flag: '🇸🇳',
      }}
      stats={[
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: '24/7', label: 'ventes automatiques' },
        { value: '10%', label: 'commission Siteviral' },
      ]}
      faq={[
        { q: 'Quels types de produits puis-je vendre ?', a: 'Tout ce qui est numérique : PDF, Excel, PowerPoint, vidéos, audio. Templates, frameworks, formations, audits.' },
        { q: 'Mes clients entreprises peuvent-ils payer par virement ?', a: 'Oui, carte bancaire et Mobile Money sont acceptés. Factures automatiques disponibles.' },
        { q: 'Peut-on créer des offres à différents prix ?', a: 'Oui, créez des produits individuels et des bundles à prix dégressif. Vous fixez tous les prix.' },
        { q: 'Comment protéger ma propriété intellectuelle ?', a: 'Watermark automatique sur les PDF et accès sécurisé. Seuls les acheteurs peuvent télécharger.' },
        { q: 'Puis-je proposer des abonnements ?', a: 'Oui, créez des plans mensuels/annuels pour un accès récurrent à vos ressources.' },
        { q: 'Comment recevoir mes revenus ?', a: 'Mobile Money ou virement bancaire. Versements après 72h de sécurité.' },
      ]}
      cta={{ label: 'Vendre mon expertise', path: '/auth?mode=signup' }}
      secondaryCta={{ label: 'Voir comment ça marche', path: '/features' }}
    />
  );
}
