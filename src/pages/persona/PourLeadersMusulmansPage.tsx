import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';
import { useI18n } from '@/i18n/I18nContext';

export default function PourLeadersMusulmansPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <PersonaLandingPage
      seo={{
        title: isFr ? 'Siteviral pour les Leaders Musulmans — Digitalisez vos enseignements' : 'Siteviral for Muslim Leaders — Digitize Your Teachings',
        description: isFr ? 'Plateforme adaptée pour les imams et leaders musulmans. Distribuez vos cours coraniques, recevez sadaqas et zakat par Mobile Money.' : 'Platform for imams and Muslim leaders. Distribute your Quranic courses, receive sadaqah and zakat via Mobile Money.',
        url: 'https://siteviral.com/pour/leaders-musulmans',
      }}
      badge={isFr ? '☪️ Pour les Leaders Musulmans' : '☪️ For Muslim Leaders'}
      headline={isFr
        ? <>Digitalisez vos <span className="text-primary">enseignements islamiques</span> et touchez plus de fidèles</>
        : <>Digitize your <span className="text-primary">Islamic teachings</span> and reach more followers</>}
      subheadline={isFr
        ? 'Distribuez vos cours coraniques, recevez des sadaqas et zakats numériquement, et connectez votre communauté — une plateforme adaptée au contexte africain.'
        : 'Distribute your Quranic courses, receive sadaqah and zakat digitally, and connect your community — a platform adapted to the African context.'}
      painPoints={isFr ? [
        { icon: '📚', title: 'Enseignements non digitalisés', desc: 'Vos cours et récitations restent en présentiel. Pas de moyen de les partager au-delà de votre mosquée.' },
        { icon: '💸', title: 'Zakat et sadaqa en espèces', desc: 'La collecte manuelle est opaque, sans traçabilité ni reçus pour les donateurs.' },
        { icon: '🌍', title: 'Diaspora déconnectée', desc: 'Vos fidèles à l\'étranger veulent contribuer mais les canaux sont limités ou coûteux.' },
        { icon: '🚫', title: 'Aucune plateforme adaptée', desc: 'Les plateformes existantes ne comprennent pas le contexte culturel et religieux africain.' },
        { icon: '📱', title: 'Distribution par WhatsApp', desc: 'Vous envoyez vos contenus un par un sur WhatsApp. Pas de suivi, pas de revenus.' },
        { icon: '🏗️', title: 'Pas de présence en ligne', desc: 'Créer un site coûte cher et nécessite des compétences que vous n\'avez pas.' },
      ] : [
        { icon: '📚', title: 'Non-digitized teachings', desc: 'Your courses and recitations remain in-person. No way to share beyond your mosque.' },
        { icon: '💸', title: 'Cash-only zakat & sadaqah', desc: 'Manual collection is opaque, with no traceability or receipts for donors.' },
        { icon: '🌍', title: 'Disconnected diaspora', desc: 'Your followers abroad want to contribute but channels are limited or expensive.' },
        { icon: '🚫', title: 'No suitable platform', desc: 'Existing platforms don\'t understand the African cultural and religious context.' },
        { icon: '📱', title: 'WhatsApp distribution', desc: 'You send content one by one on WhatsApp. No tracking, no revenue.' },
        { icon: '🏗️', title: 'No online presence', desc: 'Building a website is expensive and requires skills you don\'t have.' },
      ]}
      solutions={isFr ? [
        { title: 'Page communautaire professionnelle', desc: 'Créez votre vitrine en ligne en minutes : présentation, contacts, contenus, collectes.' },
        { title: 'Sadaqa & Zakat numériques', desc: 'Vos fidèles contribuent par Mobile Money en 1 clic. Tout est tracé et transparent.' },
        { title: 'Cours coraniques en ligne', desc: 'Vendez ou partagez vos récitations, tafsirs, cours audio et PDF éducatifs.' },
        { title: 'Campagnes de collecte', desc: 'Construction de mosquée, aide aux nécessiteux — lancez des campagnes avec objectif et barre de progression.' },
        { title: 'Connexion diaspora', desc: 'Mobile Money en Afrique, carte Visa/Mastercard pour les fidèles à l\'étranger.' },
        { title: 'Programme ambassadeur', desc: 'Vos fidèles partagent et sont récompensés. Affiliation halal, transparente et traçable.' },
      ] : [
        { title: 'Professional community page', desc: 'Create your online presence in minutes: overview, contacts, content, collections.' },
        { title: 'Digital sadaqah & zakat', desc: 'Your followers contribute via Mobile Money in 1 click. Everything is tracked and transparent.' },
        { title: 'Online Quranic courses', desc: 'Sell or share your recitations, tafsirs, audio courses, and educational PDFs.' },
        { title: 'Fundraising campaigns', desc: 'Mosque construction, aid for the needy — launch campaigns with goals and progress bars.' },
        { title: 'Diaspora connection', desc: 'Mobile Money in Africa, Visa/Mastercard for followers abroad.' },
        { title: 'Ambassador program', desc: 'Your followers share and earn rewards. Halal, transparent, and traceable affiliation.' },
      ]}
      steps={isFr ? [
        { step: '1', title: 'Créez votre espace', desc: 'Inscription gratuite. Nommez votre communauté, ajoutez votre logo.' },
        { step: '2', title: 'Ajoutez vos contenus', desc: 'Uploadez cours audio, PDF, vidéos. Créez vos campagnes de collecte de zakat.' },
        { step: '3', title: 'Partagez avec votre communauté', desc: 'Envoyez votre lien sur WhatsApp. Les fidèles achètent et donnent en 1 clic.' },
      ] : [
        { step: '1', title: 'Create your space', desc: 'Free sign-up. Name your community, add your logo.' },
        { step: '2', title: 'Add your content', desc: 'Upload audio courses, PDFs, videos. Create your zakat collection campaigns.' },
        { step: '3', title: 'Share with your community', desc: 'Send your link on WhatsApp. Followers buy and donate in 1 click.' },
      ]}
      testimonial={{
        name: 'Imam S. D.',
        role: isFr ? 'Leader communautaire' : 'Community leader',
        text: isFr
          ? 'Nos fidèles de la diaspora peuvent enfin contribuer facilement. La transparence de la plateforme renforce la confiance de toute la communauté.'
          : 'Our diaspora followers can finally contribute easily. The platform\'s transparency strengthens the entire community\'s trust.',
        flag: '🇸🇳',
      }}
      stats={isFr ? [
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: '2 min', label: 'pour créer votre page' },
        { value: '100%', label: 'transparent et traçable' },
      ] : [
        { value: '$0', label: 'subscription fee' },
        { value: '2 min', label: 'to create your page' },
        { value: '100%', label: 'transparent & traceable' },
      ]}
      faq={isFr ? [
        { q: 'Est-ce adapté aux communautés musulmanes ?', a: 'Oui, Siteviral est une plateforme neutre et universelle. Elle s\'adapte à tous les contextes religieux et culturels, y compris les communautés musulmanes.' },
        { q: 'Peut-on recevoir des zakat par Mobile Money ?', a: 'Oui, créez une campagne dédiée à la zakat. Vos fidèles paient par Orange Money, MTN, Wave ou carte bancaire.' },
        { q: 'Les contenus peuvent-ils être gratuits ?', a: 'Absolument. Vous pouvez offrir des contenus gratuitement ou les vendre. Vous décidez pour chaque ressource.' },
        { q: 'Comment la diaspora peut-elle contribuer ?', a: 'La diaspora peut payer par carte Visa/Mastercard en EUR, USD ou GBP. Le système gère les devises automatiquement.' },
        { q: 'Y a-t-il des frais cachés ?', a: 'Non. Zéro abonnement. Siteviral prend 10% uniquement sur les ventes. Les dons sont soumis aux seuls frais de la passerelle.' },
        { q: 'Mes données sont-elles en sécurité ?', a: 'Oui, toutes les données sont chiffrées et hébergées sur des serveurs sécurisés. Conformité RGPD.' },
      ] : [
        { q: 'Is this suitable for Muslim communities?', a: 'Yes, Siteviral is a neutral and universal platform. It adapts to all religious and cultural contexts, including Muslim communities.' },
        { q: 'Can we receive zakat via Mobile Money?', a: 'Yes, create a dedicated zakat campaign. Followers pay via Orange Money, MTN, Wave, or credit card.' },
        { q: 'Can content be free?', a: 'Absolutely. You can offer content for free or sell it. You decide for each resource.' },
        { q: 'How can the diaspora contribute?', a: 'The diaspora can pay via Visa/Mastercard in EUR, USD, or GBP. The system handles currencies automatically.' },
        { q: 'Are there hidden fees?', a: 'No. Zero subscription. Siteviral takes 10% on sales only. Donations are subject only to gateway fees.' },
        { q: 'Is my data secure?', a: 'Yes, all data is encrypted and hosted on secure servers. GDPR compliant.' },
      ]}
      cta={{ label: isFr ? 'Créer ma page communautaire' : 'Create my community page', path: '/auth?mode=signup' }}
      secondaryCta={{ label: isFr ? 'Découvrir les fonctionnalités' : 'Discover features', path: '/features' }}
    />
  );
}
