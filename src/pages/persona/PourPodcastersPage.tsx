import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';
import { useI18n } from '@/i18n/I18nContext';

export default function PourPodcastersPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <PersonaLandingPage
      seo={{
        title: isFr ? 'Siteviral pour Podcasters — Monétisez votre podcast sans Patreon' : 'Siteviral for Podcasters — Monetize your podcast without Patreon',
        description: isFr ? 'Vendez des épisodes exclusifs, collectez des dons de vos auditeurs et développez votre audience avec le programme ambassadeur.' : 'Sell exclusive episodes, collect listener donations and grow your audience with the ambassador program.',
        url: 'https://siteviral.com/pour/podcasters',
      }}
      badge={isFr ? '🎙️ Pour les Podcasters' : '🎙️ For Podcasters'}
      headline={isFr ? <>Monétisez votre podcast <span className="text-primary">sans Patreon</span></> : <>Monetize your podcast <span className="text-primary">without Patreon</span></>}
      subheadline={isFr ? 'Vendez des épisodes premium, collectez le soutien de vos auditeurs en Mobile Money, et laissez vos fans propager votre voix.' : 'Sell premium episodes, collect listener support via Mobile Money, and let your fans spread your voice.'}
      painPoints={isFr ? [
        { icon: '💸', title: 'Patreon ne supporte pas le Mobile Money', desc: 'Vos auditeurs africains ne peuvent pas vous soutenir via Patreon.' },
        { icon: '📉', title: 'La pub ne paie presque rien', desc: 'Il faut 10 000+ écoutes par épisode pour gagner quelque chose en publicité.' },
        { icon: '🎧', title: 'Spotify ne monétise pas les podcasts', desc: 'Contrairement à la musique, les podcasts sur Spotify ne génèrent aucun revenu.' },
        { icon: '🔗', title: 'Audience fragmentée', desc: 'Vos auditeurs sont sur 5 plateformes différentes. Impossible de les rassembler.' },
        { icon: '📊', title: 'Pas de données auditeurs', desc: 'Vous ne connaissez pas vos auditeurs. Pas d\'emails, pas de contact direct.' },
        { icon: '⏳', title: 'Production chronophage', desc: 'Vous passez des heures à produire sans retour financier.' },
      ] : [
        { icon: '💸', title: 'Patreon doesn\'t support Mobile Money', desc: 'Your African listeners can\'t support you via Patreon.' },
        { icon: '📉', title: 'Ads barely pay', desc: 'You need 10,000+ listens per episode to earn anything from advertising.' },
        { icon: '🎧', title: 'Spotify doesn\'t monetize podcasts', desc: 'Unlike music, podcasts on Spotify generate no revenue for creators.' },
        { icon: '🔗', title: 'Fragmented audience', desc: 'Your listeners are on 5 different platforms. Impossible to unite them.' },
        { icon: '📊', title: 'No listener data', desc: 'You don\'t know your listeners. No emails, no direct contact.' },
        { icon: '⏳', title: 'Time-consuming production', desc: 'You spend hours producing with no financial return.' },
      ]}
      solutions={isFr ? [
        { title: 'Épisodes premium', desc: 'Proposez des épisodes exclusifs, des interviews bonus ou des séries complètes en accès payant.' },
        { title: 'Soutien des auditeurs', desc: 'Lancez des campagnes de dons pour financer votre saison. Vos fans contribuent en Mobile Money.' },
        { title: 'Base d\'auditeurs', desc: 'Collectez les emails de vos fans. Envoyez-leur des notifications à chaque nouvel épisode.' },
        { title: 'Ambassadeurs audio', desc: 'Vos auditeurs partagent vos épisodes et gagnent une commission sur chaque vente.' },
        { title: 'Contenu compagnon', desc: 'Vendez des transcriptions, résumés, guides complémentaires à vos épisodes.' },
        { title: 'Mobile Money natif', desc: 'Orange Money, MTN, Wave… Vos auditeurs vous soutiennent en 2 clics.' },
      ] : [
        { title: 'Premium episodes', desc: 'Offer exclusive episodes, bonus interviews or complete series behind a paywall.' },
        { title: 'Listener support', desc: 'Launch donation campaigns to fund your season. Your fans contribute via Mobile Money.' },
        { title: 'Listener base', desc: 'Collect your fans\' emails. Send them notifications for each new episode.' },
        { title: 'Audio ambassadors', desc: 'Your listeners share your episodes and earn a commission on each sale.' },
        { title: 'Companion content', desc: 'Sell transcriptions, summaries, companion guides to your episodes.' },
        { title: 'Native Mobile Money', desc: 'Orange Money, MTN, Wave… Your listeners support you in 2 clicks.' },
      ]}
      steps={isFr ? [
        { step: '1', title: 'Créez votre page podcast', desc: 'Ajoutez le nom de votre podcast, description et logo. Votre vitrine est prête.' },
        { step: '2', title: 'Uploadez vos épisodes premium', desc: 'Fichiers audio MP3, avec description et prix. Livraison automatique.' },
        { step: '3', title: 'Développez votre audience', desc: 'Partagez, activez les ambassadeurs, collectez les emails. Votre podcast devient un business.' },
      ] : [
        { step: '1', title: 'Create your podcast page', desc: 'Add your podcast name, description and logo. Your storefront is ready.' },
        { step: '2', title: 'Upload your premium episodes', desc: 'MP3 audio files, with description and price. Automatic delivery.' },
        { step: '3', title: 'Grow your audience', desc: 'Share, activate ambassadors, collect emails. Your podcast becomes a business.' },
      ]}
      testimonial={{
        name: 'Ibrahim T.',
        role: isFr ? 'Podcaster "Afrique Demain", Lomé' : 'Podcaster "Africa Tomorrow", Lomé',
        text: isFr ? 'Mes auditeurs me soutenaient moralement mais pas financièrement. Avec Siteviral, 85 d\'entre eux me soutiennent chaque mois en Mobile Money.' : 'My listeners supported me morally but not financially. With Siteviral, 85 of them support me every month via Mobile Money.',
        flag: '🇹🇬',
      }}
      stats={isFr ? [
        { value: '93%', label: 'Revenu conservé' },
        { value: '0 FCFA', label: 'Abonnement' },
        { value: '1 500+', label: 'Épisodes vendus' },
        { value: '< 2 min', label: 'Publication' },
      ] : [
        { value: '93%', label: 'Revenue kept' },
        { value: '$0', label: 'Subscription' },
        { value: '1,500+', label: 'Episodes sold' },
        { value: '< 2 min', label: 'Publishing' },
      ]}
      faq={isFr ? [
        { q: 'Puis-je garder mon podcast sur Spotify en parallèle ?', a: 'Bien sûr ! Gardez vos épisodes gratuits sur Spotify/Apple et vendez les exclusivités sur Siteviral.' },
        { q: 'Quels formats audio sont acceptés ?', a: 'MP3, WAV, M4A, AAC — tout format audio standard jusqu\'à 500 Mo.' },
        { q: 'Puis-je créer un abonnement mensuel ?', a: 'Pas encore d\'abonnement récurrent automatique, mais vous pouvez vendre des packs mensuels.' },
        { q: 'Comment promouvoir mes épisodes premium ?', a: 'Mentionnez-les dans vos épisodes gratuits, partagez sur les réseaux, et activez le programme ambassadeur.' },
      ] : [
        { q: 'Can I keep my podcast on Spotify in parallel?', a: 'Of course! Keep your free episodes on Spotify/Apple and sell exclusives on Siteviral.' },
        { q: 'What audio formats are accepted?', a: 'MP3, WAV, M4A, AAC — any standard audio format up to 500 MB.' },
        { q: 'Can I create a monthly subscription?', a: 'No automatic recurring subscription yet, but you can sell monthly packs.' },
        { q: 'How to promote my premium episodes?', a: 'Mention them in your free episodes, share on social media, and activate the ambassador program.' },
      ]}
      cta={{ label: isFr ? 'Créer ma page podcast' : 'Create my podcast page', path: '/auth?mode=signup' }}
      secondaryCta={{ label: isFr ? 'Explorer le marketplace' : 'Explore the marketplace', path: '/discover' }}
    />
  );
}
