import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';

export default function PourLeadersMusulmansPage() {
  return (
    <PersonaLandingPage
      seo={{
        title: 'Siteviral pour les Leaders Musulmans — Digitalisez vos enseignements',
        description: 'Plateforme adaptée pour les imams et leaders musulmans. Distribuez vos cours coraniques, recevez sadaqas et zakat par Mobile Money.',
        url: 'https://siteviral.com/pour/leaders-musulmans',
      }}
      badge="☪️ Pour les Leaders Musulmans"
      headline={<>Digitalisez vos <span className="text-primary">enseignements islamiques</span> et touchez plus de fidèles</>}
      subheadline="Distribuez vos cours coraniques, recevez des sadaqas et zakats numériquement, et connectez votre communauté — une plateforme adaptée au contexte africain."
      painPoints={[
        { icon: '📚', title: 'Enseignements non digitalisés', desc: 'Vos cours et récitations restent en présentiel. Pas de moyen de les partager au-delà de votre mosquée.' },
        { icon: '💸', title: 'Zakat et sadaqa en espèces', desc: 'La collecte manuelle est opaque, sans traçabilité ni reçus pour les donateurs.' },
        { icon: '🌍', title: 'Diaspora déconnectée', desc: 'Vos fidèles à l\'étranger veulent contribuer mais les canaux sont limités ou coûteux.' },
        { icon: '🚫', title: 'Aucune plateforme adaptée', desc: 'Les plateformes existantes ne comprennent pas le contexte culturel et religieux africain.' },
        { icon: '📱', title: 'Distribution par WhatsApp', desc: 'Vous envoyez vos contenus un par un sur WhatsApp. Pas de suivi, pas de revenus.' },
        { icon: '🏗️', title: 'Pas de présence en ligne', desc: 'Créer un site coûte cher et nécessite des compétences que vous n\'avez pas.' },
      ]}
      solutions={[
        { title: 'Page communautaire professionnelle', desc: 'Créez votre vitrine en ligne en minutes : présentation, contacts, contenus, collectes.' },
        { title: 'Sadaqa & Zakat numériques', desc: 'Vos fidèles contribuent par Mobile Money en 1 clic. Tout est tracé et transparent.' },
        { title: 'Cours coraniques en ligne', desc: 'Vendez ou partagez vos récitations, tafsirs, cours audio et PDF éducatifs.' },
        { title: 'Campagnes de collecte', desc: 'Construction de mosquée, aide aux nécessiteux — lancez des campagnes avec objectif et barre de progression.' },
        { title: 'Connexion diaspora', desc: 'Mobile Money en Afrique, carte Visa/Mastercard pour les fidèles à l\'étranger.' },
        { title: 'Programme ambassadeur', desc: 'Vos fidèles partagent et sont récompensés. Affiliation halal, transparente et traçable.' },
      ]}
      steps={[
        { step: '1', title: 'Créez votre espace', desc: 'Inscription gratuite. Nommez votre communauté, ajoutez votre logo.' },
        { step: '2', title: 'Ajoutez vos contenus', desc: 'Uploadez cours audio, PDF, vidéos. Créez vos campagnes de collecte de zakat.' },
        { step: '3', title: 'Partagez avec votre communauté', desc: 'Envoyez votre lien sur WhatsApp. Les fidèles achètent et donnent en 1 clic.' },
      ]}
      testimonial={{
        name: 'Imam S. D.',
        role: 'Leader communautaire',
        text: 'Nos fidèles de la diaspora peuvent enfin contribuer facilement. La transparence de la plateforme renforce la confiance de toute la communauté.',
        flag: '🇸🇳',
      }}
      stats={[
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: '2 min', label: 'pour créer votre page' },
        { value: '100%', label: 'transparent et traçable' },
      ]}
      faq={[
        { q: 'Est-ce adapté aux communautés musulmanes ?', a: 'Oui, Siteviral est une plateforme neutre et universelle. Elle s\'adapte à tous les contextes religieux et culturels, y compris les communautés musulmanes.' },
        { q: 'Peut-on recevoir des zakat par Mobile Money ?', a: 'Oui, créez une campagne dédiée à la zakat. Vos fidèles paient par Orange Money, MTN, Wave ou carte bancaire.' },
        { q: 'Les contenus peuvent-ils être gratuits ?', a: 'Absolument. Vous pouvez offrir des contenus gratuitement ou les vendre. Vous décidez pour chaque ressource.' },
        { q: 'Comment la diaspora peut-elle contribuer ?', a: 'La diaspora peut payer par carte Visa/Mastercard en EUR, USD ou GBP. Le système gère les devises automatiquement.' },
        { q: 'Y a-t-il des frais cachés ?', a: 'Non. Zéro abonnement. Siteviral prend 10% uniquement sur les ventes. Les dons sont soumis aux seuls frais de la passerelle.' },
        { q: 'Mes données sont-elles en sécurité ?', a: 'Oui, toutes les données sont chiffrées et hébergées sur des serveurs sécurisés. Conformité RGPD.' },
      ]}
      cta={{ label: 'Créer ma page communautaire', path: '/auth?mode=signup' }}
      secondaryCta={{ label: 'Découvrir les fonctionnalités', path: '/features' }}
    />
  );
}
