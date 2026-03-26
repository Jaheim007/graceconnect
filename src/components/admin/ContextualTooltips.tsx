import { HelpTip } from '@/components/ui/HelpTip';
import { useI18n } from '@/i18n/I18nContext';

/**
 * Pre-built contextual tooltips for key admin screens.
 * Each tooltip explains the *benefit*, not just the feature.
 */

const TIPS = {
  dashboard_revenue: {
    fr: 'Ce montant inclut toutes vos ventes et dons. Partagez votre lien pour augmenter vos revenus !',
    en: 'This amount includes all your sales and donations. Share your link to increase revenue!',
  },
  dashboard_members: {
    fr: 'Plus vous avez de membres, plus votre communauté est forte. Invitez-les via WhatsApp !',
    en: 'More members mean a stronger community. Invite them via WhatsApp!',
  },
  dashboard_products: {
    fr: 'Chaque produit publié est une source de revenus. Ajoutez-en régulièrement pour diversifier.',
    en: 'Each published product is a revenue source. Add new ones regularly to diversify.',
  },
  dashboard_campaigns: {
    fr: 'Les campagnes de dons permettent à votre communauté de soutenir vos projets directement.',
    en: 'Donation campaigns let your community directly support your projects.',
  },
  product_title: {
    fr: 'Un bon titre attire l\'attention. Soyez précis et incluez des mots-clés que vos clients cherchent.',
    en: 'A good title grabs attention. Be specific and include keywords your customers search for.',
  },
  product_description: {
    fr: 'Une description détaillée augmente les ventes de 30%. Utilisez le bouton IA pour en générer une.',
    en: 'A detailed description increases sales by 30%. Use the AI button to generate one.',
  },
  product_price: {
    fr: 'Fixez un prix juste. Les produits entre 2 000 et 10 000 FCFA se vendent le mieux sur notre plateforme.',
    en: 'Set a fair price. Products between $5-$20 sell best on our platform.',
  },
  product_cover: {
    fr: 'Les produits avec une couverture professionnelle se vendent 2x plus. Investissez dans une belle image !',
    en: 'Products with a professional cover sell 2x more. Invest in a great image!',
  },
  product_pwyw: {
    fr: 'Le "Pay What You Want" augmente le nombre d\'acheteurs tout en permettant aux généreux de payer plus.',
    en: '"Pay What You Want" increases buyers while letting generous ones pay more.',
  },
  affiliation: {
    fr: 'Activez le programme ambassadeur pour que d\'autres partagent vos produits et gagnent une commission.',
    en: 'Enable the ambassador program so others can share your products and earn a commission.',
  },
  analytics_funnel: {
    fr: 'Ce tunnel montre où vous perdez des acheteurs potentiels. Concentrez-vous sur les étapes avec le plus de pertes.',
    en: 'This funnel shows where you lose potential buyers. Focus on steps with the highest drop-off.',
  },
  qr_code: {
    fr: 'Imprimez ce QR code sur vos flyers, cartes de visite ou affiches pour vendre hors ligne !',
    en: 'Print this QR code on flyers, business cards or posters to sell offline!',
  },
} as const;

type TipKey = keyof typeof TIPS;

export function ContextTip({ tipKey, side = 'top' }: { tipKey: TipKey; side?: 'top' | 'bottom' | 'left' | 'right' }) {
  const { locale } = useI18n();
  const tip = TIPS[tipKey];
  const content = locale === 'fr' ? tip.fr : tip.en;
  return <HelpTip content={content} side={side} />;
}
