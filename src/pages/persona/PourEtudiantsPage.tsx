import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';
import { useI18n } from '@/i18n/I18nContext';

export default function PourEtudiantsPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <PersonaLandingPage
      seo={{
        title: isFr ? 'Siteviral pour les Étudiants — Gagnez de l\'argent en partageant' : 'Siteviral for Students — Earn money by sharing',
        description: isFr ? 'Devenez ambassadeur Siteviral. Partagez des ressources utiles et gagnez jusqu\'à 50% de commission sur chaque vente. Zéro investissement.' : 'Become a Siteviral ambassador. Share useful resources and earn up to 50% commission on every sale. Zero investment.',
        url: 'https://siteviral.com/pour/etudiants',
      }}
      badge={isFr ? '🎒 Pour les Étudiants & Jeunes' : '🎒 For Students & Youth'}
      headline={isFr ? <>Gagnez de l'argent <span className="text-primary">sans rien créer</span>. Juste en partageant.</> : <>Earn money <span className="text-primary">without creating anything</span>. Just by sharing.</>}
      subheadline={isFr ? 'Devenez ambassadeur Siteviral : partagez les ressources des autres sur WhatsApp, TikTok ou Instagram, et touchez jusqu\'à 50% de commission sur chaque vente. Zéro investissement, zéro stock.' : 'Become a Siteviral ambassador: share others\' resources on WhatsApp, TikTok or Instagram, and earn up to 50% commission on every sale. Zero investment, zero inventory.'}
      painPoints={isFr ? [
        { icon: '💰', title: 'Besoin d\'argent, pas de job', desc: 'Les stages ne paient pas, les emplois étudiants sont rares. Vous cherchez un revenu flexible.' },
        { icon: '⏰', title: 'Pas de temps pour un business', desc: 'Entre les cours et les examens, impossible de gérer un commerce ou créer du contenu.' },
        { icon: '🚫', title: 'Pas de capital de départ', desc: 'Les business classiques demandent un investissement. Vous n\'avez rien à mettre.' },
        { icon: '📱', title: 'Audience non monétisée', desc: 'Vous avez des centaines de contacts WhatsApp, des followers… mais zéro revenu.' },
        { icon: '🤔', title: 'Arnaques partout', desc: 'Forex, MLM, crypto douteuse — vous avez peur de vous faire avoir.' },
        { icon: '📦', title: 'Rien à vendre', desc: 'Pas de produit, pas de compétence spéciale à vendre. Que faire ?' },
      ] : [
        { icon: '💰', title: 'Need money, no job', desc: 'Internships don\'t pay, student jobs are rare. You need flexible income.' },
        { icon: '⏰', title: 'No time for a business', desc: 'Between classes and exams, it\'s impossible to run a business or create content.' },
        { icon: '🚫', title: 'No starting capital', desc: 'Traditional businesses require investment. You have nothing to put in.' },
        { icon: '📱', title: 'Unmonetized audience', desc: 'You have hundreds of WhatsApp contacts, followers… but zero revenue.' },
        { icon: '🤔', title: 'Scams everywhere', desc: 'Forex, MLM, shady crypto — you\'re afraid of getting scammed.' },
        { icon: '📦', title: 'Nothing to sell', desc: 'No product, no special skill to sell. What to do?' },
      ]}
      solutions={isFr ? [
        { title: 'Zéro contenu à créer', desc: 'Vous ne créez rien. Vous partagez les e-books, cours et ressources des autres vendeurs.' },
        { title: 'Jusqu\'à 50% de commission', desc: 'Chaque vente via votre lien vous rapporte entre 5% et 50% du prix. Vous gagnez à chaque partage.' },
        { title: 'Un lien, c\'est tout', desc: 'Copiez votre lien d\'ambassadeur, partagez-le sur WhatsApp, Instagram, TikTok. C\'est fait.' },
        { title: 'Paiement automatique', desc: 'Vos commissions s\'accumulent et sont versées automatiquement sur votre Mobile Money.' },
        { title: 'C\'est pas un MLM', desc: 'Un seul niveau de commission, pas de recrutement. Vous partagez, vous gagnez. Point.' },
        { title: 'Dashboard de suivi', desc: 'Voyez en temps réel vos clics, ventes et commissions. Tout est transparent.' },
      ] : [
        { title: 'Zero content to create', desc: 'You create nothing. You share e-books, courses and resources from other sellers.' },
        { title: 'Up to 50% commission', desc: 'Each sale through your link earns you 5-50% of the price. You earn with every share.' },
        { title: 'One link, that\'s it', desc: 'Copy your ambassador link, share it on WhatsApp, Instagram, TikTok. Done.' },
        { title: 'Automatic payment', desc: 'Your commissions accumulate and are automatically paid to your Mobile Money.' },
        { title: 'It\'s not an MLM', desc: 'Single-level commission, no recruiting. You share, you earn. Period.' },
        { title: 'Tracking dashboard', desc: 'See your clicks, sales and commissions in real time. Everything is transparent.' },
      ]}
      steps={isFr ? [
        { step: '1', title: 'Inscrivez-vous gratuitement', desc: 'Créez votre compte en 30 secondes. Aucune vérification, aucun paiement.' },
        { step: '2', title: 'Choisissez des produits à promouvoir', desc: 'Parcourez le catalogue, trouvez des ressources qui plaisent à votre réseau.' },
        { step: '3', title: 'Partagez et gagnez', desc: 'Copiez votre lien unique, partagez sur vos réseaux. Chaque vente = commission.' },
      ] : [
        { step: '1', title: 'Sign up for free', desc: 'Create your account in 30 seconds. No verification, no payment.' },
        { step: '2', title: 'Choose products to promote', desc: 'Browse the catalog, find resources your network will love.' },
        { step: '3', title: 'Share and earn', desc: 'Copy your unique link, share on your networks. Every sale = commission.' },
      ]}
      testimonial={{
        name: 'Ibrahim T.',
        role: isFr ? 'Ambassadeur Siteviral' : 'Siteviral Ambassador',
        text: isFr ? 'Je n\'ai aucun contenu à moi. Je partage les ressources des autres et je gagne des commissions chaque semaine. C\'est incroyable.' : 'I have no content of my own. I share others\' resources and earn commissions every week. It\'s incredible.',
        flag: '🇸🇳',
      }}
      stats={isFr ? [
        { value: '5-50%', label: 'de commission par vente' },
        { value: '0 FCFA', label: 'd\'investissement' },
        { value: '30 sec', label: 'pour s\'inscrire' },
      ] : [
        { value: '5-50%', label: 'commission per sale' },
        { value: '$0', label: 'investment' },
        { value: '30 sec', label: 'to sign up' },
      ]}
      faq={isFr ? [
        { q: 'C\'est quoi exactement un ambassadeur ?', a: 'Un ambassadeur partage les produits des vendeurs via un lien unique. Quand quelqu\'un achète via votre lien, vous touchez une commission automatiquement.' },
        { q: 'C\'est pas un MLM ?', a: 'Non ! Il n\'y a qu\'un seul niveau de commission. Vous ne recrutez personne, vous ne payez rien. Vous partagez, vous gagnez. C\'est de l\'affiliation classique.' },
        { q: 'Combien je peux gagner ?', a: 'Ça dépend de ce que vous partagez et de votre réseau. Certains ambassadeurs gagnent 50 000 à 500 000 FCFA/mois. Le potentiel est illimité.' },
        { q: 'Comment je reçois mon argent ?', a: 'Vos commissions sont versées automatiquement sur votre Mobile Money après une période de sécurité de 15 jours.' },
        { q: 'Pourquoi 15 jours d\'attente ?', a: 'C\'est une mesure de sécurité pour protéger contre les remboursements et la fraude. Après 15 jours, votre commission est garantie.' },
        { q: 'Je peux le faire en plus de mes études ?', a: 'Absolument ! C\'est 100% flexible. Partagez quand vous voulez, d\'où vous voulez. Pas d\'horaires, pas de patron.' },
      ] : [
        { q: 'What exactly is an ambassador?', a: 'An ambassador shares sellers\' products via a unique link. When someone buys through your link, you earn a commission automatically.' },
        { q: 'Is this an MLM?', a: 'No! There\'s only one level of commission. You don\'t recruit anyone, you don\'t pay anything. You share, you earn. It\'s classic affiliate marketing.' },
        { q: 'How much can I earn?', a: 'It depends on what you share and your network. Some ambassadors earn $80-$800/month. The potential is unlimited.' },
        { q: 'How do I receive my money?', a: 'Your commissions are automatically paid to your Mobile Money after a 15-day security period.' },
        { q: 'Why 15 days wait?', a: 'It\'s a security measure to protect against refunds and fraud. After 15 days, your commission is guaranteed.' },
        { q: 'Can I do this alongside my studies?', a: 'Absolutely! It\'s 100% flexible. Share whenever you want, wherever you want. No schedule, no boss.' },
      ]}
      cta={{ label: isFr ? 'Devenir ambassadeur maintenant' : 'Become an ambassador now', path: '/auth?mode=signup' }}
      secondaryCta={{ label: isFr ? 'Calculer mes gains potentiels' : 'Calculate my potential earnings', path: '/calculateur' }}
    />
  );
}
