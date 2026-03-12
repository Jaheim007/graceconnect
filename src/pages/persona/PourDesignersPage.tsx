import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';
import { useI18n } from '@/i18n/I18nContext';

export default function PourDesignersPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <PersonaLandingPage
      seo={{
        title: isFr ? 'Siteviral pour Designers — Vendez vos templates, logos & assets numériques' : 'Siteviral for Designers — Sell your templates, logos & digital assets',
        description: isFr ? 'Monétisez vos créations graphiques : templates, mockups, logos, icônes. Paiement Mobile Money, livraison automatique.' : 'Monetize your graphic creations: templates, mockups, logos, icons. Mobile Money payments, automatic delivery.',
        url: 'https://siteviral.com/pour/designers',
      }}
      badge={isFr ? '🎨 Pour les Designers & Graphistes' : '🎨 For Designers & Graphic Artists'}
      headline={isFr ? <>Vendez vos créations <span className="text-primary">pendant que vous dormez</span></> : <>Sell your creations <span className="text-primary">while you sleep</span></>}
      subheadline={isFr ? 'Templates, mockups, logos, icônes, kits UI — créez une fois, vendez à l\'infini. Livraison automatique, paiement Mobile Money.' : 'Templates, mockups, logos, icons, UI kits — create once, sell forever. Automatic delivery, Mobile Money payments.'}
      painPoints={isFr ? [
        { icon: '💰', title: 'Revenus au projet', desc: 'Un client = un projet = un paiement. Entre les projets, vous ne gagnez rien.' },
        { icon: '🔄', title: 'Révisions infinies', desc: 'Clients qui demandent 10 révisions pour le prix d\'une. Votre temps est gaspillé.' },
        { icon: '🏪', title: 'Marketplaces saturées', desc: 'Creative Market, Envato prennent 30-50% et votre travail se noie parmi des millions de fichiers.' },
        { icon: '💳', title: 'Clients qui ne paient pas', desc: 'Vous livrez le mockup, le client disparaît. Encaisser avant livraison est mal vu.' },
        { icon: '📦', title: 'Pas de boutique propre', desc: 'Créer un e-commerce demande un site web, un hébergement, un système de paiement…' },
        { icon: '🌍', title: 'Marché local sous-exploité', desc: 'Les PME africaines cherchent des templates adaptés mais ne trouvent pas de source locale.' },
      ] : [
        { icon: '💰', title: 'Project-based income', desc: 'One client = one project = one payment. Between projects, you earn nothing.' },
        { icon: '🔄', title: 'Endless revisions', desc: 'Clients asking for 10 revisions for the price of one. Your time is wasted.' },
        { icon: '🏪', title: 'Saturated marketplaces', desc: 'Creative Market, Envato take 30-50% and your work drowns among millions of files.' },
        { icon: '💳', title: 'Clients who don\'t pay', desc: 'You deliver the mockup, the client disappears. Collecting before delivery is frowned upon.' },
        { icon: '📦', title: 'No personal store', desc: 'Creating an e-commerce requires a website, hosting, a payment system…' },
        { icon: '🌍', title: 'Underexploited local market', desc: 'African SMEs are looking for adapted templates but can\'t find a local source.' },
      ]}
      solutions={isFr ? [
        { title: 'Boutique d\'assets numériques', desc: 'Votre catalogue en ligne avec preview, prix et achat en 1 clic. Professionnel et automatisé.' },
        { title: 'Livraison automatique', desc: 'Le client paie, reçoit le fichier ZIP immédiatement. Plus de livraison manuelle.' },
        { title: 'Templates localisés', desc: 'Créez des templates adaptés aux entreprises africaines : menus de restaurant, flyers d\'église, CV locaux.' },
        { title: 'Packs & bundles', desc: 'Combinez 10 templates dans un pack. Le prix par unité baisse, votre chiffre d\'affaires monte.' },
        { title: 'Programme ambassadeur', desc: 'D\'autres designers et agences recommandent vos assets et gagnent une commission.' },
        { title: 'Mobile Money + carte', desc: 'Touchez à la fois les clients locaux (Mobile Money) et internationaux (carte bancaire).' },
      ] : [
        { title: 'Digital asset store', desc: 'Your online catalog with preview, pricing and 1-click purchase. Professional and automated.' },
        { title: 'Automatic delivery', desc: 'Client pays, receives the ZIP file immediately. No more manual delivery.' },
        { title: 'Localized templates', desc: 'Create templates adapted to African businesses: restaurant menus, church flyers, local CVs.' },
        { title: 'Packs & bundles', desc: 'Combine 10 templates into a pack. Unit price drops, your revenue goes up.' },
        { title: 'Ambassador program', desc: 'Other designers and agencies recommend your assets and earn a commission.' },
        { title: 'Mobile Money + card', desc: 'Reach both local clients (Mobile Money) and international ones (bank card).' },
      ]}
      steps={isFr ? [
        { step: '1', title: 'Uploadez vos assets', desc: 'ZIP contenant vos fichiers source (PSD, AI, Figma). Ajoutez des previews attractives.' },
        { step: '2', title: 'Fixez vos prix', desc: 'Templates : 2 000-10 000 FCFA. Packs : 15 000-30 000 FCFA. Kits complets : 50 000+ FCFA.' },
        { step: '3', title: 'Partagez et vendez', desc: 'Portfolio Instagram + lien Siteviral. Les ambassadeurs amplifient votre portée.' },
      ] : [
        { step: '1', title: 'Upload your assets', desc: 'ZIP containing your source files (PSD, AI, Figma). Add attractive previews.' },
        { step: '2', title: 'Set your prices', desc: 'Templates: $3-17. Packs: $25-50. Complete kits: $85+.' },
        { step: '3', title: 'Share and sell', desc: 'Instagram portfolio + Siteviral link. Ambassadors amplify your reach.' },
      ]}
      testimonial={{
        name: 'Yves K.',
        role: isFr ? 'Graphic Designer, Cotonou' : 'Graphic Designer, Cotonou',
        text: isFr ? 'Mon pack "50 Templates Social Media" à 8 000 FCFA se vend tout seul. 15-20 ventes par mois sans aucun effort. C\'est mon meilleur investissement en temps.' : 'My "50 Social Media Templates" pack sells itself. 15-20 sales per month without any effort. It\'s my best time investment.',
        flag: '🇧🇯',
      }}
      stats={isFr ? [
        { value: '93%', label: 'Revenu conservé' },
        { value: '2 800+', label: 'Assets vendus' },
        { value: '0 FCFA', label: 'Abonnement' },
        { value: '∞', label: 'Ventes par asset' },
      ] : [
        { value: '93%', label: 'Revenue kept' },
        { value: '2,800+', label: 'Assets sold' },
        { value: '$0', label: 'Subscription' },
        { value: '∞', label: 'Sales per asset' },
      ]}
      faq={isFr ? [
        { q: 'Quels formats sont acceptés ?', a: 'Tous : PSD, AI, EPS, SVG, Figma, ZIP, PDF, PNG… Jusqu\'à 500 Mo par produit.' },
        { q: 'Comment empêcher la redistribution ?', a: 'Filigrane sur les previews, lien de téléchargement unique et limité, traçabilité par acheteur.' },
        { q: 'Puis-je vendre des services personnalisés ?', a: 'Oui ! Créez un produit "Logo personnalisé" avec un formulaire de brief. Le client paie, vous créez.' },
        { q: 'Quelle est la commission ?', a: '7% par vente. Pas d\'abonnement. Si vous ne vendez rien, vous ne payez rien.' },
      ] : [
        { q: 'What formats are accepted?', a: 'All: PSD, AI, EPS, SVG, Figma, ZIP, PDF, PNG… Up to 500 MB per product.' },
        { q: 'How to prevent redistribution?', a: 'Watermark on previews, unique and limited download link, per-buyer tracking.' },
        { q: 'Can I sell custom services?', a: 'Yes! Create a "Custom Logo" product with a brief form. Client pays, you create.' },
        { q: 'What\'s the commission?', a: '7% per sale. No subscription. If you don\'t sell, you don\'t pay.' },
      ]}
      cta={{ label: isFr ? 'Ouvrir ma boutique design' : 'Open my design store', path: '/auth?mode=signup' }}
      secondaryCta={{ label: isFr ? 'Voir le marketplace' : 'See the marketplace', path: '/discover' }}
    />
  );
}
