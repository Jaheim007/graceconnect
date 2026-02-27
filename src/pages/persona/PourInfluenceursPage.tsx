import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';

export default function PourInfluenceursPage() {
  return (
    <PersonaLandingPage
      seo={{
        title: 'Siteviral pour les Influenceurs — Monétisez votre communauté',
        description: 'Transformez vos followers en clients. Vendez vos produits digitaux, merch et contenus exclusifs par Mobile Money.',
        url: 'https://siteviral.com/pour/influenceurs',
      }}
      badge="⭐ Pour les Influenceurs"
      headline={<>Transformez vos <span className="text-primary">followers</span> en revenus réels</>}
      subheadline="Vous avez des milliers de followers mais vos revenus dépendent des marques. Créez votre propre boutique, vendez vos produits digitaux et gardez 90% des revenus."
      painPoints={[
        { icon: '🤝', title: 'Dépendance aux marques', desc: 'Vos revenus dépendent des partenariats sponsorisés. Pas de contrat = pas de revenu.' },
        { icon: '💰', title: 'Sous-monétisation', desc: 'Des milliers de followers engagés mais aucun moyen de leur vendre directement.' },
        { icon: '📱', title: 'Pas de boutique', desc: 'Instagram et TikTok ne permettent pas de vendre des produits digitaux facilement.' },
        { icon: '🌍', title: 'Audience africaine', desc: 'Votre audience paye par Mobile Money mais aucune plateforme ne le supporte nativement.' },
        { icon: '📊', title: 'Aucune donnée', desc: 'Les réseaux sociaux gardent vos données. Vous ne possédez pas votre audience.' },
        { icon: '🔄', title: 'Revenus imprévisibles', desc: 'Un mois viral, un mois mort. Aucune stabilité financière.' },
      ]}
      solutions={[
        { title: 'Boutique personnalisée', desc: 'Votre propre page de marque avec tous vos produits : presets, guides, formations, merch digital.' },
        { title: 'Lien dans la bio', desc: 'Un seul lien qui regroupe votre boutique, vos contenus gratuits et vos réseaux.' },
        { title: 'Mobile Money natif', desc: 'Orange Money, MTN, Wave — vos fans africains achètent en 1 clic.' },
        { title: 'Contenus exclusifs', desc: 'Vendez des contenus réservés à vos plus grands fans. Behind-the-scenes, tutoriels, etc.' },
        { title: 'Programme ambassadeur', desc: 'Vos fans partagent votre boutique et gagnent une commission. Croissance virale.' },
        { title: 'Données clients', desc: 'Récupérez emails et contacts de vos acheteurs. Votre audience vous appartient enfin.' },
      ]}
      steps={[
        { step: '1', title: 'Créez votre boutique', desc: 'Inscription gratuite. Personnalisez avec votre photo, bio et couleurs.' },
        { step: '2', title: 'Ajoutez vos produits', desc: 'Presets, guides, formations, templates. Uploadez et fixez vos prix.' },
        { step: '3', title: 'Partagez dans votre bio', desc: 'Un lien dans votre bio Instagram/TikTok. Vos fans achètent directement.' },
      ]}
      testimonial={{
        name: 'Sarah O.',
        role: 'Influenceuse beauté',
        text: 'Mes presets Lightroom se vendent tout seuls depuis ma bio Instagram. 400 ventes le premier mois. Je ne dépends plus des sponsors.',
        flag: '🇳🇬',
      }}
      stats={[
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: '1 lien', label: 'dans votre bio' },
        { value: '90%', label: 'pour vous' },
      ]}
      faq={[
        { q: 'Quels produits puis-je vendre ?', a: 'Presets photo, templates, ebooks, formations, guides, musique, tout contenu numérique.' },
        { q: 'Ça marche avec Instagram et TikTok ?', a: 'Oui, ajoutez votre lien Siteviral dans votre bio. Vos followers cliquent et achètent en 1 clic.' },
        { q: 'Mes fans africains peuvent-ils payer ?', a: 'Oui, Mobile Money (Orange, MTN, Wave) et carte bancaire. Le paiement s\'adapte à chaque fan.' },
        { q: 'Combien prend Siteviral ?', a: '10% sur les ventes uniquement. Zéro abonnement, zéro frais cachés.' },
        { q: 'Peut-on offrir du contenu gratuit ?', a: 'Oui, mixez produits gratuits et payants pour maximiser votre conversion.' },
        { q: 'Comment récupérer mon argent ?', a: 'Mobile Money ou virement bancaire. Versements après 72h de sécurité.' },
      ]}
      cta={{ label: 'Créer ma boutique', path: '/auth?mode=signup' }}
      secondaryCta={{ label: 'Voir les fonctionnalités', path: '/features' }}
    />
  );
}
