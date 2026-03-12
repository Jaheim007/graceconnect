import { SEOGuidePage } from '@/components/landing/SEOGuidePage';
export default function GuideVendreCoursPage() {
  return <SEOGuidePage
    seo={{ title: 'Vendre des cours en ligne en Afrique — Guide', description: 'Comment vendre vos cours, formations et annales en ligne en Afrique. Paiement Mobile Money, zéro abonnement.', url: 'https://siteviral.com/guide/vendre-cours-en-ligne' }}
    badge="🎓 Guide SEO"
    title="Vendre des cours en ligne en Afrique"
    intro="Vous êtes formateur, professeur ou coach ? Vos cours, exercices et annales peuvent toucher des milliers d'étudiants au-delà de votre ville. Voici comment les vendre en ligne."
    sections={[
      { heading: '1. Le marché de l\'éducation digitale en Afrique', content: 'Des millions d\'étudiants cherchent du contenu éducatif de qualité. Udemy et Coursera sont en dollars et ne supportent pas le Mobile Money. Le marché est grand ouvert.' },
      { heading: '2. Les formats qui se vendent', content: 'PDF d\'annales corrigées, fiches de révision, vidéos explicatives, cours audio, exercices corrigés. Les packs thématiques (ex: "Pack BAC Maths") se vendent particulièrement bien.' },
      { heading: '3. Fixer le bon prix', content: 'Pour les étudiants africains : 500 à 3 000 FCFA par document. Pour les formations complètes : 5 000 à 15 000 FCFA. La stratégie : un contenu gratuit pour attirer + des contenus payants pour monétiser.' },
      { heading: '4. Créer votre boutique de cours', content: 'Inscription gratuite sur Siteviral → Créez votre organisation "Prof [Votre Nom]" → Uploadez vos cours → Fixez les prix → Partagez dans les groupes d\'étudiants.' },
      { heading: '5. Toucher plus d\'étudiants', content: 'Partagez dans les groupes WhatsApp d\'étudiants. Publiez sur Facebook. Activez le programme ambassadeur : vos meilleurs étudiants partagent et gagnent une commission.' },
      { heading: '6. Protection de vos contenus', content: 'Watermark automatique sur les PDF. Chaque fichier téléchargé porte le nom de l\'acheteur. Dissuasion efficace contre le partage illégal.' },
    ]}
    cta={{ label: 'Vendre mes cours en ligne', path: '/auth?mode=signup' }}
  />;
}
