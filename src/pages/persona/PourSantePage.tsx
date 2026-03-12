import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';
import { useI18n } from '@/i18n/I18nContext';

export default function PourSantePage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <PersonaLandingPage
      seo={{
        title: isFr ? 'Siteviral pour les Professionnels de Santé — Vendez vos contenus médicaux' : 'Siteviral for Health Professionals — Sell Your Medical Content',
        description: isFr ? 'Médecins, nutritionnistes, coachs bien-être : vendez vos guides santé, programmes et formations par Mobile Money.' : 'Doctors, nutritionists, wellness coaches: sell your health guides, programs, and training via Mobile Money.',
        url: 'https://siteviral.com/pour/sante',
      }}
      badge={isFr ? '🩺 Pour les Pros de Santé' : '🩺 For Health Professionals'}
      headline={isFr
        ? <>Partagez votre <span className="text-primary">expertise santé</span> et touchez des milliers de personnes</>
        : <>Share your <span className="text-primary">health expertise</span> and reach thousands of people</>}
      subheadline={isFr
        ? 'Vous êtes médecin, nutritionniste ou coach bien-être. Vos guides, programmes alimentaires et formations peuvent aider bien au-delà de votre cabinet. Vendez-les en ligne.'
        : 'You\'re a doctor, nutritionist, or wellness coach. Your guides, meal plans, and courses can help far beyond your office. Sell them online.'}
      painPoints={isFr ? [
        { icon: '🏥', title: 'Expertise limitée au cabinet', desc: 'Vous aidez 10 patients par jour alors que des milliers auraient besoin de vos conseils.' },
        { icon: '📱', title: 'Conseils gratuits sur WhatsApp', desc: 'Vous répondez gratuitement aux questions santé dans les groupes. Votre temps n\'est pas valorisé.' },
        { icon: '💸', title: 'Pas de revenus passifs', desc: 'Vos revenus s\'arrêtent quand vous ne consultez pas. Pas de produits qui travaillent pour vous.' },
        { icon: '📋', title: 'Programmes non packageés', desc: 'Vos protocoles et programmes restent dans vos dossiers patients. Jamais vendus à grande échelle.' },
        { icon: '🌍', title: 'Contenu santé rare en français', desc: 'Le contenu santé de qualité adapté au contexte africain est quasi inexistant en ligne.' },
        { icon: '🏗️', title: 'Pas de plateforme adaptée', desc: 'Créer un site e-commerce médical est complexe, coûteux et chronophage.' },
      ] : [
        { icon: '🏥', title: 'Expertise limited to office', desc: 'You help 10 patients a day while thousands need your advice.' },
        { icon: '📱', title: 'Free advice on WhatsApp', desc: 'You answer health questions for free in groups. Your time isn\'t valued.' },
        { icon: '💸', title: 'No passive income', desc: 'Your revenue stops when you\'re not consulting. No products working for you.' },
        { icon: '📋', title: 'Unpackaged programs', desc: 'Your protocols and programs stay in patient files. Never sold at scale.' },
        { icon: '🌍', title: 'Rare quality health content', desc: 'Quality health content adapted to the African context is nearly nonexistent online.' },
        { icon: '🏗️', title: 'No suitable platform', desc: 'Building a medical e-commerce site is complex, expensive, and time-consuming.' },
      ]}
      solutions={isFr ? [
        { title: 'Guides santé premium', desc: 'Vendez vos guides nutrition, programmes de remise en forme, protocoles bien-être en PDF.' },
        { title: 'Formations vidéo', desc: 'Enregistrez vos formations sur des sujets de santé publique. Vendez en replay illimité.' },
        { title: 'Programmes alimentaires', desc: 'Créez des plans personnalisables que vos clients achètent et téléchargent instantanément.' },
        { title: 'Consultations à distance', desc: 'Vendez des packs de consultation avec liens de réservation intégrés.' },
        { title: 'Mobile Money natif', desc: 'Vos patients payent par Orange Money, MTN ou Wave. Accessible à tous.' },
        { title: 'Page professionnelle', desc: 'Vitrine crédible avec vos qualifications, spécialisations et catalogue de ressources.' },
      ] : [
        { title: 'Premium health guides', desc: 'Sell your nutrition guides, fitness programs, wellness protocols as PDFs.' },
        { title: 'Video training', desc: 'Record your training on public health topics. Sell as unlimited replays.' },
        { title: 'Meal programs', desc: 'Create customizable plans that your clients buy and download instantly.' },
        { title: 'Remote consultations', desc: 'Sell consultation packs with integrated booking links.' },
        { title: 'Native Mobile Money', desc: 'Your patients pay via Orange Money, MTN, or Wave. Accessible to all.' },
        { title: 'Professional page', desc: 'Credible storefront with your qualifications, specializations, and resource catalog.' },
      ]}
      steps={isFr ? [
        { step: '1', title: 'Créez votre page', desc: 'Inscription gratuite. Présentez vos qualifications et spécialisations.' },
        { step: '2', title: 'Publiez vos ressources', desc: 'Guides PDF, vidéos éducatives, programmes. Fixez vos prix.' },
        { step: '3', title: 'Aidez plus de monde', desc: 'Partagez dans vos réseaux. Vos contenus aident 24h/24, même quand vous dormez.' },
      ] : [
        { step: '1', title: 'Create your page', desc: 'Free sign-up. Present your qualifications and specializations.' },
        { step: '2', title: 'Publish your resources', desc: 'PDF guides, educational videos, programs. Set your prices.' },
        { step: '3', title: 'Help more people', desc: 'Share in your networks. Your content helps 24/7, even while you sleep.' },
      ]}
      testimonial={{
        name: 'Dr. A. M.',
        role: isFr ? 'Nutritionniste' : 'Nutritionist',
        text: isFr
          ? 'Mon guide "Alimentation saine au Sahel" s\'est vendu à 300 exemplaires. Je touche des patients dans 5 pays que je n\'aurais jamais pu voir en cabinet.'
          : 'My guide "Healthy Eating in the Sahel" sold 300 copies. I reach patients in 5 countries I could never have seen in my office.',
        flag: '🇲🇱',
      }}
      stats={isFr ? [
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: '5 pays', label: 'touchés en moyenne' },
        { value: '90%', label: 'pour vous' },
      ] : [
        { value: '$0', label: 'subscription fee' },
        { value: '5 countries', label: 'reached on average' },
        { value: '90%', label: 'for you' },
      ]}
      faq={isFr ? [
        { q: 'Est-ce conforme à la déontologie médicale ?', a: 'Oui, vendre des guides éducatifs et formations ne constitue pas un acte médical. C\'est de l\'éducation santé.' },
        { q: 'Quels contenus puis-je vendre ?', a: 'Guides nutrition, programmes sportifs, formations vidéo, ebooks santé, protocoles bien-être.' },
        { q: 'Mes patients peuvent-ils payer par Mobile Money ?', a: 'Oui, tous les moyens de paiement mobile sont acceptés.' },
        { q: 'Les contenus sont-ils protégés ?', a: 'Oui, watermark automatique et accès sécurisé. Seuls les acheteurs téléchargent.' },
        { q: 'Puis-je offrir des contenus gratuits ?', a: 'Oui, publiez des ressources gratuites pour attirer puis proposez vos produits premium.' },
        { q: 'Comment recevoir mes revenus ?', a: 'Mobile Money ou virement bancaire après 72h de sécurité.' },
      ] : [
        { q: 'Is this compliant with medical ethics?', a: 'Yes, selling educational guides and training does not constitute a medical act. It\'s health education.' },
        { q: 'What content can I sell?', a: 'Nutrition guides, fitness programs, video training, health ebooks, wellness protocols.' },
        { q: 'Can my patients pay via Mobile Money?', a: 'Yes, all mobile payment methods are accepted.' },
        { q: 'Is content protected?', a: 'Yes, automatic watermark and secured access. Only buyers can download.' },
        { q: 'Can I offer free content?', a: 'Yes, publish free resources to attract, then offer your premium products.' },
        { q: 'How do I receive my earnings?', a: 'Mobile Money or bank transfer after 72-hour security hold.' },
      ]}
      cta={{ label: isFr ? 'Partager mon expertise santé' : 'Share my health expertise', path: '/auth?mode=signup' }}
      secondaryCta={{ label: isFr ? 'Voir les fonctionnalités' : 'See features', path: '/features' }}
    />
  );
}
