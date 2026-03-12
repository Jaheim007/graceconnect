import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';
import { useI18n } from '@/i18n/I18nContext';

export default function PourRetraitesPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <PersonaLandingPage
      seo={{
        title: isFr ? 'Siteviral pour les Retraités — Transmettez et monétisez votre expérience' : 'Siteviral for Retirees — Share and Monetize Your Experience',
        description: isFr ? 'Cadres retraités et seniors : partagez votre expertise accumulée en vendant guides, mémoires et formations en ligne.' : 'Retired executives and seniors: share your accumulated expertise by selling guides, memoirs, and online courses.',
        url: 'https://siteviral.com/pour/retraites',
      }}
      badge={isFr ? '🎓 Pour les Retraités & Seniors' : '🎓 For Retirees & Seniors'}
      headline={isFr
        ? <>Transmettez votre <span className="text-primary">expérience</span> et générez un complément de revenu</>
        : <>Share your <span className="text-primary">experience</span> and earn extra income</>}
      subheadline={isFr
        ? 'Vous avez 20, 30 ou 40 ans d\'expérience professionnelle. Cette richesse mérite d\'être partagée. Publiez vos guides, mémoires et formations en ligne — simplement depuis votre téléphone.'
        : 'You have 20, 30, or 40 years of professional experience. This wealth deserves to be shared. Publish your guides, memoirs, and courses online — simply from your phone.'}
      painPoints={isFr ? [
        { icon: '📚', title: 'Savoir non transmis', desc: 'Des décennies d\'expertise risquent de se perdre. Personne n\'a documenté votre parcours.' },
        { icon: '💰', title: 'Pension insuffisante', desc: 'La retraite ne couvre pas toujours les besoins. Un complément de revenu serait bienvenu.' },
        { icon: '🖥️', title: 'Technologie intimidante', desc: 'Les outils numériques semblent complexes. Vous ne savez pas par où commencer.' },
        { icon: '📖', title: 'Écrire un livre est long', desc: 'Publier un livre traditionnel prend des mois et coûte cher. Pas garanti de vendre.' },
        { icon: '🌍', title: 'Audience limitée', desc: 'Votre réseau local ne suffit pas pour rentabiliser un projet éditorial.' },
        { icon: '⏰', title: 'Trop de temps libre', desc: 'La retraite peut être longue. Un projet structurant donne du sens aux journées.' },
      ] : [
        { icon: '📚', title: 'Knowledge not passed on', desc: 'Decades of expertise risk being lost. Nobody has documented your journey.' },
        { icon: '💰', title: 'Insufficient pension', desc: 'Retirement doesn\'t always cover needs. Extra income would be welcome.' },
        { icon: '🖥️', title: 'Intimidating technology', desc: 'Digital tools seem complex. You don\'t know where to start.' },
        { icon: '📖', title: 'Writing a book takes long', desc: 'Traditional publishing takes months and is expensive. No guaranteed sales.' },
        { icon: '🌍', title: 'Limited audience', desc: 'Your local network isn\'t enough to make an editorial project profitable.' },
        { icon: '⏰', title: 'Too much free time', desc: 'Retirement can feel long. A meaningful project gives purpose to your days.' },
      ]}
      solutions={isFr ? [
        { title: 'Publication simple', desc: 'Écrivez et publiez vos guides, mémoires ou récits de carrière en PDF. Vente instantanée.' },
        { title: 'Interface accessible', desc: 'Conçu pour être simple. Si vous savez envoyer un message WhatsApp, vous savez utiliser Siteviral.' },
        { title: 'Formations audio', desc: 'Enregistrez vos connaissances en audio. Les jeunes professionnels achètent votre expérience.' },
        { title: 'Mobile Money', desc: 'Recevez vos revenus directement sur votre Mobile Money. Pas besoin de compte bancaire spécial.' },
        { title: 'Communauté intergénérationnelle', desc: 'Connectez-vous avec les jeunes professionnels qui ont besoin de vos conseils.' },
        { title: 'Zéro risque financier', desc: 'Aucun investissement initial. Pas d\'abonnement. Vous ne payez que quand vous vendez.' },
      ] : [
        { title: 'Simple publishing', desc: 'Write and publish your guides, memoirs, or career stories as PDFs. Instant sales.' },
        { title: 'Accessible interface', desc: 'Designed to be simple. If you can send a WhatsApp message, you can use Siteviral.' },
        { title: 'Audio courses', desc: 'Record your knowledge as audio. Young professionals buy your experience.' },
        { title: 'Mobile Money', desc: 'Receive your earnings directly to your Mobile Money. No special bank account needed.' },
        { title: 'Intergenerational community', desc: 'Connect with young professionals who need your advice.' },
        { title: 'Zero financial risk', desc: 'No upfront investment. No subscription. You only pay when you sell.' },
      ]}
      steps={isFr ? [
        { step: '1', title: 'Inscrivez-vous', desc: 'Gratuit et simple. Votre petit-fils peut vous aider en 2 minutes.' },
        { step: '2', title: 'Partagez votre savoir', desc: 'Uploadez vos PDF, enregistrements audio ou vidéos. Fixez un prix accessible.' },
        { step: '3', title: 'Recevez des revenus', desc: 'Les ventes sont automatiques. L\'argent arrive sur votre Mobile Money.' },
      ] : [
        { step: '1', title: 'Sign up', desc: 'Free and simple. Your grandchild can help you in 2 minutes.' },
        { step: '2', title: 'Share your knowledge', desc: 'Upload your PDFs, audio recordings, or videos. Set an accessible price.' },
        { step: '3', title: 'Receive income', desc: 'Sales are automatic. Money arrives on your Mobile Money.' },
      ]}
      testimonial={{
        name: 'M. Ouédraogo',
        role: isFr ? 'Ancien DG, retraité' : 'Former CEO, retired',
        text: isFr
          ? 'J\'ai publié "40 ans de management en Afrique de l\'Ouest". 200 exemplaires vendus en 3 mois. À 67 ans, je suis devenu auteur digital.'
          : 'I published "40 Years of Management in West Africa". 200 copies sold in 3 months. At 67, I became a digital author.',
        flag: '🇧🇫',
      }}
      stats={isFr ? [
        { value: '0 FCFA', label: 'pour commencer' },
        { value: 'Simple', label: 'comme WhatsApp' },
        { value: '90%', label: 'pour vous' },
      ] : [
        { value: '$0', label: 'to get started' },
        { value: 'Simple', label: 'as WhatsApp' },
        { value: '90%', label: 'for you' },
      ]}
      faq={isFr ? [
        { q: 'C\'est vraiment simple à utiliser ?', a: 'Oui, l\'interface est conçue pour être aussi simple que WhatsApp. Un membre de votre famille peut vous aider au début.' },
        { q: 'Que puis-je publier ?', a: 'Mémoires de carrière, guides pratiques, leçons de vie, formations audio, tout ce qui valorise votre expérience.' },
        { q: 'C\'est gratuit ?', a: 'Oui, aucun abonnement. Siteviral prend 10% uniquement quand quelqu\'un achète votre contenu.' },
        { q: 'Comment recevoir l\'argent ?', a: 'Par Mobile Money directement sur votre numéro. Simple et sécurisé.' },
        { q: 'Faut-il un ordinateur ?', a: 'Non, tout fonctionne depuis un smartphone. Création, gestion et suivi des ventes.' },
        { q: 'Mes contenus sont-ils protégés ?', a: 'Oui, watermark automatique et accès sécurisé. Votre propriété intellectuelle est respectée.' },
      ] : [
        { q: 'Is it really simple to use?', a: 'Yes, the interface is designed to be as simple as WhatsApp. A family member can help you at first.' },
        { q: 'What can I publish?', a: 'Career memoirs, practical guides, life lessons, audio courses — anything that showcases your experience.' },
        { q: 'Is it free?', a: 'Yes, no subscription. Siteviral takes 10% only when someone buys your content.' },
        { q: 'How do I receive money?', a: 'Via Mobile Money directly to your number. Simple and secure.' },
        { q: 'Do I need a computer?', a: 'No, everything works from a smartphone. Creation, management, and sales tracking.' },
        { q: 'Is my content protected?', a: 'Yes, automatic watermark and secured access. Your intellectual property is respected.' },
      ]}
      cta={{ label: isFr ? 'Partager mon expérience' : 'Share my experience', path: '/auth?mode=signup' }}
      secondaryCta={{ label: isFr ? 'Voir comment ça marche' : 'See how it works', path: '/features' }}
    />
  );
}
