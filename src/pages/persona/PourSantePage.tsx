import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';

export default function PourSantePage() {
  return (
    <PersonaLandingPage
      seo={{
        title: 'Siteviral pour les Professionnels de Santé — Vendez vos contenus médicaux',
        description: 'Médecins, nutritionnistes, coachs bien-être : vendez vos guides santé, programmes et formations par Mobile Money.',
        url: 'https://siteviral.com/pour/sante',
      }}
      badge="🩺 Pour les Pros de Santé"
      headline={<>Partagez votre <span className="text-primary">expertise santé</span> et touchez des milliers de personnes</>}
      subheadline="Vous êtes médecin, nutritionniste ou coach bien-être. Vos guides, programmes alimentaires et formations peuvent aider bien au-delà de votre cabinet. Vendez-les en ligne."
      painPoints={[
        { icon: '🏥', title: 'Expertise limitée au cabinet', desc: 'Vous aidez 10 patients par jour alors que des milliers auraient besoin de vos conseils.' },
        { icon: '📱', title: 'Conseils gratuits sur WhatsApp', desc: 'Vous répondez gratuitement aux questions santé dans les groupes. Votre temps n\'est pas valorisé.' },
        { icon: '💸', title: 'Pas de revenus passifs', desc: 'Vos revenus s\'arrêtent quand vous ne consultez pas. Pas de produits qui travaillent pour vous.' },
        { icon: '📋', title: 'Programmes non packageés', desc: 'Vos protocoles et programmes restent dans vos dossiers patients. Jamais vendus à grande échelle.' },
        { icon: '🌍', title: 'Contenu santé rare en français', desc: 'Le contenu santé de qualité adapté au contexte africain est quasi inexistant en ligne.' },
        { icon: '🏗️', title: 'Pas de plateforme adaptée', desc: 'Créer un site e-commerce médical est complexe, coûteux et chronophage.' },
      ]}
      solutions={[
        { title: 'Guides santé premium', desc: 'Vendez vos guides nutrition, programmes de remise en forme, protocoles bien-être en PDF.' },
        { title: 'Formations vidéo', desc: 'Enregistrez vos formations sur des sujets de santé publique. Vendez en replay illimité.' },
        { title: 'Programmes alimentaires', desc: 'Créez des plans personnalisables que vos clients achètent et téléchargent instantanément.' },
        { title: 'Consultations à distance', desc: 'Vendez des packs de consultation avec liens de réservation intégrés.' },
        { title: 'Mobile Money natif', desc: 'Vos patients payent par Orange Money, MTN ou Wave. Accessible à tous.' },
        { title: 'Page professionnelle', desc: 'Vitrine crédible avec vos qualifications, spécialisations et catalogue de ressources.' },
      ]}
      steps={[
        { step: '1', title: 'Créez votre page', desc: 'Inscription gratuite. Présentez vos qualifications et spécialisations.' },
        { step: '2', title: 'Publiez vos ressources', desc: 'Guides PDF, vidéos éducatives, programmes. Fixez vos prix.' },
        { step: '3', title: 'Aidez plus de monde', desc: 'Partagez dans vos réseaux. Vos contenus aident 24h/24, même quand vous dormez.' },
      ]}
      testimonial={{
        name: 'Dr. A. M.',
        role: 'Nutritionniste',
        text: 'Mon guide "Alimentation saine au Sahel" s\'est vendu à 300 exemplaires. Je touche des patients dans 5 pays que je n\'aurais jamais pu voir en cabinet.',
        flag: '🇲🇱',
      }}
      stats={[
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: '5 pays', label: 'touchés en moyenne' },
        { value: '90%', label: 'pour vous' },
      ]}
      faq={[
        { q: 'Est-ce conforme à la déontologie médicale ?', a: 'Oui, vendre des guides éducatifs et formations ne constitue pas un acte médical. C\'est de l\'éducation santé.' },
        { q: 'Quels contenus puis-je vendre ?', a: 'Guides nutrition, programmes sportifs, formations vidéo, ebooks santé, protocoles bien-être.' },
        { q: 'Mes patients peuvent-ils payer par Mobile Money ?', a: 'Oui, tous les moyens de paiement mobile sont acceptés.' },
        { q: 'Les contenus sont-ils protégés ?', a: 'Oui, watermark automatique et accès sécurisé. Seuls les acheteurs téléchargent.' },
        { q: 'Puis-je offrir des contenus gratuits ?', a: 'Oui, publiez des ressources gratuites pour attirer puis proposez vos produits premium.' },
        { q: 'Comment recevoir mes revenus ?', a: 'Mobile Money ou virement bancaire après 72h de sécurité.' },
      ]}
      cta={{ label: 'Partager mon expertise santé', path: '/auth?mode=signup' }}
      secondaryCta={{ label: 'Voir les fonctionnalités', path: '/features' }}
    />
  );
}
