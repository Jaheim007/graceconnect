import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';

export default function PourRetraitesPage() {
  return (
    <PersonaLandingPage
      seo={{
        title: 'Siteviral pour les Retraités — Transmettez et monétisez votre expérience',
        description: 'Cadres retraités et seniors : partagez votre expertise accumulée en vendant guides, mémoires et formations en ligne. Simple et accessible.',
        url: 'https://siteviral.com/pour/retraites',
      }}
      badge="🎓 Pour les Retraités & Seniors"
      headline={<>Transmettez votre <span className="text-primary">expérience</span> et générez un complément de revenu</>}
      subheadline="Vous avez 20, 30 ou 40 ans d'expérience professionnelle. Cette richesse mérite d'être partagée. Publiez vos guides, mémoires et formations en ligne — simplement depuis votre téléphone."
      painPoints={[
        { icon: '📚', title: 'Savoir non transmis', desc: 'Des décennies d\'expertise risquent de se perdre. Personne n\'a documenté votre parcours.' },
        { icon: '💰', title: 'Pension insuffisante', desc: 'La retraite ne couvre pas toujours les besoins. Un complément de revenu serait bienvenu.' },
        { icon: '🖥️', title: 'Technologie intimidante', desc: 'Les outils numériques semblent complexes. Vous ne savez pas par où commencer.' },
        { icon: '📖', title: 'Écrire un livre est long', desc: 'Publier un livre traditionnel prend des mois et coûte cher. Pas garanti de vendre.' },
        { icon: '🌍', title: 'Audience limitée', desc: 'Votre réseau local ne suffit pas pour rentabiliser un projet éditorial.' },
        { icon: '⏰', title: 'Trop de temps libre', desc: 'La retraite peut être longue. Un projet structurant donne du sens aux journées.' },
      ]}
      solutions={[
        { title: 'Publication simple', desc: 'Écrivez et publiez vos guides, mémoires ou récits de carrière en PDF. Vente instantanée.' },
        { title: 'Interface accessible', desc: 'Conçu pour être simple. Si vous savez envoyer un message WhatsApp, vous savez utiliser Siteviral.' },
        { title: 'Formations audio', desc: 'Enregistrez vos connaissances en audio. Les jeunes professionnels achètent votre expérience.' },
        { title: 'Mobile Money', desc: 'Recevez vos revenus directement sur votre Mobile Money. Pas besoin de compte bancaire spécial.' },
        { title: 'Communauté intergénérationnelle', desc: 'Connectez-vous avec les jeunes professionnels qui ont besoin de vos conseils.' },
        { title: 'Zéro risque financier', desc: 'Aucun investissement initial. Pas d\'abonnement. Vous ne payez que quand vous vendez.' },
      ]}
      steps={[
        { step: '1', title: 'Inscrivez-vous', desc: 'Gratuit et simple. Votre petit-fils peut vous aider en 2 minutes.' },
        { step: '2', title: 'Partagez votre savoir', desc: 'Uploadez vos PDF, enregistrements audio ou vidéos. Fixez un prix accessible.' },
        { step: '3', title: 'Recevez des revenus', desc: 'Les ventes sont automatiques. L\'argent arrive sur votre Mobile Money.' },
      ]}
      testimonial={{
        name: 'M. Ouédraogo',
        role: 'Ancien DG, retraité',
        text: 'J\'ai publié "40 ans de management en Afrique de l\'Ouest". 200 exemplaires vendus en 3 mois. À 67 ans, je suis devenu auteur digital.',
        flag: '🇧🇫',
      }}
      stats={[
        { value: '0 FCFA', label: 'pour commencer' },
        { value: 'Simple', label: 'comme WhatsApp' },
        { value: '90%', label: 'pour vous' },
      ]}
      faq={[
        { q: 'C\'est vraiment simple à utiliser ?', a: 'Oui, l\'interface est conçue pour être aussi simple que WhatsApp. Un membre de votre famille peut vous aider au début.' },
        { q: 'Que puis-je publier ?', a: 'Mémoires de carrière, guides pratiques, leçons de vie, formations audio, tout ce qui valorise votre expérience.' },
        { q: 'C\'est gratuit ?', a: 'Oui, aucun abonnement. Siteviral prend 10% uniquement quand quelqu\'un achète votre contenu.' },
        { q: 'Comment recevoir l\'argent ?', a: 'Par Mobile Money directement sur votre numéro. Simple et sécurisé.' },
        { q: 'Faut-il un ordinateur ?', a: 'Non, tout fonctionne depuis un smartphone. Création, gestion et suivi des ventes.' },
        { q: 'Mes contenus sont-ils protégés ?', a: 'Oui, watermark automatique et accès sécurisé. Votre propriété intellectuelle est respectée.' },
      ]}
      cta={{ label: 'Partager mon expérience', path: '/auth?mode=signup' }}
      secondaryCta={{ label: 'Voir comment ça marche', path: '/features' }}
    />
  );
}
