import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';

export default function PourFemmesEntrepreneurPage() {
  return (
    <PersonaLandingPage
      seo={{
        title: 'Siteviral pour les Femmes Entrepreneures — Lancez votre business digital',
        description: 'Plateforme pensée pour les femmes entrepreneures africaines. Vendez vos créations, formations et services par Mobile Money. Zéro code, zéro abonnement.',
        url: 'https://siteviral.com/pour/femmes-entrepreneures',
      }}
      badge="👩‍💼 Pour les Femmes Entrepreneures"
      headline={<>Lancez votre <span className="text-primary">business digital</span> sans barrières</>}
      subheadline="Vous avez le talent, les idées et l'énergie. Il vous manque juste la plateforme. Créez votre boutique en ligne, vendez vos produits et services, et développez votre indépendance financière."
      painPoints={[
        { icon: '🚧', title: 'Barrières techniques', desc: 'Créer un site web semble complexe et coûteux. Vous ne savez pas par où commencer.' },
        { icon: '💸', title: 'Accès au financement limité', desc: 'Les banques et investisseurs sont difficiles d\'accès. Il faut commencer avec peu.' },
        { icon: '📱', title: 'Vente sur WhatsApp', desc: 'Vous vendez via WhatsApp mais gérer les commandes manuellement est épuisant.' },
        { icon: '🌍', title: 'Marché limité', desc: 'Vous ne touchez que votre entourage proche. Votre marché potentiel est bien plus large.' },
        { icon: '⏰', title: 'Double charge', desc: 'Entre famille et business, chaque minute compte. Il faut des outils efficaces.' },
        { icon: '🏗️', title: 'Pas de vitrine pro', desc: 'Sans présence en ligne professionnelle, les clients sérieux vous prennent moins au sérieux.' },
      ]}
      solutions={[
        { title: 'Boutique en 2 minutes', desc: 'Créez votre vitrine professionnelle sans aucune compétence technique. Tout est guidé.' },
        { title: 'Zéro investissement', desc: 'Pas d\'abonnement, pas de frais fixes. Vous ne payez que quand vous vendez.' },
        { title: 'Mobile Money natif', desc: 'Vos clientes payent par Orange Money, MTN ou Wave. Le moyen de paiement qu\'elles connaissent.' },
        { title: 'Produits & services', desc: 'Vendez ebooks, formations, recettes, patrons couture, guides beauté, tout contenu digital.' },
        { title: 'Communauté & réseau', desc: 'Connectez-vous avec d\'autres entrepreneures. Partagez, collaborez, grandissez ensemble.' },
        { title: 'Programme ambassadrice', desc: 'Vos clientes deviennent vos ambassadrices et gagnent une commission sur chaque vente.' },
      ]}
      steps={[
        { step: '1', title: 'Inscrivez-vous', desc: 'Gratuit. Créez votre page en 2 minutes avec votre téléphone.' },
        { step: '2', title: 'Ajoutez vos produits', desc: 'Photos, descriptions, prix. Uploadez vos fichiers digitaux.' },
        { step: '3', title: 'Vendez et grandissez', desc: 'Partagez votre lien sur WhatsApp et réseaux sociaux. Les ventes arrivent.' },
      ]}
      testimonial={{
        name: 'Fatou B.',
        role: 'Entrepreneure mode & beauté',
        text: 'J\'ai lancé mes tutoriels coiffure sur Siteviral depuis mon téléphone. En 3 mois, j\'ai gagné plus que mon ancien salaire. Merci pour cette opportunité.',
        flag: '🇬🇳',
      }}
      stats={[
        { value: '0 FCFA', label: 'pour démarrer' },
        { value: '2 min', label: 'pour créer sa boutique' },
        { value: '+60%', label: 'de nos créateurs sont des femmes' },
      ]}
      faq={[
        { q: 'Faut-il savoir coder ?', a: 'Non, aucune compétence technique nécessaire. Si vous savez utiliser WhatsApp, vous savez utiliser Siteviral.' },
        { q: 'C\'est vraiment gratuit ?', a: 'Oui, zéro abonnement. Siteviral prend 10% uniquement quand vous faites une vente.' },
        { q: 'Je peux vendre quoi ?', a: 'Tout contenu digital : recettes, tutoriels, formations, guides, patrons, ebooks, musique, photos.' },
        { q: 'Comment mes clientes payent ?', a: 'Par Mobile Money (Orange, MTN, Wave) ou carte bancaire. Simple et rapide.' },
        { q: 'Peut-on utiliser depuis un téléphone ?', a: 'Oui, Siteviral est 100% optimisé mobile. Créez et gérez tout depuis votre smartphone.' },
        { q: 'Comment recevoir mon argent ?', a: 'Par Mobile Money directement sur votre numéro. Versements après 72h.' },
      ]}
      cta={{ label: 'Lancer mon business', path: '/auth?mode=signup' }}
      secondaryCta={{ label: 'Voir comment ça marche', path: '/features' }}
    />
  );
}
