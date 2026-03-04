import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';

export default function PourMusiciensPage() {
  return (
    <PersonaLandingPage
      seo={{
        title: 'Siteviral pour Musiciens — Monétisez votre musique sans label',
        description: 'Vendez vos singles, albums et beats directement à vos fans. Paiement Mobile Money, livraison instantanée, programme ambassadeur intégré.',
        url: 'https://siteviral.com/pour/musiciens',
      }}
      badge="🎵 Pour les Musiciens & Artistes"
      headline={<>Monétisez votre musique <span className="text-primary">sans label</span>, sans intermédiaire</>}
      subheadline={<>Vendez vos singles, albums, beats et exclusivités directement à vos fans. Recevez vos paiements en Mobile Money. Gardez le contrôle.</>}
      painPoints={[
        { icon: '🏷️', title: 'Les labels prennent tout', desc: 'Contrats abusifs, royalties opaques, vous créez mais vous ne gagnez presque rien.' },
        { icon: '📉', title: 'Streaming = centimes', desc: '0,003$ par stream sur Spotify. Il faut 1 million d\'écoutes pour gagner 3 000$. Impossible pour un artiste émergent.' },
        { icon: '🌍', title: 'Pas adapté à l\'Afrique', desc: 'Spotify, Apple Music, Deezer… Peu de fans africains y sont. Et ils ne supportent pas le Mobile Money.' },
        { icon: '🎤', title: 'Pas de relation directe', desc: 'Sur les plateformes de streaming, vous ne connaissez pas vos fans. Impossible de les contacter.' },
        { icon: '💳', title: 'Paiement bloqué', desc: 'Vos fans veulent vous soutenir mais n\'ont pas de carte bancaire. Vous perdez la majorité des ventes.' },
        { icon: '⏰', title: 'Délais de distribution', desc: 'Attendre 2-4 semaines pour qu\'un distributeur mette votre musique en ligne. Vous perdez le buzz.' },
      ]}
      solutions={[
        { title: 'Boutique musicale instantanée', desc: 'Votre page artiste avec bio, discographie et paiement intégré. En ligne en 2 minutes.' },
        { title: 'Vente directe à vos fans', desc: 'Singles, albums, beats, acapellas, exclusivités… Fixez vos prix, gardez 93% des revenus.' },
        { title: 'Mobile Money natif', desc: 'MTN, Orange Money, Wave, Airtel… Vos fans paient comme ils en ont l\'habitude.' },
        { title: 'Ambassadeurs musicaux', desc: 'Vos fans partagent votre musique et gagnent une commission. Marketing viral automatique.' },
        { title: 'Contenu exclusif', desc: 'Proposez des avant-premières, des versions acoustiques, des behind-the-scenes en exclusivité.' },
        { title: 'Collecte de dons', desc: 'Lancez des campagnes pour financer votre prochain album ou clip. Vos fans contribuent directement.' },
      ]}
      steps={[
        { step: '1', title: 'Créez votre page artiste', desc: 'Inscrivez-vous, ajoutez votre nom d\'artiste, bio et photo. Votre vitrine est prête.' },
        { step: '2', title: 'Uploadez votre musique', desc: 'Ajoutez vos fichiers audio (MP3, WAV, FLAC), artwork, et fixez vos prix.' },
        { step: '3', title: 'Partagez et encaissez', desc: 'Partagez le lien sur vos réseaux. Chaque vente arrive directement sur votre compte.' },
      ]}
      testimonial={{
        name: 'DJ Kenzo',
        role: 'Beatmaker & Producteur, Kinshasa',
        text: 'J\'ai vendu 200 beats en 3 mois sur Siteviral. Mes clients paient en Mobile Money et reçoivent les fichiers instantanément. Plus besoin de négocier par WhatsApp.',
        flag: '🇨🇩',
      }}
      stats={[
        { value: '93%', label: 'Revenu conservé' },
        { value: '5 000+', label: 'Tracks vendus' },
        { value: '< 2 min', label: 'Mise en ligne' },
        { value: '0 FCFA', label: 'Abonnement' },
      ]}
      faq={[
        { q: 'Quels formats audio sont acceptés ?', a: 'MP3, WAV, FLAC, AAC, et tout fichier numérique jusqu\'à 500 Mo. Livraison automatique après paiement.' },
        { q: 'Puis-je vendre des beats avec licence ?', a: 'Absolument ! Créez différentes versions (lease, exclusive) avec des prix différents. Chaque acheteur reçoit son fichier.' },
        { q: 'Comment les fans découvrent ma musique ?', a: 'Via le Hub Siteviral, les partages ambassadeurs sur les réseaux sociaux, et votre lien direct.' },
        { q: 'Siteviral remplace-t-il Spotify ?', a: 'Non, Siteviral complète le streaming. Gardez Spotify pour la visibilité, utilisez Siteviral pour la monétisation directe.' },
        { q: 'Puis-je lancer un crowdfunding pour mon album ?', a: 'Oui ! Utilisez les campagnes de dons pour financer votre projet. Vos fans contribuent et suivent la progression en temps réel.' },
      ]}
      cta={{ label: 'Créer ma page artiste', path: '/auth?mode=signup' }}
      secondaryCta={{ label: 'Explorer le Hub', path: '/discover' }}
    />
  );
}
