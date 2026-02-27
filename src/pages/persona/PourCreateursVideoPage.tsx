import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';

export default function PourCreateursVideoPage() {
  return (
    <PersonaLandingPage
      seo={{
        title: 'Siteviral pour les Créateurs Vidéo — Monétisez vos contenus',
        description: 'Vendez vos vidéos, formations et masterclasses en ligne. Paiement Mobile Money & carte bancaire. Zéro abonnement.',
        url: 'https://siteviral.com/pour/createurs-video',
      }}
      badge="🎬 Pour les Créateurs Vidéo"
      headline={<>Monétisez vos <span className="text-primary">vidéos</span> au-delà de YouTube et TikTok</>}
      subheadline="Vous créez du contenu vidéo de qualité mais les revenus publicitaires sont dérisoires. Vendez directement vos formations, masterclasses et contenus exclusifs à votre audience africaine."
      painPoints={[
        { icon: '💰', title: 'Revenus pub insuffisants', desc: 'YouTube paye très peu en Afrique. Vos milliers de vues ne génèrent presque rien.' },
        { icon: '🔒', title: 'Pas de contenu premium', desc: 'Impossible de vendre des vidéos exclusives sur YouTube ou TikTok.' },
        { icon: '📱', title: 'Paiement compliqué', desc: 'Votre audience paye par Mobile Money mais les plateformes occidentales ne le supportent pas.' },
        { icon: '🏗️', title: 'Créer un site coûte cher', desc: 'Les solutions e-learning sont complexes, chères et inadaptées au marché africain.' },
        { icon: '📊', title: 'Aucune donnée client', desc: 'YouTube garde vos abonnés. Vous ne pouvez pas les contacter directement.' },
        { icon: '⏳', title: 'Temps perdu en logistique', desc: 'Gérer les paiements manuels par WhatsApp prend plus de temps que créer du contenu.' },
      ]}
      solutions={[
        { title: 'Boutique vidéo privée', desc: 'Vendez vos formations, masterclasses et tutoriels premium. Accès instantané après paiement.' },
        { title: 'Paiement Mobile Money', desc: 'Orange Money, MTN, Wave — vos fans payent comme ils en ont l\'habitude.' },
        { title: 'Importation YouTube', desc: 'Importez vos vidéos YouTube gratuites pour attirer du trafic vers vos contenus payants.' },
        { title: 'Communauté engagée', desc: 'Page de marque professionnelle avec feed, commentaires et notifications.' },
        { title: 'Données clients', desc: 'Récupérez les emails et contacts de vos acheteurs. Votre audience vous appartient.' },
        { title: 'Programme ambassadeur', desc: 'Vos fans partagent vos vidéos et gagnent une commission sur chaque vente générée.' },
      ]}
      steps={[
        { step: '1', title: 'Créez votre page', desc: 'Inscription gratuite. Ajoutez votre logo, bio et liens sociaux.' },
        { step: '2', title: 'Uploadez vos vidéos', desc: 'Ajoutez vos formations et masterclasses. Fixez vos prix en FCFA, EUR ou USD.' },
        { step: '3', title: 'Partagez à votre audience', desc: 'Un lien dans votre bio YouTube/TikTok. Les ventes sont automatiques 24h/24.' },
      ]}
      testimonial={{
        name: 'Chris M.',
        role: 'Créateur vidéo',
        text: 'Je gagnais 5 000 FCFA/mois sur YouTube. Avec Siteviral, ma première formation s\'est vendue à 200 copies en 2 semaines. Game changer.',
        flag: '🇨🇲',
      }}
      stats={[
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: '90%', label: 'pour vous' },
        { value: '24/7', label: 'ventes automatiques' },
      ]}
      faq={[
        { q: 'Quels formats vidéo sont acceptés ?', a: 'MP4, MOV, AVI et bien d\'autres. Vous pouvez aussi ajouter des liens YouTube/Vimeo pour vos contenus gratuits.' },
        { q: 'Puis-je vendre des formations complètes ?', a: 'Oui, créez des bundles avec plusieurs vidéos, PDF et ressources complémentaires.' },
        { q: 'Comment protéger mes vidéos ?', a: 'Les fichiers sont hébergés de façon sécurisée. Seuls les acheteurs y ont accès après paiement.' },
        { q: 'Mes abonnés YouTube peuvent-ils payer ?', a: 'Oui, partagez votre lien Siteviral dans la description de vos vidéos. Paiement en 1 clic.' },
        { q: 'Combien prend Siteviral ?', a: '10% uniquement sur les ventes. Zéro abonnement, zéro frais cachés.' },
        { q: 'Peut-on offrir des contenus gratuits ?', a: 'Absolument. Mixez gratuit et payant pour créer un tunnel de conversion efficace.' },
      ]}
      cta={{ label: 'Vendre mes vidéos en ligne', path: '/auth?mode=signup' }}
      secondaryCta={{ label: 'Voir les fonctionnalités', path: '/features' }}
    />
  );
}
