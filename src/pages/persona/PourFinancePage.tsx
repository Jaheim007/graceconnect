import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';

export default function PourFinancePage() {
  return (
    <PersonaLandingPage
      seo={{
        title: 'Siteviral pour les Experts Finance — Vendez vos formations et outils financiers',
        description: 'Comptables, conseillers financiers, experts en investissement : vendez vos formations, templates Excel et guides fiscaux par Mobile Money.',
        url: 'https://siteviral.com/pour/finance',
      }}
      badge="📊 Pour les Experts Finance"
      headline={<>Monétisez votre <span className="text-primary">expertise financière</span> à grande échelle</>}
      subheadline="Vous êtes comptable, conseiller financier ou expert en investissement. Vos tableaux Excel, guides fiscaux et formations intéressent des milliers de professionnels et entrepreneurs."
      painPoints={[
        { icon: '📉', title: 'Expertise sous-valorisée', desc: 'Vous créez des outils financiers pour vos clients mais ne les vendez jamais au grand public.' },
        { icon: '⏰', title: 'Temps limité', desc: 'Votre agenda est plein. Vous refusez des clients faute de temps.' },
        { icon: '📋', title: 'Templates non monétisés', desc: 'Vos tableaux de bord Excel, modèles comptables et outils d\'analyse dorment dans vos fichiers.' },
        { icon: '🌍', title: 'Portée locale', desc: 'Vous ne servez que les entreprises de votre ville. Le digital peut étendre votre impact.' },
        { icon: '💸', title: 'Revenus irréguliers', desc: 'Vos honoraires varient d\'un mois à l\'autre. Pas de flux de revenus passifs.' },
        { icon: '📱', title: 'Audience mobile', desc: 'Vos prospects sont sur mobile et payent par Mobile Money, pas par virement.' },
      ]}
      solutions={[
        { title: 'Templates Excel & outils', desc: 'Vendez vos tableaux de bord, modèles de trésorerie, simulateurs et outils comptables.' },
        { title: 'Guides fiscaux', desc: 'Publiez des guides pratiques : fiscalité UEMOA/CEMAC, optimisation, déclarations.' },
        { title: 'Formations en ligne', desc: 'Enregistrez vos formations comptabilité, investissement, gestion. Vente automatique.' },
        { title: 'Bundles premium', desc: 'Packagez template + guide + formation dans des offres irrésistibles.' },
        { title: 'Mobile Money intégré', desc: 'Orange Money, MTN, Wave et carte bancaire. Paiement en 1 clic.' },
        { title: 'Abonnements récurrents', desc: 'Proposez un accès mensuel à votre bibliothèque d\'outils. Revenus prévisibles.' },
      ]}
      steps={[
        { step: '1', title: 'Créez votre page', desc: 'Inscription gratuite. Présentez vos qualifications et domaines d\'expertise.' },
        { step: '2', title: 'Uploadez vos produits', desc: 'Templates Excel, guides PDF, formations vidéo. Fixez vos prix.' },
        { step: '3', title: 'Vendez automatiquement', desc: 'Partagez sur LinkedIn et WhatsApp. Les ventes tournent 24h/24.' },
      ]}
      testimonial={{
        name: 'Expert C. D.',
        role: 'Expert-comptable',
        text: 'Mon template "Tableau de bord PME" se vend 50 fois par mois sans effort. Un complément de revenu idéal entre deux missions d\'audit.',
        flag: '🇧🇫',
      }}
      stats={[
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: 'Illimité', label: 'nombre de produits' },
        { value: '90%', label: 'pour vous' },
      ]}
      faq={[
        { q: 'Quels produits financiers puis-je vendre ?', a: 'Templates Excel, modèles comptables, guides fiscaux, formations vidéo, simulateurs financiers.' },
        { q: 'Est-ce conforme à la réglementation ?', a: 'Oui, vendre des outils et formations éducatives est parfaitement légal. Ce n\'est pas du conseil personnalisé.' },
        { q: 'Mes clients peuvent-ils payer par Mobile Money ?', a: 'Oui, tous les moyens de paiement mobile africains sont acceptés.' },
        { q: 'Les fichiers Excel sont-ils protégés ?', a: 'Oui, watermark automatique avec le nom de l\'acheteur sur les PDF. Accès sécurisé.' },
        { q: 'Peut-on vendre en plusieurs devises ?', a: 'Oui, FCFA, EUR, USD, GBP. Le système gère la conversion automatiquement.' },
        { q: 'Comment recevoir mes revenus ?', a: 'Mobile Money ou virement bancaire. Versements après 72h.' },
      ]}
      cta={{ label: 'Vendre mes outils financiers', path: '/auth?mode=signup' }}
      secondaryCta={{ label: 'Découvrir les fonctionnalités', path: '/features' }}
    />
  );
}
