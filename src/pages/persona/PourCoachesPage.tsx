import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';

export default function PourCoachesPage() {
  return (
    <PersonaLandingPage
      seo={{
        title: 'Siteviral pour Coachs — Vendez vos programmes & accompagnements en ligne',
        description: 'Monétisez votre expertise de coach. Vendez vos programmes, guides et sessions enregistrées avec paiement Mobile Money.',
        url: 'https://siteviral.com/pour/coaches',
      }}
      badge="🎯 Pour les Coachs & Mentors"
      headline={<>Transformez votre coaching en <span className="text-primary">business scalable</span></>}
      subheadline={<>Vendez vos programmes, workbooks et masterclasses enregistrées. Touchez des clients 24h/24 sans être physiquement présent.</>}
      painPoints={[
        { icon: '⏰', title: 'Temps contre argent', desc: 'Vous échangez vos heures contre de l\'argent. Pas de client = pas de revenu. Zéro revenu passif.' },
        { icon: '📱', title: 'Coaching par WhatsApp', desc: 'Vous envoyez des exercices et des audios gratuitement. Votre expertise est sous-évaluée.' },
        { icon: '🌍', title: 'Portée limitée', desc: 'Vous ne pouvez coacher que les gens de votre ville. Des milliers de clients potentiels vous échappent.' },
        { icon: '💳', title: 'Paiement compliqué', desc: 'Encaisser avant la session est un calvaire. Les clients paient en retard ou ne paient pas.' },
        { icon: '📋', title: 'Pas de système', desc: 'Pas de plateforme pour organiser vos programmes, suivre vos clients, gérer vos ventes.' },
        { icon: '🏷️', title: 'Concurrence des plateformes chères', desc: 'Kajabi à 149$/mois, Podia à 39$/mois… Trop cher pour démarrer.' },
      ]}
      solutions={[
        { title: 'Programmes packagés', desc: 'Transformez votre méthode en ebooks, workbooks et vidéos vendables à l\'infini. Créez une fois, vendez toujours.' },
        { title: 'Paiement sécurisé avant accès', desc: 'Le client paie, reçoit le contenu. Plus de relances, plus d\'impayés.' },
        { title: 'Bundles & parcours', desc: 'Créez des parcours progressifs : Module 1 → Module 2 → Programme complet à prix réduit.' },
        { title: 'Ambassadeurs coachs', desc: 'Vos anciens clients recommandent vos programmes et gagnent une commission. Croissance organique.' },
        { title: 'Mobile Money natif', desc: 'Vos clients paient en MTN, Orange Money, Wave. Zéro friction, maximum de conversions.' },
        { title: 'Zéro abonnement', desc: 'Pas de 149$/mois. Siteviral prend 7% par vente uniquement. Pas de vente = pas de frais.' },
      ]}
      steps={[
        { step: '1', title: 'Packagez votre expertise', desc: 'Transformez votre méthodologie en PDF, audio ou vidéo. Un week-end suffit pour le premier produit.' },
        { step: '2', title: 'Créez votre vitrine coach', desc: 'Page professionnelle avec bio, témoignages et catalogue. En ligne en 2 minutes.' },
        { step: '3', title: 'Vendez en continu', desc: 'Partagez le lien, activez les ambassadeurs. Vos programmes se vendent même pendant vos sessions.' },
      ]}
      testimonial={{
        name: 'Carine A.',
        role: 'Coach en leadership féminin, Lomé',
        text: 'J\'ai transformé mon programme "Femme Leader" en 5 modules PDF. 320 ventes en 4 mois. Je coache toujours en live, mais maintenant j\'ai aussi un revenu passif.',
        flag: '🇹🇬',
      }}
      stats={[
        { value: '93%', label: 'Revenu conservé' },
        { value: '0 FCFA', label: 'Abonnement' },
        { value: '< 2 min', label: 'Mise en ligne' },
        { value: '24/7', label: 'Ventes automatiques' },
      ]}
      faq={[
        { q: 'Puis-je vendre des sessions de coaching live ?', a: 'Siteviral est optimisé pour les produits numériques. Pour le live, vendez l\'accès (lien Zoom privé) comme produit numérique.' },
        { q: 'Comment structurer mes prix ?', a: 'Module unique : 3 000-7 000 FCFA. Programme complet : 15 000-30 000 FCFA. Accompagnement premium : 50 000+ FCFA.' },
        { q: 'Puis-je offrir des garanties ?', a: 'Oui ! Ajoutez une garantie "satisfait ou remboursé" dans la description. Les remboursements sont gérés via le support.' },
        { q: 'Comment collecter des témoignages ?', a: 'Demandez à vos clients satisfaits un court texte ou une vidéo. Ajoutez-les à votre page produit.' },
      ]}
      cta={{ label: 'Lancer mon business de coaching', path: '/auth?mode=signup' }}
      secondaryCta={{ label: 'Calculer mes revenus', path: '/calculateur' }}
    />
  );
}
