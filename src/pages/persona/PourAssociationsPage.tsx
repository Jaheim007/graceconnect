import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';

export default function PourAssociationsPage() {
  return (
    <PersonaLandingPage
      seo={{
        title: 'Siteviral pour Associations — Gérez vos cotisations et événements en ligne',
        description: 'Collectez les cotisations, organisez vos événements et communiquez avec vos membres depuis une seule plateforme. Mobile Money natif.',
        url: 'https://siteviral.com/pour/associations',
      }}
      badge="🤝 Pour les Associations & Clubs"
      headline={<>Gérez votre association <span className="text-primary">100% en ligne</span></>}
      subheadline={<>Cotisations en Mobile Money, événements, annonces, comptabilité automatique. Tout dans une seule plateforme gratuite.</>}
      painPoints={[
        { icon: '💵', title: 'Cotisations en espèces', desc: 'Collecter les cotisations en cash est un cauchemar. Qui a payé ? Qui doit encore ? Aucune traçabilité.' },
        { icon: '📋', title: 'Gestion manuelle', desc: 'Cahiers, Excel, groupes WhatsApp… La gestion de votre association est fragmentée et chronophage.' },
        { icon: '📢', title: 'Communication difficile', desc: 'Vos annonces se perdent dans les groupes WhatsApp. Les membres ratent les informations importantes.' },
        { icon: '🎫', title: 'Événements non rentabilisés', desc: 'Organiser un événement sans billetterie numérique = pas de ventes anticipées, pas de visibilité.' },
        { icon: '📊', title: 'Pas de reporting', desc: 'Impossible de présenter un bilan financier clair aux membres. La confiance s\'érode.' },
        { icon: '🔄', title: 'Rotation des responsables', desc: 'Quand le trésorier change, toute la mémoire institutionnelle se perd.' },
      ]}
      solutions={[
        { title: 'Cotisations en ligne', desc: 'Chaque membre paie via Mobile Money. Le système trace automatiquement qui a payé et qui doit encore.' },
        { title: 'Page d\'association', desc: 'Votre vitrine officielle avec logo, description, contacts. Professionnalisez votre image.' },
        { title: 'Annonces centralisées', desc: 'Publiez des annonces visibles par tous les membres. Fini les messages perdus dans WhatsApp.' },
        { title: 'Événements & billetterie', desc: 'Créez des événements avec inscription en ligne. Collectez les paiements à l\'avance.' },
        { title: 'Rapports automatiques', desc: 'Export Excel/PDF de toutes les transactions. Bilans financiers en 1 clic.' },
        { title: 'Gestion des membres', desc: 'Liste des membres, rôles, historique de cotisations. Tout est centralisé et pérenne.' },
      ]}
      steps={[
        { step: '1', title: 'Créez votre espace', desc: 'Inscrivez votre association avec logo et description. Page publique prête en 2 minutes.' },
        { step: '2', title: 'Invitez vos membres', desc: 'Partagez le lien d\'inscription. Les membres rejoignent et peuvent payer en ligne.' },
        { step: '3', title: 'Gérez et communiquez', desc: 'Cotisations, annonces, événements — tout depuis votre tableau de bord.' },
      ]}
      testimonial={{
        name: 'Alassane B.',
        role: 'Président, Association des Anciens Élèves, Ouagadougou',
        text: 'Avant, on collectait 40% des cotisations. Maintenant avec Siteviral, on est à 85%. Les membres paient en un clic sur Orange Money. Le trésorier est enfin serein.',
        flag: '🇧🇫',
      }}
      stats={[
        { value: '+85%', label: 'Taux de cotisation' },
        { value: '0 FCFA', label: 'Abonnement' },
        { value: '100%', label: 'Traçabilité' },
        { value: '< 5 min', label: 'Configuration' },
      ]}
      faq={[
        { q: 'Combien de membres peut-on gérer ?', a: 'Aucune limite. Que vous ayez 10 ou 10 000 membres, la plateforme s\'adapte.' },
        { q: 'Les cotisations peuvent-elles être récurrentes ?', a: 'Vous pouvez créer des campagnes mensuelles et envoyer des rappels automatiques aux membres.' },
        { q: 'Peut-on exporter les données ?', a: 'Oui ! Export Excel et PDF de toutes les transactions, listes de membres, et rapports financiers.' },
        { q: 'Est-ce adapté pour une tontine ?', a: 'Les tontines ont des besoins spécifiques (rotation), mais Siteviral peut gérer les cotisations et la traçabilité.' },
        { q: 'Comment faire la transition depuis le cash ?', a: 'Commencez par proposer le paiement en ligne en parallèle du cash. En 2-3 mois, la majorité basculera.' },
      ]}
      cta={{ label: 'Créer l\'espace de mon association', path: '/auth?mode=signup' }}
      secondaryCta={{ label: 'Voir comment ça marche', path: '/features' }}
    />
  );
}
