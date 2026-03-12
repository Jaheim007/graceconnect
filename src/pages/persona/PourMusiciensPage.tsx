import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';
import { useI18n } from '@/i18n/I18nContext';

export default function PourMusiciensPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <PersonaLandingPage
      seo={{
        title: isFr ? 'Siteviral pour Musiciens — Monétisez votre musique sans label' : 'Siteviral for Musicians — Monetize your music without a label',
        description: isFr ? 'Vendez vos singles, albums et beats directement à vos fans. Paiement Mobile Money, livraison instantanée, programme ambassadeur intégré.' : 'Sell your singles, albums and beats directly to your fans. Mobile Money payments, instant delivery, built-in ambassador program.',
        url: 'https://siteviral.com/pour/musiciens',
      }}
      badge={isFr ? '🎵 Pour les Musiciens & Artistes' : '🎵 For Musicians & Artists'}
      headline={isFr ? <>Monétisez votre musique <span className="text-primary">sans label</span>, sans intermédiaire</> : <>Monetize your music <span className="text-primary">without a label</span>, no middleman</>}
      subheadline={isFr ? 'Vendez vos singles, albums, beats et exclusivités directement à vos fans. Recevez vos paiements en Mobile Money. Gardez le contrôle.' : 'Sell your singles, albums, beats and exclusives directly to your fans. Receive payments via Mobile Money. Keep control.'}
      painPoints={isFr ? [
        { icon: '🏷️', title: 'Les labels prennent tout', desc: 'Contrats abusifs, royalties opaques, vous créez mais vous ne gagnez presque rien.' },
        { icon: '📉', title: 'Streaming = centimes', desc: '0,003$ par stream sur Spotify. Il faut 1 million d\'écoutes pour gagner 3 000$. Impossible pour un artiste émergent.' },
        { icon: '🌍', title: 'Pas adapté à l\'Afrique', desc: 'Spotify, Apple Music, Deezer… Peu de fans africains y sont. Et ils ne supportent pas le Mobile Money.' },
        { icon: '🎤', title: 'Pas de relation directe', desc: 'Sur les plateformes de streaming, vous ne connaissez pas vos fans. Impossible de les contacter.' },
        { icon: '💳', title: 'Paiement bloqué', desc: 'Vos fans veulent vous soutenir mais n\'ont pas de carte bancaire. Vous perdez la majorité des ventes.' },
        { icon: '⏰', title: 'Délais de distribution', desc: 'Attendre 2-4 semaines pour qu\'un distributeur mette votre musique en ligne. Vous perdez le buzz.' },
      ] : [
        { icon: '🏷️', title: 'Labels take everything', desc: 'Abusive contracts, opaque royalties, you create but earn almost nothing.' },
        { icon: '📉', title: 'Streaming = pennies', desc: '$0.003 per stream on Spotify. You need 1 million plays to earn $3,000. Impossible for emerging artists.' },
        { icon: '🌍', title: 'Not adapted to Africa', desc: 'Spotify, Apple Music, Deezer… Few African fans are there. And they don\'t support Mobile Money.' },
        { icon: '🎤', title: 'No direct relationship', desc: 'On streaming platforms, you don\'t know your fans. Impossible to contact them.' },
        { icon: '💳', title: 'Blocked payments', desc: 'Your fans want to support you but don\'t have bank cards. You lose most sales.' },
        { icon: '⏰', title: 'Distribution delays', desc: 'Wait 2-4 weeks for a distributor to put your music online. You lose the buzz.' },
      ]}
      solutions={isFr ? [
        { title: 'Boutique musicale instantanée', desc: 'Votre page artiste avec bio, discographie et paiement intégré. En ligne en 2 minutes.' },
        { title: 'Vente directe à vos fans', desc: 'Singles, albums, beats, acapellas, exclusivités… Fixez vos prix, gardez 93% des revenus.' },
        { title: 'Mobile Money natif', desc: 'MTN, Orange Money, Wave, Airtel… Vos fans paient comme ils en ont l\'habitude.' },
        { title: 'Ambassadeurs musicaux', desc: 'Vos fans partagent votre musique et gagnent une commission. Marketing viral automatique.' },
        { title: 'Contenu exclusif', desc: 'Proposez des avant-premières, des versions acoustiques, des behind-the-scenes en exclusivité.' },
        { title: 'Collecte de dons', desc: 'Lancez des campagnes pour financer votre prochain album ou clip. Vos fans contribuent directement.' },
      ] : [
        { title: 'Instant music store', desc: 'Your artist page with bio, discography and integrated payment. Online in 2 minutes.' },
        { title: 'Direct sales to your fans', desc: 'Singles, albums, beats, acapellas, exclusives… Set your prices, keep 93% of revenue.' },
        { title: 'Native Mobile Money', desc: 'MTN, Orange Money, Wave, Airtel… Your fans pay the way they\'re used to.' },
        { title: 'Music ambassadors', desc: 'Your fans share your music and earn a commission. Automatic viral marketing.' },
        { title: 'Exclusive content', desc: 'Offer premieres, acoustic versions, behind-the-scenes exclusives.' },
        { title: 'Donation campaigns', desc: 'Launch campaigns to fund your next album or music video. Your fans contribute directly.' },
      ]}
      steps={isFr ? [
        { step: '1', title: 'Créez votre page artiste', desc: 'Inscrivez-vous, ajoutez votre nom d\'artiste, bio et photo. Votre vitrine est prête.' },
        { step: '2', title: 'Uploadez votre musique', desc: 'Ajoutez vos fichiers audio (MP3, WAV, FLAC), artwork, et fixez vos prix.' },
        { step: '3', title: 'Partagez et encaissez', desc: 'Partagez le lien sur vos réseaux. Chaque vente arrive directement sur votre compte.' },
      ] : [
        { step: '1', title: 'Create your artist page', desc: 'Sign up, add your artist name, bio and photo. Your storefront is ready.' },
        { step: '2', title: 'Upload your music', desc: 'Add your audio files (MP3, WAV, FLAC), artwork, and set your prices.' },
        { step: '3', title: 'Share and earn', desc: 'Share the link on your social media. Every sale goes directly to your account.' },
      ]}
      testimonial={{
        name: 'DJ Kenzo',
        role: isFr ? 'Beatmaker & Producteur, Kinshasa' : 'Beatmaker & Producer, Kinshasa',
        text: isFr ? 'J\'ai vendu 200 beats en 3 mois sur Siteviral. Mes clients paient en Mobile Money et reçoivent les fichiers instantanément. Plus besoin de négocier par WhatsApp.' : 'I sold 200 beats in 3 months on Siteviral. My clients pay via Mobile Money and receive files instantly. No more negotiating via WhatsApp.',
        flag: '🇨🇩',
      }}
      stats={isFr ? [
        { value: '93%', label: 'Revenu conservé' },
        { value: '5 000+', label: 'Tracks vendus' },
        { value: '< 2 min', label: 'Mise en ligne' },
        { value: '0 FCFA', label: 'Abonnement' },
      ] : [
        { value: '93%', label: 'Revenue kept' },
        { value: '5,000+', label: 'Tracks sold' },
        { value: '< 2 min', label: 'Setup time' },
        { value: '$0', label: 'Subscription' },
      ]}
      faq={isFr ? [
        { q: 'Quels formats audio sont acceptés ?', a: 'MP3, WAV, FLAC, AAC, et tout fichier numérique jusqu\'à 500 Mo. Livraison automatique après paiement.' },
        { q: 'Puis-je vendre des beats avec licence ?', a: 'Absolument ! Créez différentes versions (lease, exclusive) avec des prix différents. Chaque acheteur reçoit son fichier.' },
        { q: 'Comment les fans découvrent ma musique ?', a: 'Via le marketplace Siteviral, les partages ambassadeurs sur les réseaux sociaux, et votre lien direct.' },
        { q: 'Siteviral remplace-t-il Spotify ?', a: 'Non, Siteviral complète le streaming. Gardez Spotify pour la visibilité, utilisez Siteviral pour la monétisation directe.' },
        { q: 'Puis-je lancer un crowdfunding pour mon album ?', a: 'Oui ! Utilisez les campagnes de dons pour financer votre projet. Vos fans contribuent et suivent la progression en temps réel.' },
      ] : [
        { q: 'What audio formats are accepted?', a: 'MP3, WAV, FLAC, AAC, and any digital file up to 500 MB. Automatic delivery after payment.' },
        { q: 'Can I sell beats with licenses?', a: 'Absolutely! Create different versions (lease, exclusive) at different prices. Each buyer receives their file.' },
        { q: 'How do fans discover my music?', a: 'Via the Siteviral marketplace, ambassador shares on social media, and your direct link.' },
        { q: 'Does Siteviral replace Spotify?', a: 'No, Siteviral complements streaming. Keep Spotify for visibility, use Siteviral for direct monetization.' },
        { q: 'Can I launch crowdfunding for my album?', a: 'Yes! Use donation campaigns to fund your project. Your fans contribute and track progress in real time.' },
      ]}
      cta={{ label: isFr ? 'Créer ma page artiste' : 'Create my artist page', path: '/auth?mode=signup' }}
      secondaryCta={{ label: isFr ? 'Explorer le marketplace' : 'Explore the marketplace', path: '/discover' }}
    />
  );
}
