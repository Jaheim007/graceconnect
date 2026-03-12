import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';
import { useI18n } from '@/i18n/I18nContext';

export default function PourCentresFormationPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <PersonaLandingPage
      seo={{
        title: isFr ? 'Siteviral pour les Centres de Formation & Auto-écoles — Passez au digital' : 'Siteviral for Training Centers & Driving Schools — Go Digital',
        description: isFr ? 'Complétez votre offre présentielle avec du contenu digital. Vendez cours théoriques, quiz et manuels en ligne par Mobile Money.' : 'Complement your in-person training with digital content. Sell courses, quizzes, and manuals online via Mobile Money.',
        url: 'https://siteviral.com/pour/centres-formation',
      }}
      badge={isFr ? '🏫 Pour les Centres de Formation & Auto-écoles' : '🏫 For Training Centers & Driving Schools'}
      headline={isFr
        ? <>Complétez votre formation présentielle avec du <span className="text-primary">contenu digital</span> rentable</>
        : <>Complement your in-person training with profitable <span className="text-primary">digital content</span></>}
      subheadline={isFr
        ? 'Vous dirigez une auto-école, un centre de formation professionnelle ou un institut. Vendez vos cours théoriques, manuels et quiz en ligne pour toucher plus de clients sans augmenter vos coûts fixes.'
        : 'You run a driving school, vocational training center, or institute. Sell your theoretical courses, manuals, and quizzes online to reach more clients without increasing fixed costs.'}
      painPoints={isFr ? [
        { icon: '🏢', title: 'Limité au présentiel', desc: 'Votre capacité d\'accueil est limitée. Vous refusez des clients faute de place.' },
        { icon: '🌍', title: 'Portée géographique restreinte', desc: 'Seuls les habitants de votre ville peuvent suivre vos formations.' },
        { icon: '📉', title: 'Revenus plafonnés', desc: 'Vos revenus dépendent du nombre de places physiques. Pas de scalabilité.' },
        { icon: '📚', title: 'Manuels physiques coûteux', desc: 'L\'impression de manuels coûte cher et limite vos marges.' },
        { icon: '🏥', title: 'Post-COVID, demande online', desc: 'Les apprenants veulent du contenu accessible à distance, à leur rythme.' },
        { icon: '💻', title: 'Pas de plateforme abordable', desc: 'Les LMS comme Teachable coûtent cher et ne supportent pas le Mobile Money.' },
      ] : [
        { icon: '🏢', title: 'Limited to in-person', desc: 'Your capacity is limited. You turn away clients due to lack of space.' },
        { icon: '🌍', title: 'Limited geographic reach', desc: 'Only residents of your city can attend your training.' },
        { icon: '📉', title: 'Capped revenue', desc: 'Your revenue depends on physical seats. No scalability.' },
        { icon: '📚', title: 'Expensive printed manuals', desc: 'Printing manuals is costly and limits your margins.' },
        { icon: '🏥', title: 'Post-COVID online demand', desc: 'Learners want content accessible remotely, at their own pace.' },
        { icon: '💻', title: 'No affordable platform', desc: 'LMS platforms like Teachable are expensive and don\'t support Mobile Money.' },
      ]}
      solutions={isFr ? [
        { title: 'Cours théoriques en ligne', desc: 'Vendez la partie théorique en digital : code de la route, cours préparatoires, modules e-learning.' },
        { title: 'Manuels digitaux', desc: 'Transformez vos manuels imprimés en PDF vendus en ligne. Zéro coût d\'impression.' },
        { title: 'Quiz & évaluations', desc: 'Proposez des tests de préparation, exercices corrigés, simulations d\'examens.' },
        { title: 'Paiement Mobile Money', desc: 'Vos apprenants paient par Orange Money, MTN, Wave. Pas besoin de carte bancaire.' },
        { title: 'Extension géographique', desc: 'Un apprenant à 500km peut acheter vos cours théoriques sans se déplacer.' },
        { title: 'Revenus passifs complémentaires', desc: 'Le digital complète vos revenus sans augmenter vos charges fixes.' },
      ] : [
        { title: 'Online theoretical courses', desc: 'Sell the theoretical part digitally: driving code, prep courses, e-learning modules.' },
        { title: 'Digital manuals', desc: 'Turn your printed manuals into PDFs sold online. Zero printing costs.' },
        { title: 'Quizzes & assessments', desc: 'Offer prep tests, corrected exercises, exam simulations.' },
        { title: 'Mobile Money payments', desc: 'Your learners pay via Orange Money, MTN, Wave. No credit card needed.' },
        { title: 'Geographic expansion', desc: 'A learner 500km away can buy your theoretical courses without traveling.' },
        { title: 'Passive income supplement', desc: 'Digital complements your revenue without increasing fixed costs.' },
      ]}
      steps={isFr ? [
        { step: '1', title: 'Créez votre centre en ligne', desc: 'Inscription gratuite. Présentez votre centre, vos formations, vos certifications.' },
        { step: '2', title: 'Digitalisez vos contenus', desc: 'Convertissez vos manuels en PDF, enregistrez vos cours en vidéo.' },
        { step: '3', title: 'Vendez à distance', desc: 'Partagez votre lien. Les apprenants achètent et accèdent instantanément.' },
      ] : [
        { step: '1', title: 'Create your online center', desc: 'Free sign-up. Showcase your center, courses, and certifications.' },
        { step: '2', title: 'Digitize your content', desc: 'Convert your manuals to PDF, record your courses on video.' },
        { step: '3', title: 'Sell remotely', desc: 'Share your link. Learners buy and get instant access.' },
      ]}
      testimonial={{
        name: isFr ? 'Directeur M. B.' : 'Director M. B.',
        role: isFr ? 'Auto-école' : 'Driving school',
        text: isFr
          ? 'Nos cours de code de la route sont maintenant disponibles en PDF et vidéo. Les élèves achètent par Mobile Money et révisent chez eux. Nos revenus ont augmenté de 40%.'
          : 'Our driving code courses are now available as PDF and video. Students buy via Mobile Money and study at home. Our revenue increased by 40%.',
        flag: '🇧🇫',
      }}
      stats={isFr ? [
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: '40%', label: 'de revenus supplémentaires' },
        { value: '24h/24', label: 'contenu accessible' },
      ] : [
        { value: '$0', label: 'subscription fee' },
        { value: '40%', label: 'additional revenue' },
        { value: '24/7', label: 'content accessible' },
      ]}
      faq={isFr ? [
        { q: 'Peut-on vendre des vidéos de formation ?', a: 'Oui, uploadez vos vidéos MP4. Les apprenants les achètent et les téléchargent ou les visionnent directement.' },
        { q: 'Comment gérer plusieurs formations ?', a: 'Créez un produit par formation ou par module. Vous pouvez aussi créer des bundles (pack complet).' },
        { q: 'Est-ce compatible avec le présentiel ?', a: 'Absolument, le digital complète votre offre présentielle. Vendez le théorique en ligne, gardez le pratique en centre.' },
        { q: 'Comment nos apprenants nous trouvent-ils ?', a: 'Partagez votre page Siteviral sur vos réseaux sociaux, WhatsApp et même dans votre centre physique.' },
        { q: 'Peut-on délivrer des certificats ?', a: 'Vous pouvez inclure un certificat PDF dans vos produits ou l\'envoyer manuellement après validation.' },
        { q: 'Comment recevoir les paiements ?', a: 'Par Mobile Money ou virement bancaire, après une période de sécurité de 72h.' },
      ] : [
        { q: 'Can I sell training videos?', a: 'Yes, upload your MP4 videos. Learners buy and download or stream them directly.' },
        { q: 'How to manage multiple courses?', a: 'Create one product per course or module. You can also create bundles (complete packs).' },
        { q: 'Is it compatible with in-person training?', a: 'Absolutely, digital complements your in-person offering. Sell theory online, keep practice at the center.' },
        { q: 'How do learners find us?', a: 'Share your Siteviral page on social media, WhatsApp, and even in your physical center.' },
        { q: 'Can we issue certificates?', a: 'You can include a PDF certificate in your products or send it manually after validation.' },
        { q: 'How do we receive payments?', a: 'Via Mobile Money or bank transfer, after a 72-hour security period.' },
      ]}
      cta={{ label: isFr ? 'Digitaliser mon centre de formation' : 'Digitize my training center', path: '/auth?mode=signup' }}
      secondaryCta={{ label: isFr ? 'Voir les fonctionnalités' : 'See features', path: '/features' }}
    />
  );
}
