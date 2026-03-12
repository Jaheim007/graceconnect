import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';
import { useI18n } from '@/i18n/I18nContext';

export default function PourEntrepreneursPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <PersonaLandingPage
      seo={{
        title: isFr ? 'Siteviral pour Entrepreneurs — Lancez votre business numérique sans code' : 'Siteviral for Entrepreneurs — Launch your digital business without code',
        description: isFr ? 'Vendez vos produits numériques, formations et services en ligne. Zéro code, zéro abonnement, paiement Mobile Money natif.' : 'Sell your digital products, courses and services online. Zero code, zero subscription, native Mobile Money payments.',
        url: 'https://siteviral.com/pour/entrepreneurs',
      }}
      badge={isFr ? '🚀 Pour les Entrepreneurs' : '🚀 For Entrepreneurs'}
      headline={isFr ? <>Lancez votre business digital <span className="text-primary">en un week-end</span></> : <>Launch your digital business <span className="text-primary">in a weekend</span></>}
      subheadline={isFr ? 'Pas besoin de développeur, de site web ou de budget marketing. Créez, vendez et développez votre entreprise numérique avec Siteviral.' : 'No need for a developer, a website or a marketing budget. Create, sell and grow your digital business with Siteviral.'}
      painPoints={isFr ? [
        { icon: '💻', title: 'Besoin d\'un site web', desc: 'Créer un site e-commerce coûte 500 000+ FCFA et prend des semaines. Et il faut le maintenir.' },
        { icon: '🔧', title: 'Complexité technique', desc: 'Hébergement, SSL, passerelle de paiement, gestion des stocks… Trop de technique, pas assez de ventes.' },
        { icon: '💸', title: 'Coûts de démarrage élevés', desc: 'Shopify à 29$/mois, nom de domaine, publicité… Vous dépensez avant même de vendre.' },
        { icon: '📊', title: 'Marketing coûteux', desc: 'Facebook Ads, Google Ads… Des milliers de FCFA brûlés sans garantie de résultat.' },
        { icon: '🏦', title: 'Encaissement compliqué', desc: 'Ouvrir un compte marchand, négocier avec les banques, intégrer un système de paiement…' },
        { icon: '📈', title: 'Difficulté à scaler', desc: 'Comment passer de 10 à 1 000 clients sans exploser vos coûts ?' },
      ] : [
        { icon: '💻', title: 'Need a website', desc: 'Creating an e-commerce site costs $800+ and takes weeks. And you have to maintain it.' },
        { icon: '🔧', title: 'Technical complexity', desc: 'Hosting, SSL, payment gateway, inventory management… Too much tech, not enough sales.' },
        { icon: '💸', title: 'High startup costs', desc: 'Shopify at $29/month, domain name, advertising… You spend before you even sell.' },
        { icon: '📊', title: 'Expensive marketing', desc: 'Facebook Ads, Google Ads… Thousands burned with no guaranteed results.' },
        { icon: '🏦', title: 'Complicated payments', desc: 'Opening a merchant account, negotiating with banks, integrating a payment system…' },
        { icon: '📈', title: 'Difficulty scaling', desc: 'How to go from 10 to 1,000 clients without exploding costs?' },
      ]}
      solutions={isFr ? [
        { title: 'Boutique en 2 minutes', desc: 'Créez votre vitrine professionnelle sans code. Logo, description, produits, paiement — tout est inclus.' },
        { title: 'Zéro coût initial', desc: 'Pas d\'abonnement, pas de frais cachés. Vous ne payez que 7% quand vous vendez. Pas de vente = 0 frais.' },
        { title: 'Paiement intégré', desc: 'Mobile Money + carte bancaire. Vos clients paient, vous recevez. Aucune configuration technique.' },
        { title: 'Marketing gratuit', desc: 'Le programme ambassadeur remplace la publicité. Vos clients vendent pour vous et gagnent une commission.' },
        { title: 'Scalabilité infinie', desc: 'Produits numériques = zéro stock, zéro livraison, zéro limite. 10 ou 10 000 clients, même coût.' },
        { title: 'Analytics & CRM', desc: 'Tableau de bord avec ventes, clients, ambassadeurs. Prenez des décisions basées sur les données.' },
      ] : [
        { title: 'Store in 2 minutes', desc: 'Create your professional storefront without code. Logo, description, products, payment — all included.' },
        { title: 'Zero upfront costs', desc: 'No subscription, no hidden fees. You only pay 7% when you sell. No sale = $0 fees.' },
        { title: 'Integrated payments', desc: 'Mobile Money + bank card. Your clients pay, you receive. No technical setup.' },
        { title: 'Free marketing', desc: 'The ambassador program replaces advertising. Your clients sell for you and earn a commission.' },
        { title: 'Infinite scalability', desc: 'Digital products = zero inventory, zero shipping, zero limits. 10 or 10,000 clients, same cost.' },
        { title: 'Analytics & CRM', desc: 'Dashboard with sales, clients, ambassadors. Make data-driven decisions.' },
      ]}
      steps={isFr ? [
        { step: '1', title: 'Identifiez votre produit', desc: 'Quel problème résolvez-vous ? Packagez la solution en produit numérique (guide, template, formation).' },
        { step: '2', title: 'Créez votre boutique', desc: 'Inscription, upload du produit, prix fixé. Votre business est en ligne.' },
        { step: '3', title: 'Grandissez avec les ambassadeurs', desc: 'Activez le programme ambassadeur. Votre armée de vente travaille 24h/24 pour vous.' },
      ] : [
        { step: '1', title: 'Identify your product', desc: 'What problem do you solve? Package the solution into a digital product (guide, template, course).' },
        { step: '2', title: 'Create your store', desc: 'Sign up, upload the product, set price. Your business is live.' },
        { step: '3', title: 'Grow with ambassadors', desc: 'Activate the ambassador program. Your sales army works 24/7 for you.' },
      ]}
      testimonial={{
        name: 'Serge N.',
        role: isFr ? 'Fondateur, "Business Toolkit Africa", Douala' : 'Founder, "Business Toolkit Africa", Douala',
        text: isFr ? 'J\'ai lancé ma collection de templates business un dimanche. Le lundi, j\'avais mes premières ventes. En 6 mois, c\'est devenu mon activité principale.' : 'I launched my business template collection on a Sunday. By Monday, I had my first sales. In 6 months, it became my main activity.',
        flag: '🇨🇲',
      }}
      stats={isFr ? [
        { value: '0 FCFA', label: 'Coût de lancement' },
        { value: '< 2 min', label: 'Mise en ligne' },
        { value: '93%', label: 'Marge conservée' },
        { value: '∞', label: 'Potentiel de ventes' },
      ] : [
        { value: '$0', label: 'Launch cost' },
        { value: '< 2 min', label: 'Setup time' },
        { value: '93%', label: 'Margin kept' },
        { value: '∞', label: 'Sales potential' },
      ]}
      faq={isFr ? [
        { q: 'Ai-je besoin de compétences techniques ?', a: 'Non. Si vous savez utiliser WhatsApp, vous savez utiliser Siteviral. L\'interface est conçue pour les non-techniciens.' },
        { q: 'Puis-je vendre des produits physiques ?', a: 'Siteviral est optimisé pour le numérique. Pour le physique, vous pouvez utiliser les liens externes.' },
        { q: 'Comment me différencier des concurrents ?', a: 'Le programme ambassadeur est votre avantage compétitif. Aucun concurrent local n\'offre ce système de croissance virale.' },
        { q: 'Puis-je avoir plusieurs boutiques ?', a: 'Oui ! Créez plusieurs organisations pour différentes marques ou niches.' },
      ] : [
        { q: 'Do I need technical skills?', a: 'No. If you can use WhatsApp, you can use Siteviral. The interface is designed for non-technical people.' },
        { q: 'Can I sell physical products?', a: 'Siteviral is optimized for digital. For physical products, you can use external links.' },
        { q: 'How to differentiate from competitors?', a: 'The ambassador program is your competitive advantage. No local competitor offers this viral growth system.' },
        { q: 'Can I have multiple stores?', a: 'Yes! Create multiple organizations for different brands or niches.' },
      ]}
      cta={{ label: isFr ? 'Lancer mon business' : 'Launch my business', path: '/auth?mode=signup' }}
      secondaryCta={{ label: isFr ? 'Calculer mes revenus' : 'Calculate my earnings', path: '/calculateur' }}
    />
  );
}
