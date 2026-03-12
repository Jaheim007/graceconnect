import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';
import { useI18n } from '@/i18n/I18nContext';

export default function PourEnseignantsPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <PersonaLandingPage
      seo={{
        title: isFr ? 'Siteviral pour les Enseignants — Vendez vos cours et annales en ligne' : 'Siteviral for Teachers — Sell Your Courses and Past Exams Online',
        description: isFr ? 'Plateforme pour professeurs, préparateurs d\'examens et écoles de langues. Vendez vos cours, exercices corrigés et annales par Mobile Money.' : 'Platform for teachers, exam prep tutors, and language schools. Sell your courses, corrected exercises, and past exams via Mobile Money.',
        url: 'https://siteviral.com/pour/enseignants',
      }}
      badge={isFr ? '🎓 Pour les Enseignants & Prépas' : '🎓 For Teachers & Tutors'}
      headline={isFr
        ? <>Vendez vos cours et <span className="text-primary">annales corrigées</span> en ligne à des milliers d'étudiants</>
        : <>Sell your courses and <span className="text-primary">corrected exams</span> online to thousands of students</>}
      subheadline={isFr
        ? 'Vous êtes professeur, préparateur d\'examens ou dirigez une école de langues. Arrêtez de distribuer vos supports en photocopies — vendez-les en ligne par Mobile Money et touchez 10x plus d\'étudiants.'
        : 'You\'re a teacher, exam prep tutor, or language school director. Stop distributing your materials as photocopies — sell them online via Mobile Money and reach 10x more students.'}
      painPoints={isFr ? [
        { icon: '📝', title: 'Distribution en photocopies', desc: 'Vos cours et annales sont distribués en photocopies. Portée limitée à votre classe.' },
        { icon: '🌍', title: 'Portée géographique limitée', desc: 'Vous ne touchez que les étudiants de votre ville. Des milliers d\'autres auraient besoin de vos contenus.' },
        { icon: '💸', title: 'Contenus non monétisés', desc: 'Vous créez du contenu de qualité mais ne générez aucun revenu digital.' },
        { icon: '📱', title: 'Envoi par WhatsApp', desc: 'Vous envoyez vos fichiers un par un sur WhatsApp contre paiement manuel. Pas de suivi.' },
        { icon: '🏆', title: 'Concurrence des apps gratuites', desc: 'Les étudiants utilisent des ressources gratuites de qualité médiocre au lieu de vos contenus premium.' },
        { icon: '⏰', title: 'Période d\'examens surchargée', desc: 'La demande explose avant les examens mais vous ne pouvez pas servir tout le monde en présentiel.' },
      ] : [
        { icon: '📝', title: 'Photocopy distribution', desc: 'Your courses and exams are distributed as photocopies. Reach limited to your classroom.' },
        { icon: '🌍', title: 'Limited geographic reach', desc: 'You only reach students in your city. Thousands more need your content.' },
        { icon: '💸', title: 'Unmonetized content', desc: 'You create quality content but generate no digital revenue.' },
        { icon: '📱', title: 'WhatsApp delivery', desc: 'You send files one by one on WhatsApp against manual payment. No tracking.' },
        { icon: '🏆', title: 'Free app competition', desc: 'Students use low-quality free resources instead of your premium content.' },
        { icon: '⏰', title: 'Exam season overload', desc: 'Demand spikes before exams but you can\'t serve everyone in person.' },
      ]}
      solutions={isFr ? [
        { title: 'Boutique de cours en ligne', desc: 'Vendez vos PDF, vidéos, audio, annales corrigées. Livraison instantanée après paiement Mobile Money.' },
        { title: 'Annales & exercices corrigés', desc: 'Packagez vos corrections d\'examens passés. Les étudiants achètent et téléchargent immédiatement.' },
        { title: 'Cours audio & vidéo', desc: 'Enregistrez vos explications et vendez-les comme contenus premium accessibles 24h/24.' },
        { title: 'Portée nationale', desc: 'Un étudiant à Bouaké, Douala ou Dakar peut acheter vos cours instantanément.' },
        { title: 'Revenus passifs', desc: 'Créez une fois, vendez à l\'infini. Vos anciens cours continuent de générer des revenus.' },
        { title: 'Programme ambassadeur', desc: 'Vos meilleurs étudiants partagent vos cours et touchent une commission sur chaque vente.' },
      ] : [
        { title: 'Online course store', desc: 'Sell your PDFs, videos, audio, corrected exams. Instant delivery after Mobile Money payment.' },
        { title: 'Past exams & exercises', desc: 'Package your past exam corrections. Students buy and download instantly.' },
        { title: 'Audio & video courses', desc: 'Record your explanations and sell them as premium content accessible 24/7.' },
        { title: 'Nationwide reach', desc: 'A student in any city can buy your courses instantly.' },
        { title: 'Passive income', desc: 'Create once, sell forever. Your old courses keep generating revenue.' },
        { title: 'Ambassador program', desc: 'Your best students share your courses and earn a commission on every sale.' },
      ]}
      steps={isFr ? [
        { step: '1', title: 'Créez votre page', desc: 'Inscription gratuite. Présentez-vous, votre matière, votre expérience.' },
        { step: '2', title: 'Uploadez vos contenus', desc: 'PDF d\'annales, vidéos explicatives, fiches de révision. Fixez vos prix.' },
        { step: '3', title: 'Partagez aux étudiants', desc: 'Envoyez votre lien dans les groupes WhatsApp d\'étudiants. Les ventes sont automatiques.' },
      ] : [
        { step: '1', title: 'Create your page', desc: 'Free sign-up. Present yourself, your subject, your experience.' },
        { step: '2', title: 'Upload your content', desc: 'Past exam PDFs, explainer videos, revision sheets. Set your prices.' },
        { step: '3', title: 'Share with students', desc: 'Send your link in student WhatsApp groups. Sales are automatic.' },
      ]}
      testimonial={{
        name: 'Prof. A. T.',
        role: isFr ? 'Préparateur concours' : 'Exam prep tutor',
        text: isFr
          ? 'Mes annales corrigées se vendaient en photocopies dans ma ville. Maintenant je les vends dans tout le pays par Mobile Money. Mes revenus ont été multipliés par 5.'
          : 'My corrected past exams were sold as photocopies in my city. Now I sell them nationwide via Mobile Money. My revenue multiplied by 5.',
        flag: '🇸🇳',
      }}
      stats={isFr ? [
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: 'Illimité', label: 'nombre de contenus' },
        { value: '90%', label: 'pour vous, 10% pour Siteviral' },
      ] : [
        { value: '$0', label: 'subscription fee' },
        { value: 'Unlimited', label: 'number of products' },
        { value: '90%', label: 'for you, 10% for Siteviral' },
      ]}
      faq={isFr ? [
        { q: 'Quels formats sont supportés ?', a: 'PDF, Word, PowerPoint, audio MP3, vidéo MP4 et bien d\'autres. Tout ce que vous utilisez déjà.' },
        { q: 'Les étudiants peuvent-ils payer par Mobile Money ?', a: 'Oui, Orange Money, MTN, Wave — tous les moyens de paiement mobile sont acceptés.' },
        { q: 'Peut-on offrir des contenus gratuits ?', a: 'Oui, vous pouvez mélanger contenus gratuits (pour attirer) et payants (pour monétiser). C\'est vous qui décidez.' },
        { q: 'Comment protéger mes contenus ?', a: 'Siteviral applique un watermark automatique avec le nom de l\'acheteur sur les fichiers téléchargés. Dissuasion efficace.' },
        { q: 'Peut-on vendre des packs / bundles ?', a: 'Oui, créez des bundles (ex: "Pack BAC Maths + Physique") avec remise automatique.' },
        { q: 'Comment recevoir mon argent ?', a: 'Par Mobile Money ou virement bancaire. L\'argent est versé après 72h de sécurité.' },
      ] : [
        { q: 'What formats are supported?', a: 'PDF, Word, PowerPoint, MP3 audio, MP4 video, and more. Everything you already use.' },
        { q: 'Can students pay via Mobile Money?', a: 'Yes, Orange Money, MTN, Wave — all mobile payment methods are accepted.' },
        { q: 'Can I offer free content?', a: 'Yes, mix free (to attract) and paid (to monetize) content. You decide.' },
        { q: 'How is my content protected?', a: 'Siteviral applies an automatic watermark with the buyer\'s name on downloaded files. Effective deterrent.' },
        { q: 'Can I sell bundles?', a: 'Yes, create bundles (e.g., "BAC Math + Physics Pack") with automatic discounts.' },
        { q: 'How do I receive my money?', a: 'Via Mobile Money or bank transfer. Money is released after a 72-hour security hold.' },
      ]}
      cta={{ label: isFr ? 'Vendre mes cours en ligne' : 'Sell my courses online', path: '/auth?mode=signup' }}
      secondaryCta={{ label: isFr ? 'Voir comment ça marche' : 'See how it works', path: '/features' }}
    />
  );
}
