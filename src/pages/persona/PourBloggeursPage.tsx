import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';
import { useI18n } from '@/i18n/I18nContext';

export default function PourBloggeursPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <PersonaLandingPage
      seo={{
        title: isFr ? 'Siteviral pour les Blogueurs — Monétisez votre audience' : 'Siteviral for Bloggers — Monetize your audience',
        description: isFr ? 'Transformez votre blog en business digital. Vendez ebooks, guides et formations à votre audience par Mobile Money.' : 'Turn your blog into a digital business. Sell ebooks, guides and courses to your audience via Mobile Money.',
        url: 'https://siteviral.com/pour/blogueurs',
      }}
      badge={isFr ? '✍️ Pour les Blogueurs' : '✍️ For Bloggers'}
      headline={isFr ? <>Transformez votre <span className="text-primary">audience</span> en revenus concrets</> : <>Turn your <span className="text-primary">audience</span> into real revenue</>}
      subheadline={isFr ? 'Vous avez des milliers de lecteurs mais zéro revenu. Arrêtez de dépendre de la publicité — vendez vos ebooks, guides et formations directement à votre communauté.' : 'You have thousands of readers but zero revenue. Stop depending on ads — sell your ebooks, guides and courses directly to your community.'}
      painPoints={isFr ? [
        { icon: '📉', title: 'Publicité qui ne paye pas', desc: 'AdSense rapporte des centimes en Afrique. Votre trafic ne se convertit pas en revenus.' },
        { icon: '📚', title: 'Contenus non monétisés', desc: 'Vous écrivez du contenu premium mais le donnez gratuitement sans retour.' },
        { icon: '🛒', title: 'Pas de boutique intégrée', desc: 'WordPress + WooCommerce est complexe et les passerelles de paiement africaines sont difficiles à intégrer.' },
        { icon: '💸', title: 'Sponsoring rare', desc: 'Les marques sponsorisent peu les blogueurs africains. Le modèle est fragile.' },
        { icon: '📱', title: 'Audience mobile', desc: '80% de vos lecteurs sont sur mobile mais votre site n\'est pas optimisé pour l\'achat mobile.' },
        { icon: '🔄', title: 'Revenus imprévisibles', desc: 'Un mois bien, un mois rien. Pas de revenus récurrents ni de stabilité.' },
      ] : [
        { icon: '📉', title: 'Ads don\'t pay', desc: 'AdSense pays pennies in Africa. Your traffic doesn\'t convert to revenue.' },
        { icon: '📚', title: 'Unmonetized content', desc: 'You write premium content but give it away for free with no return.' },
        { icon: '🛒', title: 'No integrated store', desc: 'WordPress + WooCommerce is complex and African payment gateways are hard to integrate.' },
        { icon: '💸', title: 'Rare sponsorships', desc: 'Brands rarely sponsor African bloggers. The model is fragile.' },
        { icon: '📱', title: 'Mobile audience', desc: '80% of your readers are on mobile but your site isn\'t optimized for mobile purchases.' },
        { icon: '🔄', title: 'Unpredictable revenue', desc: 'One good month, one bad month. No recurring revenue or stability.' },
      ]}
      solutions={isFr ? [
        { title: 'Ebooks & guides premium', desc: 'Vendez vos meilleurs contenus en PDF. Livraison instantanée après paiement Mobile Money.' },
        { title: 'Newsletter payante', desc: 'Proposez un abonnement premium avec du contenu exclusif pour vos lecteurs les plus fidèles.' },
        { title: 'Formations en ligne', desc: 'Packagez votre expertise en formations vidéo ou audio. Vente automatique 24h/24.' },
        { title: 'Page de marque', desc: 'Une vitrine professionnelle qui centralise tous vos produits, articles et liens.' },
        { title: 'Mobile Money intégré', desc: 'Vos lecteurs africains payent en 1 clic par Orange Money, MTN ou Wave.' },
        { title: 'Affiliation intégrée', desc: 'Vos lecteurs partagent vos produits et touchent une commission. Croissance virale.' },
      ] : [
        { title: 'Premium ebooks & guides', desc: 'Sell your best content as PDF. Instant delivery after Mobile Money payment.' },
        { title: 'Paid newsletter', desc: 'Offer a premium subscription with exclusive content for your most loyal readers.' },
        { title: 'Online courses', desc: 'Package your expertise into video or audio courses. Automatic sales 24/7.' },
        { title: 'Brand page', desc: 'A professional storefront that centralizes all your products, articles and links.' },
        { title: 'Integrated Mobile Money', desc: 'Your African readers pay in 1 click via Orange Money, MTN or Wave.' },
        { title: 'Built-in affiliate', desc: 'Your readers share your products and earn a commission. Viral growth.' },
      ]}
      steps={isFr ? [
        { step: '1', title: 'Créez votre boutique', desc: 'Inscription gratuite. Importez votre identité de marque en 2 minutes.' },
        { step: '2', title: 'Ajoutez vos produits', desc: 'Ebooks, guides PDF, templates, formations. Fixez vos prix librement.' },
        { step: '3', title: 'Partagez à vos lecteurs', desc: 'Ajoutez le lien dans vos articles et bio. Vos lecteurs achètent en 1 clic.' },
      ] : [
        { step: '1', title: 'Create your store', desc: 'Free signup. Import your brand identity in 2 minutes.' },
        { step: '2', title: 'Add your products', desc: 'Ebooks, PDF guides, templates, courses. Set your prices freely.' },
        { step: '3', title: 'Share with your readers', desc: 'Add the link in your articles and bio. Your readers buy in 1 click.' },
      ]}
      testimonial={{
        name: 'Aminata K.',
        role: isFr ? 'Blogueuse lifestyle' : 'Lifestyle blogger',
        text: isFr ? 'Mon premier ebook s\'est vendu à 150 exemplaires en une semaine grâce à ma communauté WhatsApp. Siteviral a rendu tout ça possible.' : 'My first ebook sold 150 copies in one week thanks to my WhatsApp community. Siteviral made it all possible.',
        flag: '🇬🇭',
      }}
      stats={isFr ? [
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: '2 min', label: 'pour lancer sa boutique' },
        { value: '90%', label: 'de marge pour vous' },
      ] : [
        { value: '$0', label: 'subscription' },
        { value: '2 min', label: 'to launch your store' },
        { value: '90%', label: 'margin for you' },
      ]}
      faq={isFr ? [
        { q: 'Puis-je vendre des ebooks ?', a: 'Oui, uploadez vos PDF et fixez votre prix. Les acheteurs téléchargent instantanément après paiement.' },
        { q: 'Comment intégrer Siteviral à mon blog ?', a: 'Ajoutez simplement votre lien Siteviral dans vos articles, sidebar ou bio. Aucune intégration technique nécessaire.' },
        { q: 'Mes lecteurs peuvent-ils payer par Mobile Money ?', a: 'Oui, tous les moyens de paiement mobile africains sont supportés : Orange Money, MTN, Wave, carte bancaire.' },
        { q: 'Y a-t-il des limites de produits ?', a: 'Non, vous pouvez ajouter autant de produits que vous voulez. Aucune limite.' },
      ] : [
        { q: 'Can I sell ebooks?', a: 'Yes, upload your PDFs and set your price. Buyers download instantly after payment.' },
        { q: 'How to integrate Siteviral with my blog?', a: 'Simply add your Siteviral link in your articles, sidebar or bio. No technical integration needed.' },
        { q: 'Can my readers pay by Mobile Money?', a: 'Yes, all African mobile payment methods are supported: Orange Money, MTN, Wave, bank card.' },
        { q: 'Are there product limits?', a: 'No, you can add as many products as you want. No limits.' },
      ]}
      cta={{ label: isFr ? 'Monétiser mon audience' : 'Monetize my audience', path: '/auth?mode=signup' }}
      secondaryCta={{ label: isFr ? 'Découvrir les fonctionnalités' : 'Discover features', path: '/features' }}
    />
  );
}
