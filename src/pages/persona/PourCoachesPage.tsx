import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';
import { useI18n } from '@/i18n/I18nContext';

export default function PourCoachesPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <PersonaLandingPage
      seo={{
        title: isFr ? 'Siteviral pour Coachs — Vendez vos programmes & accompagnements en ligne' : 'Siteviral for Coaches — Sell your programs & coaching online',
        description: isFr ? 'Monétisez votre expertise de coach. Vendez vos programmes, guides et sessions enregistrées avec paiement Mobile Money.' : 'Monetize your coaching expertise. Sell your programs, guides and recorded sessions with Mobile Money payments.',
        url: 'https://siteviral.com/pour/coaches',
      }}
      badge={isFr ? '🎯 Pour les Coachs & Mentors' : '🎯 For Coaches & Mentors'}
      headline={isFr ? <>Transformez votre coaching en <span className="text-primary">business scalable</span></> : <>Turn your coaching into a <span className="text-primary">scalable business</span></>}
      subheadline={isFr ? 'Vendez vos programmes, workbooks et masterclasses enregistrées. Touchez des clients 24h/24 sans être physiquement présent.' : 'Sell your programs, workbooks and recorded masterclasses. Reach clients 24/7 without being physically present.'}
      painPoints={isFr ? [
        { icon: '⏰', title: 'Temps contre argent', desc: 'Vous échangez vos heures contre de l\'argent. Pas de client = pas de revenu. Zéro revenu passif.' },
        { icon: '📱', title: 'Coaching par WhatsApp', desc: 'Vous envoyez des exercices et des audios gratuitement. Votre expertise est sous-évaluée.' },
        { icon: '🌍', title: 'Portée limitée', desc: 'Vous ne pouvez coacher que les gens de votre ville. Des milliers de clients potentiels vous échappent.' },
        { icon: '💳', title: 'Paiement compliqué', desc: 'Encaisser avant la session est un calvaire. Les clients paient en retard ou ne paient pas.' },
        { icon: '📋', title: 'Pas de système', desc: 'Pas de plateforme pour organiser vos programmes, suivre vos clients, gérer vos ventes.' },
        { icon: '🏷️', title: 'Concurrence des plateformes chères', desc: 'Kajabi à 149$/mois, Podia à 39$/mois… Trop cher pour démarrer.' },
      ] : [
        { icon: '⏰', title: 'Time for money', desc: 'You trade hours for money. No client = no revenue. Zero passive income.' },
        { icon: '📱', title: 'Coaching via WhatsApp', desc: 'You send exercises and audios for free. Your expertise is undervalued.' },
        { icon: '🌍', title: 'Limited reach', desc: 'You can only coach people in your city. Thousands of potential clients are out of reach.' },
        { icon: '💳', title: 'Complicated payments', desc: 'Collecting payment before a session is a nightmare. Clients pay late or don\'t pay at all.' },
        { icon: '📋', title: 'No system', desc: 'No platform to organize your programs, track clients, manage sales.' },
        { icon: '🏷️', title: 'Expensive platform competition', desc: 'Kajabi at $149/month, Podia at $39/month… Too expensive to start.' },
      ]}
      solutions={isFr ? [
        { title: 'Programmes packagés', desc: 'Transformez votre méthode en ebooks, workbooks et vidéos vendables à l\'infini. Créez une fois, vendez toujours.' },
        { title: 'Paiement sécurisé avant accès', desc: 'Le client paie, reçoit le contenu. Plus de relances, plus d\'impayés.' },
        { title: 'Bundles & parcours', desc: 'Créez des parcours progressifs : Module 1 → Module 2 → Programme complet à prix réduit.' },
        { title: 'Ambassadeurs coachs', desc: 'Vos anciens clients recommandent vos programmes et gagnent une commission. Croissance organique.' },
        { title: 'Mobile Money natif', desc: 'Vos clients paient en MTN, Orange Money, Wave. Zéro friction, maximum de conversions.' },
        { title: 'Zéro abonnement', desc: 'Pas de 149$/mois. Siteviral prend 7% par vente uniquement. Pas de vente = pas de frais.' },
      ] : [
        { title: 'Packaged programs', desc: 'Turn your method into ebooks, workbooks and videos sellable forever. Create once, sell always.' },
        { title: 'Secure payment before access', desc: 'Client pays, gets the content. No more follow-ups, no more unpaid invoices.' },
        { title: 'Bundles & pathways', desc: 'Create progressive pathways: Module 1 → Module 2 → Full program at a discount.' },
        { title: 'Coach ambassadors', desc: 'Your former clients recommend your programs and earn a commission. Organic growth.' },
        { title: 'Native Mobile Money', desc: 'Your clients pay with MTN, Orange Money, Wave. Zero friction, maximum conversions.' },
        { title: 'Zero subscription', desc: 'No $149/month. Siteviral takes 7% per sale only. No sale = no fees.' },
      ]}
      steps={isFr ? [
        { step: '1', title: 'Packagez votre expertise', desc: 'Transformez votre méthodologie en PDF, audio ou vidéo. Un week-end suffit pour le premier produit.' },
        { step: '2', title: 'Créez votre vitrine coach', desc: 'Page professionnelle avec bio, témoignages et catalogue. En ligne en 2 minutes.' },
        { step: '3', title: 'Vendez en continu', desc: 'Partagez le lien, activez les ambassadeurs. Vos programmes se vendent même pendant vos sessions.' },
      ] : [
        { step: '1', title: 'Package your expertise', desc: 'Turn your methodology into PDF, audio or video. A weekend is enough for the first product.' },
        { step: '2', title: 'Create your coach storefront', desc: 'Professional page with bio, testimonials and catalog. Online in 2 minutes.' },
        { step: '3', title: 'Sell continuously', desc: 'Share the link, activate ambassadors. Your programs sell even during your sessions.' },
      ]}
      testimonial={{
        name: 'Carine A.',
        role: isFr ? 'Coach en leadership féminin, Lomé' : 'Women\'s leadership coach, Lomé',
        text: isFr ? 'J\'ai transformé mon programme "Femme Leader" en 5 modules PDF. 320 ventes en 4 mois. Je coache toujours en live, mais maintenant j\'ai aussi un revenu passif.' : 'I turned my "Woman Leader" program into 5 PDF modules. 320 sales in 4 months. I still coach live, but now I also have passive income.',
        flag: '🇹🇬',
      }}
      stats={isFr ? [
        { value: '93%', label: 'Revenu conservé' },
        { value: '0 FCFA', label: 'Abonnement' },
        { value: '< 2 min', label: 'Mise en ligne' },
        { value: '24/7', label: 'Ventes automatiques' },
      ] : [
        { value: '93%', label: 'Revenue kept' },
        { value: '$0', label: 'Subscription' },
        { value: '< 2 min', label: 'Setup time' },
        { value: '24/7', label: 'Automatic sales' },
      ]}
      faq={isFr ? [
        { q: 'Puis-je vendre des sessions de coaching live ?', a: 'Siteviral est optimisé pour les produits numériques. Pour le live, vendez l\'accès (lien Zoom privé) comme produit numérique.' },
        { q: 'Comment structurer mes prix ?', a: 'Module unique : 3 000-7 000 FCFA. Programme complet : 15 000-30 000 FCFA. Accompagnement premium : 50 000+ FCFA.' },
        { q: 'Puis-je offrir des garanties ?', a: 'Oui ! Ajoutez une garantie "satisfait ou remboursé" dans la description. Les remboursements sont gérés via le support.' },
        { q: 'Comment collecter des témoignages ?', a: 'Demandez à vos clients satisfaits un court texte ou une vidéo. Ajoutez-les à votre page produit.' },
      ] : [
        { q: 'Can I sell live coaching sessions?', a: 'Siteviral is optimized for digital products. For live sessions, sell access (private Zoom link) as a digital product.' },
        { q: 'How to structure my pricing?', a: 'Single module: $5-12. Full program: $25-50. Premium coaching: $85+.' },
        { q: 'Can I offer guarantees?', a: 'Yes! Add a money-back guarantee in the description. Refunds are handled through support.' },
        { q: 'How to collect testimonials?', a: 'Ask your satisfied clients for a short text or video. Add them to your product page.' },
      ]}
      cta={{ label: isFr ? 'Lancer mon business de coaching' : 'Launch my coaching business', path: '/auth?mode=signup' }}
      secondaryCta={{ label: isFr ? 'Calculer mes revenus' : 'Calculate my earnings', path: '/calculateur' }}
    />
  );
}
