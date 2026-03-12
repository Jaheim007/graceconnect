import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';
import { useI18n } from '@/i18n/I18nContext';

export default function PourMediasPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <PersonaLandingPage
      seo={{
        title: isFr ? 'Siteviral pour les Médias — Monétisez vos contenus éditoriaux' : 'Siteviral for Media — Monetize Your Editorial Content',
        description: isFr ? 'Journaux, web-médias et radios : monétisez vos archives, podcasts et contenus premium. Paiement Mobile Money intégré.' : 'Newspapers, web media, and radio: monetize your archives, podcasts, and premium content. Mobile Money integrated.',
        url: 'https://siteviral.com/pour/medias',
      }}
      badge={isFr ? '📰 Pour les Médias' : '📰 For Media'}
      headline={isFr
        ? <>Monétisez vos <span className="text-primary">contenus éditoriaux</span> au-delà de la publicité</>
        : <>Monetize your <span className="text-primary">editorial content</span> beyond advertising</>}
      subheadline={isFr
        ? 'Les revenus publicitaires s\'effondrent. Créez un canal de revenus direct : vendez vos archives, enquêtes exclusives, podcasts premium et formations journalistiques.'
        : 'Ad revenue is collapsing. Create a direct revenue channel: sell your archives, exclusive investigations, premium podcasts, and journalism training.'}
      painPoints={isFr ? [
        { icon: '📉', title: 'Revenus pub en chute', desc: 'La publicité digitale paye de moins en moins. Le modèle économique est fragile.' },
        { icon: '📦', title: 'Archives non monétisées', desc: 'Des années de contenus de qualité dorment dans vos serveurs sans générer de revenus.' },
        { icon: '🔒', title: 'Pas de paywall adapté', desc: 'Les solutions de paywall occidentales ne supportent pas le Mobile Money.' },
        { icon: '🎙️', title: 'Podcasts gratuits', desc: 'Vos émissions audio attirent des auditeurs mais ne génèrent aucun revenu direct.' },
        { icon: '💸', title: 'Dépendance aux bailleurs', desc: 'Vos projets éditoriaux dépendent de financements externes aléatoires.' },
        { icon: '📱', title: 'Audience mobile', desc: '90% de votre audience est sur mobile. Il faut un modèle adapté.' },
      ] : [
        { icon: '📉', title: 'Falling ad revenue', desc: 'Digital advertising pays less and less. The business model is fragile.' },
        { icon: '📦', title: 'Unmonetized archives', desc: 'Years of quality content sit on your servers generating no revenue.' },
        { icon: '🔒', title: 'No suitable paywall', desc: 'Western paywall solutions don\'t support Mobile Money.' },
        { icon: '🎙️', title: 'Free podcasts', desc: 'Your audio shows attract listeners but generate no direct revenue.' },
        { icon: '💸', title: 'Funder dependency', desc: 'Your editorial projects depend on random external funding.' },
        { icon: '📱', title: 'Mobile audience', desc: '90% of your audience is on mobile. You need an adapted model.' },
      ]}
      solutions={isFr ? [
        { title: 'Contenus premium', desc: 'Vendez vos enquêtes exclusives, analyses approfondies et dossiers spéciaux en accès payant.' },
        { title: 'Archives monétisées', desc: 'Packagez vos meilleures archives en collections thématiques vendables.' },
        { title: 'Podcasts premium', desc: 'Proposez des épisodes bonus, interviews exclusives et séries spéciales payantes.' },
        { title: 'Abonnements lecteurs', desc: 'Créez des formules d\'abonnement mensuel pour un accès illimité à vos contenus premium.' },
        { title: 'Mobile Money natif', desc: 'Vos lecteurs payent par Orange Money, MTN ou Wave. Friction minimale.' },
        { title: 'Collecte de dons', desc: 'Lancez des campagnes de soutien pour financer vos enquêtes indépendantes.' },
      ] : [
        { title: 'Premium content', desc: 'Sell your exclusive investigations, in-depth analyses, and special reports behind a paywall.' },
        { title: 'Monetized archives', desc: 'Package your best archives into sellable thematic collections.' },
        { title: 'Premium podcasts', desc: 'Offer bonus episodes, exclusive interviews, and paid special series.' },
        { title: 'Reader subscriptions', desc: 'Create monthly subscription plans for unlimited access to your premium content.' },
        { title: 'Native Mobile Money', desc: 'Your readers pay via Orange Money, MTN, or Wave. Minimal friction.' },
        { title: 'Donation campaigns', desc: 'Launch support campaigns to fund your independent investigations.' },
      ]}
      steps={isFr ? [
        { step: '1', title: 'Créez votre espace', desc: 'Inscription gratuite. Importez votre identité visuelle et votre ligne éditoriale.' },
        { step: '2', title: 'Publiez vos contenus', desc: 'Articles premium, podcasts, vidéos, PDF. Mixez gratuit et payant.' },
        { step: '3', title: 'Fidélisez votre audience', desc: 'Abonnements, notifications, newsletter. Vos lecteurs reviennent et payent.' },
      ] : [
        { step: '1', title: 'Create your space', desc: 'Free sign-up. Import your visual identity and editorial line.' },
        { step: '2', title: 'Publish your content', desc: 'Premium articles, podcasts, videos, PDFs. Mix free and paid.' },
        { step: '3', title: 'Retain your audience', desc: 'Subscriptions, notifications, newsletter. Your readers return and pay.' },
      ]}
      testimonial={{
        name: isFr ? 'Rédaction L.I.' : 'Editorial team L.I.',
        role: isFr ? 'Web-média indépendant' : 'Independent web media',
        text: isFr
          ? 'Nos dossiers d\'enquête premium financent désormais notre rédaction. 200 abonnés payants en 2 mois. L\'indépendance éditoriale retrouvée.'
          : 'Our premium investigation reports now fund our newsroom. 200 paying subscribers in 2 months. Editorial independence regained.',
        flag: '🇧🇯',
      }}
      stats={isFr ? [
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: 'Illimité', label: 'contenus publiables' },
        { value: '90%', label: 'pour la rédaction' },
      ] : [
        { value: '$0', label: 'subscription fee' },
        { value: 'Unlimited', label: 'publishable content' },
        { value: '90%', label: 'for the newsroom' },
      ]}
      faq={isFr ? [
        { q: 'Peut-on vendre des articles individuels ?', a: 'Oui, vendez à l\'unité ou par abonnement. Vous définissez votre modèle.' },
        { q: 'Les podcasts sont-ils supportés ?', a: 'Oui, uploadez vos fichiers audio MP3. Les auditeurs achètent et écoutent directement.' },
        { q: 'Comment intégrer à notre site existant ?', a: 'Ajoutez un lien vers votre page Siteviral. Aucune intégration technique complexe nécessaire.' },
        { q: 'Nos lecteurs peuvent-ils payer par Mobile Money ?', a: 'Oui, tous les moyens de paiement mobile africains et carte bancaire internationale.' },
        { q: 'Peut-on lancer des campagnes de soutien ?', a: 'Oui, créez des campagnes de dons avec objectif et barre de progression.' },
        { q: 'Comment recevoir les revenus ?', a: 'Mobile Money ou virement bancaire. Versements après 72h de sécurité.' },
      ] : [
        { q: 'Can we sell individual articles?', a: 'Yes, sell per unit or by subscription. You define your model.' },
        { q: 'Are podcasts supported?', a: 'Yes, upload your MP3 audio files. Listeners buy and listen directly.' },
        { q: 'How to integrate with our existing site?', a: 'Add a link to your Siteviral page. No complex technical integration needed.' },
        { q: 'Can our readers pay via Mobile Money?', a: 'Yes, all African mobile payment methods and international credit cards.' },
        { q: 'Can we launch support campaigns?', a: 'Yes, create donation campaigns with goals and progress bars.' },
        { q: 'How do we receive revenue?', a: 'Mobile Money or bank transfer. Payouts after 72-hour security hold.' },
      ]}
      cta={{ label: isFr ? 'Monétiser nos contenus' : 'Monetize our content', path: '/auth?mode=signup' }}
      secondaryCta={{ label: isFr ? 'Découvrir les fonctionnalités' : 'Discover features', path: '/features' }}
    />
  );
}
