import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';
import { useI18n } from '@/i18n/I18nContext';

export default function PourPhotographesPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <PersonaLandingPage
      seo={{
        title: isFr ? 'Siteviral pour Photographes — Vendez vos photos & presets en ligne' : 'Siteviral for Photographers — Sell your photos & presets online',
        description: isFr ? 'Monétisez vos photos, presets Lightroom et services photo. Paiement Mobile Money, livraison instantanée, programme ambassadeur.' : 'Monetize your photos, Lightroom presets and photo services. Mobile Money payments, instant delivery, ambassador program.',
        url: 'https://siteviral.com/pour/photographes',
      }}
      badge={isFr ? '📸 Pour les Photographes' : '📸 For Photographers'}
      headline={isFr ? <>Monétisez vos photos <span className="text-primary">au-delà des shootings</span></> : <>Monetize your photos <span className="text-primary">beyond photo shoots</span></>}
      subheadline={isFr ? 'Vendez vos presets, packs de photos, formations et galeries exclusives. Créez des revenus passifs avec votre talent visuel.' : 'Sell your presets, photo packs, training and exclusive galleries. Create passive income with your visual talent.'}
      painPoints={isFr ? [
        { icon: '📅', title: 'Revenus imprévisibles', desc: 'Pas de shooting = pas de revenus. Vos mois creux sont stressants financièrement.' },
        { icon: '🆓', title: 'Contenu donné gratuitement', desc: 'Vos presets circulent sur WhatsApp sans aucune compensation. Votre travail est dévalué.' },
        { icon: '💳', title: 'Clients qui ne paient pas', desc: 'Difficile de collecter le paiement avant livraison. Les screenshots de paiement sont flous.' },
        { icon: '🌐', title: 'Pas de boutique en ligne', desc: 'Créer un site e-commerce coûte cher et demande des compétences techniques.' },
        { icon: '📉', title: 'Shutterstock paie 0,25$', desc: 'Les banques de photos paient des centimes par téléchargement. Impossible de vivre de ça.' },
        { icon: '🔗', title: 'Pas de communauté', desc: 'Vos clients achètent une fois et disparaissent. Pas de relation durable.' },
      ] : [
        { icon: '📅', title: 'Unpredictable income', desc: 'No shoot = no income. Your slow months are financially stressful.' },
        { icon: '🆓', title: 'Content given away for free', desc: 'Your presets circulate on WhatsApp without any compensation. Your work is devalued.' },
        { icon: '💳', title: 'Clients who don\'t pay', desc: 'Hard to collect payment before delivery. Payment screenshots are blurry.' },
        { icon: '🌐', title: 'No online store', desc: 'Creating an e-commerce site is expensive and requires technical skills.' },
        { icon: '📉', title: 'Shutterstock pays $0.25', desc: 'Stock photo sites pay pennies per download. Impossible to make a living.' },
        { icon: '🔗', title: 'No community', desc: 'Your clients buy once and disappear. No lasting relationship.' },
      ]}
      solutions={isFr ? [
        { title: 'Boutique de presets', desc: 'Vendez vos presets Lightroom, packs de LUT, filtres VSCO. Livraison automatique après paiement.' },
        { title: 'Galeries exclusives', desc: 'Proposez des collections photo premium accessibles uniquement aux acheteurs.' },
        { title: 'Formations photo', desc: 'Transformez votre expertise en cours vendables : retouche, composition, éclairage.' },
        { title: 'Paiement avant livraison', desc: 'Plus de screenshots flous. Le client paie, reçoit son fichier. Simple et sécurisé.' },
        { title: 'Ambassadeurs photographes', desc: 'D\'autres photographes recommandent vos presets et gagnent une commission.' },
        { title: 'Mobile Money natif', desc: 'Vos clients paient comme ils en ont l\'habitude. MTN, Orange, Wave, Airtel.' },
      ] : [
        { title: 'Preset store', desc: 'Sell your Lightroom presets, LUT packs, VSCO filters. Automatic delivery after payment.' },
        { title: 'Exclusive galleries', desc: 'Offer premium photo collections accessible only to buyers.' },
        { title: 'Photo courses', desc: 'Turn your expertise into sellable courses: editing, composition, lighting.' },
        { title: 'Payment before delivery', desc: 'No more blurry screenshots. Client pays, receives their file. Simple and secure.' },
        { title: 'Photographer ambassadors', desc: 'Other photographers recommend your presets and earn a commission.' },
        { title: 'Native Mobile Money', desc: 'Your clients pay the way they\'re used to. MTN, Orange, Wave, Airtel.' },
      ]}
      steps={isFr ? [
        { step: '1', title: 'Créez votre galerie', desc: 'Inscrivez-vous, ajoutez votre portfolio et une bio. Votre vitrine pro est prête en 2 minutes.' },
        { step: '2', title: 'Uploadez vos produits', desc: 'Presets, photos, formations — uploadez, fixez un prix, publiez. C\'est tout.' },
        { step: '3', title: 'Vendez en automatique', desc: 'Partagez le lien. Chaque vente est traitée automatiquement. Dormez et gagnez.' },
      ] : [
        { step: '1', title: 'Create your gallery', desc: 'Sign up, add your portfolio and a bio. Your pro storefront is ready in 2 minutes.' },
        { step: '2', title: 'Upload your products', desc: 'Presets, photos, courses — upload, set a price, publish. That\'s it.' },
        { step: '3', title: 'Sell automatically', desc: 'Share the link. Every sale is processed automatically. Sleep and earn.' },
      ]}
      testimonial={{
        name: 'Fatou D.',
        role: isFr ? 'Photographe de mariage, Dakar' : 'Wedding photographer, Dakar',
        text: isFr ? 'J\'ai créé un pack de 12 presets à 5 000 FCFA. En 2 mois, j\'ai eu 180 ventes. C\'est devenu mon deuxième salaire sans aucun effort supplémentaire.' : 'I created a pack of 12 presets for $8. In 2 months, I had 180 sales. It became my second salary without any extra effort.',
        flag: '🇸🇳',
      }}
      stats={isFr ? [
        { value: '93%', label: 'Revenu conservé' },
        { value: '3 200+', label: 'Presets vendus' },
        { value: '0 FCFA', label: 'Abonnement' },
        { value: '< 2 min', label: 'Mise en ligne' },
      ] : [
        { value: '93%', label: 'Revenue kept' },
        { value: '3,200+', label: 'Presets sold' },
        { value: '$0', label: 'Subscription' },
        { value: '< 2 min', label: 'Setup time' },
      ]}
      faq={isFr ? [
        { q: 'Quels formats de fichiers sont acceptés ?', a: 'Tous les formats : DNG, XMP, ZIP, JPEG, PNG, PSD, RAW… Jusqu\'à 500 Mo par fichier.' },
        { q: 'Puis-je vendre des packs de photos stock ?', a: 'Oui ! Créez des collections thématiques (mariage, nature, portrait) et vendez-les à prix fixe.' },
        { q: 'Comment protéger mes photos du vol ?', a: 'Les fichiers ne sont accessibles qu\'après paiement. Chaque téléchargement est tracé et limité.' },
        { q: 'Ça marche pour la vidéo aussi ?', a: 'Absolument ! Vendez vos LUTs, templates de montage, et formations vidéo.' },
      ] : [
        { q: 'What file formats are accepted?', a: 'All formats: DNG, XMP, ZIP, JPEG, PNG, PSD, RAW… Up to 500 MB per file.' },
        { q: 'Can I sell stock photo packs?', a: 'Yes! Create themed collections (wedding, nature, portrait) and sell them at a fixed price.' },
        { q: 'How to protect my photos from theft?', a: 'Files are only accessible after payment. Each download is tracked and limited.' },
        { q: 'Does it work for video too?', a: 'Absolutely! Sell your LUTs, editing templates, and video courses.' },
      ]}
      cta={{ label: isFr ? 'Créer ma boutique photo' : 'Create my photo store', path: '/auth?mode=signup' }}
      secondaryCta={{ label: isFr ? 'Voir des exemples' : 'See examples', path: '/discover' }}
    />
  );
}
