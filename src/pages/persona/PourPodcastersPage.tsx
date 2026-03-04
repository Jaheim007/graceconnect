import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';

export default function PourPodcastersPage() {
  return (
    <PersonaLandingPage
      seo={{
        title: 'Siteviral pour Podcasters — Monétisez votre podcast sans Patreon',
        description: 'Vendez des épisodes exclusifs, collectez des dons de vos auditeurs et développez votre audience avec le programme ambassadeur.',
        url: 'https://siteviral.com/pour/podcasters',
      }}
      badge="🎙️ Pour les Podcasters"
      headline={<>Monétisez votre podcast <span className="text-primary">sans Patreon</span></>}
      subheadline={<>Vendez des épisodes premium, collectez le soutien de vos auditeurs en Mobile Money, et laissez vos fans propager votre voix.</>}
      painPoints={[
        { icon: '💸', title: 'Patreon ne supporte pas le Mobile Money', desc: 'Vos auditeurs africains ne peuvent pas vous soutenir via Patreon. Vous perdez votre audience locale.' },
        { icon: '📉', title: 'La pub ne paie presque rien', desc: 'Il faut 10 000+ écoutes par épisode pour gagner quelque chose en publicité. Irréaliste pour la plupart.' },
        { icon: '🎧', title: 'Spotify ne monétise pas les podcasts', desc: 'Contrairement à la musique, les podcasts sur Spotify ne génèrent aucun revenu pour le créateur.' },
        { icon: '🔗', title: 'Audience fragmentée', desc: 'Vos auditeurs sont sur 5 plateformes différentes. Impossible de les rassembler.' },
        { icon: '📊', title: 'Pas de données auditeurs', desc: 'Vous ne connaissez pas vos auditeurs. Pas d\'emails, pas de contact direct.' },
        { icon: '⏳', title: 'Production chronophage', desc: 'Vous passez des heures à produire sans retour financier. La motivation baisse.' },
      ]}
      solutions={[
        { title: 'Épisodes premium', desc: 'Proposez des épisodes exclusifs, des interviews bonus ou des séries complètes en accès payant.' },
        { title: 'Soutien des auditeurs', desc: 'Lancez des campagnes de dons pour financer votre saison. Vos fans contribuent en Mobile Money.' },
        { title: 'Base d\'auditeurs', desc: 'Collectez les emails de vos fans. Envoyez-leur des notifications à chaque nouvel épisode.' },
        { title: 'Ambassadeurs audio', desc: 'Vos auditeurs partagent vos épisodes et gagnent une commission sur chaque vente.' },
        { title: 'Contenu compagnon', desc: 'Vendez des transcriptions, résumés, guides complémentaires à vos épisodes.' },
        { title: 'Mobile Money natif', desc: 'Orange Money, MTN, Wave… Vos auditeurs vous soutiennent en 2 clics.' },
      ]}
      steps={[
        { step: '1', title: 'Créez votre page podcast', desc: 'Ajoutez le nom de votre podcast, description et logo. Votre vitrine est prête.' },
        { step: '2', title: 'Uploadez vos épisodes premium', desc: 'Fichiers audio MP3, avec description et prix. Livraison automatique.' },
        { step: '3', title: 'Développez votre audience', desc: 'Partagez, activez les ambassadeurs, collectez les emails. Votre podcast devient un business.' },
      ]}
      testimonial={{
        name: 'Ibrahim T.',
        role: 'Podcaster "Afrique Demain", Lomé',
        text: 'Mes auditeurs me soutenaient moralement mais pas financièrement. Avec Siteviral, 85 d\'entre eux me soutiennent chaque mois en Mobile Money. Ça change tout.',
        flag: '🇹🇬',
      }}
      stats={[
        { value: '93%', label: 'Revenu conservé' },
        { value: '0 FCFA', label: 'Abonnement' },
        { value: '1 500+', label: 'Épisodes vendus' },
        { value: '< 2 min', label: 'Publication' },
      ]}
      faq={[
        { q: 'Puis-je garder mon podcast sur Spotify en parallèle ?', a: 'Bien sûr ! Gardez vos épisodes gratuits sur Spotify/Apple et vendez les exclusivités sur Siteviral.' },
        { q: 'Quels formats audio sont acceptés ?', a: 'MP3, WAV, M4A, AAC — tout format audio standard jusqu\'à 500 Mo.' },
        { q: 'Puis-je créer un abonnement mensuel ?', a: 'Pas encore d\'abonnement récurrent automatique, mais vous pouvez vendre des packs mensuels.' },
        { q: 'Comment promouvoir mes épisodes premium ?', a: 'Mentionnez-les dans vos épisodes gratuits, partagez sur les réseaux, et activez le programme ambassadeur.' },
      ]}
      cta={{ label: 'Créer ma page podcast', path: '/auth?mode=signup' }}
      secondaryCta={{ label: 'Explorer le Hub', path: '/discover' }}
    />
  );
}
