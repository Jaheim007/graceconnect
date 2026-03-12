import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';
import { useI18n } from '@/i18n/I18nContext';

export default function PourFormateursPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <PersonaLandingPage
      seo={{
        title: isFr ? 'Siteviral pour les Formateurs — Vendez vos cours en ligne' : 'Siteviral for Trainers — Sell your courses online',
        description: isFr ? 'Arrêtez d\'envoyer vos PDFs par WhatsApp. Vendez vos formations, guides et cours en ligne avec paiement Mobile Money intégré.' : 'Stop sending PDFs on WhatsApp. Sell your trainings, guides and courses online with built-in Mobile Money payments.',
        url: 'https://siteviral.com/pour/formateurs',
      }}
      badge={isFr ? '🎓 Pour les Formateurs & Coachs' : '🎓 For Trainers & Coaches'}
      headline={isFr ? <>Arrêtez d'envoyer vos PDFs par WhatsApp. <span className="text-primary">Vendez-les.</span></> : <>Stop sending PDFs on WhatsApp. <span className="text-primary">Sell them.</span></>}
      subheadline={isFr ? 'Transformez vos connaissances en revenus passifs. Créez votre boutique de formations, vendez vos e-books, guides et cours — paiement Mobile Money ou carte en 1 clic.' : 'Turn your knowledge into passive income. Create your training store, sell your e-books, guides and courses — Mobile Money or card payment in 1 click.'}
      painPoints={isFr ? [
        { icon: '📲', title: 'Envoi gratuit sur WhatsApp', desc: 'Vous créez du contenu de valeur puis l\'envoyez gratuitement. Votre expertise mérite mieux.' },
        { icon: '💳', title: 'Pas de solution de paiement', desc: 'Stripe est en dollars, PayPal pas dispo partout, les virements sont compliqués. Comment encaisser ?' },
        { icon: '🏗️', title: 'Créer un site coûte cher', desc: 'WordPress, Teachable, Podia — tout coûte 30-100$/mois. Trop cher pour démarrer.' },
        { icon: '📦', title: 'Livraison manuelle', desc: 'Après chaque paiement, vous devez envoyer le fichier manuellement. Pas scalable.' },
        { icon: '📉', title: 'Audience limitée', desc: 'Vous n\'atteignez que votre réseau direct. Pas de viralité, pas de recommandation.' },
        { icon: '🔄', title: 'Revenus imprévisibles', desc: 'Pas de système, pas de récurrence. Vous vendez quand vous y pensez.' },
      ] : [
        { icon: '📲', title: 'Sending free on WhatsApp', desc: 'You create valuable content and share it for free. Your expertise deserves better.' },
        { icon: '💳', title: 'No payment solution', desc: 'Stripe is in dollars, PayPal not available everywhere, transfers are complicated. How to get paid?' },
        { icon: '🏗️', title: 'Building a site is expensive', desc: 'WordPress, Teachable, Podia — everything costs $30-100/month. Too expensive to start.' },
        { icon: '📦', title: 'Manual delivery', desc: 'After each payment, you have to send the file manually. Not scalable.' },
        { icon: '📉', title: 'Limited audience', desc: 'You only reach your direct network. No virality, no referrals.' },
        { icon: '🔄', title: 'Unpredictable revenue', desc: 'No system, no recurrence. You sell when you think about it.' },
      ]}
      solutions={isFr ? [
        { title: 'Boutique en ligne gratuite', desc: 'Créez votre page de vente en 2 minutes. Upload de fichiers, prix, description — c\'est prêt.' },
        { title: 'Paiement Mobile Money natif', desc: 'Orange Money, MTN, Wave — vos clients paient comme ils en ont l\'habitude. Zéro friction.' },
        { title: 'Livraison automatique', desc: 'Le client paie, reçoit son fichier instantanément. Vous dormez, vous vendez.' },
        { title: 'Programme ambassadeur', desc: 'Vos anciens élèves recommandent vos cours et touchent une commission. Votre audience grandit toute seule.' },
        { title: 'Multi-formats supportés', desc: 'PDFs, audio, vidéo, images — vendez tout type de contenu numérique.' },
        { title: 'Analytics & suivi', desc: 'Voyez combien de ventes, quels produits marchent, d\'où viennent vos clients.' },
      ] : [
        { title: 'Free online store', desc: 'Create your sales page in 2 minutes. File upload, pricing, description — it\'s ready.' },
        { title: 'Native Mobile Money payments', desc: 'Orange Money, MTN, Wave — your clients pay the way they\'re used to. Zero friction.' },
        { title: 'Automatic delivery', desc: 'Client pays, gets the file instantly. You sleep, you sell.' },
        { title: 'Ambassador program', desc: 'Your former students recommend your courses and earn a commission. Your audience grows on its own.' },
        { title: 'Multi-format support', desc: 'PDFs, audio, video, images — sell any type of digital content.' },
        { title: 'Analytics & tracking', desc: 'See how many sales, which products work, where your clients come from.' },
      ]}
      steps={isFr ? [
        { step: '1', title: 'Créez votre espace formateur', desc: 'Inscrivez-vous, nommez votre « école en ligne », ajoutez votre bio et photo.' },
        { step: '2', title: 'Uploadez vos cours', desc: 'Ajoutez vos PDFs, vidéos, audio. Fixez vos prix en FCFA, EUR ou USD.' },
        { step: '3', title: 'Partagez et vendez', desc: 'Partagez votre lien sur vos réseaux. Vos ambassadeurs amplifient la diffusion.' },
      ] : [
        { step: '1', title: 'Create your trainer space', desc: 'Sign up, name your "online school", add your bio and photo.' },
        { step: '2', title: 'Upload your courses', desc: 'Add your PDFs, videos, audio. Set your prices in XOF, EUR or USD.' },
        { step: '3', title: 'Share and sell', desc: 'Share your link on social media. Your ambassadors amplify distribution.' },
      ]}
      testimonial={{
        name: 'Marie-Claire B.',
        role: isFr ? 'Coach & Auteure' : 'Coach & Author',
        text: isFr ? 'J\'ai centralisé tous mes documents et ressources sur une seule plateforme. Mes clients achètent et téléchargent en un clic.' : 'I centralized all my documents and resources on a single platform. My clients buy and download in one click.',
        flag: '🇨🇲',
      }}
      stats={isFr ? [
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: '10%', label: 'commission par vente' },
        { value: '∞', label: 'produits illimités' },
      ] : [
        { value: '$0', label: 'subscription' },
        { value: '10%', label: 'commission per sale' },
        { value: '∞', label: 'unlimited products' },
      ]}
      faq={isFr ? [
        { q: 'Combien ça coûte ?', a: 'Zéro abonnement. Siteviral prend 10% de commission uniquement sur les ventes réalisées. Si vous ne vendez pas, vous ne payez rien.' },
        { q: 'Quels formats de fichiers sont supportés ?', a: 'PDF, DOCX, MP3, MP4, images, ZIP — tous les formats courants sont acceptés.' },
        { q: 'Est-ce que mes clients reçoivent le fichier automatiquement ?', a: 'Oui, dès que le paiement est confirmé, le client reçoit un lien de téléchargement sécurisé instantanément.' },
        { q: 'Puis-je fixer mes prix en FCFA ?', a: 'Oui, vous fixez vos prix dans la devise de votre choix : FCFA, EUR, USD, GHS, etc.' },
        { q: 'Comment fonctionne le programme ambassadeur ?', a: 'Vous définissez un pourcentage de commission (5-50%). N\'importe qui peut partager vos produits et toucher cette commission sur chaque vente.' },
        { q: 'Quand est-ce que je reçois mon argent ?', a: 'Les revenus sont disponibles après 72h de sécurité. Retrait automatique sur Mobile Money ou compte bancaire.' },
      ] : [
        { q: 'How much does it cost?', a: 'Zero subscription. Siteviral takes 10% commission only on completed sales. If you don\'t sell, you don\'t pay.' },
        { q: 'What file formats are supported?', a: 'PDF, DOCX, MP3, MP4, images, ZIP — all common formats are accepted.' },
        { q: 'Do my clients receive the file automatically?', a: 'Yes, as soon as payment is confirmed, the client instantly receives a secure download link.' },
        { q: 'Can I set prices in my currency?', a: 'Yes, you set your prices in the currency of your choice: XOF, EUR, USD, GHS, etc.' },
        { q: 'How does the ambassador program work?', a: 'You set a commission percentage (5-50%). Anyone can share your products and earn that commission on each sale.' },
        { q: 'When do I receive my money?', a: 'Earnings are available after a 72-hour security period. Automatic withdrawal to Mobile Money or bank account.' },
      ]}
      cta={{ label: isFr ? 'Créer ma boutique de cours' : 'Create my course store', path: '/auth?mode=signup' }}
      secondaryCta={{ label: isFr ? 'Calculer mes revenus potentiels' : 'Calculate my potential earnings', path: '/calculateur' }}
    />
  );
}
