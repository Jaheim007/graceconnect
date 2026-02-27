import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';

export default function PourPhotographesPage() {
  return (
    <PersonaLandingPage
      seo={{
        title: 'Siteviral pour Photographes — Vendez vos photos & presets en ligne',
        description: 'Monétisez vos photos, presets Lightroom et services photo. Paiement Mobile Money, livraison instantanée, programme ambassadeur.',
        url: 'https://siteviral.com/pour/photographes',
      }}
      badge="📸 Pour les Photographes"
      headline={<>Monétisez vos photos <span className="text-primary">au-delà des shootings</span></>}
      subheadline={<>Vendez vos presets, packs de photos, formations et galeries exclusives. Créez des revenus passifs avec votre talent visuel.</>}
      painPoints={[
        { icon: '📅', title: 'Revenus imprévisibles', desc: 'Pas de shooting = pas de revenus. Vos mois creux sont stressants financièrement.' },
        { icon: '🆓', title: 'Contenu donné gratuitement', desc: 'Vos presets circulent sur WhatsApp sans aucune compensation. Votre travail est dévalué.' },
        { icon: '💳', title: 'Clients qui ne paient pas', desc: 'Difficile de collecter le paiement avant livraison. Les screenshots de paiement sont flous.' },
        { icon: '🌐', title: 'Pas de boutique en ligne', desc: 'Créer un site e-commerce coûte cher et demande des compétences techniques.' },
        { icon: '📉', title: 'Shutterstock paie 0,25$', desc: 'Les banques de photos paient des centimes par téléchargement. Impossible de vivre de ça.' },
        { icon: '🔗', title: 'Pas de communauté', desc: 'Vos clients achètent une fois et disparaissent. Pas de relation durable.' },
      ]}
      solutions={[
        { title: 'Boutique de presets', desc: 'Vendez vos presets Lightroom, packs de LUT, filtres VSCO. Livraison automatique après paiement.' },
        { title: 'Galeries exclusives', desc: 'Proposez des collections photo premium accessibles uniquement aux acheteurs.' },
        { title: 'Formations photo', desc: 'Transformez votre expertise en cours vendables : retouche, composition, éclairage.' },
        { title: 'Paiement avant livraison', desc: 'Plus de screenshots flous. Le client paie, reçoit son fichier. Simple et sécurisé.' },
        { title: 'Ambassadeurs photographes', desc: 'D\'autres photographes recommandent vos presets et gagnent une commission.' },
        { title: 'Mobile Money natif', desc: 'Vos clients paient comme ils en ont l\'habitude. MTN, Orange, Wave, Airtel.' },
      ]}
      steps={[
        { step: '1', title: 'Créez votre galerie', desc: 'Inscrivez-vous, ajoutez votre portfolio et une bio. Votre vitrine pro est prête en 2 minutes.' },
        { step: '2', title: 'Uploadez vos produits', desc: 'Presets, photos, formations — uploadez, fixez un prix, publiez. C\'est tout.' },
        { step: '3', title: 'Vendez en automatique', desc: 'Partagez le lien. Chaque vente est traitée automatiquement. Dormez et gagnez.' },
      ]}
      testimonial={{
        name: 'Fatou D.',
        role: 'Photographe de mariage, Dakar',
        text: 'J\'ai créé un pack de 12 presets à 5 000 FCFA. En 2 mois, j\'ai eu 180 ventes. C\'est devenu mon deuxième salaire sans aucun effort supplémentaire.',
        flag: '🇸🇳',
      }}
      stats={[
        { value: '93%', label: 'Revenu conservé' },
        { value: '3 200+', label: 'Presets vendus' },
        { value: '0 FCFA', label: 'Abonnement' },
        { value: '< 2 min', label: 'Mise en ligne' },
      ]}
      faq={[
        { q: 'Quels formats de fichiers sont acceptés ?', a: 'Tous les formats : DNG, XMP, ZIP, JPEG, PNG, PSD, RAW… Jusqu\'à 500 Mo par fichier.' },
        { q: 'Puis-je vendre des packs de photos stock ?', a: 'Oui ! Créez des collections thématiques (mariage, nature, portrait) et vendez-les à prix fixe.' },
        { q: 'Comment protéger mes photos du vol ?', a: 'Les fichiers ne sont accessibles qu\'après paiement. Chaque téléchargement est tracé et limité.' },
        { q: 'Ça marche pour la vidéo aussi ?', a: 'Absolument ! Vendez vos LUTs, templates de montage, et formations vidéo.' },
      ]}
      cta={{ label: 'Créer ma boutique photo', path: '/auth?mode=signup' }}
      secondaryCta={{ label: 'Voir des exemples', path: '/discover' }}
    />
  );
}
