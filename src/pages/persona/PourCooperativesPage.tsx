import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';
import { useI18n } from '@/i18n/I18nContext';

export default function PourCooperativesPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <PersonaLandingPage
      seo={{
        title: isFr ? 'Siteviral pour les Coopératives — Digitalisez votre groupement' : 'Siteviral for Cooperatives — Digitize Your Group',
        description: isFr ? 'Plateforme pour coopératives agricoles et groupements professionnels. Vitrine digitale, cotisations, vente de guides techniques par Mobile Money.' : 'Platform for agricultural cooperatives and professional groups. Digital storefront, dues collection, technical guides via Mobile Money.',
        url: 'https://siteviral.com/pour/cooperatives',
      }}
      badge={isFr ? '🌾 Pour les Coopératives & Groupements' : '🌾 For Cooperatives & Groups'}
      headline={isFr
        ? <>Donnez à votre coopérative une <span className="text-primary">vitrine digitale</span> et vendez vos ressources</>
        : <>Give your cooperative a <span className="text-primary">digital storefront</span> and sell your resources</>}
      subheadline={isFr
        ? 'Vous êtes une coopérative agricole ou un groupement professionnel. Collectez vos cotisations par Mobile Money, vendez vos guides techniques et donnez de la visibilité à votre groupement — sans site coûteux.'
        : 'You\'re an agricultural cooperative or professional group. Collect dues via Mobile Money, sell your technical guides, and boost your group\'s visibility — without an expensive website.'}
      painPoints={isFr ? [
        { icon: '👁️', title: 'Aucune visibilité', desc: 'Votre coopérative n\'a pas de présence en ligne. Personne ne vous trouve sur internet.' },
        { icon: '💸', title: 'Cotisations en espèces', desc: 'La collecte manuelle des cotisations est chaotique, opaque et source de conflits.' },
        { icon: '📄', title: 'Guides non monétisés', desc: 'Vous produisez des guides techniques, des fiches pratiques, mais ne les vendez pas.' },
        { icon: '📱', title: 'Pas de canal digital', desc: 'Tout passe par le bouche-à-oreille et les réunions physiques. Portée très limitée.' },
        { icon: '🏛️', title: 'Dépendance aux subventions', desc: 'Vous dépendez des programmes gouvernementaux et des ONG pour fonctionner.' },
        { icon: '📊', title: 'Pas de suivi', desc: 'Aucune visibilité sur qui a payé ses cotisations, quelles ressources sont populaires.' },
      ] : [
        { icon: '👁️', title: 'No visibility', desc: 'Your cooperative has no online presence. Nobody finds you on the internet.' },
        { icon: '💸', title: 'Cash-only dues', desc: 'Manual dues collection is chaotic, opaque, and a source of conflict.' },
        { icon: '📄', title: 'Unmonetized guides', desc: 'You produce technical guides and practical sheets but don\'t sell them.' },
        { icon: '📱', title: 'No digital channel', desc: 'Everything is word-of-mouth and physical meetings. Very limited reach.' },
        { icon: '🏛️', title: 'Subsidy dependent', desc: 'You depend on government programs and NGOs to operate.' },
        { icon: '📊', title: 'No tracking', desc: 'No visibility on who paid dues, which resources are popular.' },
      ]}
      solutions={isFr ? [
        { title: 'Vitrine professionnelle', desc: 'Page de coopérative avec présentation, membres, produits, événements. Accessible à tous.' },
        { title: 'Cotisations digitales', desc: 'Collectez les cotisations par Mobile Money. Suivi automatique de qui a payé.' },
        { title: 'Vente de guides techniques', desc: 'Vendez vos fiches pratiques, manuels de culture, guides de transformation. PDF ou vidéo.' },
        { title: 'Communication centralisée', desc: 'Annonces, événements, actualités — informez tous vos membres depuis une seule plateforme.' },
        { title: 'Revenus propres', desc: 'Réduisez votre dépendance aux subventions en générant des revenus digitaux.' },
        { title: 'Analytics & reporting', desc: 'Suivez vos ventes, cotisations, membres actifs. Exportez des rapports pour vos bailleurs.' },
      ] : [
        { title: 'Professional storefront', desc: 'Cooperative page with overview, members, products, events. Accessible to all.' },
        { title: 'Digital dues', desc: 'Collect dues via Mobile Money. Automatic tracking of who has paid.' },
        { title: 'Sell technical guides', desc: 'Sell your practical sheets, farming manuals, processing guides. PDF or video.' },
        { title: 'Centralized communication', desc: 'Announcements, events, news — inform all members from a single platform.' },
        { title: 'Own revenue', desc: 'Reduce subsidy dependence by generating digital revenue.' },
        { title: 'Analytics & reporting', desc: 'Track sales, dues, active members. Export reports for your funders.' },
      ]}
      steps={isFr ? [
        { step: '1', title: 'Créez votre coopérative', desc: 'Inscription gratuite. Décrivez votre groupement, ajoutez votre logo.' },
        { step: '2', title: 'Ajoutez vos ressources', desc: 'Uploadez guides techniques, fiches pratiques. Configurez vos cotisations.' },
        { step: '3', title: 'Mobilisez vos membres', desc: 'Partagez votre page. Les cotisations et achats se font par Mobile Money.' },
      ] : [
        { step: '1', title: 'Create your cooperative', desc: 'Free sign-up. Describe your group, add your logo.' },
        { step: '2', title: 'Add your resources', desc: 'Upload technical guides, practical sheets. Set up your dues.' },
        { step: '3', title: 'Mobilize your members', desc: 'Share your page. Dues and purchases are handled via Mobile Money.' },
      ]}
      testimonial={{
        name: isFr ? 'Président B. K.' : 'President B. K.',
        role: isFr ? 'Coopérative agricole' : 'Agricultural cooperative',
        text: isFr
          ? 'Nos membres paient maintenant leurs cotisations par Orange Money. Nous vendons aussi nos guides de culture. Tout est tracé, plus de conflits.'
          : 'Our members now pay their dues via Orange Money. We also sell our farming guides. Everything is tracked, no more conflicts.',
        flag: '🇰🇪',
      }}
      stats={isFr ? [
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: 'Mobile Money', label: 'Orange, MTN, Wave' },
        { value: '100%', label: 'traçabilité des paiements' },
      ] : [
        { value: '$0', label: 'subscription fee' },
        { value: 'Mobile Money', label: 'Orange, MTN, Wave' },
        { value: '100%', label: 'payment traceability' },
      ]}
      faq={isFr ? [
        { q: 'Peut-on collecter des cotisations mensuelles ?', a: 'Oui, vous pouvez créer des collectes récurrentes. Chaque paiement est tracé avec le nom du membre.' },
        { q: 'Faut-il une structure légale ?', a: 'Non, vous pouvez commencer immédiatement. Pour les retraits importants, une vérification d\'identité sera nécessaire.' },
        { q: 'Peut-on vendre des guides techniques ?', a: 'Oui, uploadez vos PDF, vidéos ou fichiers. Fixez votre prix et le fichier est livré automatiquement après paiement.' },
        { q: 'Comment nos membres paient-ils ?', a: 'Par Mobile Money (Orange, MTN, Wave) ou carte bancaire. Un clic suffit.' },
        { q: 'Peut-on avoir plusieurs administrateurs ?', a: 'Oui, ajoutez le bureau de votre coopérative comme administrateurs avec différents niveaux d\'accès.' },
        { q: 'Les bailleurs peuvent-ils voir nos rapports ?', a: 'Oui, vous pouvez exporter vos données en CSV/PDF pour vos rapports à destination des bailleurs.' },
      ] : [
        { q: 'Can we collect monthly dues?', a: 'Yes, you can create recurring collections. Each payment is tracked with the member\'s name.' },
        { q: 'Do we need a legal structure?', a: 'No, you can start immediately. For large withdrawals, identity verification will be required.' },
        { q: 'Can we sell technical guides?', a: 'Yes, upload your PDFs, videos, or files. Set your price and the file is delivered automatically after payment.' },
        { q: 'How do our members pay?', a: 'Via Mobile Money (Orange, MTN, Wave) or credit card. One click is enough.' },
        { q: 'Can we have multiple admins?', a: 'Yes, add your cooperative\'s board as administrators with different access levels.' },
        { q: 'Can funders see our reports?', a: 'Yes, you can export your data as CSV/PDF for reports to funders.' },
      ]}
      cta={{ label: isFr ? 'Créer la page de ma coopérative' : 'Create my cooperative page', path: '/auth?mode=signup' }}
      secondaryCta={{ label: isFr ? 'Voir les fonctionnalités' : 'See features', path: '/features' }}
    />
  );
}
