import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';

export default function PourMissionnairesPage() {
  return (
    <PersonaLandingPage
      seo={{
        title: 'Siteviral pour les Missionnaires — Collectez des soutiens en toute transparence',
        description: 'Page de soutien professionnelle pour missionnaires. Recevez des dons internationaux, partagez vos rapports, maintenez la confiance de vos donateurs.',
        url: 'https://siteviral.com/pour/missionnaires',
      }}
      badge="✈️ Pour les Missionnaires"
      headline={<>Créez votre page de <span className="text-primary">soutien missionnaire</span> en 5 minutes</>}
      subheadline="Vous travaillez dans des zones reculées et dépendez de dons internationaux. Créez une page professionnelle qui inspire confiance, recevez des dons multi-devises et partagez vos rapports en toute transparence."
      painPoints={[
        { icon: '🌍', title: 'Donateurs dispersés', desc: 'Vos soutiens sont dans 10 pays différents. Pas de canal centralisé pour recevoir leurs dons.' },
        { icon: '📊', title: 'Manque de transparence', desc: 'Les donateurs veulent savoir où va leur argent. Vous n\'avez pas d\'outil de reporting simple.' },
        { icon: '💳', title: 'Réception difficile', desc: 'PayPal ne marche pas bien, Western Union coûte cher, les virements sont compliqués.' },
        { icon: '🖥️', title: 'Image non professionnelle', desc: 'Sans page dédiée, vos appels à dons semblent amateurs et n\'inspirent pas confiance.' },
        { icon: '⏰', title: 'Temps perdu en admin', desc: 'Vous passez des heures à envoyer des remerciements et des rapports manuellement.' },
        { icon: '📱', title: 'Pas adapté au mobile', desc: 'Vos donateurs africains veulent payer par Mobile Money, pas par virement bancaire.' },
      ]}
      solutions={[
        { title: 'Page de mission professionnelle', desc: 'Présentez votre mission, vos objectifs, vos résultats. Une URL propre à partager partout.' },
        { title: 'Dons multi-devises', desc: 'FCFA par Mobile Money en Afrique, EUR/USD/GBP par carte pour la diaspora et les soutiens internationaux.' },
        { title: 'Campagnes ciblées', desc: 'Lancez des collectes pour chaque projet : construction, équipement, aide humanitaire. Barre de progression visible.' },
        { title: 'Rapports transparents', desc: 'Partagez des annonces et mises à jour avec tous vos donateurs. Traçabilité totale des fonds.' },
        { title: 'Dons récurrents', desc: 'Vos soutiens fidèles peuvent programmer des dons mensuels automatiques.' },
        { title: 'Ambassadeurs de mission', desc: 'Vos relais dans chaque pays partagent votre page et mobilisent leur réseau.' },
      ]}
      steps={[
        { step: '1', title: 'Créez votre page de mission', desc: 'Inscription gratuite. Décrivez votre mission, ajoutez des photos de terrain.' },
        { step: '2', title: 'Lancez vos campagnes', desc: 'Créez des collectes avec objectifs. Partagez sur WhatsApp, Facebook, email.' },
        { step: '3', title: 'Recevez et reportez', desc: 'Les dons arrivent automatiquement. Envoyez des mises à jour à vos donateurs.' },
      ]}
      testimonial={{
        name: 'Missionnaire J. N.',
        role: 'Organisation missionnaire',
        text: 'Nos donateurs en Europe et en Amérique peuvent enfin contribuer facilement par carte. Et ceux au pays donnent par Mobile Money. La transparence a renforcé la confiance.',
        flag: '🇨🇩',
      }}
      stats={[
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: 'Multi-devises', label: 'FCFA, USD, EUR, GBP' },
        { value: '100%', label: 'traçabilité des dons' },
      ]}
      faq={[
        { q: 'Peut-on recevoir des dons de l\'étranger ?', a: 'Oui, les donateurs internationaux paient par carte Visa/Mastercard en leur devise locale (EUR, USD, GBP).' },
        { q: 'Comment prouver la transparence ?', a: 'Chaque don est tracé. Vous pouvez publier des annonces et mises à jour visibles par tous vos donateurs sur votre page.' },
        { q: 'Les dons récurrents sont-ils possibles ?', a: 'Oui, vos soutiens peuvent choisir de donner mensuellement. Le prélèvement est automatique.' },
        { q: 'Faut-il une structure légale ?', a: 'Non, vous pouvez commencer sans structure légale. Pour les gros volumes, une vérification KYC sera demandée.' },
        { q: 'Comment recevoir l\'argent sur le terrain ?', a: 'Par Mobile Money (Orange, MTN, Wave) ou virement bancaire. Vous choisissez votre méthode de retrait.' },
        { q: 'Est-ce sécurisé pour les donateurs ?', a: 'Oui, paiements sécurisés par Paystack et Stripe (PCI-DSS). Les données sont chiffrées.' },
      ]}
      cta={{ label: 'Créer ma page de mission', path: '/auth?mode=signup' }}
      secondaryCta={{ label: 'Voir un exemple', path: '/discover' }}
    />
  );
}
