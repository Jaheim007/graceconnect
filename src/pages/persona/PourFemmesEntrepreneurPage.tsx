import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';
import { useI18n } from '@/i18n/I18nContext';

export default function PourFemmesEntrepreneurPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <PersonaLandingPage
      seo={{
        title: isFr ? 'Siteviral pour les Femmes Entrepreneures — Lancez votre business digital' : 'Siteviral for Women Entrepreneurs — Launch Your Digital Business',
        description: isFr ? 'Plateforme pensée pour les femmes entrepreneures africaines. Vendez vos créations, formations et services par Mobile Money. Zéro code, zéro abonnement.' : 'Platform designed for African women entrepreneurs. Sell your creations, training, and services via Mobile Money. Zero code, zero subscription.',
        url: 'https://siteviral.com/pour/femmes-entrepreneures',
      }}
      badge={isFr ? '👩‍💼 Pour les Femmes Entrepreneures' : '👩‍💼 For Women Entrepreneurs'}
      headline={isFr
        ? <>Lancez votre <span className="text-primary">business digital</span> sans barrières</>
        : <>Launch your <span className="text-primary">digital business</span> without barriers</>}
      subheadline={isFr
        ? 'Vous avez le talent, les idées et l\'énergie. Il vous manque juste la plateforme. Créez votre boutique en ligne, vendez vos produits et services, et développez votre indépendance financière.'
        : 'You have the talent, ideas, and energy. You just need the platform. Create your online store, sell your products and services, and build your financial independence.'}
      painPoints={isFr ? [
        { icon: '🚧', title: 'Barrières techniques', desc: 'Créer un site web semble complexe et coûteux. Vous ne savez pas par où commencer.' },
        { icon: '💸', title: 'Accès au financement limité', desc: 'Les banques et investisseurs sont difficiles d\'accès. Il faut commencer avec peu.' },
        { icon: '📱', title: 'Vente sur WhatsApp', desc: 'Vous vendez via WhatsApp mais gérer les commandes manuellement est épuisant.' },
        { icon: '🌍', title: 'Marché limité', desc: 'Vous ne touchez que votre entourage proche. Votre marché potentiel est bien plus large.' },
        { icon: '⏰', title: 'Double charge', desc: 'Entre famille et business, chaque minute compte. Il faut des outils efficaces.' },
        { icon: '🏗️', title: 'Pas de vitrine pro', desc: 'Sans présence en ligne professionnelle, les clients sérieux vous prennent moins au sérieux.' },
      ] : [
        { icon: '🚧', title: 'Technical barriers', desc: 'Building a website seems complex and expensive. You don\'t know where to start.' },
        { icon: '💸', title: 'Limited funding access', desc: 'Banks and investors are hard to reach. You need to start with little.' },
        { icon: '📱', title: 'WhatsApp selling', desc: 'You sell via WhatsApp but managing orders manually is exhausting.' },
        { icon: '🌍', title: 'Limited market', desc: 'You only reach your immediate circle. Your potential market is much larger.' },
        { icon: '⏰', title: 'Double burden', desc: 'Between family and business, every minute counts. You need efficient tools.' },
        { icon: '🏗️', title: 'No professional storefront', desc: 'Without a professional online presence, serious clients take you less seriously.' },
      ]}
      solutions={isFr ? [
        { title: 'Boutique en 2 minutes', desc: 'Créez votre vitrine professionnelle sans aucune compétence technique. Tout est guidé.' },
        { title: 'Zéro investissement', desc: 'Pas d\'abonnement, pas de frais fixes. Vous ne payez que quand vous vendez.' },
        { title: 'Mobile Money natif', desc: 'Vos clientes payent par Orange Money, MTN ou Wave. Le moyen de paiement qu\'elles connaissent.' },
        { title: 'Produits & services', desc: 'Vendez ebooks, formations, recettes, patrons couture, guides beauté, tout contenu digital.' },
        { title: 'Communauté & réseau', desc: 'Connectez-vous avec d\'autres entrepreneures. Partagez, collaborez, grandissez ensemble.' },
        { title: 'Programme ambassadrice', desc: 'Vos clientes deviennent vos ambassadrices et gagnent une commission sur chaque vente.' },
      ] : [
        { title: 'Store in 2 minutes', desc: 'Create your professional storefront with zero technical skills. Fully guided.' },
        { title: 'Zero investment', desc: 'No subscription, no fixed fees. You only pay when you sell.' },
        { title: 'Native Mobile Money', desc: 'Your clients pay via Orange Money, MTN, or Wave. The payment method they know.' },
        { title: 'Products & services', desc: 'Sell ebooks, courses, recipes, sewing patterns, beauty guides, any digital content.' },
        { title: 'Community & network', desc: 'Connect with other women entrepreneurs. Share, collaborate, grow together.' },
        { title: 'Ambassador program', desc: 'Your clients become your ambassadors and earn a commission on every sale.' },
      ]}
      steps={isFr ? [
        { step: '1', title: 'Inscrivez-vous', desc: 'Gratuit. Créez votre page en 2 minutes avec votre téléphone.' },
        { step: '2', title: 'Ajoutez vos produits', desc: 'Photos, descriptions, prix. Uploadez vos fichiers digitaux.' },
        { step: '3', title: 'Vendez et grandissez', desc: 'Partagez votre lien sur WhatsApp et réseaux sociaux. Les ventes arrivent.' },
      ] : [
        { step: '1', title: 'Sign up', desc: 'Free. Create your page in 2 minutes from your phone.' },
        { step: '2', title: 'Add your products', desc: 'Photos, descriptions, prices. Upload your digital files.' },
        { step: '3', title: 'Sell and grow', desc: 'Share your link on WhatsApp and social media. Sales start coming in.' },
      ]}
      testimonial={{
        name: 'Fatou B.',
        role: isFr ? 'Entrepreneure mode & beauté' : 'Fashion & beauty entrepreneur',
        text: isFr
          ? 'J\'ai lancé mes tutoriels coiffure sur Siteviral depuis mon téléphone. En 3 mois, j\'ai gagné plus que mon ancien salaire. Merci pour cette opportunité.'
          : 'I launched my hair tutorials on Siteviral from my phone. In 3 months, I earned more than my old salary. Thank you for this opportunity.',
        flag: '🇬🇳',
      }}
      stats={isFr ? [
        { value: '0 FCFA', label: 'pour démarrer' },
        { value: '2 min', label: 'pour créer sa boutique' },
        { value: '+60%', label: 'de nos créateurs sont des femmes' },
      ] : [
        { value: '$0', label: 'to get started' },
        { value: '2 min', label: 'to create your store' },
        { value: '+60%', label: 'of our creators are women' },
      ]}
      faq={isFr ? [
        { q: 'Faut-il savoir coder ?', a: 'Non, aucune compétence technique nécessaire. Si vous savez utiliser WhatsApp, vous savez utiliser Siteviral.' },
        { q: 'C\'est vraiment gratuit ?', a: 'Oui, zéro abonnement. Siteviral prend 10% uniquement quand vous faites une vente.' },
        { q: 'Je peux vendre quoi ?', a: 'Tout contenu digital : recettes, tutoriels, formations, guides, patrons, ebooks, musique, photos.' },
        { q: 'Comment mes clientes payent ?', a: 'Par Mobile Money (Orange, MTN, Wave) ou carte bancaire. Simple et rapide.' },
        { q: 'Peut-on utiliser depuis un téléphone ?', a: 'Oui, Siteviral est 100% optimisé mobile. Créez et gérez tout depuis votre smartphone.' },
        { q: 'Comment recevoir mon argent ?', a: 'Par Mobile Money directement sur votre numéro. Versements après 72h.' },
      ] : [
        { q: 'Do I need to know how to code?', a: 'No, zero technical skills needed. If you can use WhatsApp, you can use Siteviral.' },
        { q: 'Is it really free?', a: 'Yes, zero subscription. Siteviral takes 10% only when you make a sale.' },
        { q: 'What can I sell?', a: 'Any digital content: recipes, tutorials, courses, guides, patterns, ebooks, music, photos.' },
        { q: 'How do my clients pay?', a: 'Via Mobile Money (Orange, MTN, Wave) or credit card. Simple and fast.' },
        { q: 'Can I use it from my phone?', a: 'Yes, Siteviral is 100% mobile-optimized. Create and manage everything from your smartphone.' },
        { q: 'How do I receive my money?', a: 'Via Mobile Money directly to your number. Payouts after 72 hours.' },
      ]}
      cta={{ label: isFr ? 'Lancer mon business' : 'Launch my business', path: '/auth?mode=signup' }}
      secondaryCta={{ label: isFr ? 'Voir comment ça marche' : 'See how it works', path: '/features' }}
    />
  );
}
