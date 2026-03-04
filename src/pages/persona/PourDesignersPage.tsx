import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';

export default function PourDesignersPage() {
  return (
    <PersonaLandingPage
      seo={{
        title: 'Siteviral pour Designers — Vendez vos templates, logos & assets numériques',
        description: 'Monétisez vos créations graphiques : templates, mockups, logos, icônes. Paiement Mobile Money, livraison automatique.',
        url: 'https://siteviral.com/pour/designers',
      }}
      badge="🎨 Pour les Designers & Graphistes"
      headline={<>Vendez vos créations <span className="text-primary">pendant que vous dormez</span></>}
      subheadline={<>Templates, mockups, logos, icônes, kits UI — créez une fois, vendez à l'infini. Livraison automatique, paiement Mobile Money.</>}
      painPoints={[
        { icon: '💰', title: 'Revenus au projet', desc: 'Un client = un projet = un paiement. Entre les projets, vous ne gagnez rien.' },
        { icon: '🔄', title: 'Révisions infinies', desc: 'Clients qui demandent 10 révisions pour le prix d\'une. Votre temps est gaspillé.' },
        { icon: '🏪', title: 'Marketplaces saturées', desc: 'Creative Market, Envato prennent 30-50% et votre travail se noie parmi des millions de fichiers.' },
        { icon: '💳', title: 'Clients qui ne paient pas', desc: 'Vous livrez le mockup, le client disparaît. Encaisser avant livraison est mal vu.' },
        { icon: '📦', title: 'Pas de boutique propre', desc: 'Créer un e-commerce demande un site web, un hébergement, un système de paiement…' },
        { icon: '🌍', title: 'Marché local sous-exploité', desc: 'Les PME africaines cherchent des templates adaptés mais ne trouvent pas de source locale.' },
      ]}
      solutions={[
        { title: 'Boutique d\'assets numériques', desc: 'Votre catalogue en ligne avec preview, prix et achat en 1 clic. Professionnel et automatisé.' },
        { title: 'Livraison automatique', desc: 'Le client paie, reçoit le fichier ZIP immédiatement. Plus de livraison manuelle.' },
        { title: 'Templates localisés', desc: 'Créez des templates adaptés aux entreprises africaines : menus de restaurant, flyers d\'église, CV locaux.' },
        { title: 'Packs & bundles', desc: 'Combinez 10 templates dans un pack. Le prix par unité baisse, votre chiffre d\'affaires monte.' },
        { title: 'Programme ambassadeur', desc: 'D\'autres designers et agences recommandent vos assets et gagnent une commission.' },
        { title: 'Mobile Money + carte', desc: 'Touchez à la fois les clients locaux (Mobile Money) et internationaux (carte bancaire).' },
      ]}
      steps={[
        { step: '1', title: 'Uploadez vos assets', desc: 'ZIP contenant vos fichiers source (PSD, AI, Figma). Ajoutez des previews attractives.' },
        { step: '2', title: 'Fixez vos prix', desc: 'Templates : 2 000-10 000 FCFA. Packs : 15 000-30 000 FCFA. Kits complets : 50 000+ FCFA.' },
        { step: '3', title: 'Partagez et vendez', desc: 'Portfolio Instagram + lien Siteviral. Les ambassadeurs amplifient votre portée.' },
      ]}
      testimonial={{
        name: 'Yves K.',
        role: 'Graphic Designer, Cotonou',
        text: 'Mon pack "50 Templates Social Media" à 8 000 FCFA se vend tout seul. 15-20 ventes par mois sans aucun effort. C\'est mon meilleur investissement en temps.',
        flag: '🇧🇯',
      }}
      stats={[
        { value: '93%', label: 'Revenu conservé' },
        { value: '2 800+', label: 'Assets vendus' },
        { value: '0 FCFA', label: 'Abonnement' },
        { value: '∞', label: 'Ventes par asset' },
      ]}
      faq={[
        { q: 'Quels formats sont acceptés ?', a: 'Tous : PSD, AI, EPS, SVG, Figma, ZIP, PDF, PNG… Jusqu\'à 500 Mo par produit.' },
        { q: 'Comment empêcher la redistribution ?', a: 'Filigrane sur les previews, lien de téléchargement unique et limité, traçabilité par acheteur.' },
        { q: 'Puis-je vendre des services personnalisés ?', a: 'Oui ! Créez un produit "Logo personnalisé" avec un formulaire de brief. Le client paie, vous créez.' },
        { q: 'Quelle est la commission ?', a: '7% par vente. Pas d\'abonnement. Si vous ne vendez rien, vous ne payez rien.' },
      ]}
      cta={{ label: 'Ouvrir ma boutique design', path: '/auth?mode=signup' }}
      secondaryCta={{ label: 'Voir le marketplace', path: '/discover' }}
    />
  );
}
