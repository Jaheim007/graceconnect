import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';
import { useI18n } from '@/i18n/I18nContext';

export default function PourAuteursPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <PersonaLandingPage
      seo={{
        title: isFr ? 'Siteviral pour Auteurs — Vendez vos livres & ebooks sans intermédiaire' : 'Siteviral for Authors — Sell your books & ebooks without intermediaries',
        description: isFr ? 'Publiez et vendez vos livres, ebooks et guides directement à votre audience. Zéro abonnement, livraison instantanée, paiement Mobile Money.' : 'Publish and sell your books, ebooks and guides directly to your audience. Zero subscription, instant delivery, Mobile Money payments.',
        url: 'https://siteviral.com/pour/auteurs',
      }}
      badge={isFr ? '📚 Pour les Auteurs & Écrivains' : '📚 For Authors & Writers'}
      headline={isFr ? <>Vendez vos livres <span className="text-primary">sans éditeur</span>, sans commission abusive</> : <>Sell your books <span className="text-primary">without a publisher</span>, without excessive fees</>}
      subheadline={isFr ? 'Publiez vos ebooks, guides et formations écrites. Recevez vos paiements en Mobile Money ou virement. Gardez 93% de chaque vente.' : 'Publish your ebooks, guides and written courses. Receive payments via Mobile Money or bank transfer. Keep 93% of every sale.'}
      painPoints={isFr ? [
        { icon: '🏦', title: 'Amazon prend 30-65%', desc: 'Les plateformes occidentales gardent la majorité de vos revenus et ne supportent pas le Mobile Money.' },
        { icon: '📦', title: 'Logistique complexe', desc: 'Imprimer, stocker, expédier… Le livre physique est un cauchemar logistique en Afrique.' },
        { icon: '🔗', title: 'Pas de lien direct avec vos lecteurs', desc: 'Sur Amazon ou les librairies, vous ne connaissez pas vos acheteurs. Impossible de fidéliser.' },
        { icon: '💸', title: 'Paiement difficile', desc: 'Vos lecteurs africains ne peuvent pas payer par carte. Vous perdez 80% des ventes potentielles.' },
        { icon: '📢', title: 'Marketing inexistant', desc: 'Vous publiez mais personne ne le sait. Pas d\'outils de promotion intégrés.' },
        { icon: '⏳', title: 'Délais de paiement interminables', desc: 'Les éditeurs traditionnels paient tous les 6 mois… quand ils paient.' },
      ] : [
        { icon: '🏦', title: 'Amazon takes 30-65%', desc: 'Western platforms keep most of your revenue and don\'t support Mobile Money.' },
        { icon: '📦', title: 'Complex logistics', desc: 'Print, store, ship… Physical books are a logistical nightmare in Africa.' },
        { icon: '🔗', title: 'No direct link with readers', desc: 'On Amazon or bookstores, you don\'t know your buyers. Impossible to build loyalty.' },
        { icon: '💸', title: 'Difficult payments', desc: 'Your African readers can\'t pay by card. You lose 80% of potential sales.' },
        { icon: '📢', title: 'No marketing', desc: 'You publish but nobody knows. No built-in promotion tools.' },
        { icon: '⏳', title: 'Endless payment delays', desc: 'Traditional publishers pay every 6 months… when they pay.' },
      ]}
      solutions={isFr ? [
        { title: 'Boutique d\'auteur en 2 minutes', desc: 'Créez votre page auteur avec bio, catalogue et paiement intégré. Aucune compétence technique requise.' },
        { title: 'Livraison instantanée', desc: 'Vos ebooks sont livrés automatiquement après paiement. PDF protégé avec filigrane anti-piratage.' },
        { title: 'Mobile Money natif', desc: 'Orange Money, MTN, Wave, Airtel… Vos lecteurs paient comme ils en ont l\'habitude.' },
        { title: 'Programme ambassadeur', desc: 'Vos fans deviennent vos promoteurs. Ils partagent, vous vendez, ils gagnent une commission.' },
        { title: 'Bundle & upsell', desc: 'Combinez plusieurs livres en packs. Proposez des guides complémentaires à chaque achat.' },
        { title: 'Base de lecteurs', desc: 'Collectez les emails de vos acheteurs. Envoyez des annonces pour vos prochaines sorties.' },
      ] : [
        { title: 'Author store in 2 minutes', desc: 'Create your author page with bio, catalog and integrated payment. No technical skills required.' },
        { title: 'Instant delivery', desc: 'Your ebooks are delivered automatically after payment. PDF protected with anti-piracy watermark.' },
        { title: 'Native Mobile Money', desc: 'Orange Money, MTN, Wave, Airtel… Your readers pay the way they\'re used to.' },
        { title: 'Ambassador program', desc: 'Your fans become your promoters. They share, you sell, they earn a commission.' },
        { title: 'Bundle & upsell', desc: 'Combine multiple books into packs. Offer complementary guides with each purchase.' },
        { title: 'Reader base', desc: 'Collect your buyers\' emails. Send announcements for your upcoming releases.' },
      ]}
      steps={isFr ? [
        { step: '1', title: 'Créez votre espace auteur', desc: 'Inscrivez-vous, ajoutez votre bio et une photo. Votre page est prête en 2 minutes.' },
        { step: '2', title: 'Uploadez vos œuvres', desc: 'Ajoutez vos ebooks (PDF, EPUB), fixez le prix, ajoutez une couverture. C\'est tout.' },
        { step: '3', title: 'Partagez et vendez', desc: 'Partagez le lien sur WhatsApp, Facebook, Instagram. Recevez vos paiements instantanément.' },
      ] : [
        { step: '1', title: 'Create your author space', desc: 'Sign up, add your bio and a photo. Your page is ready in 2 minutes.' },
        { step: '2', title: 'Upload your works', desc: 'Add your ebooks (PDF, EPUB), set the price, add a cover. That\'s it.' },
        { step: '3', title: 'Share and sell', desc: 'Share the link on WhatsApp, Facebook, Instagram. Receive your payments instantly.' },
      ]}
      testimonial={{
        name: 'Aminata K.',
        role: isFr ? 'Auteure de romans & guides pratiques, Accra' : 'Novelist & practical guide author, Accra',
        text: isFr ? 'J\'ai vendu 340 ebooks en 2 mois sans éditeur. Mes lecteurs paient en Mobile Money et reçoivent le livre instantanément. C\'est magique.' : 'I sold 340 ebooks in 2 months without a publisher. My readers pay via Mobile Money and receive the book instantly. It\'s magical.',
        flag: '🇬🇭',
      }}
      stats={isFr ? [
        { value: '93%', label: 'Revenu conservé' },
        { value: '12 000+', label: 'Ebooks vendus' },
        { value: '< 2 min', label: 'Pour publier' },
        { value: '24h', label: 'Délai de paiement' },
      ] : [
        { value: '93%', label: 'Revenue kept' },
        { value: '12,000+', label: 'Ebooks sold' },
        { value: '< 2 min', label: 'To publish' },
        { value: '24h', label: 'Payment delay' },
      ]}
      faq={isFr ? [
        { q: 'Quels formats de fichiers sont acceptés ?', a: 'PDF, EPUB, DOCX, et tout fichier numérique jusqu\'à 500 Mo. Vos lecteurs reçoivent le fichier automatiquement après paiement.' },
        { q: 'Comment protéger mes livres contre le piratage ?', a: 'Chaque téléchargement est tracé avec un filigrane unique contenant le nom de l\'acheteur. Vous pouvez aussi limiter le nombre de téléchargements.' },
        { q: 'Puis-je vendre des livres physiques ?', a: 'Siteviral est optimisé pour le numérique, mais vous pouvez utiliser les liens externes pour rediriger vers une commande physique.' },
        { q: 'Combien ça coûte ?', a: 'Zéro abonnement. Siteviral prend une commission de 7% uniquement sur les ventes réalisées. Pas de vente = pas de frais.' },
        { q: 'Puis-je vendre en plusieurs devises ?', a: 'Oui ! XOF, XAF, USD, EUR, GHS, NGN, KES… Plus de 15 devises supportées.' },
      ] : [
        { q: 'What file formats are accepted?', a: 'PDF, EPUB, DOCX, and any digital file up to 500 MB. Your readers receive the file automatically after payment.' },
        { q: 'How to protect my books from piracy?', a: 'Each download is tracked with a unique watermark containing the buyer\'s name. You can also limit the number of downloads.' },
        { q: 'Can I sell physical books?', a: 'Siteviral is optimized for digital, but you can use external links to redirect to a physical order.' },
        { q: 'How much does it cost?', a: 'Zero subscription. Siteviral takes a 7% commission only on completed sales. No sale = no fees.' },
        { q: 'Can I sell in multiple currencies?', a: 'Yes! XOF, XAF, USD, EUR, GHS, NGN, KES… Over 15 currencies supported.' },
      ]}
      cta={{ label: isFr ? 'Créer ma boutique d\'auteur' : 'Create my author store', path: '/auth?mode=signup' }}
      secondaryCta={{ label: isFr ? 'Voir un exemple' : 'See an example', path: '/discover' }}
    />
  );
}
