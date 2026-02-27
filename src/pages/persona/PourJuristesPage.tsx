import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';

export default function PourJuristesPage() {
  return (
    <PersonaLandingPage
      seo={{
        title: 'Siteviral pour les Juristes & Avocats — Vendez vos modèles juridiques',
        description: 'Vendez vos modèles de contrats, guides juridiques et formations en droit par Mobile Money. Plateforme adaptée aux professionnels du droit africain.',
        url: 'https://siteviral.com/pour/juristes',
      }}
      badge="⚖️ Pour les Juristes & Avocats"
      headline={<>Vendez vos <span className="text-primary">modèles juridiques</span> à des milliers de professionnels</>}
      subheadline="Vos contrats types, guides OHADA et formations en droit des affaires intéressent des milliers d'entrepreneurs. Vendez-les en ligne automatiquement."
      painPoints={[
        { icon: '📄', title: 'Modèles non monétisés', desc: 'Vous créez des contrats types pour vos clients mais ne les vendez jamais à grande échelle.' },
        { icon: '🌍', title: 'Portée limitée au cabinet', desc: 'Seuls vos clients directs bénéficient de votre expertise. Des milliers d\'entrepreneurs en ont besoin.' },
        { icon: '💸', title: 'Honoraires comme seul revenu', desc: 'Vos revenus dépendent uniquement de vos heures facturées. Pas de revenu passif.' },
        { icon: '📱', title: 'Distribution inefficace', desc: 'Vous envoyez vos documents par email ou WhatsApp sans aucun système de paiement intégré.' },
        { icon: '🏗️', title: 'Pas de plateforme adaptée', desc: 'Les plateformes e-commerce ne comprennent pas les besoins spécifiques du droit africain.' },
        { icon: '⏰', title: 'Formations chronophages', desc: 'Organiser des séminaires en présentiel prend du temps et limite votre audience.' },
      ]}
      solutions={[
        { title: 'Boutique de modèles', desc: 'Vendez contrats types, statuts, actes, procès-verbaux. Téléchargement instantané après paiement.' },
        { title: 'Guides juridiques', desc: 'Publiez des guides pratiques : droit OHADA, création d\'entreprise, fiscalité, propriété intellectuelle.' },
        { title: 'Formations en ligne', desc: 'Enregistrez vos séminaires et vendez-les en replay. Revenus passifs sans limite de sièges.' },
        { title: 'Paiement flexible', desc: 'Vos clients payent par Mobile Money ou carte bancaire. Facturation automatique.' },
        { title: 'Page professionnelle', desc: 'Vitrine crédible : votre parcours, barreaux, spécialisations et catalogue de produits.' },
        { title: 'Programme ambassadeur', desc: 'Vos confrères et clients partagent vos ressources et touchent une commission.' },
      ]}
      steps={[
        { step: '1', title: 'Créez votre page', desc: 'Inscription gratuite. Présentez votre cabinet et vos spécialisations.' },
        { step: '2', title: 'Uploadez vos modèles', desc: 'Contrats Word/PDF, guides, formations vidéo. Fixez vos prix.' },
        { step: '3', title: 'Partagez à votre réseau', desc: 'LinkedIn, groupes WhatsApp d\'entrepreneurs. Les ventes sont automatiques.' },
      ]}
      testimonial={{
        name: 'Me F. N.',
        role: 'Avocat d\'affaires',
        text: 'Mon pack "Créer sa SARL en Côte d\'Ivoire" se vend tout seul. 50 ventes par mois sans effort supplémentaire. Un complément de revenu précieux.',
        flag: '🇨🇮',
      }}
      stats={[
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: 'Illimité', label: 'modèles et formations' },
        { value: '90%', label: 'pour vous' },
      ]}
      faq={[
        { q: 'Quels documents puis-je vendre ?', a: 'Contrats types, statuts, actes, guides juridiques, formations vidéo, tout support numérique.' },
        { q: 'Est-ce conforme à la déontologie ?', a: 'Oui, vendre des modèles et formations ne constitue pas de la consultation juridique. C\'est de l\'édition professionnelle.' },
        { q: 'Mes clients peuvent-ils payer par Mobile Money ?', a: 'Oui, Orange Money, MTN, Wave et carte bancaire sont tous acceptés.' },
        { q: 'Les documents sont-ils protégés ?', a: 'Oui, watermark automatique avec le nom de l\'acheteur. Téléchargement sécurisé.' },
        { q: 'Peut-on vendre en FCFA et en EUR ?', a: 'Oui, vous choisissez la devise. Le système gère la conversion automatiquement pour la diaspora.' },
        { q: 'Comment recevoir mes revenus ?', a: 'Mobile Money ou virement bancaire. Versements après 72h.' },
      ]}
      cta={{ label: 'Vendre mes modèles juridiques', path: '/auth?mode=signup' }}
      secondaryCta={{ label: 'Découvrir les fonctionnalités', path: '/features' }}
    />
  );
}
