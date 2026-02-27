import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';

export default function PourMinisteresPage() {
  return (
    <PersonaLandingPage
      seo={{
        title: 'Siteviral pour les Ministères & Évangélistes — Centralisez votre impact',
        description: 'Plateforme tout-en-un pour les mega-churches, ministères internationaux et évangélistes itinérants. Multi-pays, multi-devises, analytics avancés.',
        url: 'https://siteviral.com/pour/ministeres',
      }}
      badge="🌍 Pour les Ministères & Évangélistes"
      headline={<>Centralisez votre ministère <span className="text-primary">international</span> sur une seule plateforme</>}
      subheadline="Vous avez une audience multi-pays, des contenus vidéo à monétiser et des développeurs qui coûtent cher. Siteviral remplace tout ça avec une solution professionnelle, multi-devises, sans code."
      painPoints={[
        { icon: '💰', title: 'Développeurs trop chers', desc: 'Vous payez des développeurs pour des solutions custom qui ne marchent pas bien et coûtent une fortune.' },
        { icon: '🌐', title: 'Audience dispersée', desc: 'Vos fidèles sont dans 10 pays différents mais vous n\'avez pas de plateforme centralisée.' },
        { icon: '📹', title: 'Des millions de vues, zéro revenu', desc: 'YouTube ne paye pas dans votre pays. Vos contenus viraux ne génèrent aucun revenu structuré.' },
        { icon: '🔀', title: 'Outils fragmentés', desc: 'PayPal pour certains, espèces pour d\'autres, WhatsApp pour communiquer. Rien n\'est intégré.' },
        { icon: '📊', title: 'Aucun analytics', desc: 'Pas de visibilité sur qui donne, qui achète, quels contenus performent.' },
        { icon: '⚙️', title: 'Maintenance technique', desc: 'Votre site custom tombe en panne, les mises à jour sont un cauchemar.' },
      ]}
      solutions={[
        { title: 'Plateforme professionnelle clé en main', desc: 'Page de ministère personnalisable avec votre branding. Aucun développeur nécessaire.' },
        { title: 'Multi-devises automatique', desc: 'Recevez en FCFA, USD, EUR, GBP. Chaque fidèle paye dans sa devise locale.' },
        { title: 'Monétisation YouTube', desc: 'Vos prédications YouTube deviennent des produits premium vendus directement à vos fans.' },
        { title: 'Analytics en temps réel', desc: 'Dashboard complet : ventes, dons, membres actifs, contenus les plus populaires.' },
        { title: 'Réseau d\'ambassadeurs', desc: 'Transformez vos fidèles les plus engagés en force de vente avec commissions automatiques.' },
        { title: 'Zéro maintenance', desc: 'Tout est géré par Siteviral. Mises à jour, sécurité, hébergement — vous vous concentrez sur votre mission.' },
      ]}
      steps={[
        { step: '1', title: 'Créez votre ministère', desc: 'Inscription gratuite, personnalisez votre page avec logo et bannière en 5 minutes.' },
        { step: '2', title: 'Importez vos contenus', desc: 'Uploadez vos prédications, importez depuis YouTube, créez vos campagnes de collecte.' },
        { step: '3', title: 'Déployez mondialement', desc: 'Partagez votre lien. Mobile Money en Afrique, carte bancaire pour la diaspora mondiale.' },
      ]}
      testimonial={{
        name: 'Évangéliste D. A.',
        role: 'Ministère international',
        text: 'J\'avais 2 millions de vues sur YouTube mais zéro revenu. Avec Siteviral, mes prédications génèrent maintenant des revenus chaque jour.',
        flag: '🇨🇲',
      }}
      stats={[
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: 'Multi-devises', label: 'FCFA, USD, EUR, GBP' },
        { value: '10%', label: 'commission uniquement sur les ventes' },
      ]}
      faq={[
        { q: 'Peut-on remplacer notre site actuel ?', a: 'Oui, Siteviral peut servir de site principal ou compléter votre site existant. Vous obtenez une URL partageable et une page professionnelle complète.' },
        { q: 'Comment gérer plusieurs pays ?', a: 'Siteviral gère automatiquement les devises. Vos fidèles au Cameroun payent en FCFA, ceux en France en EUR, aux USA en USD.' },
        { q: 'Peut-on avoir plusieurs administrateurs ?', a: 'Oui, ajoutez des membres à votre équipe avec différents niveaux d\'accès (admin, modérateur, éditeur).' },
        { q: 'Comment importer nos vidéos YouTube ?', a: 'Collez simplement le lien YouTube. Siteviral récupère automatiquement le titre, la miniature et crée un produit prêt à vendre.' },
        { q: 'Y a-t-il une limite de stockage ?', a: 'Non, uploadez autant de contenus que vous voulez. Audio, vidéo, PDF, images — pas de limite.' },
        { q: 'Le paiement est-il sécurisé ?', a: 'Oui, nous utilisons Paystack et Stripe, certifiés PCI-DSS. Vos fidèles et vous êtes protégés.' },
      ]}
      cta={{ label: 'Lancer mon ministère en ligne', path: '/auth?mode=signup' }}
      secondaryCta={{ label: 'Voir les fonctionnalités', path: '/features' }}
    />
  );
}
