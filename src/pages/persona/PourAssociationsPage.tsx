import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';
import { useI18n } from '@/i18n/I18nContext';

export default function PourAssociationsPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <PersonaLandingPage
      seo={{
        title: isFr ? 'Siteviral pour Associations — Gérez vos cotisations et événements en ligne' : 'Siteviral for Associations — Manage your dues and events online',
        description: isFr ? 'Collectez les cotisations, organisez vos événements et communiquez avec vos membres depuis une seule plateforme. Mobile Money natif.' : 'Collect dues, organize your events and communicate with your members from a single platform. Native Mobile Money.',
        url: 'https://siteviral.com/pour/associations',
      }}
      badge={isFr ? '🤝 Pour les Associations & Clubs' : '🤝 For Associations & Clubs'}
      headline={isFr ? <>Gérez votre association <span className="text-primary">100% en ligne</span></> : <>Manage your association <span className="text-primary">100% online</span></>}
      subheadline={isFr ? 'Cotisations en Mobile Money, événements, annonces, comptabilité automatique. Tout dans une seule plateforme gratuite.' : 'Dues via Mobile Money, events, announcements, automatic accounting. All in one free platform.'}
      painPoints={isFr ? [
        { icon: '💵', title: 'Cotisations en espèces', desc: 'Collecter les cotisations en cash est un cauchemar. Qui a payé ? Qui doit encore ? Aucune traçabilité.' },
        { icon: '📋', title: 'Gestion manuelle', desc: 'Cahiers, Excel, groupes WhatsApp… La gestion de votre association est fragmentée et chronophage.' },
        { icon: '📢', title: 'Communication difficile', desc: 'Vos annonces se perdent dans les groupes WhatsApp. Les membres ratent les informations importantes.' },
        { icon: '🎫', title: 'Événements non rentabilisés', desc: 'Organiser un événement sans billetterie numérique = pas de ventes anticipées, pas de visibilité.' },
        { icon: '📊', title: 'Pas de reporting', desc: 'Impossible de présenter un bilan financier clair aux membres. La confiance s\'érode.' },
        { icon: '🔄', title: 'Rotation des responsables', desc: 'Quand le trésorier change, toute la mémoire institutionnelle se perd.' },
      ] : [
        { icon: '💵', title: 'Cash dues', desc: 'Collecting dues in cash is a nightmare. Who paid? Who still owes? No traceability.' },
        { icon: '📋', title: 'Manual management', desc: 'Notebooks, Excel, WhatsApp groups… Your association management is fragmented and time-consuming.' },
        { icon: '📢', title: 'Difficult communication', desc: 'Your announcements get lost in WhatsApp groups. Members miss important information.' },
        { icon: '🎫', title: 'Unprofitable events', desc: 'Organizing an event without digital ticketing = no advance sales, no visibility.' },
        { icon: '📊', title: 'No reporting', desc: 'Impossible to present a clear financial report to members. Trust erodes.' },
        { icon: '🔄', title: 'Leadership rotation', desc: 'When the treasurer changes, all institutional memory is lost.' },
      ]}
      solutions={isFr ? [
        { title: 'Cotisations en ligne', desc: 'Chaque membre paie via Mobile Money. Le système trace automatiquement qui a payé et qui doit encore.' },
        { title: 'Page d\'association', desc: 'Votre vitrine officielle avec logo, description, contacts. Professionnalisez votre image.' },
        { title: 'Annonces centralisées', desc: 'Publiez des annonces visibles par tous les membres. Fini les messages perdus dans WhatsApp.' },
        { title: 'Événements & billetterie', desc: 'Créez des événements avec inscription en ligne. Collectez les paiements à l\'avance.' },
        { title: 'Rapports automatiques', desc: 'Export Excel/PDF de toutes les transactions. Bilans financiers en 1 clic.' },
        { title: 'Gestion des membres', desc: 'Liste des membres, rôles, historique de cotisations. Tout est centralisé et pérenne.' },
      ] : [
        { title: 'Online dues', desc: 'Each member pays via Mobile Money. The system automatically tracks who paid and who still owes.' },
        { title: 'Association page', desc: 'Your official storefront with logo, description, contacts. Professionalize your image.' },
        { title: 'Centralized announcements', desc: 'Publish announcements visible to all members. No more lost messages in WhatsApp.' },
        { title: 'Events & ticketing', desc: 'Create events with online registration. Collect payments in advance.' },
        { title: 'Automatic reports', desc: 'Excel/PDF export of all transactions. Financial statements in 1 click.' },
        { title: 'Member management', desc: 'Member list, roles, dues history. Everything is centralized and permanent.' },
      ]}
      steps={isFr ? [
        { step: '1', title: 'Créez votre espace', desc: 'Inscrivez votre association avec logo et description. Page publique prête en 2 minutes.' },
        { step: '2', title: 'Invitez vos membres', desc: 'Partagez le lien d\'inscription. Les membres rejoignent et peuvent payer en ligne.' },
        { step: '3', title: 'Gérez et communiquez', desc: 'Cotisations, annonces, événements — tout depuis votre tableau de bord.' },
      ] : [
        { step: '1', title: 'Create your space', desc: 'Register your association with logo and description. Public page ready in 2 minutes.' },
        { step: '2', title: 'Invite your members', desc: 'Share the registration link. Members join and can pay online.' },
        { step: '3', title: 'Manage and communicate', desc: 'Dues, announcements, events — all from your dashboard.' },
      ]}
      testimonial={{
        name: 'Alassane B.',
        role: isFr ? 'Président, Association des Anciens Élèves, Ouagadougou' : 'President, Alumni Association, Ouagadougou',
        text: isFr ? 'Avant, on collectait 40% des cotisations. Maintenant avec Siteviral, on est à 85%. Les membres paient en un clic sur Orange Money. Le trésorier est enfin serein.' : 'Before, we collected 40% of dues. Now with Siteviral, we\'re at 85%. Members pay in one click with Orange Money. The treasurer is finally at ease.',
        flag: '🇧🇫',
      }}
      stats={isFr ? [
        { value: '+85%', label: 'Taux de cotisation' },
        { value: '0 FCFA', label: 'Abonnement' },
        { value: '100%', label: 'Traçabilité' },
        { value: '< 5 min', label: 'Configuration' },
      ] : [
        { value: '+85%', label: 'Dues collection rate' },
        { value: '$0', label: 'Subscription' },
        { value: '100%', label: 'Traceability' },
        { value: '< 5 min', label: 'Setup' },
      ]}
      faq={isFr ? [
        { q: 'Combien de membres peut-on gérer ?', a: 'Aucune limite. Que vous ayez 10 ou 10 000 membres, la plateforme s\'adapte.' },
        { q: 'Les cotisations peuvent-elles être récurrentes ?', a: 'Vous pouvez créer des campagnes mensuelles et envoyer des rappels automatiques aux membres.' },
        { q: 'Peut-on exporter les données ?', a: 'Oui ! Export Excel et PDF de toutes les transactions, listes de membres, et rapports financiers.' },
        { q: 'Est-ce adapté pour une tontine ?', a: 'Les tontines ont des besoins spécifiques (rotation), mais Siteviral peut gérer les cotisations et la traçabilité.' },
        { q: 'Comment faire la transition depuis le cash ?', a: 'Commencez par proposer le paiement en ligne en parallèle du cash. En 2-3 mois, la majorité basculera.' },
      ] : [
        { q: 'How many members can we manage?', a: 'No limit. Whether you have 10 or 10,000 members, the platform scales.' },
        { q: 'Can dues be recurring?', a: 'You can create monthly campaigns and send automatic reminders to members.' },
        { q: 'Can we export data?', a: 'Yes! Excel and PDF export of all transactions, member lists, and financial reports.' },
        { q: 'Is it suitable for a tontine?', a: 'Tontines have specific needs (rotation), but Siteviral can handle dues and traceability.' },
        { q: 'How to transition from cash?', a: 'Start by offering online payment alongside cash. In 2-3 months, the majority will switch.' },
      ]}
      cta={{ label: isFr ? 'Créer l\'espace de mon association' : 'Create my association\'s space', path: '/auth?mode=signup' }}
      secondaryCta={{ label: isFr ? 'Voir comment ça marche' : 'See how it works', path: '/features' }}
    />
  );
}
