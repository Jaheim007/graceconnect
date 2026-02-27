import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';

export default function PourOngPage() {
  return (
    <PersonaLandingPage
      seo={{
        title: 'Siteviral pour les ONG & Associations — Collectez plus, simplement',
        description: 'Lancez vos campagnes de collecte en ligne, recevez des dons par Mobile Money et carte, et mobilisez vos ambassadeurs pour lever plus de fonds.',
        url: 'https://siteviral.com/pour/ong',
      }}
      badge="🌍 Pour les ONG & Associations"
      headline={<>Levez <span className="text-primary">3x plus de fonds</span> grâce au digital</>}
      subheadline="Lancez des campagnes de collecte professionnelles, recevez des dons par Mobile Money et carte bancaire, et mobilisez des ambassadeurs bénévoles pour amplifier votre impact."
      painPoints={[
        { icon: '📋', title: 'Collectes manuelles inefficaces', desc: 'Enveloppes, virements bancaires, tableurs Excel. Vous perdez du temps et de l\'argent à chaque collecte.' },
        { icon: '🌐', title: 'Pas de plateforme adaptée', desc: 'GoFundMe, PayPal — ces outils ne supportent pas le Mobile Money et ne sont pas adaptés au contexte africain.' },
        { icon: '📊', title: 'Aucune transparence', desc: 'Vos donateurs veulent savoir où va leur argent. Sans outil, la traçabilité est impossible.' },
        { icon: '💰', title: 'Diaspora difficile à atteindre', desc: 'Vos sympathisants à l\'étranger veulent aider mais les canaux de paiement sont limités.' },
        { icon: '📢', title: 'Communication fragmentée', desc: 'WhatsApp, Facebook, email… aucun canal centralisé pour informer et mobiliser.' },
        { icon: '🔒', title: 'Frais élevés des alternatives', desc: 'Les plateformes internationales prennent 5-8% + frais de conversion. Trop cher.' },
      ]}
      solutions={[
        { title: 'Campagnes de collecte professionnelles', desc: 'Créez des pages de don avec objectif, barre de progression, images et partage social intégré.' },
        { title: 'Mobile Money + Carte', desc: 'Vos donateurs en Afrique paient par Mobile Money, ceux de la diaspora par carte. Automatique.' },
        { title: 'Traçabilité complète', desc: 'Chaque don est enregistré avec nom, montant, date. Exportez en CSV pour vos rapports.' },
        { title: 'Ambassadeurs bénévoles', desc: 'Vos sympathisants partagent vos campagnes et amplifient votre portée sans que cela ne vous coûte.' },
        { title: 'Communication centralisée', desc: 'Annonces, événements, photos — tout sur votre page. Notifications automatiques.' },
        { title: 'Vente de ressources', desc: 'Vendez aussi vos guides, rapports, badges — diversifiez vos sources de revenus.' },
      ]}
      steps={[
        { step: '1', title: 'Créez votre page d\'organisation', desc: 'Nom, logo, description de votre mission. Votre page est publique et professionnelle.' },
        { step: '2', title: 'Lancez votre campagne', desc: 'Définissez un objectif, ajoutez des photos et une description. Partagez le lien.' },
        { step: '3', title: 'Recevez et suivez les dons', desc: 'Les dons arrivent automatiquement. Suivez en temps réel, exportez vos rapports.' },
      ]}
      testimonial={{
        name: 'David K.',
        role: 'Directeur ONG',
        text: 'Nos campagnes de collecte ont levé 3x plus qu\'avant. Les donateurs paient par Mobile Money en un clic.',
        flag: '🇬🇭',
      }}
      stats={[
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: '15 min', label: 'pour lancer une campagne' },
        { value: '100%', label: 'traçabilité des dons' },
      ]}
      faq={[
        { q: 'Combien coûte Siteviral pour une ONG ?', a: 'Zéro abonnement. Les frais sont uniquement ceux de la passerelle de paiement (environ 1.5-3% selon le moyen de paiement). Siteviral ne prélève aucune commission sur les dons.' },
        { q: 'Peut-on exporter les données des donateurs ?', a: 'Oui, toutes les données (noms, montants, dates) sont exportables en CSV pour vos rapports annuels et audits.' },
        { q: 'Est-ce conforme aux réglementations ?', a: 'Oui, Siteviral est conforme KYC/AML. Nous vérifions l\'identité des organisations avant d\'activer les payouts.' },
        { q: 'Comment la diaspora peut-elle donner ?', a: 'Par carte Visa/Mastercard en EUR, USD ou toute autre devise. La conversion est automatique.' },
        { q: 'Peut-on avoir plusieurs campagnes en même temps ?', a: 'Oui, créez autant de campagnes que nécessaire : urgence, projets, dîme, cotisations, etc.' },
        { q: 'Y a-t-il un minimum de don ?', a: 'Non, vos donateurs peuvent donner le montant de leur choix. Vous pouvez aussi proposer des montants suggérés.' },
      ]}
      cta={{ label: 'Créer ma page d\'ONG gratuitement', path: '/auth?mode=signup' }}
      secondaryCta={{ label: 'Calculer mon potentiel', path: '/calculateur' }}
    />
  );
}
