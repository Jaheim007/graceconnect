import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';

export default function PourDiasporaPage() {
  return (
    <PersonaLandingPage
      seo={{
        title: 'Siteviral pour la Diaspora — Soutenez vos communautés à distance',
        description: 'Donnez, achetez et soutenez les projets de votre communauté d\'origine depuis l\'étranger. Paiement sécurisé, transparence totale.',
        url: 'https://siteviral.com/pour/diaspora',
      }}
      badge="🌍 Pour la Diaspora Africaine"
      headline={<>Soutenez vos communautés <span className="text-primary">depuis l'étranger</span></>}
      subheadline={<>Donnez aux églises, ONG et projets de chez vous. Achetez les produits de créateurs locaux. Tout est traçable, transparent et sécurisé.</>}
      painPoints={[
        { icon: '💸', title: 'Western Union coûte cher', desc: 'Les frais de transfert classiques mangent 7-12% de chaque envoi. L\'argent n\'arrive pas toujours où il devrait.' },
        { icon: '🔍', title: 'Zéro transparence', desc: 'Vous envoyez de l\'argent mais vous ne savez jamais comment il est utilisé. Aucun suivi, aucun rapport.' },
        { icon: '🤷', title: 'Difficile de trouver des projets fiables', desc: 'Comment savoir quelles ONG ou églises sont sérieuses ? Pas de plateforme de confiance.' },
        { icon: '🛒', title: 'Impossible d\'acheter local', desc: 'Vous voulez soutenir les créateurs africains mais les plateformes locales n\'acceptent pas vos moyens de paiement.' },
        { icon: '📱', title: 'Communication fragmentée', desc: 'WhatsApp, email, appels… Suivre les projets de votre communauté est un casse-tête.' },
        { icon: '🕐', title: 'Décalage horaire', desc: 'Impossible de participer aux événements en direct. Vous manquez les moments importants de votre communauté.' },
      ]}
      solutions={[
        { title: 'Dons traçables', desc: 'Chaque don est suivi en temps réel. Vous voyez exactement combien a été collecté et comment c\'est utilisé.' },
        { title: 'Paiement par carte bancaire', desc: 'Payez avec Visa, Mastercard ou Stripe depuis l\'Europe, l\'Amérique ou l\'Asie. L\'argent arrive en Mobile Money.' },
        { title: 'Marketplace de créateurs', desc: 'Découvrez et achetez les ebooks, formations et créations d\'artistes et entrepreneurs africains.' },
        { title: 'Suivi des campagnes', desc: 'Suivez la progression des campagnes de collecte en temps réel. Reçus de don automatiques.' },
        { title: 'Annonces communautaires', desc: 'Restez connecté avec les nouvelles de votre église, association ou communauté.' },
        { title: 'Programme ambassadeur', desc: 'Partagez les projets avec votre réseau en diaspora. Chaque partage qui convertit vous rapporte.' },
      ]}
      steps={[
        { step: '1', title: 'Trouvez votre communauté', desc: 'Cherchez votre église, ONG ou association sur le marketplace Siteviral.' },
        { step: '2', title: 'Donnez ou achetez', desc: 'Contribuez à une campagne ou achetez un produit. Paiement sécurisé par carte.' },
        { step: '3', title: 'Suivez l\'impact', desc: 'Recevez des mises à jour sur l\'utilisation des fonds. Reçu fiscal automatique.' },
      ]}
      testimonial={{
        name: 'Patrick M.',
        role: 'Ingénieur, Paris — Originaire de Douala',
        text: 'Je donne chaque mois à mon église de Douala via Siteviral. Je vois exactement combien est collecté. C\'est 10x mieux que d\'envoyer via Western Union.',
        flag: '🇫🇷',
      }}
      stats={[
        { value: '2-3%', label: 'Frais vs 10% WU' },
        { value: '100%', label: 'Traçabilité' },
        { value: '25+', label: 'Pays supportés' },
        { value: '24h', label: 'Réception des fonds' },
      ]}
      faq={[
        { q: 'Puis-je payer par carte bancaire européenne ?', a: 'Oui ! Visa, Mastercard, et tous les moyens de paiement Stripe sont acceptés. L\'argent est converti et envoyé en Mobile Money.' },
        { q: 'Comment savoir si mon don est bien utilisé ?', a: 'Chaque organisation a un tableau de bord transparent. Vous voyez le montant collecté, les contributeurs, et l\'avancement de la campagne.' },
        { q: 'Est-ce que je reçois un reçu fiscal ?', a: 'Oui, un reçu est généré automatiquement pour chaque don. Vous pouvez le télécharger depuis votre historique.' },
        { q: 'Quels sont les frais ?', a: 'Les frais de plateforme sont de 7% (contre 10-12% pour Western Union). Pas d\'abonnement, pas de frais cachés.' },
        { q: 'Puis-je donner de manière récurrente ?', a: 'Oui ! Configurez un don mensuel automatique. Vous pouvez l\'annuler à tout moment.' },
      ]}
      cta={{ label: 'Commencer à donner', path: '/discover' }}
      secondaryCta={{ label: 'Explorer les projets', path: '/discover' }}
    />
  );
}
