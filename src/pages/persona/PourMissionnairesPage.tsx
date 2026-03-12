import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';
import { useI18n } from '@/i18n/I18nContext';

export default function PourMissionnairesPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <PersonaLandingPage
      seo={{
        title: isFr ? 'Siteviral pour les Missionnaires — Collectez des soutiens en toute transparence' : 'Siteviral for Missionaries — Collect Support with Full Transparency',
        description: isFr ? 'Page de soutien professionnelle pour missionnaires. Recevez des dons internationaux, partagez vos rapports.' : 'Professional support page for missionaries. Receive international donations, share your reports.',
        url: 'https://siteviral.com/pour/missionnaires',
      }}
      badge={isFr ? '✈️ Pour les Missionnaires' : '✈️ For Missionaries'}
      headline={isFr
        ? <>Créez votre page de <span className="text-primary">soutien missionnaire</span> en 5 minutes</>
        : <>Create your <span className="text-primary">missionary support</span> page in 5 minutes</>}
      subheadline={isFr
        ? 'Vous travaillez dans des zones reculées et dépendez de dons internationaux. Créez une page professionnelle qui inspire confiance, recevez des dons multi-devises et partagez vos rapports en toute transparence.'
        : 'You work in remote areas and depend on international donations. Create a professional page that inspires trust, receive multi-currency donations, and share your reports with full transparency.'}
      painPoints={isFr ? [
        { icon: '🌍', title: 'Donateurs dispersés', desc: 'Vos soutiens sont dans 10 pays différents. Pas de canal centralisé pour recevoir leurs dons.' },
        { icon: '📊', title: 'Manque de transparence', desc: 'Les donateurs veulent savoir où va leur argent. Vous n\'avez pas d\'outil de reporting simple.' },
        { icon: '💳', title: 'Réception difficile', desc: 'PayPal ne marche pas bien, Western Union coûte cher, les virements sont compliqués.' },
        { icon: '🖥️', title: 'Image non professionnelle', desc: 'Sans page dédiée, vos appels à dons semblent amateurs et n\'inspirent pas confiance.' },
        { icon: '⏰', title: 'Temps perdu en admin', desc: 'Vous passez des heures à envoyer des remerciements et des rapports manuellement.' },
        { icon: '📱', title: 'Pas adapté au mobile', desc: 'Vos donateurs africains veulent payer par Mobile Money, pas par virement bancaire.' },
      ] : [
        { icon: '🌍', title: 'Scattered donors', desc: 'Your supporters are in 10+ countries. No centralized channel to receive their donations.' },
        { icon: '📊', title: 'Lack of transparency', desc: 'Donors want to know where their money goes. You don\'t have a simple reporting tool.' },
        { icon: '💳', title: 'Difficult receiving', desc: 'PayPal doesn\'t work well, Western Union is expensive, bank transfers are complicated.' },
        { icon: '🖥️', title: 'Unprofessional image', desc: 'Without a dedicated page, your fundraising appeals look amateur and don\'t inspire trust.' },
        { icon: '⏰', title: 'Time wasted on admin', desc: 'You spend hours sending thank-yous and reports manually.' },
        { icon: '📱', title: 'Not mobile-friendly', desc: 'Your African donors want to pay via Mobile Money, not bank transfer.' },
      ]}
      solutions={isFr ? [
        { title: 'Page de mission professionnelle', desc: 'Présentez votre mission, vos objectifs, vos résultats. Une URL propre à partager partout.' },
        { title: 'Dons multi-devises', desc: 'FCFA par Mobile Money en Afrique, EUR/USD/GBP par carte pour la diaspora et les soutiens internationaux.' },
        { title: 'Campagnes ciblées', desc: 'Lancez des collectes pour chaque projet : construction, équipement, aide humanitaire. Barre de progression visible.' },
        { title: 'Rapports transparents', desc: 'Partagez des annonces et mises à jour avec tous vos donateurs. Traçabilité totale des fonds.' },
        { title: 'Dons récurrents', desc: 'Vos soutiens fidèles peuvent programmer des dons mensuels automatiques.' },
        { title: 'Ambassadeurs de mission', desc: 'Vos relais dans chaque pays partagent votre page et mobilisent leur réseau.' },
      ] : [
        { title: 'Professional mission page', desc: 'Present your mission, goals, results. A clean URL to share everywhere.' },
        { title: 'Multi-currency donations', desc: 'XOF via Mobile Money in Africa, EUR/USD/GBP via card for diaspora and international supporters.' },
        { title: 'Targeted campaigns', desc: 'Launch collections for each project: construction, equipment, humanitarian aid. Visible progress bar.' },
        { title: 'Transparent reports', desc: 'Share announcements and updates with all your donors. Full fund traceability.' },
        { title: 'Recurring donations', desc: 'Your loyal supporters can set up automatic monthly donations.' },
        { title: 'Mission ambassadors', desc: 'Your relays in each country share your page and mobilize their network.' },
      ]}
      steps={isFr ? [
        { step: '1', title: 'Créez votre page de mission', desc: 'Inscription gratuite. Décrivez votre mission, ajoutez des photos de terrain.' },
        { step: '2', title: 'Lancez vos campagnes', desc: 'Créez des collectes avec objectifs. Partagez sur WhatsApp, Facebook, email.' },
        { step: '3', title: 'Recevez et reportez', desc: 'Les dons arrivent automatiquement. Envoyez des mises à jour à vos donateurs.' },
      ] : [
        { step: '1', title: 'Create your mission page', desc: 'Free sign-up. Describe your mission, add field photos.' },
        { step: '2', title: 'Launch your campaigns', desc: 'Create collections with goals. Share on WhatsApp, Facebook, email.' },
        { step: '3', title: 'Receive and report', desc: 'Donations arrive automatically. Send updates to your donors.' },
      ]}
      testimonial={{
        name: isFr ? 'Missionnaire J. N.' : 'Missionary J. N.',
        role: isFr ? 'Organisation missionnaire' : 'Missionary organization',
        text: isFr
          ? 'Nos donateurs en Europe et en Amérique peuvent enfin contribuer facilement par carte. Et ceux au pays donnent par Mobile Money. La transparence a renforcé la confiance.'
          : 'Our donors in Europe and America can finally contribute easily by card. And those at home give via Mobile Money. Transparency has strengthened trust.',
        flag: '🇨🇩',
      }}
      stats={isFr ? [
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: 'Multi-devises', label: 'FCFA, USD, EUR, GBP' },
        { value: '100%', label: 'traçabilité des dons' },
      ] : [
        { value: '$0', label: 'subscription fee' },
        { value: 'Multi-currency', label: 'XOF, USD, EUR, GBP' },
        { value: '100%', label: 'donation traceability' },
      ]}
      faq={isFr ? [
        { q: 'Peut-on recevoir des dons de l\'étranger ?', a: 'Oui, les donateurs internationaux paient par carte Visa/Mastercard en leur devise locale.' },
        { q: 'Comment prouver la transparence ?', a: 'Chaque don est tracé. Vous pouvez publier des annonces visibles par tous vos donateurs.' },
        { q: 'Les dons récurrents sont-ils possibles ?', a: 'Oui, vos soutiens peuvent choisir de donner mensuellement.' },
        { q: 'Faut-il une structure légale ?', a: 'Non, vous pouvez commencer sans structure légale. Pour les gros volumes, une vérification KYC sera demandée.' },
        { q: 'Comment recevoir l\'argent sur le terrain ?', a: 'Par Mobile Money ou virement bancaire. Vous choisissez votre méthode de retrait.' },
        { q: 'Est-ce sécurisé pour les donateurs ?', a: 'Oui, paiements sécurisés par Paystack et Stripe (PCI-DSS).' },
      ] : [
        { q: 'Can we receive donations from abroad?', a: 'Yes, international donors pay via Visa/Mastercard in their local currency.' },
        { q: 'How to prove transparency?', a: 'Every donation is tracked. You can publish announcements visible to all your donors.' },
        { q: 'Are recurring donations possible?', a: 'Yes, your supporters can choose to give monthly.' },
        { q: 'Do we need a legal structure?', a: 'No, you can start without one. For large volumes, KYC verification will be required.' },
        { q: 'How to receive money in the field?', a: 'Via Mobile Money or bank transfer. You choose your withdrawal method.' },
        { q: 'Is it secure for donors?', a: 'Yes, payments secured by Paystack and Stripe (PCI-DSS).' },
      ]}
      cta={{ label: isFr ? 'Créer ma page de mission' : 'Create my mission page', path: '/auth?mode=signup' }}
      secondaryCta={{ label: isFr ? 'Voir un exemple' : 'See an example', path: '/discover' }}
    />
  );
}
