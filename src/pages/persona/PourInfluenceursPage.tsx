import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';
import { useI18n } from '@/i18n/I18nContext';

export default function PourInfluenceursPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <PersonaLandingPage
      seo={{
        title: isFr ? 'Siteviral pour les Influenceurs — Monétisez votre communauté' : 'Siteviral for Influencers — Monetize Your Community',
        description: isFr ? 'Transformez vos followers en clients. Vendez vos produits digitaux, merch et contenus exclusifs par Mobile Money.' : 'Turn your followers into customers. Sell your digital products, merch, and exclusive content via Mobile Money.',
        url: 'https://siteviral.com/pour/influenceurs',
      }}
      badge={isFr ? 'Pour les Influenceurs' : 'For Influencers'}
      headline={isFr
        ? <>Transformez vos <span className="text-primary">followers</span> en revenus réels</>
        : <>Turn your <span className="text-primary">followers</span> into real revenue</>}
      subheadline={isFr
        ? 'Vous avez des milliers de followers mais vos revenus dépendent des marques. Créez votre propre boutique, vendez vos produits digitaux et gardez 90% des revenus.'
        : 'You have thousands of followers but your income depends on brands. Create your own store, sell your digital products, and keep 90% of revenue.'}
      painPoints={isFr ? [
        { icon: '🤝', title: 'Dépendance aux marques', desc: 'Vos revenus dépendent des partenariats sponsorisés. Pas de contrat = pas de revenu.' },
        { icon: '💰', title: 'Sous-monétisation', desc: 'Des milliers de followers engagés mais aucun moyen de leur vendre directement.' },
        { icon: '📱', title: 'Pas de boutique', desc: 'Instagram et TikTok ne permettent pas de vendre des produits digitaux facilement.' },
        { icon: '🌍', title: 'Audience africaine', desc: 'Votre audience paye par Mobile Money mais aucune plateforme ne le supporte nativement.' },
        { icon: '📊', title: 'Aucune donnée', desc: 'Les réseaux sociaux gardent vos données. Vous ne possédez pas votre audience.' },
        { icon: '🔄', title: 'Revenus imprévisibles', desc: 'Un mois viral, un mois mort. Aucune stabilité financière.' },
      ] : [
        { icon: '🤝', title: 'Brand dependency', desc: 'Your income depends on sponsored partnerships. No contract = no revenue.' },
        { icon: '💰', title: 'Under-monetization', desc: 'Thousands of engaged followers but no way to sell to them directly.' },
        { icon: '📱', title: 'No store', desc: 'Instagram and TikTok don\'t allow easy digital product sales.' },
        { icon: '🌍', title: 'African audience', desc: 'Your audience pays via Mobile Money but no platform supports it natively.' },
        { icon: '📊', title: 'No data', desc: 'Social networks keep your data. You don\'t own your audience.' },
        { icon: '🔄', title: 'Unpredictable income', desc: 'One viral month, one dead month. No financial stability.' },
      ]}
      solutions={isFr ? [
        { title: 'Boutique personnalisée', desc: 'Votre propre page de marque avec tous vos produits : presets, guides, formations, merch digital.' },
        { title: 'Lien dans la bio', desc: 'Un seul lien qui regroupe votre boutique, vos contenus gratuits et vos réseaux.' },
        { title: 'Mobile Money natif', desc: 'Orange Money, MTN, Wave — vos fans africains achètent en 1 clic.' },
        { title: 'Contenus exclusifs', desc: 'Vendez des contenus réservés à vos plus grands fans. Behind-the-scenes, tutoriels, etc.' },
        { title: 'Programme ambassadeur', desc: 'Vos fans partagent votre boutique et gagnent une commission. Croissance virale.' },
        { title: 'Données clients', desc: 'Récupérez emails et contacts de vos acheteurs. Votre audience vous appartient enfin.' },
      ] : [
        { title: 'Custom store', desc: 'Your own brand page with all your products: presets, guides, courses, digital merch.' },
        { title: 'Link in bio', desc: 'One link that combines your store, free content, and social links.' },
        { title: 'Native Mobile Money', desc: 'Orange Money, MTN, Wave — your African fans buy in 1 click.' },
        { title: 'Exclusive content', desc: 'Sell content reserved for your biggest fans. Behind-the-scenes, tutorials, etc.' },
        { title: 'Ambassador program', desc: 'Your fans share your store and earn a commission. Viral growth.' },
        { title: 'Customer data', desc: 'Get emails and contacts of your buyers. Your audience finally belongs to you.' },
      ]}
      steps={isFr ? [
        { step: '1', title: 'Créez votre boutique', desc: 'Inscription gratuite. Personnalisez avec votre photo, bio et couleurs.' },
        { step: '2', title: 'Ajoutez vos produits', desc: 'Presets, guides, formations, templates. Uploadez et fixez vos prix.' },
        { step: '3', title: 'Partagez dans votre bio', desc: 'Un lien dans votre bio Instagram/TikTok. Vos fans achètent directement.' },
      ] : [
        { step: '1', title: 'Create your store', desc: 'Free sign-up. Customize with your photo, bio, and colors.' },
        { step: '2', title: 'Add your products', desc: 'Presets, guides, courses, templates. Upload and set your prices.' },
        { step: '3', title: 'Share in your bio', desc: 'One link in your Instagram/TikTok bio. Your fans buy directly.' },
      ]}
      testimonial={{
        name: 'Sarah O.',
        role: isFr ? 'Influenceuse beauté' : 'Beauty influencer',
        text: isFr
          ? 'Mes presets Lightroom se vendent tout seuls depuis ma bio Instagram. 400 ventes le premier mois. Je ne dépends plus des sponsors.'
          : 'My Lightroom presets sell themselves from my Instagram bio. 400 sales in the first month. I no longer depend on sponsors.',
        flag: '🇳🇬',
      }}
      stats={isFr ? [
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: '1 lien', label: 'dans votre bio' },
        { value: '90%', label: 'pour vous' },
      ] : [
        { value: '$0', label: 'subscription fee' },
        { value: '1 link', label: 'in your bio' },
        { value: '90%', label: 'for you' },
      ]}
      faq={isFr ? [
        { q: 'Quels produits puis-je vendre ?', a: 'Presets photo, templates, ebooks, formations, guides, musique, tout contenu numérique.' },
        { q: 'Ça marche avec Instagram et TikTok ?', a: 'Oui, ajoutez votre lien Siteviral dans votre bio. Vos followers cliquent et achètent en 1 clic.' },
        { q: 'Mes fans africains peuvent-ils payer ?', a: 'Oui, Mobile Money (Orange, MTN, Wave) et carte bancaire. Le paiement s\'adapte à chaque fan.' },
        { q: 'Combien prend Siteviral ?', a: '10% sur les ventes uniquement. Zéro abonnement, zéro frais cachés.' },
        { q: 'Peut-on offrir du contenu gratuit ?', a: 'Oui, mixez produits gratuits et payants pour maximiser votre conversion.' },
        { q: 'Comment récupérer mon argent ?', a: 'Mobile Money ou virement bancaire. Versements après 72h de sécurité.' },
      ] : [
        { q: 'What products can I sell?', a: 'Photo presets, templates, ebooks, courses, guides, music, any digital content.' },
        { q: 'Does it work with Instagram and TikTok?', a: 'Yes, add your Siteviral link in your bio. Your followers click and buy in 1 click.' },
        { q: 'Can my African fans pay?', a: 'Yes, Mobile Money (Orange, MTN, Wave) and credit card. Payment adapts to each fan.' },
        { q: 'How much does Siteviral take?', a: '10% on sales only. Zero subscription, zero hidden fees.' },
        { q: 'Can I offer free content?', a: 'Yes, mix free and paid products to maximize your conversion.' },
        { q: 'How do I get my money?', a: 'Mobile Money or bank transfer. Payouts after 72-hour security hold.' },
      ]}
      cta={{ label: isFr ? 'Créer ma boutique' : 'Create my store', path: '/auth?mode=signup' }}
      secondaryCta={{ label: isFr ? 'Voir les fonctionnalités' : 'See features', path: '/features' }}
    />
  );
}
