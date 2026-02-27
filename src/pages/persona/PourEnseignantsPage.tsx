import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';

export default function PourEnseignantsPage() {
  return (
    <PersonaLandingPage
      seo={{
        title: 'Siteviral pour les Enseignants — Vendez vos cours et annales en ligne',
        description: 'Plateforme pour professeurs, préparateurs d\'examens et écoles de langues. Vendez vos cours, exercices corrigés et annales par Mobile Money.',
        url: 'https://siteviral.com/pour/enseignants',
      }}
      badge="🎓 Pour les Enseignants & Prépas"
      headline={<>Vendez vos cours et <span className="text-primary">annales corrigées</span> en ligne à des milliers d'étudiants</>}
      subheadline="Vous êtes professeur, préparateur d'examens ou dirigez une école de langues. Arrêtez de distribuer vos supports en photocopies — vendez-les en ligne par Mobile Money et touchez 10x plus d'étudiants."
      painPoints={[
        { icon: '📝', title: 'Distribution en photocopies', desc: 'Vos cours et annales sont distribués en photocopies. Portée limitée à votre classe.' },
        { icon: '🌍', title: 'Portée géographique limitée', desc: 'Vous ne touchez que les étudiants de votre ville. Des milliers d\'autres auraient besoin de vos contenus.' },
        { icon: '💸', title: 'Contenus non monétisés', desc: 'Vous créez du contenu de qualité mais ne générez aucun revenu digital.' },
        { icon: '📱', title: 'Envoi par WhatsApp', desc: 'Vous envoyez vos fichiers un par un sur WhatsApp contre paiement manuel. Pas de suivi.' },
        { icon: '🏆', title: 'Concurrence des apps gratuites', desc: 'Les étudiants utilisent des ressources gratuites de qualité médiocre au lieu de vos contenus premium.' },
        { icon: '⏰', title: 'Période d\'examens surchargée', desc: 'La demande explose avant les examens mais vous ne pouvez pas servir tout le monde en présentiel.' },
      ]}
      solutions={[
        { title: 'Boutique de cours en ligne', desc: 'Vendez vos PDF, vidéos, audio, annales corrigées. Livraison instantanée après paiement Mobile Money.' },
        { title: 'Annales & exercices corrigés', desc: 'Packagez vos corrections d\'examens passés. Les étudiants achètent et téléchargent immédiatement.' },
        { title: 'Cours audio & vidéo', desc: 'Enregistrez vos explications et vendez-les comme contenus premium accessibles 24h/24.' },
        { title: 'Portée nationale', desc: 'Un étudiant à Bouaké, Douala ou Dakar peut acheter vos cours instantanément.' },
        { title: 'Revenus passifs', desc: 'Créez une fois, vendez à l\'infini. Vos anciens cours continuent de générer des revenus.' },
        { title: 'Programme ambassadeur', desc: 'Vos meilleurs étudiants partagent vos cours et touchent une commission sur chaque vente.' },
      ]}
      steps={[
        { step: '1', title: 'Créez votre page', desc: 'Inscription gratuite. Présentez-vous, votre matière, votre expérience.' },
        { step: '2', title: 'Uploadez vos contenus', desc: 'PDF d\'annales, vidéos explicatives, fiches de révision. Fixez vos prix.' },
        { step: '3', title: 'Partagez aux étudiants', desc: 'Envoyez votre lien dans les groupes WhatsApp d\'étudiants. Les ventes sont automatiques.' },
      ]}
      testimonial={{
        name: 'Prof. A. T.',
        role: 'Préparateur concours',
        text: 'Mes annales corrigées se vendaient en photocopies dans ma ville. Maintenant je les vends dans tout le pays par Mobile Money. Mes revenus ont été multipliés par 5.',
        flag: '🇸🇳',
      }}
      stats={[
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: 'Illimité', label: 'nombre de contenus' },
        { value: '90%', label: 'pour vous, 10% pour Siteviral' },
      ]}
      faq={[
        { q: 'Quels formats sont supportés ?', a: 'PDF, Word, PowerPoint, audio MP3, vidéo MP4 et bien d\'autres. Tout ce que vous utilisez déjà.' },
        { q: 'Les étudiants peuvent-ils payer par Mobile Money ?', a: 'Oui, Orange Money, MTN, Wave — tous les moyens de paiement mobile sont acceptés.' },
        { q: 'Peut-on offrir des contenus gratuits ?', a: 'Oui, vous pouvez mélanger contenus gratuits (pour attirer) et payants (pour monétiser). C\'est vous qui décidez.' },
        { q: 'Comment protéger mes contenus ?', a: 'Siteviral applique un watermark automatique avec le nom de l\'acheteur sur les fichiers téléchargés. Dissuasion efficace.' },
        { q: 'Peut-on vendre des packs / bundles ?', a: 'Oui, créez des bundles (ex: "Pack BAC Maths + Physique") avec remise automatique.' },
        { q: 'Comment recevoir mon argent ?', a: 'Par Mobile Money ou virement bancaire. L\'argent est versé après 72h de sécurité.' },
      ]}
      cta={{ label: 'Vendre mes cours en ligne', path: '/auth?mode=signup' }}
      secondaryCta={{ label: 'Voir comment ça marche', path: '/features' }}
    />
  );
}
