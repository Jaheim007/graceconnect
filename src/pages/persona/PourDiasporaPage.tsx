import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';
import { useI18n } from '@/i18n/I18nContext';

export default function PourDiasporaPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <PersonaLandingPage
      seo={{
        title: isFr ? 'Siteviral pour la Diaspora — Soutenez vos communautés à distance' : 'Siteviral for the Diaspora — Support your communities remotely',
        description: isFr ? 'Donnez, achetez et soutenez les projets de votre communauté d\'origine depuis l\'étranger. Paiement sécurisé, transparence totale.' : 'Give, buy and support projects from your home community from abroad. Secure payment, total transparency.',
        url: 'https://siteviral.com/pour/diaspora',
      }}
      badge={isFr ? '🌍 Pour la Diaspora Africaine' : '🌍 For the African Diaspora'}
      headline={isFr ? <>Soutenez vos communautés <span className="text-primary">depuis l'étranger</span></> : <>Support your communities <span className="text-primary">from abroad</span></>}
      subheadline={isFr ? 'Donnez aux églises, ONG et projets de chez vous. Achetez les produits de créateurs locaux. Tout est traçable, transparent et sécurisé.' : 'Give to churches, NGOs and projects from home. Buy products from local creators. Everything is traceable, transparent and secure.'}
      painPoints={isFr ? [
        { icon: '💸', title: 'Western Union coûte cher', desc: 'Les frais de transfert classiques mangent 7-12% de chaque envoi. L\'argent n\'arrive pas toujours où il devrait.' },
        { icon: '🔍', title: 'Zéro transparence', desc: 'Vous envoyez de l\'argent mais vous ne savez jamais comment il est utilisé. Aucun suivi, aucun rapport.' },
        { icon: '🤷', title: 'Difficile de trouver des projets fiables', desc: 'Comment savoir quelles ONG ou églises sont sérieuses ? Pas de plateforme de confiance.' },
        { icon: '🛒', title: 'Impossible d\'acheter local', desc: 'Vous voulez soutenir les créateurs africains mais les plateformes locales n\'acceptent pas vos moyens de paiement.' },
        { icon: '📱', title: 'Communication fragmentée', desc: 'WhatsApp, email, appels… Suivre les projets de votre communauté est un casse-tête.' },
        { icon: '🕐', title: 'Décalage horaire', desc: 'Impossible de participer aux événements en direct. Vous manquez les moments importants de votre communauté.' },
      ] : [
        { icon: '💸', title: 'Western Union is expensive', desc: 'Classic transfer fees eat 7-12% of each send. Money doesn\'t always arrive where it should.' },
        { icon: '🔍', title: 'Zero transparency', desc: 'You send money but never know how it\'s used. No tracking, no reports.' },
        { icon: '🤷', title: 'Hard to find reliable projects', desc: 'How to know which NGOs or churches are serious? No trusted platform.' },
        { icon: '🛒', title: 'Can\'t buy local', desc: 'You want to support African creators but local platforms don\'t accept your payment methods.' },
        { icon: '📱', title: 'Fragmented communication', desc: 'WhatsApp, email, calls… Following your community\'s projects is a headache.' },
        { icon: '🕐', title: 'Time zone difference', desc: 'Can\'t participate in live events. You miss the important moments of your community.' },
      ]}
      solutions={isFr ? [
        { title: 'Dons traçables', desc: 'Chaque don est suivi en temps réel. Vous voyez exactement combien a été collecté et comment c\'est utilisé.' },
        { title: 'Paiement par carte bancaire', desc: 'Payez avec Visa, Mastercard ou Stripe depuis l\'Europe, l\'Amérique ou l\'Asie. L\'argent arrive en Mobile Money.' },
        { title: 'Marketplace de créateurs', desc: 'Découvrez et achetez les ebooks, formations et créations d\'artistes et entrepreneurs africains.' },
        { title: 'Suivi des campagnes', desc: 'Suivez la progression des campagnes de collecte en temps réel. Reçus de don automatiques.' },
        { title: 'Annonces communautaires', desc: 'Restez connecté avec les nouvelles de votre église, association ou communauté.' },
        { title: 'Programme ambassadeur', desc: 'Partagez les projets avec votre réseau en diaspora. Chaque partage qui convertit vous rapporte.' },
      ] : [
        { title: 'Traceable donations', desc: 'Each donation is tracked in real time. You see exactly how much was collected and how it\'s used.' },
        { title: 'Bank card payment', desc: 'Pay with Visa, Mastercard or Stripe from Europe, America or Asia. Money arrives via Mobile Money.' },
        { title: 'Creator marketplace', desc: 'Discover and buy ebooks, courses and creations from African artists and entrepreneurs.' },
        { title: 'Campaign tracking', desc: 'Track fundraising campaign progress in real time. Automatic donation receipts.' },
        { title: 'Community announcements', desc: 'Stay connected with news from your church, association or community.' },
        { title: 'Ambassador program', desc: 'Share projects with your diaspora network. Every share that converts earns you money.' },
      ]}
      steps={isFr ? [
        { step: '1', title: 'Trouvez votre communauté', desc: 'Cherchez votre église, ONG ou association sur le marketplace Siteviral.' },
        { step: '2', title: 'Donnez ou achetez', desc: 'Contribuez à une campagne ou achetez un produit. Paiement sécurisé par carte.' },
        { step: '3', title: 'Suivez l\'impact', desc: 'Recevez des mises à jour sur l\'utilisation des fonds. Reçu fiscal automatique.' },
      ] : [
        { step: '1', title: 'Find your community', desc: 'Search for your church, NGO or association on the Siteviral marketplace.' },
        { step: '2', title: 'Give or buy', desc: 'Contribute to a campaign or buy a product. Secure card payment.' },
        { step: '3', title: 'Track the impact', desc: 'Receive updates on fund usage. Automatic tax receipt.' },
      ]}
      testimonial={{
        name: 'Patrick M.',
        role: isFr ? 'Ingénieur, Paris — Originaire de Douala' : 'Engineer, Paris — Originally from Douala',
        text: isFr ? 'Je donne chaque mois à mon église de Douala via Siteviral. Je vois exactement combien est collecté. C\'est 10x mieux que d\'envoyer via Western Union.' : 'I give every month to my church in Douala via Siteviral. I see exactly how much is collected. It\'s 10x better than sending via Western Union.',
        flag: '🇫🇷',
      }}
      stats={isFr ? [
        { value: '2-3%', label: 'Frais vs 10% WU' },
        { value: '100%', label: 'Traçabilité' },
        { value: '25+', label: 'Pays supportés' },
        { value: '24h', label: 'Réception des fonds' },
      ] : [
        { value: '2-3%', label: 'Fees vs 10% WU' },
        { value: '100%', label: 'Traceability' },
        { value: '25+', label: 'Countries supported' },
        { value: '24h', label: 'Fund reception' },
      ]}
      faq={isFr ? [
        { q: 'Puis-je payer par carte bancaire européenne ?', a: 'Oui ! Visa, Mastercard, et tous les moyens de paiement Stripe sont acceptés.' },
        { q: 'Comment savoir si mon don est bien utilisé ?', a: 'Chaque organisation a un tableau de bord transparent. Vous voyez le montant collecté, les contributeurs, et l\'avancement de la campagne.' },
        { q: 'Est-ce que je reçois un reçu fiscal ?', a: 'Oui, un reçu est généré automatiquement pour chaque don.' },
        { q: 'Quels sont les frais ?', a: 'Les frais de plateforme sont de 7% (contre 10-12% pour Western Union). Pas d\'abonnement, pas de frais cachés.' },
        { q: 'Puis-je donner de manière récurrente ?', a: 'Oui ! Configurez un don mensuel automatique. Vous pouvez l\'annuler à tout moment.' },
      ] : [
        { q: 'Can I pay with a European bank card?', a: 'Yes! Visa, Mastercard, and all Stripe payment methods are accepted.' },
        { q: 'How to know if my donation is well used?', a: 'Each organization has a transparent dashboard. You see the amount collected, contributors, and campaign progress.' },
        { q: 'Do I receive a tax receipt?', a: 'Yes, a receipt is automatically generated for each donation.' },
        { q: 'What are the fees?', a: 'Platform fees are 7% (vs 10-12% for Western Union). No subscription, no hidden fees.' },
        { q: 'Can I give on a recurring basis?', a: 'Yes! Set up an automatic monthly donation. You can cancel at any time.' },
      ]}
      cta={{ label: isFr ? 'Commencer à donner' : 'Start giving', path: '/discover' }}
      secondaryCta={{ label: isFr ? 'Explorer les projets' : 'Explore projects', path: '/discover' }}
    />
  );
}
