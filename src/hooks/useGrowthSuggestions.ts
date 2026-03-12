import { useQuery } from '@tanstack/react-query';
import { useOrg } from '@/contexts/OrgContext';
import { db } from '@/lib/db';
import { useI18n } from '@/i18n/I18nContext';

export interface GrowthSuggestion {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  actionUrl: string;
  priority: number;
}

export function useGrowthSuggestions() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return useQuery({
    queryKey: ['growth-suggestions', orgId, locale],
    queryFn: async (): Promise<GrowthSuggestion[]> => {
      if (!orgId) return [];

      const suggestions: GrowthSuggestion[] = [];

      const [
        { count: productCount },
        { count: publishedCount },
        { count: campaignCount },
        { count: memberCount },
        { count: salesCount },
        { count: mediaCount },
        { data: org },
      ] = await Promise.all([
        db.from('digital_products').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
        db.from('digital_products').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('is_published', true),
        db.from('donation_campaigns').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('is_active', true),
        db.from('organization_members').select('*', { count: 'exact', head: true }).eq('organization_id', orgId),
        db.from('product_purchases').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'completed'),
        db.from('media_content').select('*', { count: 'exact', head: true }).eq('organization_id', orgId).eq('is_published', true),
        db.from('organizations').select('affiliation_enabled, kyc_status, logo_url, description, banner_url').eq('id', orgId).single(),
      ]);

      const p = productCount || 0;
      const pub = publishedCount || 0;
      const c = campaignCount || 0;
      const m = memberCount || 0;
      const s = salesCount || 0;
      const med = mediaCount || 0;

      if (p === 0) {
        suggestions.push({
          id: 'create-product', emoji: '📦',
          title: isFr ? 'Créez votre premier produit' : 'Create your first product',
          desc: isFr ? 'Un ebook, une formation ou un template. L\'IA peut vous aider à le créer en 5 minutes.' : 'An ebook, course or template. AI can help you create it in 5 minutes.',
          actionUrl: '/admin/products', priority: 100,
        });
      }

      if (p > 0 && pub === 0) {
        suggestions.push({
          id: 'publish-product', emoji: '🚀',
          title: isFr ? 'Publiez votre produit' : 'Publish your product',
          desc: isFr ? `Vous avez ${p} produit(s) en brouillon. Publiez-en un pour commencer à vendre.` : `You have ${p} draft product(s). Publish one to start selling.`,
          actionUrl: '/admin/products', priority: 95,
        });
      }

      if (org && (!org.logo_url || !org.description)) {
        suggestions.push({
          id: 'complete-profile', emoji: '🎨',
          title: isFr ? 'Complétez votre page' : 'Complete your page',
          desc: !org.logo_url
            ? (isFr ? 'Ajoutez un logo pour inspirer confiance.' : 'Add a logo to build trust.')
            : (isFr ? 'Ajoutez une description pour présenter votre organisation.' : 'Add a description to present your organization.'),
          actionUrl: '/admin/settings', priority: 85,
        });
      }

      if (org && (!org.kyc_status || org.kyc_status === 'none') && s > 0) {
        suggestions.push({
          id: 'start-kyc', emoji: '🔒',
          title: isFr ? 'Vérifiez votre identité (KYC)' : 'Verify your identity (KYC)',
          desc: isFr ? 'Complétez le KYC pour débloquer les retraits et rassurer vos clients.' : 'Complete KYC to unlock withdrawals and reassure your clients.',
          actionUrl: '/admin/kyc', priority: 90,
        });
      }

      if (!org?.affiliation_enabled && pub > 0) {
        suggestions.push({
          id: 'enable-affiliation', emoji: '🤝',
          title: isFr ? 'Activez le programme ambassadeur' : 'Enable the ambassador program',
          desc: isFr ? 'Laissez vos fans vendre pour vous et gagnez ensemble. Commission personnalisable.' : 'Let your fans sell for you and earn together. Customizable commission.',
          actionUrl: '/admin/settings', priority: 80,
        });
      }

      if (c === 0 && pub > 0) {
        suggestions.push({
          id: 'create-campaign', emoji: '🎯',
          title: isFr ? 'Lancez une campagne de dons' : 'Launch a donation campaign',
          desc: isFr ? 'Collectez des fonds pour un projet spécifique. Intégré à votre page publique.' : 'Raise funds for a specific project. Integrated into your public page.',
          actionUrl: '/admin/campaigns', priority: 60,
        });
      }

      if (s > 0 && m < 10) {
        suggestions.push({
          id: 'grow-audience', emoji: '📢',
          title: isFr ? 'Développez votre communauté' : 'Grow your community',
          desc: isFr ? 'Partagez votre page sur les réseaux sociaux pour attirer plus de membres.' : 'Share your page on social media to attract more members.',
          actionUrl: '/admin/settings', priority: 70,
        });
      }

      if (med === 0 && pub > 0) {
        suggestions.push({
          id: 'add-media', emoji: '🎬',
          title: isFr ? 'Ajoutez du contenu média' : 'Add media content',
          desc: isFr ? 'Vidéos, audios ou articles enrichissent votre page et fidélisent votre audience.' : 'Videos, audio or articles enrich your page and build loyalty.',
          actionUrl: '/admin/media', priority: 50,
        });
      }

      if (pub > 0 && s === 0) {
        suggestions.push({
          id: 'first-sale', emoji: '💡',
          title: isFr ? 'Décrochez votre première vente' : 'Get your first sale',
          desc: isFr ? 'Partagez vos produits sur WhatsApp, créez un code promo ou activez les ambassadeurs.' : 'Share your products on WhatsApp, create a promo code or activate ambassadors.',
          actionUrl: '/admin/products', priority: 75,
        });
      }

      return suggestions.sort((a, b) => b.priority - a.priority).slice(0, 5);
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}
