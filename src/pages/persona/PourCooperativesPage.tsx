import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';

export default function PourCooperativesPage() {
  return (
    <PersonaLandingPage
      seo={{
        title: 'Siteviral pour les Coopératives — Digitalisez votre groupement',
        description: 'Plateforme pour coopératives agricoles et groupements professionnels. Vitrine digitale, cotisations, vente de guides techniques par Mobile Money.',
        url: 'https://siteviral.com/pour/cooperatives',
      }}
      badge="🌾 Pour les Coopératives & Groupements"
      headline={<>Donnez à votre coopérative une <span className="text-primary">vitrine digitale</span> et vendez vos ressources</>}
      subheadline="Vous êtes une coopérative agricole ou un groupement professionnel. Collectez vos cotisations par Mobile Money, vendez vos guides techniques et donnez de la visibilité à votre groupement — sans site coûteux."
      painPoints={[
        { icon: '👁️', title: 'Aucune visibilité', desc: 'Votre coopérative n\'a pas de présence en ligne. Personne ne vous trouve sur internet.' },
        { icon: '💸', title: 'Cotisations en espèces', desc: 'La collecte manuelle des cotisations est chaotique, opaque et source de conflits.' },
        { icon: '📄', title: 'Guides non monétisés', desc: 'Vous produisez des guides techniques, des fiches pratiques, mais ne les vendez pas.' },
        { icon: '📱', title: 'Pas de canal digital', desc: 'Tout passe par le bouche-à-oreille et les réunions physiques. Portée très limitée.' },
        { icon: '🏛️', title: 'Dépendance aux subventions', desc: 'Vous dépendez des programmes gouvernementaux et des ONG pour fonctionner.' },
        { icon: '📊', title: 'Pas de suivi', desc: 'Aucune visibilité sur qui a payé ses cotisations, quelles ressources sont populaires.' },
      ]}
      solutions={[
        { title: 'Vitrine professionnelle', desc: 'Page de coopérative avec présentation, membres, produits, événements. Accessible à tous.' },
        { title: 'Cotisations digitales', desc: 'Collectez les cotisations par Mobile Money. Suivi automatique de qui a payé.' },
        { title: 'Vente de guides techniques', desc: 'Vendez vos fiches pratiques, manuels de culture, guides de transformation. PDF ou vidéo.' },
        { title: 'Communication centralisée', desc: 'Annonces, événements, actualités — informez tous vos membres depuis une seule plateforme.' },
        { title: 'Revenus propres', desc: 'Réduisez votre dépendance aux subventions en générant des revenus digitaux.' },
        { title: 'Analytics & reporting', desc: 'Suivez vos ventes, cotisations, membres actifs. Exportez des rapports pour vos bailleurs.' },
      ]}
      steps={[
        { step: '1', title: 'Créez votre coopérative', desc: 'Inscription gratuite. Décrivez votre groupement, ajoutez votre logo.' },
        { step: '2', title: 'Ajoutez vos ressources', desc: 'Uploadez guides techniques, fiches pratiques. Configurez vos cotisations.' },
        { step: '3', title: 'Mobilisez vos membres', desc: 'Partagez votre page. Les cotisations et achats se font par Mobile Money.' },
      ]}
      testimonial={{
        name: 'Président B. K.',
        role: 'Coopérative agricole',
        text: 'Nos membres paient maintenant leurs cotisations par Orange Money. Nous vendons aussi nos guides de culture. Tout est tracé, plus de conflits.',
        flag: '🇰🇪',
      }}
      stats={[
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: 'Mobile Money', label: 'Orange, MTN, Wave' },
        { value: '100%', label: 'traçabilité des paiements' },
      ]}
      faq={[
        { q: 'Peut-on collecter des cotisations mensuelles ?', a: 'Oui, vous pouvez créer des collectes récurrentes. Chaque paiement est tracé avec le nom du membre.' },
        { q: 'Faut-il une structure légale ?', a: 'Non, vous pouvez commencer immédiatement. Pour les retraits importants, une vérification d\'identité sera nécessaire.' },
        { q: 'Peut-on vendre des guides techniques ?', a: 'Oui, uploadez vos PDF, vidéos ou fichiers. Fixez votre prix et le fichier est livré automatiquement après paiement.' },
        { q: 'Comment nos membres paient-ils ?', a: 'Par Mobile Money (Orange, MTN, Wave) ou carte bancaire. Un clic suffit.' },
        { q: 'Peut-on avoir plusieurs administrateurs ?', a: 'Oui, ajoutez le bureau de votre coopérative comme administrateurs avec différents niveaux d\'accès.' },
        { q: 'Les bailleurs peuvent-ils voir nos rapports ?', a: 'Oui, vous pouvez exporter vos données en CSV/PDF pour vos rapports à destination des bailleurs.' },
      ]}
      cta={{ label: 'Créer la page de ma coopérative', path: '/auth?mode=signup' }}
      secondaryCta={{ label: 'Voir les fonctionnalités', path: '/features' }}
    />
  );
}
