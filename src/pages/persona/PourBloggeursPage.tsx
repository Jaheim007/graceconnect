import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';

export default function PourBloggeursPage() {
  return (
    <PersonaLandingPage
      seo={{
        title: 'Siteviral pour les Blogueurs — Monétisez votre audience',
        description: 'Transformez votre blog en business digital. Vendez ebooks, guides et formations à votre audience par Mobile Money.',
        url: 'https://siteviral.com/pour/blogueurs',
      }}
      badge="✍️ Pour les Blogueurs"
      headline={<>Transformez votre <span className="text-primary">audience</span> en revenus concrets</>}
      subheadline="Vous avez des milliers de lecteurs mais zéro revenu. Arrêtez de dépendre de la publicité — vendez vos ebooks, guides et formations directement à votre communauté."
      painPoints={[
        { icon: '📉', title: 'Publicité qui ne paye pas', desc: 'AdSense rapporte des centimes en Afrique. Votre trafic ne se convertit pas en revenus.' },
        { icon: '📚', title: 'Contenus non monétisés', desc: 'Vous écrivez du contenu premium mais le donnez gratuitement sans retour.' },
        { icon: '🛒', title: 'Pas de boutique intégrée', desc: 'WordPress + WooCommerce est complexe et les passerelles de paiement africaines sont difficiles à intégrer.' },
        { icon: '💸', title: 'Sponsoring rare', desc: 'Les marques sponsorisent peu les blogueurs africains. Le modèle est fragile.' },
        { icon: '📱', title: 'Audience mobile', desc: '80% de vos lecteurs sont sur mobile mais votre site n\'est pas optimisé pour l\'achat mobile.' },
        { icon: '🔄', title: 'Revenus imprévisibles', desc: 'Un mois bien, un mois rien. Pas de revenus récurrents ni de stabilité.' },
      ]}
      solutions={[
        { title: 'Ebooks & guides premium', desc: 'Vendez vos meilleurs contenus en PDF. Livraison instantanée après paiement Mobile Money.' },
        { title: 'Newsletter payante', desc: 'Proposez un abonnement premium avec du contenu exclusif pour vos lecteurs les plus fidèles.' },
        { title: 'Formations en ligne', desc: 'Packagez votre expertise en formations vidéo ou audio. Vente automatique 24h/24.' },
        { title: 'Page de marque', desc: 'Une vitrine professionnelle qui centralise tous vos produits, articles et liens.' },
        { title: 'Mobile Money intégré', desc: 'Vos lecteurs africains payent en 1 clic par Orange Money, MTN ou Wave.' },
        { title: 'Affiliation intégrée', desc: 'Vos lecteurs partagent vos produits et touchent une commission. Croissance virale.' },
      ]}
      steps={[
        { step: '1', title: 'Créez votre boutique', desc: 'Inscription gratuite. Importez votre identité de marque en 2 minutes.' },
        { step: '2', title: 'Ajoutez vos produits', desc: 'Ebooks, guides PDF, templates, formations. Fixez vos prix librement.' },
        { step: '3', title: 'Partagez à vos lecteurs', desc: 'Ajoutez le lien dans vos articles et bio. Vos lecteurs achètent en 1 clic.' },
      ]}
      testimonial={{
        name: 'Aminata K.',
        role: 'Blogueuse lifestyle',
        text: 'Mon premier ebook s\'est vendu à 150 exemplaires en une semaine grâce à ma communauté WhatsApp. Siteviral a rendu tout ça possible.',
        flag: '🇨🇮',
      }}
      stats={[
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: '2 min', label: 'pour lancer sa boutique' },
        { value: '90%', label: 'de marge pour vous' },
      ]}
      faq={[
        { q: 'Puis-je vendre des ebooks ?', a: 'Oui, uploadez vos PDF et fixez votre prix. Les acheteurs téléchargent instantanément après paiement.' },
        { q: 'Comment intégrer Siteviral à mon blog ?', a: 'Ajoutez simplement votre lien Siteviral dans vos articles, sidebar ou bio. Aucune intégration technique nécessaire.' },
        { q: 'Mes lecteurs peuvent-ils payer par Mobile Money ?', a: 'Oui, tous les moyens de paiement mobile africains sont supportés : Orange Money, MTN, Wave, carte bancaire.' },
        { q: 'Peut-on offrir des contenus gratuits ?', a: 'Oui, créez des lead magnets gratuits pour capturer des emails, puis vendez vos produits premium.' },
        { q: 'Y a-t-il des limites de produits ?', a: 'Non, vous pouvez ajouter autant de produits que vous voulez. Aucune limite.' },
        { q: 'Comment recevoir mes paiements ?', a: 'Par Mobile Money ou virement bancaire. Versements après 72h de sécurité.' },
      ]}
      cta={{ label: 'Monétiser mon audience', path: '/auth?mode=signup' }}
      secondaryCta={{ label: 'Découvrir les fonctionnalités', path: '/features' }}
    />
  );
}
