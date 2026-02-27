import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';

export default function PourEglisesPage() {
  return (
    <PersonaLandingPage
      seo={{
        title: 'Siteviral pour les Églises — Digitalisez votre ministère',
        description: 'Créez votre plateforme digitale pour votre église. Recevez dons et dîmes par Mobile Money, vendez vos prédications, centralisez tout.',
        url: 'https://siteviral.com/pour/eglises',
      }}
      badge="⛪ Pour les Églises & Ministères"
      headline={<>Votre église mérite une <span className="text-primary">présence digitale</span> à la hauteur de sa mission</>}
      subheadline="Recevez des dons et dîmes par Mobile Money, vendez vos prédications audio et vidéo, et centralisez toute votre communauté sur une seule plateforme — sans compétence technique."
      painPoints={[
        { icon: '💸', title: 'Perte d\'argent en espèces', desc: 'Les offrandes en cash disparaissent, pas de traçabilité, pas de reçus. Vous ne savez pas qui donne quoi.' },
        { icon: '📱', title: 'Outils fragmentés', desc: 'WhatsApp pour communiquer, Facebook pour publier, rien pour vendre vos ressources. Tout est dispersé.' },
        { icon: '🚫', title: 'Pas de site, pas de compétence', desc: 'Créer un site coûte cher, prend du temps et nécessite un développeur que vous n\'avez pas.' },
        { icon: '📉', title: 'Prédications non monétisées', desc: 'Des heures de contenu audio et vidéo de qualité, mais aucun moyen structuré de les vendre.' },
        { icon: '🌍', title: 'Diaspora injoignable', desc: 'Vos fidèles à l\'étranger veulent donner mais les canaux sont limités ou compliqués.' },
        { icon: '⏰', title: 'Temps perdu en gestion', desc: 'Gérer manuellement les cotisations, suivre les membres, envoyer les contenus un par un.' },
      ]}
      solutions={[
        { title: 'Page d\'église professionnelle', desc: 'Créez votre vitrine en 2 minutes : logo, bannière, description, contacts. Accessible à tous.' },
        { title: 'Dons & dîmes par Mobile Money', desc: 'Vos fidèles donnent en 1 clic depuis leur téléphone. Orange Money, MTN, Wave, cartes bancaires.' },
        { title: 'Boutique de prédications', desc: 'Vendez vos audio, vidéos, e-books, guides. Livraison instantanée après paiement.' },
        { title: 'Campagnes de collecte', desc: 'Lancez des appels à dons avec objectif, barre de progression et partage social.' },
        { title: 'Armée d\'ambassadeurs', desc: 'Vos membres fidèles partagent vos ressources et touchent une commission sur chaque vente.' },
        { title: 'Paiement international', desc: 'Mobile Money en Afrique, Visa/Mastercard pour la diaspora. Multi-devises automatique.' },
      ]}
      steps={[
        { step: '1', title: 'Créez votre organisation', desc: 'Inscrivez-vous gratuitement, nommez votre église, ajoutez votre logo. 2 minutes.' },
        { step: '2', title: 'Ajoutez vos ressources', desc: 'Uploadez vos prédications, fixez vos prix (ou gratuit), créez vos campagnes de dons.' },
        { step: '3', title: 'Partagez et recevez', desc: 'Partagez votre lien sur WhatsApp et Facebook. Les paiements arrivent automatiquement.' },
      ]}
      testimonial={{
        name: 'Pasteur K. M.',
        role: 'Leader communautaire',
        text: 'En une semaine, notre communauté a pu offrir plus de 200 prédications audio. Les dons arrivent aussi par Mobile Money. C\'est révolutionnaire.',
        flag: '🇳🇬',
      }}
      stats={[
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: '2 min', label: 'pour créer votre page' },
        { value: '150+ pays', label: 'Mobile Money & Carte' },
      ]}
      faq={[
        { q: 'Est-ce que c\'est gratuit ?', a: 'Oui, il n\'y a aucun abonnement. Siteviral prend une commission de 10% uniquement sur les ventes réalisées. Les dons sont soumis aux frais de la passerelle de paiement uniquement.' },
        { q: 'Nos fidèles peuvent-ils payer par Mobile Money ?', a: 'Absolument ! Orange Money, MTN Mobile Money, Wave et toutes les méthodes de paiement mobile sont acceptées. La diaspora peut payer par carte.' },
        { q: 'Faut-il des compétences techniques ?', a: 'Non, zéro. Si vous savez utiliser WhatsApp, vous savez utiliser Siteviral. Tout se fait en quelques clics.' },
        { q: 'Comment recevoir l\'argent ?', a: 'L\'argent est versé automatiquement sur votre compte Mobile Money ou bancaire après une période de sécurité de 72h.' },
        { q: 'Peut-on recevoir des dons récurrents ?', a: 'Oui, vos fidèles peuvent choisir de donner de manière récurrente (hebdomadaire, mensuel). Tout est automatisé.' },
        { q: 'Est-ce sécurisé ?', a: 'Oui. Tous les paiements passent par Paystack et Stripe, deux des passerelles les plus sécurisées au monde. Conformité PCI-DSS.' },
      ]}
      cta={{ label: 'Créer ma page d\'église gratuitement', path: '/auth?mode=signup' }}
      secondaryCta={{ label: 'Voir comment ça marche', path: '/features' }}
    />
  );
}
