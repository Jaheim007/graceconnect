import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';
import { useI18n } from '@/i18n/I18nContext';

export default function PourAgencesPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <PersonaLandingPage
      seo={{
        title: isFr ? 'Siteviral pour les Agences — Lancez des boutiques digitales pour vos clients' : 'Siteviral for Agencies — Launch digital stores for your clients',
        description: isFr ? 'Agences web et marketing : créez des boutiques digitales pour vos clients en quelques minutes. Revenus récurrents par organisation gérée.' : 'Web and marketing agencies: create digital stores for your clients in minutes. Recurring revenue per managed organization.',
        url: 'https://siteviral.com/pour/agences',
      }}
      badge={isFr ? '🏢 Pour les Agences' : '🏢 For Agencies'}
      headline={isFr ? <>Lancez des <span className="text-primary">boutiques digitales</span> pour chacun de vos clients</> : <>Launch <span className="text-primary">digital stores</span> for each of your clients</>}
      subheadline={isFr ? 'Vous êtes une agence web, marketing ou communication. Offrez à vos clients une plateforme de vente digitale clé en main et générez des revenus récurrents sur chaque organisation créée.' : 'You\'re a web, marketing or communications agency. Offer your clients a turnkey digital sales platform and generate recurring revenue on each organization created.'}
      painPoints={isFr ? [
        { icon: '🔧', title: 'Développement coûteux', desc: 'Créer un site e-commerce sur mesure pour chaque client prend des semaines et coûte cher.' },
        { icon: '💸', title: 'Revenus one-shot', desc: 'Vous facturez un projet puis le client part. Pas de revenus récurrents.' },
        { icon: '📱', title: 'Mobile Money non intégré', desc: 'Vos clients africains ont besoin de Mobile Money mais les solutions sont complexes à intégrer.' },
        { icon: '🔄', title: 'Maintenance continue', desc: 'Chaque site client nécessite des mises à jour, de l\'hébergement et du support technique.' },
        { icon: '📊', title: 'Pas de vue d\'ensemble', desc: 'Gérer 10 clients sur 10 plateformes différentes est un cauchemar opérationnel.' },
        { icon: '⏰', title: 'Time-to-market lent', desc: 'Vos clients veulent être en ligne demain. Vous avez besoin de semaines.' },
      ] : [
        { icon: '🔧', title: 'Expensive development', desc: 'Building a custom e-commerce site for each client takes weeks and costs a lot.' },
        { icon: '💸', title: 'One-shot revenue', desc: 'You invoice a project then the client leaves. No recurring revenue.' },
        { icon: '📱', title: 'Mobile Money not integrated', desc: 'Your African clients need Mobile Money but solutions are complex to integrate.' },
        { icon: '🔄', title: 'Ongoing maintenance', desc: 'Each client site requires updates, hosting and technical support.' },
        { icon: '📊', title: 'No overview', desc: 'Managing 10 clients on 10 different platforms is an operational nightmare.' },
        { icon: '⏰', title: 'Slow time-to-market', desc: 'Your clients want to be online tomorrow. You need weeks.' },
      ]}
      solutions={isFr ? [
        { title: 'Déploiement en 10 minutes', desc: 'Créez une boutique complète pour votre client en quelques clics. Logo, produits, paiement — tout y est.' },
        { title: 'Multi-organisations', desc: 'Gérez tous vos clients depuis un seul compte. Vue d\'ensemble sur toutes les boutiques.' },
        { title: 'Mobile Money intégré', desc: 'Paystack, Stripe — tous les paiements sont gérés. Rien à configurer côté technique.' },
        { title: 'White-label friendly', desc: 'Page personnalisable avec le branding de chaque client. Votre agence reste en coulisse.' },
        { title: 'Revenus partenaire', desc: 'Devenez partenaire et touchez une commission récurrente sur chaque client que vous apportez.' },
        { title: 'Zéro maintenance', desc: 'Siteviral gère l\'hébergement, les mises à jour et la sécurité. Vous vous concentrez sur la valeur.' },
      ] : [
        { title: '10-minute deployment', desc: 'Create a complete store for your client in a few clicks. Logo, products, payment — everything is there.' },
        { title: 'Multi-organizations', desc: 'Manage all your clients from a single account. Overview of all stores.' },
        { title: 'Integrated Mobile Money', desc: 'Paystack, Stripe — all payments are handled. Nothing to configure on the technical side.' },
        { title: 'White-label friendly', desc: 'Customizable page with each client\'s branding. Your agency stays behind the scenes.' },
        { title: 'Partner revenue', desc: 'Become a partner and earn recurring commission on each client you bring.' },
        { title: 'Zero maintenance', desc: 'Siteviral handles hosting, updates and security. You focus on value.' },
      ]}
      steps={isFr ? [
        { step: '1', title: 'Devenez partenaire', desc: 'Inscription gratuite. Accédez au programme partenaire et à vos outils de gestion.' },
        { step: '2', title: 'Créez pour vos clients', desc: 'Lancez une boutique par client en 10 minutes. Uploadez leurs produits et configurez les paiements.' },
        { step: '3', title: 'Générez des revenus', desc: 'Commission récurrente sur chaque transaction. Plus vous gérez de clients, plus vous gagnez.' },
      ] : [
        { step: '1', title: 'Become a partner', desc: 'Free signup. Access the partner program and your management tools.' },
        { step: '2', title: 'Create for your clients', desc: 'Launch a store per client in 10 minutes. Upload their products and configure payments.' },
        { step: '3', title: 'Generate revenue', desc: 'Recurring commission on each transaction. The more clients you manage, the more you earn.' },
      ]}
      testimonial={{
        name: 'Creative Studio KD',
        role: isFr ? 'Digital agency, Nairobi' : 'Digital agency, Nairobi',
        text: isFr ? 'On a migré 15 clients sur Siteviral en un mois. Plus de soucis d\'hébergement ni de paiement. Et les commissions partenaires couvrent nos frais fixes.' : 'We migrated 15 clients to Siteviral in one month. No more hosting or payment headaches. And partner commissions cover our fixed costs.',
        flag: '🇰🇪',
      }}
      stats={isFr ? [
        { value: '10 min', label: 'par boutique client' },
        { value: '0 FCFA', label: 'de maintenance' },
        { value: 'Récurrent', label: 'modèle de revenus' },
      ] : [
        { value: '10 min', label: 'per client store' },
        { value: '$0', label: 'maintenance' },
        { value: 'Recurring', label: 'revenue model' },
      ]}
      faq={isFr ? [
        { q: 'Comment fonctionne le programme partenaire ?', a: 'Vous créez des organisations pour vos clients et touchez une commission sur chaque transaction. Plus de détails sur la page partenaire.' },
        { q: 'Mes clients gardent-ils le contrôle ?', a: 'Oui, chaque client a son propre accès admin. Vous pouvez gérer en co-administration.' },
        { q: 'Combien de clients puis-je gérer ?', a: 'Aucune limite. Créez autant d\'organisations que nécessaire.' },
        { q: 'Faut-il des compétences techniques ?', a: 'Non, tout est no-code. Si vous savez utiliser Facebook, vous savez utiliser Siteviral.' },
      ] : [
        { q: 'How does the partner program work?', a: 'You create organizations for your clients and earn a commission on each transaction. More details on the partner page.' },
        { q: 'Do my clients keep control?', a: 'Yes, each client has their own admin access. You can manage in co-administration.' },
        { q: 'How many clients can I manage?', a: 'No limit. Create as many organizations as needed.' },
        { q: 'Do I need technical skills?', a: 'No, everything is no-code. If you can use Facebook, you can use Siteviral.' },
      ]}
      cta={{ label: isFr ? 'Devenir partenaire agence' : 'Become an agency partner', path: '/devenir-partenaire' }}
      secondaryCta={{ label: isFr ? 'Voir le programme partenaire' : 'See the partner program', path: '/partner-terms' }}
    />
  );
}
