import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';

export default function PourEtudiantsPage() {
  return (
    <PersonaLandingPage
      seo={{
        title: 'Siteviral pour les Étudiants — Gagnez de l\'argent en partageant',
        description: 'Devenez ambassadeur Siteviral. Partagez des ressources utiles et gagnez jusqu\'à 50% de commission sur chaque vente. Zéro investissement.',
        url: 'https://siteviral.com/pour/etudiants',
      }}
      badge="🎒 Pour les Étudiants & Jeunes"
      headline={<>Gagnez de l'argent <span className="text-primary">sans rien créer</span>. Juste en partageant.</>}
      subheadline="Devenez ambassadeur Siteviral : partagez les ressources des autres sur WhatsApp, TikTok ou Instagram, et touchez jusqu'à 50% de commission sur chaque vente. Zéro investissement, zéro stock."
      painPoints={[
        { icon: '💰', title: 'Besoin d\'argent, pas de job', desc: 'Les stages ne paient pas, les emplois étudiants sont rares. Vous cherchez un revenu flexible.' },
        { icon: '⏰', title: 'Pas de temps pour un business', desc: 'Entre les cours et les examens, impossible de gérer un commerce ou créer du contenu.' },
        { icon: '🚫', title: 'Pas de capital de départ', desc: 'Les business classiques demandent un investissement. Vous n\'avez rien à mettre.' },
        { icon: '📱', title: 'Audience non monétisée', desc: 'Vous avez des centaines de contacts WhatsApp, des followers… mais zéro revenu.' },
        { icon: '🤔', title: 'Arnaques partout', desc: 'Forex, MLM, crypto douteuse — vous avez peur de vous faire avoir.' },
        { icon: '📦', title: 'Rien à vendre', desc: 'Pas de produit, pas de compétence spéciale à vendre. Que faire ?' },
      ]}
      solutions={[
        { title: 'Zéro contenu à créer', desc: 'Vous ne créez rien. Vous partagez les e-books, cours et ressources des autres vendeurs.' },
        { title: 'Jusqu\'à 50% de commission', desc: 'Chaque vente via votre lien vous rapporte entre 5% et 50% du prix. Vous gagnez à chaque partage.' },
        { title: 'Un lien, c\'est tout', desc: 'Copiez votre lien d\'ambassadeur, partagez-le sur WhatsApp, Instagram, TikTok. C\'est fait.' },
        { title: 'Paiement automatique', desc: 'Vos commissions s\'accumulent et sont versées automatiquement sur votre Mobile Money.' },
        { title: 'C\'est pas un MLM', desc: 'Un seul niveau de commission, pas de recrutement. Vous partagez, vous gagnez. Point.' },
        { title: 'Dashboard de suivi', desc: 'Voyez en temps réel vos clics, ventes et commissions. Tout est transparent.' },
      ]}
      steps={[
        { step: '1', title: 'Inscrivez-vous gratuitement', desc: 'Créez votre compte en 30 secondes. Aucune vérification, aucun paiement.' },
        { step: '2', title: 'Choisissez des produits à promouvoir', desc: 'Parcourez le catalogue, trouvez des ressources qui plaisent à votre réseau.' },
        { step: '3', title: 'Partagez et gagnez', desc: 'Copiez votre lien unique, partagez sur vos réseaux. Chaque vente = commission.' },
      ]}
      testimonial={{
        name: 'Ibrahim T.',
        role: 'Ambassadeur Siteviral',
        text: 'Je n\'ai aucun contenu à moi. Je partage les ressources des autres et je gagne des commissions chaque semaine. C\'est incroyable.',
        flag: '🇸🇳',
      }}
      stats={[
        { value: '5-50%', label: 'de commission par vente' },
        { value: '0 FCFA', label: 'd\'investissement' },
        { value: '30 sec', label: 'pour s\'inscrire' },
      ]}
      faq={[
        { q: 'C\'est quoi exactement un ambassadeur ?', a: 'Un ambassadeur partage les produits des vendeurs via un lien unique. Quand quelqu\'un achète via votre lien, vous touchez une commission automatiquement.' },
        { q: 'C\'est pas un MLM ?', a: 'Non ! Il n\'y a qu\'un seul niveau de commission. Vous ne recrutez personne, vous ne payez rien. Vous partagez, vous gagnez. C\'est de l\'affiliation classique.' },
        { q: 'Combien je peux gagner ?', a: 'Ça dépend de ce que vous partagez et de votre réseau. Certains ambassadeurs gagnent 50 000 à 500 000 FCFA/mois. Le potentiel est illimité.' },
        { q: 'Comment je reçois mon argent ?', a: 'Vos commissions sont versées automatiquement sur votre Mobile Money après une période de sécurité de 15 jours.' },
        { q: 'Pourquoi 15 jours d\'attente ?', a: 'C\'est une mesure de sécurité pour protéger contre les remboursements et la fraude. Après 15 jours, votre commission est garantie.' },
        { q: 'Je peux le faire en plus de mes études ?', a: 'Absolument ! C\'est 100% flexible. Partagez quand vous voulez, d\'où vous voulez. Pas d\'horaires, pas de patron.' },
      ]}
      cta={{ label: 'Devenir ambassadeur maintenant', path: '/auth?mode=signup' }}
      secondaryCta={{ label: 'Calculer mes gains potentiels', path: '/calculateur' }}
    />
  );
}
