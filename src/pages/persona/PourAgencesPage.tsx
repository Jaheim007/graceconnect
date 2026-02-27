import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';

export default function PourAgencesPage() {
  return (
    <PersonaLandingPage
      seo={{
        title: 'Siteviral pour les Agences — Lancez des boutiques digitales pour vos clients',
        description: 'Agences web et marketing : créez des boutiques digitales pour vos clients en quelques minutes. Revenus récurrents par organisation gérée.',
        url: 'https://siteviral.com/pour/agences',
      }}
      badge="🏢 Pour les Agences"
      headline={<>Lancez des <span className="text-primary">boutiques digitales</span> pour chacun de vos clients</>}
      subheadline="Vous êtes une agence web, marketing ou communication. Offrez à vos clients une plateforme de vente digitale clé en main et générez des revenus récurrents sur chaque organisation créée."
      painPoints={[
        { icon: '🔧', title: 'Développement coûteux', desc: 'Créer un site e-commerce sur mesure pour chaque client prend des semaines et coûte cher.' },
        { icon: '💸', title: 'Revenus one-shot', desc: 'Vous facturez un projet puis le client part. Pas de revenus récurrents.' },
        { icon: '📱', title: 'Mobile Money non intégré', desc: 'Vos clients africains ont besoin de Mobile Money mais les solutions sont complexes à intégrer.' },
        { icon: '🔄', title: 'Maintenance continue', desc: 'Chaque site client nécessite des mises à jour, de l\'hébergement et du support technique.' },
        { icon: '📊', title: 'Pas de vue d\'ensemble', desc: 'Gérer 10 clients sur 10 plateformes différentes est un cauchemar opérationnel.' },
        { icon: '⏰', title: 'Time-to-market lent', desc: 'Vos clients veulent être en ligne demain. Vous avez besoin de semaines.' },
      ]}
      solutions={[
        { title: 'Déploiement en 10 minutes', desc: 'Créez une boutique complète pour votre client en quelques clics. Logo, produits, paiement — tout y est.' },
        { title: 'Multi-organisations', desc: 'Gérez tous vos clients depuis un seul compte. Vue d\'ensemble sur toutes les boutiques.' },
        { title: 'Mobile Money intégré', desc: 'Paystack, Stripe — tous les paiements sont gérés. Rien à configurer côté technique.' },
        { title: 'White-label friendly', desc: 'Page personnalisable avec le branding de chaque client. Votre agence reste en coulisse.' },
        { title: 'Revenus partenaire', desc: 'Devenez partenaire et touchez une commission récurrente sur chaque client que vous apportez.' },
        { title: 'Zéro maintenance', desc: 'Siteviral gère l\'hébergement, les mises à jour et la sécurité. Vous vous concentrez sur la valeur.' },
      ]}
      steps={[
        { step: '1', title: 'Devenez partenaire', desc: 'Inscription gratuite. Accédez au programme partenaire et à vos outils de gestion.' },
        { step: '2', title: 'Créez pour vos clients', desc: 'Lancez une boutique par client en 10 minutes. Uploadez leurs produits et configurez les paiements.' },
        { step: '3', title: 'Générez des revenus', desc: 'Commission récurrente sur chaque transaction. Plus vous gérez de clients, plus vous gagnez.' },
      ]}
      testimonial={{
        name: 'Agence Digitale KD',
        role: 'Agence web, Abidjan',
        text: 'On a migré 15 clients sur Siteviral en un mois. Plus de soucis d\'hébergement ni de paiement. Et les commissions partenaires couvrent nos frais fixes.',
        flag: '🇨🇮',
      }}
      stats={[
        { value: '10 min', label: 'par boutique client' },
        { value: '0 FCFA', label: 'de maintenance' },
        { value: 'Récurrent', label: 'modèle de revenus' },
      ]}
      faq={[
        { q: 'Comment fonctionne le programme partenaire ?', a: 'Vous créez des organisations pour vos clients et touchez une commission sur chaque transaction. Plus de détails sur la page partenaire.' },
        { q: 'Mes clients gardent-ils le contrôle ?', a: 'Oui, chaque client a son propre accès admin. Vous pouvez gérer en co-administration.' },
        { q: 'Combien de clients puis-je gérer ?', a: 'Aucune limite. Créez autant d\'organisations que nécessaire.' },
        { q: 'Faut-il des compétences techniques ?', a: 'Non, tout est no-code. Si vous savez utiliser Facebook, vous savez utiliser Siteviral.' },
        { q: 'Quels services puis-je ajouter ?', a: 'Produits digitaux, dons, événements, médias, abonnements — tout ce que Siteviral offre est disponible.' },
        { q: 'Comment recevoir mes commissions ?', a: 'Par Mobile Money ou virement bancaire. Tableau de bord partenaire avec suivi en temps réel.' },
      ]}
      cta={{ label: 'Devenir partenaire agence', path: '/become-partner' }}
      secondaryCta={{ label: 'Voir le programme partenaire', path: '/partner-terms' }}
    />
  );
}
