import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';

export default function PourFormateursPage() {
  return (
    <PersonaLandingPage
      seo={{
        title: 'Siteviral pour les Formateurs — Vendez vos cours en ligne',
        description: 'Arrêtez d\'envoyer vos PDFs par WhatsApp. Vendez vos formations, guides et cours en ligne avec paiement Mobile Money intégré.',
        url: 'https://siteviral.com/pour/formateurs',
      }}
      badge="🎓 Pour les Formateurs & Coachs"
      headline={<>Arrêtez d'envoyer vos PDFs par WhatsApp. <span className="text-primary">Vendez-les.</span></>}
      subheadline="Transformez vos connaissances en revenus passifs. Créez votre boutique de formations, vendez vos e-books, guides et cours — paiement Mobile Money ou carte en 1 clic."
      painPoints={[
        { icon: '📲', title: 'Envoi gratuit sur WhatsApp', desc: 'Vous créez du contenu de valeur puis l\'envoyez gratuitement. Votre expertise mérite mieux.' },
        { icon: '💳', title: 'Pas de solution de paiement', desc: 'Stripe est en dollars, PayPal pas dispo partout, les virements sont compliqués. Comment encaisser ?' },
        { icon: '🏗️', title: 'Créer un site coûte cher', desc: 'WordPress, Teachable, Podia — tout coûte 30-100$/mois. Trop cher pour démarrer.' },
        { icon: '📦', title: 'Livraison manuelle', desc: 'Après chaque paiement, vous devez envoyer le fichier manuellement. Pas scalable.' },
        { icon: '📉', title: 'Audience limitée', desc: 'Vous n\'atteignez que votre réseau direct. Pas de viralité, pas de recommandation.' },
        { icon: '🔄', title: 'Revenus imprévisibles', desc: 'Pas de système, pas de récurrence. Vous vendez quand vous y pensez.' },
      ]}
      solutions={[
        { title: 'Boutique en ligne gratuite', desc: 'Créez votre page de vente en 2 minutes. Upload de fichiers, prix, description — c\'est prêt.' },
        { title: 'Paiement Mobile Money natif', desc: 'Orange Money, MTN, Wave — vos clients paient comme ils en ont l\'habitude. Zéro friction.' },
        { title: 'Livraison automatique', desc: 'Le client paie, reçoit son fichier instantanément. Vous dormez, vous vendez.' },
        { title: 'Programme ambassadeur', desc: 'Vos anciens élèves recommandent vos cours et touchent une commission. Votre audience grandit toute seule.' },
        { title: 'Multi-formats supportés', desc: 'PDFs, audio, vidéo, images — vendez tout type de contenu numérique.' },
        { title: 'Analytics & suivi', desc: 'Voyez combien de ventes, quels produits marchent, d\'où viennent vos clients.' },
      ]}
      steps={[
        { step: '1', title: 'Créez votre espace formateur', desc: 'Inscrivez-vous, nommez votre « école en ligne », ajoutez votre bio et photo.' },
        { step: '2', title: 'Uploadez vos cours', desc: 'Ajoutez vos PDFs, vidéos, audio. Fixez vos prix en FCFA, EUR ou USD.' },
        { step: '3', title: 'Partagez et vendez', desc: 'Partagez votre lien sur vos réseaux. Vos ambassadeurs amplifient la diffusion.' },
      ]}
      testimonial={{
        name: 'Marie-Claire B.',
        role: 'Coach & Auteure',
        text: 'J\'ai centralisé tous mes documents et ressources sur une seule plateforme. Mes clients achètent et téléchargent en un clic.',
        flag: '🇨🇲',
      }}
      stats={[
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: '10%', label: 'commission par vente' },
        { value: '∞', label: 'produits illimités' },
      ]}
      faq={[
        { q: 'Combien ça coûte ?', a: 'Zéro abonnement. Siteviral prend 10% de commission uniquement sur les ventes réalisées. Si vous ne vendez pas, vous ne payez rien.' },
        { q: 'Quels formats de fichiers sont supportés ?', a: 'PDF, DOCX, MP3, MP4, images, ZIP — tous les formats courants sont acceptés.' },
        { q: 'Est-ce que mes clients reçoivent le fichier automatiquement ?', a: 'Oui, dès que le paiement est confirmé, le client reçoit un lien de téléchargement sécurisé instantanément.' },
        { q: 'Puis-je fixer mes prix en FCFA ?', a: 'Oui, vous fixez vos prix dans la devise de votre choix : FCFA, EUR, USD, GHS, etc.' },
        { q: 'Comment fonctionne le programme ambassadeur ?', a: 'Vous définissez un pourcentage de commission (5-50%). N\'importe qui peut partager vos produits et toucher cette commission sur chaque vente.' },
        { q: 'Quand est-ce que je reçois mon argent ?', a: 'Les revenus sont disponibles après 72h de sécurité. Retrait automatique sur Mobile Money ou compte bancaire.' },
      ]}
      cta={{ label: 'Créer ma boutique de cours', path: '/auth?mode=signup' }}
      secondaryCta={{ label: 'Calculer mes revenus potentiels', path: '/calculateur' }}
    />
  );
}
