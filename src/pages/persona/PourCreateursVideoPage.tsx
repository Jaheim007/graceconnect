import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';
import { useI18n } from '@/i18n/I18nContext';

export default function PourCreateursVideoPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <PersonaLandingPage
      seo={{
        title: isFr ? 'Siteviral pour les Créateurs Vidéo — Monétisez vos contenus' : 'Siteviral for Video Creators — Monetize Your Content',
        description: isFr ? 'Vendez vos vidéos, formations et masterclasses en ligne. Paiement Mobile Money & carte bancaire. Zéro abonnement.' : 'Sell your videos, courses, and masterclasses online. Mobile Money & card payments. Zero subscription.',
        url: 'https://siteviral.com/pour/createurs-video',
      }}
      badge={isFr ? '🎬 Pour les Créateurs Vidéo' : '🎬 For Video Creators'}
      headline={isFr
        ? <>Monétisez vos <span className="text-primary">vidéos</span> au-delà de YouTube et TikTok</>
        : <>Monetize your <span className="text-primary">videos</span> beyond YouTube and TikTok</>}
      subheadline={isFr
        ? 'Vous créez du contenu vidéo de qualité mais les revenus publicitaires sont dérisoires. Vendez directement vos formations, masterclasses et contenus exclusifs à votre audience africaine.'
        : 'You create quality video content but ad revenue is negligible. Sell your courses, masterclasses, and exclusive content directly to your African audience.'}
      painPoints={isFr ? [
        { icon: '💰', title: 'Revenus pub insuffisants', desc: 'YouTube paye très peu en Afrique. Vos milliers de vues ne génèrent presque rien.' },
        { icon: '🔒', title: 'Pas de contenu premium', desc: 'Impossible de vendre des vidéos exclusives sur YouTube ou TikTok.' },
        { icon: '📱', title: 'Paiement compliqué', desc: 'Votre audience paye par Mobile Money mais les plateformes occidentales ne le supportent pas.' },
        { icon: '🏗️', title: 'Créer un site coûte cher', desc: 'Les solutions e-learning sont complexes, chères et inadaptées au marché africain.' },
        { icon: '📊', title: 'Aucune donnée client', desc: 'YouTube garde vos abonnés. Vous ne pouvez pas les contacter directement.' },
        { icon: '⏳', title: 'Temps perdu en logistique', desc: 'Gérer les paiements manuels par WhatsApp prend plus de temps que créer du contenu.' },
      ] : [
        { icon: '💰', title: 'Insufficient ad revenue', desc: 'YouTube pays very little in Africa. Your thousands of views generate almost nothing.' },
        { icon: '🔒', title: 'No premium content', desc: 'Impossible to sell exclusive videos on YouTube or TikTok.' },
        { icon: '📱', title: 'Complicated payments', desc: 'Your audience pays via Mobile Money but Western platforms don\'t support it.' },
        { icon: '🏗️', title: 'Building a site is expensive', desc: 'E-learning solutions are complex, expensive, and unsuited to the African market.' },
        { icon: '📊', title: 'No customer data', desc: 'YouTube keeps your subscribers. You can\'t contact them directly.' },
        { icon: '⏳', title: 'Time wasted on logistics', desc: 'Managing manual WhatsApp payments takes more time than creating content.' },
      ]}
      solutions={isFr ? [
        { title: 'Boutique vidéo privée', desc: 'Vendez vos formations, masterclasses et tutoriels premium. Accès instantané après paiement.' },
        { title: 'Paiement Mobile Money', desc: 'Orange Money, MTN, Wave — vos fans payent comme ils en ont l\'habitude.' },
        { title: 'Importation YouTube', desc: 'Importez vos vidéos YouTube gratuites pour attirer du trafic vers vos contenus payants.' },
        { title: 'Communauté engagée', desc: 'Page de marque professionnelle avec feed, commentaires et notifications.' },
        { title: 'Données clients', desc: 'Récupérez les emails et contacts de vos acheteurs. Votre audience vous appartient.' },
        { title: 'Programme ambassadeur', desc: 'Vos fans partagent vos vidéos et gagnent une commission sur chaque vente générée.' },
      ] : [
        { title: 'Private video store', desc: 'Sell your courses, masterclasses, and premium tutorials. Instant access after payment.' },
        { title: 'Mobile Money payments', desc: 'Orange Money, MTN, Wave — your fans pay the way they\'re used to.' },
        { title: 'YouTube import', desc: 'Import your free YouTube videos to drive traffic to your paid content.' },
        { title: 'Engaged community', desc: 'Professional brand page with feed, comments, and notifications.' },
        { title: 'Customer data', desc: 'Get emails and contacts of your buyers. Your audience belongs to you.' },
        { title: 'Ambassador program', desc: 'Your fans share your videos and earn a commission on every sale.' },
      ]}
      steps={isFr ? [
        { step: '1', title: 'Créez votre page', desc: 'Inscription gratuite. Ajoutez votre logo, bio et liens sociaux.' },
        { step: '2', title: 'Uploadez vos vidéos', desc: 'Ajoutez vos formations et masterclasses. Fixez vos prix en FCFA, EUR ou USD.' },
        { step: '3', title: 'Partagez à votre audience', desc: 'Un lien dans votre bio YouTube/TikTok. Les ventes sont automatiques 24h/24.' },
      ] : [
        { step: '1', title: 'Create your page', desc: 'Free sign-up. Add your logo, bio, and social links.' },
        { step: '2', title: 'Upload your videos', desc: 'Add your courses and masterclasses. Set prices in XOF, EUR, or USD.' },
        { step: '3', title: 'Share with your audience', desc: 'One link in your YouTube/TikTok bio. Sales run automatically 24/7.' },
      ]}
      testimonial={{
        name: 'Chris M.',
        role: isFr ? 'Créateur vidéo' : 'Video creator',
        text: isFr
          ? 'Je gagnais 5 000 FCFA/mois sur YouTube. Avec Siteviral, ma première formation s\'est vendue à 200 copies en 2 semaines. Game changer.'
          : 'I was earning 5,000 FCFA/month on YouTube. With Siteviral, my first course sold 200 copies in 2 weeks. Game changer.',
        flag: '🇨🇲',
      }}
      stats={isFr ? [
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: '90%', label: 'pour vous' },
        { value: '24/7', label: 'ventes automatiques' },
      ] : [
        { value: '$0', label: 'subscription fee' },
        { value: '90%', label: 'for you' },
        { value: '24/7', label: 'automatic sales' },
      ]}
      faq={isFr ? [
        { q: 'Quels formats vidéo sont acceptés ?', a: 'MP4, MOV, AVI et bien d\'autres. Vous pouvez aussi ajouter des liens YouTube/Vimeo pour vos contenus gratuits.' },
        { q: 'Puis-je vendre des formations complètes ?', a: 'Oui, créez des bundles avec plusieurs vidéos, PDF et ressources complémentaires.' },
        { q: 'Comment protéger mes vidéos ?', a: 'Les fichiers sont hébergés de façon sécurisée. Seuls les acheteurs y ont accès après paiement.' },
        { q: 'Mes abonnés YouTube peuvent-ils payer ?', a: 'Oui, partagez votre lien Siteviral dans la description de vos vidéos. Paiement en 1 clic.' },
        { q: 'Combien prend Siteviral ?', a: '10% uniquement sur les ventes. Zéro abonnement, zéro frais cachés.' },
        { q: 'Peut-on offrir des contenus gratuits ?', a: 'Absolument. Mixez gratuit et payant pour créer un tunnel de conversion efficace.' },
      ] : [
        { q: 'What video formats are accepted?', a: 'MP4, MOV, AVI, and more. You can also add YouTube/Vimeo links for free content.' },
        { q: 'Can I sell complete courses?', a: 'Yes, create bundles with multiple videos, PDFs, and supplementary resources.' },
        { q: 'How are my videos protected?', a: 'Files are securely hosted. Only buyers get access after payment.' },
        { q: 'Can my YouTube subscribers pay?', a: 'Yes, share your Siteviral link in your video descriptions. One-click payment.' },
        { q: 'How much does Siteviral take?', a: '10% on sales only. Zero subscription, zero hidden fees.' },
        { q: 'Can I offer free content?', a: 'Absolutely. Mix free and paid to create an effective conversion funnel.' },
      ]}
      cta={{ label: isFr ? 'Vendre mes vidéos en ligne' : 'Sell my videos online', path: '/auth?mode=signup' }}
      secondaryCta={{ label: isFr ? 'Voir les fonctionnalités' : 'See features', path: '/features' }}
    />
  );
}
