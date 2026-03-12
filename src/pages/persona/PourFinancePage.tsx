import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';
import { useI18n } from '@/i18n/I18nContext';

export default function PourFinancePage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <PersonaLandingPage
      seo={{
        title: isFr ? 'Siteviral pour les Experts Finance — Vendez vos formations et outils financiers' : 'Siteviral for Finance Experts — Sell Your Financial Tools & Training',
        description: isFr ? 'Comptables, conseillers financiers, experts en investissement : vendez vos formations, templates Excel et guides fiscaux par Mobile Money.' : 'Accountants, financial advisors, investment experts: sell your training, Excel templates, and tax guides via Mobile Money.',
        url: 'https://siteviral.com/pour/finance',
      }}
      badge={isFr ? '📊 Pour les Experts Finance' : '📊 For Finance Experts'}
      headline={isFr
        ? <>Monétisez votre <span className="text-primary">expertise financière</span> à grande échelle</>
        : <>Monetize your <span className="text-primary">financial expertise</span> at scale</>}
      subheadline={isFr
        ? 'Vous êtes comptable, conseiller financier ou expert en investissement. Vos tableaux Excel, guides fiscaux et formations intéressent des milliers de professionnels et entrepreneurs.'
        : 'You\'re an accountant, financial advisor, or investment expert. Your Excel dashboards, tax guides, and training interest thousands of professionals and entrepreneurs.'}
      painPoints={isFr ? [
        { icon: '📉', title: 'Expertise sous-valorisée', desc: 'Vous créez des outils financiers pour vos clients mais ne les vendez jamais au grand public.' },
        { icon: '⏰', title: 'Temps limité', desc: 'Votre agenda est plein. Vous refusez des clients faute de temps.' },
        { icon: '📋', title: 'Templates non monétisés', desc: 'Vos tableaux de bord Excel, modèles comptables et outils d\'analyse dorment dans vos fichiers.' },
        { icon: '🌍', title: 'Portée locale', desc: 'Vous ne servez que les entreprises de votre ville. Le digital peut étendre votre impact.' },
        { icon: '💸', title: 'Revenus irréguliers', desc: 'Vos honoraires varient d\'un mois à l\'autre. Pas de flux de revenus passifs.' },
        { icon: '📱', title: 'Audience mobile', desc: 'Vos prospects sont sur mobile et payent par Mobile Money, pas par virement.' },
      ] : [
        { icon: '📉', title: 'Undervalued expertise', desc: 'You create financial tools for your clients but never sell them to the public.' },
        { icon: '⏰', title: 'Limited time', desc: 'Your schedule is full. You turn away clients due to lack of time.' },
        { icon: '📋', title: 'Unmonetized templates', desc: 'Your Excel dashboards, accounting models, and analysis tools sit idle in your files.' },
        { icon: '🌍', title: 'Local reach', desc: 'You only serve businesses in your city. Digital can extend your impact.' },
        { icon: '💸', title: 'Irregular income', desc: 'Your fees vary month to month. No passive income stream.' },
        { icon: '📱', title: 'Mobile audience', desc: 'Your prospects are on mobile and pay via Mobile Money, not bank transfer.' },
      ]}
      solutions={isFr ? [
        { title: 'Templates Excel & outils', desc: 'Vendez vos tableaux de bord, modèles de trésorerie, simulateurs et outils comptables.' },
        { title: 'Guides fiscaux', desc: 'Publiez des guides pratiques : fiscalité UEMOA/CEMAC, optimisation, déclarations.' },
        { title: 'Formations en ligne', desc: 'Enregistrez vos formations comptabilité, investissement, gestion. Vente automatique.' },
        { title: 'Bundles premium', desc: 'Packagez template + guide + formation dans des offres irrésistibles.' },
        { title: 'Mobile Money intégré', desc: 'Orange Money, MTN, Wave et carte bancaire. Paiement en 1 clic.' },
        { title: 'Abonnements récurrents', desc: 'Proposez un accès mensuel à votre bibliothèque d\'outils. Revenus prévisibles.' },
      ] : [
        { title: 'Excel templates & tools', desc: 'Sell your dashboards, cash flow models, simulators, and accounting tools.' },
        { title: 'Tax guides', desc: 'Publish practical guides: UEMOA/CEMAC taxation, optimization, declarations.' },
        { title: 'Online training', desc: 'Record your accounting, investment, and management training. Automatic sales.' },
        { title: 'Premium bundles', desc: 'Package template + guide + training into irresistible offers.' },
        { title: 'Integrated Mobile Money', desc: 'Orange Money, MTN, Wave, and credit card. One-click payment.' },
        { title: 'Recurring subscriptions', desc: 'Offer monthly access to your tool library. Predictable revenue.' },
      ]}
      steps={isFr ? [
        { step: '1', title: 'Créez votre page', desc: 'Inscription gratuite. Présentez vos qualifications et domaines d\'expertise.' },
        { step: '2', title: 'Uploadez vos produits', desc: 'Templates Excel, guides PDF, formations vidéo. Fixez vos prix.' },
        { step: '3', title: 'Vendez automatiquement', desc: 'Partagez sur LinkedIn et WhatsApp. Les ventes tournent 24h/24.' },
      ] : [
        { step: '1', title: 'Create your page', desc: 'Free sign-up. Present your qualifications and areas of expertise.' },
        { step: '2', title: 'Upload your products', desc: 'Excel templates, PDF guides, video training. Set your prices.' },
        { step: '3', title: 'Sell automatically', desc: 'Share on LinkedIn and WhatsApp. Sales run 24/7.' },
      ]}
      testimonial={{
        name: isFr ? 'Expert C. D.' : 'Expert C. D.',
        role: isFr ? 'Expert-comptable' : 'Chartered accountant',
        text: isFr
          ? 'Mon template "Tableau de bord PME" se vend 50 fois par mois sans effort. Un complément de revenu idéal entre deux missions d\'audit.'
          : 'My "SME Dashboard" template sells 50 times a month effortlessly. An ideal income supplement between audit engagements.',
        flag: '🇧🇫',
      }}
      stats={isFr ? [
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: 'Illimité', label: 'nombre de produits' },
        { value: '90%', label: 'pour vous' },
      ] : [
        { value: '$0', label: 'subscription fee' },
        { value: 'Unlimited', label: 'number of products' },
        { value: '90%', label: 'for you' },
      ]}
      faq={isFr ? [
        { q: 'Quels produits financiers puis-je vendre ?', a: 'Templates Excel, modèles comptables, guides fiscaux, formations vidéo, simulateurs financiers.' },
        { q: 'Est-ce conforme à la réglementation ?', a: 'Oui, vendre des outils et formations éducatives est parfaitement légal. Ce n\'est pas du conseil personnalisé.' },
        { q: 'Mes clients peuvent-ils payer par Mobile Money ?', a: 'Oui, tous les moyens de paiement mobile africains sont acceptés.' },
        { q: 'Les fichiers Excel sont-ils protégés ?', a: 'Oui, watermark automatique avec le nom de l\'acheteur sur les PDF. Accès sécurisé.' },
        { q: 'Peut-on vendre en plusieurs devises ?', a: 'Oui, FCFA, EUR, USD, GBP. Le système gère la conversion automatiquement.' },
        { q: 'Comment recevoir mes revenus ?', a: 'Mobile Money ou virement bancaire. Versements après 72h.' },
      ] : [
        { q: 'What financial products can I sell?', a: 'Excel templates, accounting models, tax guides, video training, financial simulators.' },
        { q: 'Is this compliant with regulations?', a: 'Yes, selling educational tools and training is perfectly legal. It\'s not personalized advice.' },
        { q: 'Can my clients pay via Mobile Money?', a: 'Yes, all African mobile payment methods are accepted.' },
        { q: 'Are Excel files protected?', a: 'Yes, automatic watermark with buyer\'s name on PDFs. Secured access.' },
        { q: 'Can I sell in multiple currencies?', a: 'Yes, XOF, EUR, USD, GBP. The system handles conversion automatically.' },
        { q: 'How do I receive my earnings?', a: 'Mobile Money or bank transfer. Payouts after 72 hours.' },
      ]}
      cta={{ label: isFr ? 'Vendre mes outils financiers' : 'Sell my financial tools', path: '/auth?mode=signup' }}
      secondaryCta={{ label: isFr ? 'Découvrir les fonctionnalités' : 'Discover features', path: '/features' }}
    />
  );
}
