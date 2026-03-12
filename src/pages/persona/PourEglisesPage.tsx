import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';
import { useI18n } from '@/i18n/I18nContext';

export default function PourEglisesPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <PersonaLandingPage
      seo={{
        title: isFr ? 'Siteviral pour les Églises — Digitalisez votre ministère' : 'Siteviral for Churches — Digitize your ministry',
        description: isFr ? 'Créez votre plateforme digitale pour votre église. Recevez dons et dîmes par Mobile Money, vendez vos prédications, centralisez tout.' : 'Create your digital platform for your church. Receive tithes and offerings via Mobile Money, sell your sermons, centralize everything.',
        url: 'https://siteviral.com/pour/eglises',
      }}
      badge={isFr ? '⛪ Pour les Églises & Ministères' : '⛪ For Churches & Ministries'}
      headline={isFr ? <>Votre église mérite une <span className="text-primary">présence digitale</span> à la hauteur de sa mission</> : <>Your church deserves a <span className="text-primary">digital presence</span> worthy of its mission</>}
      subheadline={isFr ? 'Recevez des dons et dîmes par Mobile Money, vendez vos prédications audio et vidéo, et centralisez toute votre communauté sur une seule plateforme — sans compétence technique.' : 'Receive tithes and offerings via Mobile Money, sell your audio and video sermons, and centralize your entire community on one platform — no technical skills needed.'}
      painPoints={isFr ? [
        { icon: '💸', title: 'Perte d\'argent en espèces', desc: 'Les offrandes en cash disparaissent, pas de traçabilité, pas de reçus. Vous ne savez pas qui donne quoi.' },
        { icon: '📱', title: 'Outils fragmentés', desc: 'WhatsApp pour communiquer, Facebook pour publier, rien pour vendre vos ressources. Tout est dispersé.' },
        { icon: '🚫', title: 'Pas de site, pas de compétence', desc: 'Créer un site coûte cher, prend du temps et nécessite un développeur que vous n\'avez pas.' },
        { icon: '📉', title: 'Prédications non monétisées', desc: 'Des heures de contenu audio et vidéo de qualité, mais aucun moyen structuré de les vendre.' },
        { icon: '🌍', title: 'Diaspora injoignable', desc: 'Vos fidèles à l\'étranger veulent donner mais les canaux sont limités ou compliqués.' },
        { icon: '⏰', title: 'Temps perdu en gestion', desc: 'Gérer manuellement les cotisations, suivre les membres, envoyer les contenus un par un.' },
      ] : [
        { icon: '💸', title: 'Cash offerings lost', desc: 'Cash offerings disappear, no traceability, no receipts. You don\'t know who gives what.' },
        { icon: '📱', title: 'Fragmented tools', desc: 'WhatsApp to communicate, Facebook to publish, nothing to sell your resources. Everything is scattered.' },
        { icon: '🚫', title: 'No website, no skills', desc: 'Creating a site is expensive, time-consuming and requires a developer you don\'t have.' },
        { icon: '📉', title: 'Unmonetized sermons', desc: 'Hours of quality audio and video content, but no structured way to sell them.' },
        { icon: '🌍', title: 'Unreachable diaspora', desc: 'Your members abroad want to give but channels are limited or complicated.' },
        { icon: '⏰', title: 'Time wasted on management', desc: 'Manually managing dues, tracking members, sending content one by one.' },
      ]}
      solutions={isFr ? [
        { title: 'Page d\'église professionnelle', desc: 'Créez votre vitrine en 2 minutes : logo, bannière, description, contacts. Accessible à tous.' },
        { title: 'Dons & dîmes par Mobile Money', desc: 'Vos fidèles donnent en 1 clic depuis leur téléphone. Orange Money, MTN, Wave, cartes bancaires.' },
        { title: 'Boutique de prédications', desc: 'Vendez vos audio, vidéos, e-books, guides. Livraison instantanée après paiement.' },
        { title: 'Campagnes de collecte', desc: 'Lancez des appels à dons avec objectif, barre de progression et partage social.' },
        { title: 'Armée d\'ambassadeurs', desc: 'Vos membres fidèles partagent vos ressources et touchent une commission sur chaque vente.' },
        { title: 'Paiement international', desc: 'Mobile Money en Afrique, Visa/Mastercard pour la diaspora. Multi-devises automatique.' },
      ] : [
        { title: 'Professional church page', desc: 'Create your storefront in 2 minutes: logo, banner, description, contacts. Accessible to all.' },
        { title: 'Tithes & offerings via Mobile Money', desc: 'Your members give in 1 click from their phone. Orange Money, MTN, Wave, bank cards.' },
        { title: 'Sermon store', desc: 'Sell your audio, videos, e-books, guides. Instant delivery after payment.' },
        { title: 'Fundraising campaigns', desc: 'Launch donation appeals with goals, progress bar and social sharing.' },
        { title: 'Ambassador army', desc: 'Your faithful members share your resources and earn a commission on each sale.' },
        { title: 'International payments', desc: 'Mobile Money in Africa, Visa/Mastercard for the diaspora. Automatic multi-currency.' },
      ]}
      steps={isFr ? [
        { step: '1', title: 'Créez votre organisation', desc: 'Inscrivez-vous gratuitement, nommez votre église, ajoutez votre logo. 2 minutes.' },
        { step: '2', title: 'Ajoutez vos ressources', desc: 'Uploadez vos prédications, fixez vos prix (ou gratuit), créez vos campagnes de dons.' },
        { step: '3', title: 'Partagez et recevez', desc: 'Partagez votre lien sur WhatsApp et Facebook. Les paiements arrivent automatiquement.' },
      ] : [
        { step: '1', title: 'Create your organization', desc: 'Sign up for free, name your church, add your logo. 2 minutes.' },
        { step: '2', title: 'Add your resources', desc: 'Upload your sermons, set your prices (or free), create your donation campaigns.' },
        { step: '3', title: 'Share and receive', desc: 'Share your link on WhatsApp and Facebook. Payments arrive automatically.' },
      ]}
      testimonial={{
        name: 'Pasteur K. M.',
        role: isFr ? 'Leader communautaire' : 'Community Leader',
        text: isFr ? 'En une semaine, notre communauté a pu offrir plus de 200 prédications audio. Les dons arrivent aussi par Mobile Money. C\'est révolutionnaire.' : 'In one week, our community was able to offer over 200 audio sermons. Donations also come in via Mobile Money. It\'s revolutionary.',
        flag: '🇳🇬',
      }}
      stats={isFr ? [
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: '2 min', label: 'pour créer votre page' },
        { value: '150+ pays', label: 'Mobile Money & Carte' },
      ] : [
        { value: '$0', label: 'subscription' },
        { value: '2 min', label: 'to create your page' },
        { value: '150+ countries', label: 'Mobile Money & Card' },
      ]}
      faq={isFr ? [
        { q: 'Est-ce que c\'est gratuit ?', a: 'Oui, il n\'y a aucun abonnement. Siteviral prend une commission de 10% uniquement sur les ventes réalisées. Les dons sont soumis aux frais de la passerelle de paiement uniquement.' },
        { q: 'Nos fidèles peuvent-ils payer par Mobile Money ?', a: 'Absolument ! Orange Money, MTN Mobile Money, Wave et toutes les méthodes de paiement mobile sont acceptées. La diaspora peut payer par carte.' },
        { q: 'Faut-il des compétences techniques ?', a: 'Non, zéro. Si vous savez utiliser WhatsApp, vous savez utiliser Siteviral. Tout se fait en quelques clics.' },
        { q: 'Comment recevoir l\'argent ?', a: 'L\'argent est versé automatiquement sur votre compte Mobile Money ou bancaire après une période de sécurité de 72h.' },
        { q: 'Peut-on recevoir des dons récurrents ?', a: 'Oui, vos fidèles peuvent choisir de donner de manière récurrente (hebdomadaire, mensuel). Tout est automatisé.' },
        { q: 'Est-ce sécurisé ?', a: 'Oui. Tous les paiements passent par Paystack et Stripe, deux des passerelles les plus sécurisées au monde. Conformité PCI-DSS.' },
      ] : [
        { q: 'Is it free?', a: 'Yes, there\'s no subscription. Siteviral takes a 10% commission only on completed sales. Donations are subject to payment gateway fees only.' },
        { q: 'Can our members pay by Mobile Money?', a: 'Absolutely! Orange Money, MTN Mobile Money, Wave and all mobile payment methods are accepted. The diaspora can pay by card.' },
        { q: 'Do I need technical skills?', a: 'No, zero. If you can use WhatsApp, you can use Siteviral. Everything is done in a few clicks.' },
        { q: 'How do I receive the money?', a: 'Money is automatically sent to your Mobile Money or bank account after a 72-hour security period.' },
        { q: 'Can we receive recurring donations?', a: 'Yes, your members can choose to give on a recurring basis (weekly, monthly). Everything is automated.' },
        { q: 'Is it secure?', a: 'Yes. All payments go through Paystack and Stripe, two of the most secure payment gateways in the world. PCI-DSS compliant.' },
      ]}
      cta={{ label: isFr ? 'Créer ma page d\'église gratuitement' : 'Create my church page for free', path: '/auth?mode=signup' }}
      secondaryCta={{ label: isFr ? 'Voir comment ça marche' : 'See how it works', path: '/features' }}
    />
  );
}
