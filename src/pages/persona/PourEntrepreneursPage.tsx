import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';

export default function PourEntrepreneursPage() {
  return (
    <PersonaLandingPage
      seo={{
        title: 'Siteviral pour Entrepreneurs — Lancez votre business numérique sans code',
        description: 'Vendez vos produits numériques, formations et services en ligne. Zéro code, zéro abonnement, paiement Mobile Money natif.',
        url: 'https://siteviral.com/pour/entrepreneurs',
      }}
      badge="🚀 Pour les Entrepreneurs"
      headline={<>Lancez votre business digital <span className="text-primary">en un week-end</span></>}
      subheadline={<>Pas besoin de développeur, de site web ou de budget marketing. Créez, vendez et développez votre entreprise numérique avec Siteviral.</>}
      painPoints={[
        { icon: '💻', title: 'Besoin d\'un site web', desc: 'Créer un site e-commerce coûte 500 000+ FCFA et prend des semaines. Et il faut le maintenir.' },
        { icon: '🔧', title: 'Complexité technique', desc: 'Hébergement, SSL, passerelle de paiement, gestion des stocks… Trop de technique, pas assez de ventes.' },
        { icon: '💸', title: 'Coûts de démarrage élevés', desc: 'Shopify à 29$/mois, nom de domaine, publicité… Vous dépensez avant même de vendre.' },
        { icon: '📊', title: 'Marketing coûteux', desc: 'Facebook Ads, Google Ads… Des milliers de FCFA brûlés sans garantie de résultat.' },
        { icon: '🏦', title: 'Encaissement compliqué', desc: 'Ouvrir un compte marchand, négocier avec les banques, intégrer un système de paiement…' },
        { icon: '📈', title: 'Difficulté à scaler', desc: 'Comment passer de 10 à 1 000 clients sans exploser vos coûts ?' },
      ]}
      solutions={[
        { title: 'Boutique en 2 minutes', desc: 'Créez votre vitrine professionnelle sans code. Logo, description, produits, paiement — tout est inclus.' },
        { title: 'Zéro coût initial', desc: 'Pas d\'abonnement, pas de frais cachés. Vous ne payez que 7% quand vous vendez. Pas de vente = 0 frais.' },
        { title: 'Paiement intégré', desc: 'Mobile Money + carte bancaire. Vos clients paient, vous recevez. Aucune configuration technique.' },
        { title: 'Marketing gratuit', desc: 'Le programme ambassadeur remplace la publicité. Vos clients vendent pour vous et gagnent une commission.' },
        { title: 'Scalabilité infinie', desc: 'Produits numériques = zéro stock, zéro livraison, zéro limite. 10 ou 10 000 clients, même coût.' },
        { title: 'Analytics & CRM', desc: 'Tableau de bord avec ventes, clients, ambassadeurs. Prenez des décisions basées sur les données.' },
      ]}
      steps={[
        { step: '1', title: 'Identifiez votre produit', desc: 'Quel problème résolvez-vous ? Packagez la solution en produit numérique (guide, template, formation).' },
        { step: '2', title: 'Créez votre boutique', desc: 'Inscription, upload du produit, prix fixé. Votre business est en ligne.' },
        { step: '3', title: 'Grandissez avec les ambassadeurs', desc: 'Activez le programme ambassadeur. Votre armée de vente travaille 24h/24 pour vous.' },
      ]}
      testimonial={{
        name: 'Serge N.',
        role: 'Fondateur, "Business Toolkit Africa", Douala',
        text: 'J\'ai lancé ma collection de templates business un dimanche. Le lundi, j\'avais mes premières ventes. En 6 mois, c\'est devenu mon activité principale.',
        flag: '🇨🇲',
      }}
      stats={[
        { value: '0 FCFA', label: 'Coût de lancement' },
        { value: '< 2 min', label: 'Mise en ligne' },
        { value: '93%', label: 'Marge conservée' },
        { value: '∞', label: 'Potentiel de ventes' },
      ]}
      faq={[
        { q: 'Ai-je besoin de compétences techniques ?', a: 'Non. Si vous savez utiliser WhatsApp, vous savez utiliser Siteviral. L\'interface est conçue pour les non-techniciens.' },
        { q: 'Puis-je vendre des produits physiques ?', a: 'Siteviral est optimisé pour le numérique. Pour le physique, vous pouvez utiliser les liens externes.' },
        { q: 'Comment me différencier des concurrents ?', a: 'Le programme ambassadeur est votre avantage compétitif. Aucun concurrent local n\'offre ce système de croissance virale.' },
        { q: 'Puis-je avoir plusieurs boutiques ?', a: 'Oui ! Créez plusieurs organisations pour différentes marques ou niches.' },
      ]}
      cta={{ label: 'Lancer mon business', path: '/auth?mode=signup' }}
      secondaryCta={{ label: 'Calculer mes revenus', path: '/calculateur' }}
    />
  );
}
