import { SEOGuidePage } from '@/components/landing/SEOGuidePage';
export default function GuidePlateformeDonsPage() {
  return <SEOGuidePage
    seo={{ title: 'Plateforme de dons en ligne pour l\'Afrique — Guide complet', description: 'Découvrez la meilleure plateforme pour collecter des dons en Afrique par Mobile Money. Alternative à GoFundMe adaptée au continent.', url: 'https://siteviral.com/guide/plateforme-dons-afrique' }}
    badge="❤️ Guide SEO"
    title="Plateforme de dons en ligne pour l'Afrique"
    intro="GoFundMe ne supporte pas l'Afrique. PayPal est limité. Découvrez comment collecter des dons par Mobile Money avec une plateforme pensée pour le continent."
    sections={[
      { heading: '1. Le problème des dons en Afrique', content: 'Les plateformes occidentales ne supportent pas le Mobile Money. Les donateurs africains n\'ont souvent pas de carte bancaire. Résultat : les ONG et églises collectent en espèces, sans traçabilité.' },
      { heading: '2. Ce qu\'il faut dans une plateforme de dons africaine', content: 'Paiement Mobile Money natif, multi-devises (FCFA + EUR/USD pour la diaspora), barre de progression publique, reçus automatiques, et zéro abonnement.' },
      { heading: '3. Comment Siteviral résout le problème', content: 'Créez une campagne de collecte en 5 minutes. Vos donateurs payent par Orange Money, MTN, Wave ou carte bancaire. Tout est tracé et transparent.' },
      { heading: '4. Créer votre première campagne', content: 'Inscription → Créez votre organisation → Lancez une campagne → Définissez l\'objectif → Partagez le lien. Simple et rapide.' },
      { heading: '5. Maximiser vos collectes', content: 'Partagez sur WhatsApp et Facebook. La barre de progression motive les donateurs. Activez les ambassadeurs pour amplifier la portée.' },
      { heading: '6. Transparence et confiance', content: 'Chaque don est tracé. Les donateurs voient exactement combien a été collecté. Les fonds sont versés après vérification KYC.' },
    ]}
    cta={{ label: 'Lancer ma campagne de dons', path: '/auth?mode=signup' }}
  />;
}
