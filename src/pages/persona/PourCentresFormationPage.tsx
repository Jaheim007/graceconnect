import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';

export default function PourCentresFormationPage() {
  return (
    <PersonaLandingPage
      seo={{
        title: 'Siteviral pour les Centres de Formation & Auto-écoles — Passez au digital',
        description: 'Complétez votre offre présentielle avec du contenu digital. Vendez cours théoriques, quiz et manuels en ligne par Mobile Money.',
        url: 'https://siteviral.com/pour/centres-formation',
      }}
      badge="🏫 Pour les Centres de Formation & Auto-écoles"
      headline={<>Complétez votre formation présentielle avec du <span className="text-primary">contenu digital</span> rentable</>}
      subheadline="Vous dirigez une auto-école, un centre de formation professionnelle ou un institut. Vendez vos cours théoriques, manuels et quiz en ligne pour toucher plus de clients sans augmenter vos coûts fixes."
      painPoints={[
        { icon: '🏢', title: 'Limité au présentiel', desc: 'Votre capacité d\'accueil est limitée. Vous refusez des clients faute de place.' },
        { icon: '🌍', title: 'Portée géographique restreinte', desc: 'Seuls les habitants de votre ville peuvent suivre vos formations.' },
        { icon: '📉', title: 'Revenus plafonnés', desc: 'Vos revenus dépendent du nombre de places physiques. Pas de scalabilité.' },
        { icon: '📚', title: 'Manuels physiques coûteux', desc: 'L\'impression de manuels coûte cher et limite vos marges.' },
        { icon: '🏥', title: 'Post-COVID, demande online', desc: 'Les apprenants veulent du contenu accessible à distance, à leur rythme.' },
        { icon: '💻', title: 'Pas de plateforme abordable', desc: 'Les LMS comme Teachable coûtent cher et ne supportent pas le Mobile Money.' },
      ]}
      solutions={[
        { title: 'Cours théoriques en ligne', desc: 'Vendez la partie théorique en digital : code de la route, cours préparatoires, modules e-learning.' },
        { title: 'Manuels digitaux', desc: 'Transformez vos manuels imprimés en PDF vendus en ligne. Zéro coût d\'impression.' },
        { title: 'Quiz & évaluations', desc: 'Proposez des tests de préparation, exercices corrigés, simulations d\'examens.' },
        { title: 'Paiement Mobile Money', desc: 'Vos apprenants paient par Orange Money, MTN, Wave. Pas besoin de carte bancaire.' },
        { title: 'Extension géographique', desc: 'Un apprenant à 500km peut acheter vos cours théoriques sans se déplacer.' },
        { title: 'Revenus passifs complémentaires', desc: 'Le digital complète vos revenus sans augmenter vos charges fixes.' },
      ]}
      steps={[
        { step: '1', title: 'Créez votre centre en ligne', desc: 'Inscription gratuite. Présentez votre centre, vos formations, vos certifications.' },
        { step: '2', title: 'Digitalisez vos contenus', desc: 'Convertissez vos manuels en PDF, enregistrez vos cours en vidéo.' },
        { step: '3', title: 'Vendez à distance', desc: 'Partagez votre lien. Les apprenants achètent et accèdent instantanément.' },
      ]}
      testimonial={{
        name: 'Directeur M. B.',
        role: 'Auto-école',
        text: 'Nos cours de code de la route sont maintenant disponibles en PDF et vidéo. Les élèves achètent par Mobile Money et révisent chez eux. Nos revenus ont augmenté de 40%.',
        flag: '🇧🇫',
      }}
      stats={[
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: '40%', label: 'de revenus supplémentaires' },
        { value: '24h/24', label: 'contenu accessible' },
      ]}
      faq={[
        { q: 'Peut-on vendre des vidéos de formation ?', a: 'Oui, uploadez vos vidéos MP4. Les apprenants les achètent et les téléchargent ou les visionnent directement.' },
        { q: 'Comment gérer plusieurs formations ?', a: 'Créez un produit par formation ou par module. Vous pouvez aussi créer des bundles (pack complet).' },
        { q: 'Est-ce compatible avec le présentiel ?', a: 'Absolument, le digital complète votre offre présentielle. Vendez le théorique en ligne, gardez le pratique en centre.' },
        { q: 'Comment nos apprenants nous trouvent-ils ?', a: 'Partagez votre page Siteviral sur vos réseaux sociaux, WhatsApp et même dans votre centre physique.' },
        { q: 'Peut-on délivrer des certificats ?', a: 'Vous pouvez inclure un certificat PDF dans vos produits ou l\'envoyer manuellement après validation.' },
        { q: 'Comment recevoir les paiements ?', a: 'Par Mobile Money ou virement bancaire, après une période de sécurité de 72h.' },
      ]}
      cta={{ label: 'Digitaliser mon centre de formation', path: '/auth?mode=signup' }}
      secondaryCta={{ label: 'Voir les fonctionnalités', path: '/features' }}
    />
  );
}
