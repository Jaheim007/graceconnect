import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';

export default function PourMediasPage() {
  return (
    <PersonaLandingPage
      seo={{
        title: 'Siteviral pour les Médias — Monétisez vos contenus éditoriaux',
        description: 'Journaux, web-médias et radios : monétisez vos archives, podcasts et contenus premium. Paiement Mobile Money intégré.',
        url: 'https://siteviral.com/pour/medias',
      }}
      badge="📰 Pour les Médias"
      headline={<>Monétisez vos <span className="text-primary">contenus éditoriaux</span> au-delà de la publicité</>}
      subheadline="Les revenus publicitaires s'effondrent. Créez un canal de revenus direct : vendez vos archives, enquêtes exclusives, podcasts premium et formations journalistiques."
      painPoints={[
        { icon: '📉', title: 'Revenus pub en chute', desc: 'La publicité digitale paye de moins en moins. Le modèle économique est fragile.' },
        { icon: '📦', title: 'Archives non monétisées', desc: 'Des années de contenus de qualité dorment dans vos serveurs sans générer de revenus.' },
        { icon: '🔒', title: 'Pas de paywall adapté', desc: 'Les solutions de paywall occidentales ne supportent pas le Mobile Money.' },
        { icon: '🎙️', title: 'Podcasts gratuits', desc: 'Vos émissions audio attirent des auditeurs mais ne génèrent aucun revenu direct.' },
        { icon: '💸', title: 'Dépendance aux bailleurs', desc: 'Vos projets éditoriaux dépendent de financements externes aléatoires.' },
        { icon: '📱', title: 'Audience mobile', desc: '90% de votre audience est sur mobile. Il faut un modèle adapté.' },
      ]}
      solutions={[
        { title: 'Contenus premium', desc: 'Vendez vos enquêtes exclusives, analyses approfondies et dossiers spéciaux en accès payant.' },
        { title: 'Archives monétisées', desc: 'Packagez vos meilleures archives en collections thématiques vendables.' },
        { title: 'Podcasts premium', desc: 'Proposez des épisodes bonus, interviews exclusives et séries spéciales payantes.' },
        { title: 'Abonnements lecteurs', desc: 'Créez des formules d\'abonnement mensuel pour un accès illimité à vos contenus premium.' },
        { title: 'Mobile Money natif', desc: 'Vos lecteurs payent par Orange Money, MTN ou Wave. Friction minimale.' },
        { title: 'Collecte de dons', desc: 'Lancez des campagnes de soutien pour financer vos enquêtes indépendantes.' },
      ]}
      steps={[
        { step: '1', title: 'Créez votre espace', desc: 'Inscription gratuite. Importez votre identité visuelle et votre ligne éditoriale.' },
        { step: '2', title: 'Publiez vos contenus', desc: 'Articles premium, podcasts, vidéos, PDF. Mixez gratuit et payant.' },
        { step: '3', title: 'Fidélisez votre audience', desc: 'Abonnements, notifications, newsletter. Vos lecteurs reviennent et payent.' },
      ]}
      testimonial={{
        name: 'Rédaction L.I.',
        role: 'Web-média indépendant',
        text: 'Nos dossiers d\'enquête premium financent désormais notre rédaction. 200 abonnés payants en 2 mois. L\'indépendance éditoriale retrouvée.',
        flag: '🇧🇯',
      }}
      stats={[
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: 'Illimité', label: 'contenus publiables' },
        { value: '90%', label: 'pour la rédaction' },
      ]}
      faq={[
        { q: 'Peut-on vendre des articles individuels ?', a: 'Oui, vendez à l\'unité ou par abonnement. Vous définissez votre modèle.' },
        { q: 'Les podcasts sont-ils supportés ?', a: 'Oui, uploadez vos fichiers audio MP3. Les auditeurs achètent et écoutent directement.' },
        { q: 'Comment intégrer à notre site existant ?', a: 'Ajoutez un lien vers votre page Siteviral. Aucune intégration technique complexe nécessaire.' },
        { q: 'Nos lecteurs peuvent-ils payer par Mobile Money ?', a: 'Oui, tous les moyens de paiement mobile africains et carte bancaire internationale.' },
        { q: 'Peut-on lancer des campagnes de soutien ?', a: 'Oui, créez des campagnes de dons avec objectif et barre de progression.' },
        { q: 'Comment recevoir les revenus ?', a: 'Mobile Money ou virement bancaire. Versements après 72h de sécurité.' },
      ]}
      cta={{ label: 'Monétiser nos contenus', path: '/auth?mode=signup' }}
      secondaryCta={{ label: 'Découvrir les fonctionnalités', path: '/features' }}
    />
  );
}
