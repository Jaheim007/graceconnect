import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';
import { useI18n } from '@/i18n/I18nContext';

export default function PourMinisteresPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <PersonaLandingPage
      seo={{
        title: isFr ? 'Siteviral pour les Ministères & Évangélistes — Centralisez votre impact' : 'Siteviral for Ministries & Evangelists — Centralize Your Impact',
        description: isFr ? 'Plateforme tout-en-un pour les mega-churches, ministères internationaux et évangélistes itinérants. Multi-pays, multi-devises, analytics avancés.' : 'All-in-one platform for mega-churches, international ministries, and itinerant evangelists. Multi-country, multi-currency, advanced analytics.',
        url: 'https://siteviral.com/pour/ministeres',
      }}
      badge={isFr ? '🌍 Pour les Ministères & Évangélistes' : '🌍 For Ministries & Evangelists'}
      headline={isFr
        ? <>Centralisez votre ministère <span className="text-primary">international</span> sur une seule plateforme</>
        : <>Centralize your <span className="text-primary">international</span> ministry on one platform</>}
      subheadline={isFr
        ? 'Vous avez une audience multi-pays, des contenus vidéo à monétiser et des développeurs qui coûtent cher. Siteviral remplace tout ça avec une solution professionnelle, multi-devises, sans code.'
        : 'You have a multi-country audience, video content to monetize, and developers that cost a fortune. Siteviral replaces all that with a professional, multi-currency, no-code solution.'}
      painPoints={isFr ? [
        { icon: '💰', title: 'Développeurs trop chers', desc: 'Vous payez des développeurs pour des solutions custom qui ne marchent pas bien et coûtent une fortune.' },
        { icon: '🌐', title: 'Audience dispersée', desc: 'Vos fidèles sont dans 10 pays différents mais vous n\'avez pas de plateforme centralisée.' },
        { icon: '📹', title: 'Des millions de vues, zéro revenu', desc: 'YouTube ne paye pas dans votre pays. Vos contenus viraux ne génèrent aucun revenu structuré.' },
        { icon: '🔀', title: 'Outils fragmentés', desc: 'PayPal pour certains, espèces pour d\'autres, WhatsApp pour communiquer. Rien n\'est intégré.' },
        { icon: '📊', title: 'Aucun analytics', desc: 'Pas de visibilité sur qui donne, qui achète, quels contenus performent.' },
        { icon: '⚙️', title: 'Maintenance technique', desc: 'Votre site custom tombe en panne, les mises à jour sont un cauchemar.' },
      ] : [
        { icon: '💰', title: 'Expensive developers', desc: 'You pay developers for custom solutions that don\'t work well and cost a fortune.' },
        { icon: '🌐', title: 'Scattered audience', desc: 'Your followers are in 10+ countries but you have no centralized platform.' },
        { icon: '📹', title: 'Millions of views, zero revenue', desc: 'YouTube doesn\'t pay in your country. Your viral content generates no structured revenue.' },
        { icon: '🔀', title: 'Fragmented tools', desc: 'PayPal for some, cash for others, WhatsApp to communicate. Nothing is integrated.' },
        { icon: '📊', title: 'No analytics', desc: 'No visibility on who donates, who buys, which content performs.' },
        { icon: '⚙️', title: 'Technical maintenance', desc: 'Your custom site breaks down, updates are a nightmare.' },
      ]}
      solutions={isFr ? [
        { title: 'Plateforme professionnelle clé en main', desc: 'Page de ministère personnalisable avec votre branding. Aucun développeur nécessaire.' },
        { title: 'Multi-devises automatique', desc: 'Recevez en FCFA, USD, EUR, GBP. Chaque fidèle paye dans sa devise locale.' },
        { title: 'Monétisation YouTube', desc: 'Vos prédications YouTube deviennent des produits premium vendus directement à vos fans.' },
        { title: 'Analytics en temps réel', desc: 'Dashboard complet : ventes, dons, membres actifs, contenus les plus populaires.' },
        { title: 'Réseau d\'ambassadeurs', desc: 'Transformez vos fidèles les plus engagés en force de vente avec commissions automatiques.' },
        { title: 'Zéro maintenance', desc: 'Tout est géré par Siteviral. Mises à jour, sécurité, hébergement — vous vous concentrez sur votre mission.' },
      ] : [
        { title: 'Turnkey professional platform', desc: 'Customizable ministry page with your branding. No developer needed.' },
        { title: 'Automatic multi-currency', desc: 'Receive in XOF, USD, EUR, GBP. Each follower pays in their local currency.' },
        { title: 'YouTube monetization', desc: 'Your YouTube sermons become premium products sold directly to your fans.' },
        { title: 'Real-time analytics', desc: 'Complete dashboard: sales, donations, active members, top-performing content.' },
        { title: 'Ambassador network', desc: 'Turn your most engaged followers into a sales force with automatic commissions.' },
        { title: 'Zero maintenance', desc: 'Everything managed by Siteviral. Updates, security, hosting — you focus on your mission.' },
      ]}
      steps={isFr ? [
        { step: '1', title: 'Créez votre ministère', desc: 'Inscription gratuite, personnalisez votre page avec logo et bannière en 5 minutes.' },
        { step: '2', title: 'Importez vos contenus', desc: 'Uploadez vos prédications, importez depuis YouTube, créez vos campagnes de collecte.' },
        { step: '3', title: 'Déployez mondialement', desc: 'Partagez votre lien. Mobile Money en Afrique, carte bancaire pour la diaspora mondiale.' },
      ] : [
        { step: '1', title: 'Create your ministry', desc: 'Free sign-up, customize your page with logo and banner in 5 minutes.' },
        { step: '2', title: 'Import your content', desc: 'Upload your sermons, import from YouTube, create your fundraising campaigns.' },
        { step: '3', title: 'Deploy globally', desc: 'Share your link. Mobile Money in Africa, credit card for the global diaspora.' },
      ]}
      testimonial={{
        name: isFr ? 'Évangéliste D. A.' : 'Evangelist D. A.',
        role: isFr ? 'Ministère international' : 'International ministry',
        text: isFr
          ? 'J\'avais 2 millions de vues sur YouTube mais zéro revenu. Avec Siteviral, mes prédications génèrent maintenant des revenus chaque jour.'
          : 'I had 2 million YouTube views but zero revenue. With Siteviral, my sermons now generate daily income.',
        flag: '🇨🇲',
      }}
      stats={isFr ? [
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: 'Multi-devises', label: 'FCFA, USD, EUR, GBP' },
        { value: '10%', label: 'commission uniquement sur les ventes' },
      ] : [
        { value: '$0', label: 'subscription fee' },
        { value: 'Multi-currency', label: 'XOF, USD, EUR, GBP' },
        { value: '10%', label: 'commission on sales only' },
      ]}
      faq={isFr ? [
        { q: 'Peut-on remplacer notre site actuel ?', a: 'Oui, Siteviral peut servir de site principal ou compléter votre site existant.' },
        { q: 'Comment gérer plusieurs pays ?', a: 'Siteviral gère automatiquement les devises. Vos fidèles payent dans leur devise locale.' },
        { q: 'Peut-on avoir plusieurs administrateurs ?', a: 'Oui, ajoutez des membres à votre équipe avec différents niveaux d\'accès.' },
        { q: 'Comment importer nos vidéos YouTube ?', a: 'Collez simplement le lien YouTube. Siteviral récupère automatiquement le titre et la miniature.' },
        { q: 'Y a-t-il une limite de stockage ?', a: 'Non, uploadez autant de contenus que vous voulez. Pas de limite.' },
        { q: 'Le paiement est-il sécurisé ?', a: 'Oui, nous utilisons Paystack et Stripe, certifiés PCI-DSS.' },
      ] : [
        { q: 'Can we replace our current site?', a: 'Yes, Siteviral can serve as your main site or complement your existing one.' },
        { q: 'How to manage multiple countries?', a: 'Siteviral automatically handles currencies. Your followers pay in their local currency.' },
        { q: 'Can we have multiple admins?', a: 'Yes, add team members with different access levels.' },
        { q: 'How to import our YouTube videos?', a: 'Simply paste the YouTube link. Siteviral automatically pulls the title and thumbnail.' },
        { q: 'Is there a storage limit?', a: 'No, upload as much content as you want. No limits.' },
        { q: 'Is payment secure?', a: 'Yes, we use Paystack and Stripe, PCI-DSS certified.' },
      ]}
      cta={{ label: isFr ? 'Lancer mon ministère en ligne' : 'Launch my ministry online', path: '/auth?mode=signup' }}
      secondaryCta={{ label: isFr ? 'Voir les fonctionnalités' : 'See features', path: '/features' }}
    />
  );
}
