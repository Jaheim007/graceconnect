import { PersonaLandingPage } from '@/components/landing/PersonaLandingPage';
import { useI18n } from '@/i18n/I18nContext';

export default function PourOngPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <PersonaLandingPage
      seo={{
        title: isFr ? 'Siteviral pour les ONG & Associations — Collectez plus, simplement' : 'Siteviral for NGOs & Associations — Collect more, simply',
        description: isFr ? 'Lancez vos campagnes de collecte en ligne, recevez des dons par Mobile Money et carte, et mobilisez vos ambassadeurs pour lever plus de fonds.' : 'Launch your online fundraising campaigns, receive donations via Mobile Money and card, and mobilize ambassadors to raise more funds.',
        url: 'https://siteviral.com/pour/ong',
      }}
      badge={isFr ? '🌍 Pour les ONG & Associations' : '🌍 For NGOs & Associations'}
      headline={isFr ? <>Levez <span className="text-primary">3x plus de fonds</span> grâce au digital</> : <>Raise <span className="text-primary">3x more funds</span> through digital</>}
      subheadline={isFr ? 'Lancez des campagnes de collecte professionnelles, recevez des dons par Mobile Money et carte bancaire, et mobilisez des ambassadeurs bénévoles pour amplifier votre impact.' : 'Launch professional fundraising campaigns, receive donations via Mobile Money and card, and mobilize volunteer ambassadors to amplify your impact.'}
      painPoints={isFr ? [
        { icon: '📋', title: 'Collectes manuelles inefficaces', desc: 'Enveloppes, virements bancaires, tableurs Excel. Vous perdez du temps et de l\'argent à chaque collecte.' },
        { icon: '🌐', title: 'Pas de plateforme adaptée', desc: 'GoFundMe, PayPal — ces outils ne supportent pas le Mobile Money et ne sont pas adaptés au contexte africain.' },
        { icon: '📊', title: 'Aucune transparence', desc: 'Vos donateurs veulent savoir où va leur argent. Sans outil, la traçabilité est impossible.' },
        { icon: '💰', title: 'Diaspora difficile à atteindre', desc: 'Vos sympathisants à l\'étranger veulent aider mais les canaux de paiement sont limités.' },
        { icon: '📢', title: 'Communication fragmentée', desc: 'WhatsApp, Facebook, email… aucun canal centralisé pour informer et mobiliser.' },
        { icon: '🔒', title: 'Frais élevés des alternatives', desc: 'Les plateformes internationales prennent 5-8% + frais de conversion. Trop cher.' },
      ] : [
        { icon: '📋', title: 'Inefficient manual collections', desc: 'Envelopes, bank transfers, Excel spreadsheets. You waste time and money on every collection.' },
        { icon: '🌐', title: 'No adapted platform', desc: 'GoFundMe, PayPal — these tools don\'t support Mobile Money and aren\'t adapted to the African context.' },
        { icon: '📊', title: 'No transparency', desc: 'Your donors want to know where their money goes. Without tools, traceability is impossible.' },
        { icon: '💰', title: 'Hard to reach diaspora', desc: 'Your supporters abroad want to help but payment channels are limited.' },
        { icon: '📢', title: 'Fragmented communication', desc: 'WhatsApp, Facebook, email… no centralized channel to inform and mobilize.' },
        { icon: '🔒', title: 'High alternative fees', desc: 'International platforms take 5-8% + conversion fees. Too expensive.' },
      ]}
      solutions={isFr ? [
        { title: 'Campagnes de collecte professionnelles', desc: 'Créez des pages de don avec objectif, barre de progression, images et partage social intégré.' },
        { title: 'Mobile Money + Carte', desc: 'Vos donateurs en Afrique paient par Mobile Money, ceux de la diaspora par carte. Automatique.' },
        { title: 'Traçabilité complète', desc: 'Chaque don est enregistré avec nom, montant, date. Exportez en CSV pour vos rapports.' },
        { title: 'Ambassadeurs bénévoles', desc: 'Vos sympathisants partagent vos campagnes et amplifient votre portée sans que cela ne vous coûte.' },
        { title: 'Communication centralisée', desc: 'Annonces, événements, photos — tout sur votre page. Notifications automatiques.' },
        { title: 'Vente de ressources', desc: 'Vendez aussi vos guides, rapports, badges — diversifiez vos sources de revenus.' },
      ] : [
        { title: 'Professional fundraising campaigns', desc: 'Create donation pages with goals, progress bar, images and built-in social sharing.' },
        { title: 'Mobile Money + Card', desc: 'Your donors in Africa pay via Mobile Money, diaspora donors by card. Automatic.' },
        { title: 'Complete traceability', desc: 'Each donation is recorded with name, amount, date. Export to CSV for your reports.' },
        { title: 'Volunteer ambassadors', desc: 'Your supporters share your campaigns and amplify your reach at no cost to you.' },
        { title: 'Centralized communication', desc: 'Announcements, events, photos — all on your page. Automatic notifications.' },
        { title: 'Resource sales', desc: 'Also sell your guides, reports, badges — diversify your revenue sources.' },
      ]}
      steps={isFr ? [
        { step: '1', title: 'Créez votre page d\'organisation', desc: 'Nom, logo, description de votre mission. Votre page est publique et professionnelle.' },
        { step: '2', title: 'Lancez votre campagne', desc: 'Définissez un objectif, ajoutez des photos et une description. Partagez le lien.' },
        { step: '3', title: 'Recevez et suivez les dons', desc: 'Les dons arrivent automatiquement. Suivez en temps réel, exportez vos rapports.' },
      ] : [
        { step: '1', title: 'Create your organization page', desc: 'Name, logo, mission description. Your page is public and professional.' },
        { step: '2', title: 'Launch your campaign', desc: 'Set a goal, add photos and a description. Share the link.' },
        { step: '3', title: 'Receive and track donations', desc: 'Donations arrive automatically. Track in real time, export your reports.' },
      ]}
      testimonial={{
        name: 'David K.',
        role: isFr ? 'Directeur ONG' : 'NGO Director',
        text: isFr ? 'Nos campagnes de collecte ont levé 3x plus qu\'avant. Les donateurs paient par Mobile Money en un clic.' : 'Our fundraising campaigns raised 3x more than before. Donors pay via Mobile Money in one click.',
        flag: '🇬🇭',
      }}
      stats={isFr ? [
        { value: '0 FCFA', label: 'd\'abonnement' },
        { value: '15 min', label: 'pour lancer une campagne' },
        { value: '100%', label: 'traçabilité des dons' },
      ] : [
        { value: '$0', label: 'subscription' },
        { value: '15 min', label: 'to launch a campaign' },
        { value: '100%', label: 'donation traceability' },
      ]}
      faq={isFr ? [
        { q: 'Combien coûte Siteviral pour une ONG ?', a: 'Zéro abonnement. Les frais sont uniquement ceux de la passerelle de paiement (environ 1.5-3%). Siteviral ne prélève aucune commission sur les dons.' },
        { q: 'Peut-on exporter les données des donateurs ?', a: 'Oui, toutes les données sont exportables en CSV pour vos rapports annuels et audits.' },
        { q: 'Comment la diaspora peut-elle donner ?', a: 'Par carte Visa/Mastercard en EUR, USD ou toute autre devise. La conversion est automatique.' },
        { q: 'Peut-on avoir plusieurs campagnes en même temps ?', a: 'Oui, créez autant de campagnes que nécessaire.' },
      ] : [
        { q: 'How much does Siteviral cost for an NGO?', a: 'Zero subscription. Fees are only from the payment gateway (about 1.5-3%). Siteviral takes no commission on donations.' },
        { q: 'Can we export donor data?', a: 'Yes, all data is exportable as CSV for your annual reports and audits.' },
        { q: 'How can the diaspora give?', a: 'By Visa/Mastercard card in EUR, USD or any other currency. Conversion is automatic.' },
        { q: 'Can we have multiple campaigns at once?', a: 'Yes, create as many campaigns as needed.' },
      ]}
      cta={{ label: isFr ? 'Créer ma page d\'ONG gratuitement' : 'Create my NGO page for free', path: '/auth?mode=signup' }}
      secondaryCta={{ label: isFr ? 'Calculer mon potentiel' : 'Calculate my potential', path: '/calculateur' }}
    />
  );
}
