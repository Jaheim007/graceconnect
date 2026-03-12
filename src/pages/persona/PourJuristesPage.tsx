import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';
import { useI18n } from '@/i18n/I18nContext';

export default function PourJuristesPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <PersonaLandingPage
      seo={{
        title: isFr ? 'Siteviral pour les Juristes & Avocats — Vendez vos modèles juridiques' : 'Siteviral for Lawyers — Sell Your Legal Templates',
        description: isFr ? 'Vendez vos modèles de contrats, guides juridiques et formations en droit par Mobile Money.' : 'Sell your contract templates, legal guides, and law training via Mobile Money.',
        url: 'https://siteviral.com/pour/juristes',
      }}
      badge={isFr ? '⚖️ Pour les Juristes & Avocats' : '⚖️ For Lawyers & Legal Experts'}
      headline={isFr
        ? <>Vendez vos <span className="text-primary">modèles juridiques</span> à des milliers de professionnels</>
        : <>Sell your <span className="text-primary">legal templates</span> to thousands of professionals</>}
      subheadline={isFr
        ? 'Vos contrats types, guides OHADA et formations en droit des affaires intéressent des milliers d\'entrepreneurs. Vendez-les en ligne automatiquement.'
        : 'Your standard contracts, OHADA guides, and business law training interest thousands of entrepreneurs. Sell them online automatically.'}
      painPoints={isFr ? [
        { icon: '📄', title: 'Modèles non monétisés', desc: 'Vous créez des contrats types pour vos clients mais ne les vendez jamais à grande échelle.' },
        { icon: '🌍', title: 'Portée limitée au cabinet', desc: 'Seuls vos clients directs bénéficient de votre expertise. Des milliers d\'entrepreneurs en ont besoin.' },
        { icon: '💸', title: 'Honoraires comme seul revenu', desc: 'Vos revenus dépendent uniquement de vos heures facturées. Pas de revenu passif.' },
        { icon: '📱', title: 'Distribution inefficace', desc: 'Vous envoyez vos documents par email ou WhatsApp sans aucun système de paiement intégré.' },
        { icon: '🏗️', title: 'Pas de plateforme adaptée', desc: 'Les plateformes e-commerce ne comprennent pas les besoins spécifiques du droit africain.' },
        { icon: '⏰', title: 'Formations chronophages', desc: 'Organiser des séminaires en présentiel prend du temps et limite votre audience.' },
      ] : [
        { icon: '📄', title: 'Unmonetized templates', desc: 'You create standard contracts for clients but never sell them at scale.' },
        { icon: '🌍', title: 'Reach limited to your firm', desc: 'Only your direct clients benefit from your expertise. Thousands of entrepreneurs need it.' },
        { icon: '💸', title: 'Fees as only income', desc: 'Your revenue depends solely on billable hours. No passive income.' },
        { icon: '📱', title: 'Inefficient distribution', desc: 'You send documents via email or WhatsApp with no integrated payment.' },
        { icon: '🏗️', title: 'No suitable platform', desc: 'E-commerce platforms don\'t understand the specific needs of African law.' },
        { icon: '⏰', title: 'Time-consuming seminars', desc: 'Organizing in-person seminars takes time and limits your audience.' },
      ]}
      solutions={isFr ? [
        { title: 'Boutique de modèles', desc: 'Vendez contrats types, statuts, actes, procès-verbaux. Téléchargement instantané après paiement.' },
        { title: 'Guides juridiques', desc: 'Publiez des guides pratiques : droit OHADA, création d\'entreprise, fiscalité, propriété intellectuelle.' },
        { title: 'Formations en ligne', desc: 'Enregistrez vos séminaires et vendez-les en replay. Revenus passifs sans limite de sièges.' },
        { title: 'Paiement flexible', desc: 'Vos clients payent par Mobile Money ou carte bancaire. Facturation automatique.' },
        { title: 'Page professionnelle', desc: 'Vitrine crédible : votre parcours, barreaux, spécialisations et catalogue de produits.' },
        { title: 'Programme ambassadeur', desc: 'Vos confrères et clients partagent vos ressources et touchent une commission.' },
      ] : [
        { title: 'Template store', desc: 'Sell standard contracts, bylaws, deeds, minutes. Instant download after payment.' },
        { title: 'Legal guides', desc: 'Publish practical guides: OHADA law, business formation, taxation, intellectual property.' },
        { title: 'Online training', desc: 'Record your seminars and sell replays. Passive income with no seat limits.' },
        { title: 'Flexible payment', desc: 'Your clients pay via Mobile Money or credit card. Automatic invoicing.' },
        { title: 'Professional page', desc: 'Credible storefront: your background, bar associations, specializations, and product catalog.' },
        { title: 'Ambassador program', desc: 'Your colleagues and clients share your resources and earn a commission.' },
      ]}
      steps={isFr ? [
        { step: '1', title: 'Créez votre page', desc: 'Inscription gratuite. Présentez votre cabinet et vos spécialisations.' },
        { step: '2', title: 'Uploadez vos modèles', desc: 'Contrats Word/PDF, guides, formations vidéo. Fixez vos prix.' },
        { step: '3', title: 'Partagez à votre réseau', desc: 'LinkedIn, groupes WhatsApp d\'entrepreneurs. Les ventes sont automatiques.' },
      ] : [
        { step: '1', title: 'Create your page', desc: 'Free sign-up. Present your firm and specializations.' },
        { step: '2', title: 'Upload your templates', desc: 'Word/PDF contracts, guides, video training. Set your prices.' },
        { step: '3', title: 'Share with your network', desc: 'LinkedIn, entrepreneur WhatsApp groups. Sales are automatic.' },
      ]}
      testimonial={{
        name: 'Me F. N.',
        role: isFr ? 'Avocat d\'affaires' : 'Business lawyer',
        text: isFr
          ? 'Mon pack juridique se vend tout seul. 50 ventes par mois sans effort supplémentaire. Un complément de revenu précieux.'
          : 'My legal pack sells itself. 50 sales per month with no extra effort. A valuable income supplement.',
        flag: '🇸🇳',
      }}
      stats={isFr ? [
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: 'Illimité', label: 'modèles et formations' },
        { value: '90%', label: 'pour vous' },
      ] : [
        { value: '$0', label: 'subscription fee' },
        { value: 'Unlimited', label: 'templates and courses' },
        { value: '90%', label: 'for you' },
      ]}
      faq={isFr ? [
        { q: 'Quels documents puis-je vendre ?', a: 'Contrats types, statuts, actes, guides juridiques, formations vidéo, tout support numérique.' },
        { q: 'Est-ce conforme à la déontologie ?', a: 'Oui, vendre des modèles et formations ne constitue pas de la consultation juridique. C\'est de l\'édition professionnelle.' },
        { q: 'Mes clients peuvent-ils payer par Mobile Money ?', a: 'Oui, Orange Money, MTN, Wave et carte bancaire sont tous acceptés.' },
        { q: 'Les documents sont-ils protégés ?', a: 'Oui, watermark automatique avec le nom de l\'acheteur. Téléchargement sécurisé.' },
        { q: 'Peut-on vendre en FCFA et en EUR ?', a: 'Oui, vous choisissez la devise. Le système gère la conversion automatiquement pour la diaspora.' },
        { q: 'Comment recevoir mes revenus ?', a: 'Mobile Money ou virement bancaire. Versements après 72h.' },
      ] : [
        { q: 'What documents can I sell?', a: 'Standard contracts, bylaws, deeds, legal guides, video training, any digital material.' },
        { q: 'Is this compliant with professional ethics?', a: 'Yes, selling templates and training does not constitute legal consultation. It\'s professional publishing.' },
        { q: 'Can my clients pay via Mobile Money?', a: 'Yes, Orange Money, MTN, Wave, and credit card are all accepted.' },
        { q: 'Are documents protected?', a: 'Yes, automatic watermark with buyer\'s name. Secured download.' },
        { q: 'Can I sell in XOF and EUR?', a: 'Yes, you choose the currency. The system handles conversion automatically for the diaspora.' },
        { q: 'How do I receive my earnings?', a: 'Mobile Money or bank transfer. Payouts after 72 hours.' },
      ]}
      cta={{ label: isFr ? 'Vendre mes modèles juridiques' : 'Sell my legal templates', path: '/auth?mode=signup' }}
      secondaryCta={{ label: isFr ? 'Découvrir les fonctionnalités' : 'Discover features', path: '/features' }}
    />
  );
}
