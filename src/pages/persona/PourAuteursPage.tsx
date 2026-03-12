import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';

export default function PourAuteursPage() {
  return (
    <PersonaLandingPage
      seo={{
        title: 'Siteviral pour Auteurs — Vendez vos livres & ebooks sans intermédiaire',
        description: 'Publiez et vendez vos livres, ebooks et guides directement à votre audience. Zéro abonnement, livraison instantanée, paiement Mobile Money.',
        url: 'https://siteviral.com/pour/auteurs',
      }}
      badge="📚 Pour les Auteurs & Écrivains"
      headline={<>Vendez vos livres <span className="text-primary">sans éditeur</span>, sans commission abusive</>}
      subheadline={<>Publiez vos ebooks, guides et formations écrites. Recevez vos paiements en Mobile Money ou virement. Gardez 93% de chaque vente.</>}
      painPoints={[
        { icon: '🏦', title: 'Amazon prend 30-65%', desc: 'Les plateformes occidentales gardent la majorité de vos revenus et ne supportent pas le Mobile Money.' },
        { icon: '📦', title: 'Logistique complexe', desc: 'Imprimer, stocker, expédier… Le livre physique est un cauchemar logistique en Afrique.' },
        { icon: '🔗', title: 'Pas de lien direct avec vos lecteurs', desc: 'Sur Amazon ou les librairies, vous ne connaissez pas vos acheteurs. Impossible de fidéliser.' },
        { icon: '💸', title: 'Paiement difficile', desc: 'Vos lecteurs africains ne peuvent pas payer par carte. Vous perdez 80% des ventes potentielles.' },
        { icon: '📢', title: 'Marketing inexistant', desc: 'Vous publiez mais personne ne le sait. Pas d\'outils de promotion intégrés.' },
        { icon: '⏳', title: 'Délais de paiement interminables', desc: 'Les éditeurs traditionnels paient tous les 6 mois… quand ils paient.' },
      ]}
      solutions={[
        { title: 'Boutique d\'auteur en 2 minutes', desc: 'Créez votre page auteur avec bio, catalogue et paiement intégré. Aucune compétence technique requise.' },
        { title: 'Livraison instantanée', desc: 'Vos ebooks sont livrés automatiquement après paiement. PDF protégé avec filigrane anti-piratage.' },
        { title: 'Mobile Money natif', desc: 'Orange Money, MTN, Wave, Airtel… Vos lecteurs paient comme ils en ont l\'habitude.' },
        { title: 'Programme ambassadeur', desc: 'Vos fans deviennent vos promoteurs. Ils partagent, vous vendez, ils gagnent une commission.' },
        { title: 'Bundle & upsell', desc: 'Combinez plusieurs livres en packs. Proposez des guides complémentaires à chaque achat.' },
        { title: 'Base de lecteurs', desc: 'Collectez les emails de vos acheteurs. Envoyez des annonces pour vos prochaines sorties.' },
      ]}
      steps={[
        { step: '1', title: 'Créez votre espace auteur', desc: 'Inscrivez-vous, ajoutez votre bio et une photo. Votre page est prête en 2 minutes.' },
        { step: '2', title: 'Uploadez vos œuvres', desc: 'Ajoutez vos ebooks (PDF, EPUB), fixez le prix, ajoutez une couverture. C\'est tout.' },
        { step: '3', title: 'Partagez et vendez', desc: 'Partagez le lien sur WhatsApp, Facebook, Instagram. Recevez vos paiements instantanément.' },
      ]}
      testimonial={{
        name: 'Aminata K.',
        role: 'Auteure de romans & guides pratiques, Accra',
        text: 'J\'ai vendu 340 ebooks en 2 mois sans éditeur. Mes lecteurs paient en Mobile Money et reçoivent le livre instantanément. C\'est magique.',
        flag: '🇬🇭',
      }}
      stats={[
        { value: '93%', label: 'Revenu conservé' },
        { value: '12 000+', label: 'Ebooks vendus' },
        { value: '< 2 min', label: 'Pour publier' },
        { value: '24h', label: 'Délai de paiement' },
      ]}
      faq={[
        { q: 'Quels formats de fichiers sont acceptés ?', a: 'PDF, EPUB, DOCX, et tout fichier numérique jusqu\'à 500 Mo. Vos lecteurs reçoivent le fichier automatiquement après paiement.' },
        { q: 'Comment protéger mes livres contre le piratage ?', a: 'Chaque téléchargement est tracé avec un filigrane unique contenant le nom de l\'acheteur. Vous pouvez aussi limiter le nombre de téléchargements.' },
        { q: 'Puis-je vendre des livres physiques ?', a: 'Siteviral est optimisé pour le numérique, mais vous pouvez utiliser les liens externes pour rediriger vers une commande physique.' },
        { q: 'Combien ça coûte ?', a: 'Zéro abonnement. Siteviral prend une commission de 7% uniquement sur les ventes réalisées. Pas de vente = pas de frais.' },
        { q: 'Puis-je vendre en plusieurs devises ?', a: 'Oui ! XOF, XAF, USD, EUR, GHS, NGN, KES… Plus de 15 devises supportées.' },
      ]}
      cta={{ label: 'Créer ma boutique d\'auteur', path: '/auth?mode=signup' }}
      secondaryCta={{ label: 'Voir un exemple', path: '/discover' }}
    />
  );
}
