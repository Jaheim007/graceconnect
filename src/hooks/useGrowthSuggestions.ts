import { useQuery } from '@tanstack/react-query';
import { useOrg } from '@/contexts/OrgContext';
import { db } from '@/lib/db';

export interface GrowthSuggestion {
  id: string;
  emoji: string;
  title: string;
  desc: string;
  actionUrl: string;
  priority: number;
}

/**
 * Contextual growth suggestions based on real org activity gaps.
 * Checks what the org is missing and returns prioritized recommendations.
 */
export function useGrowthSuggestions() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  return useQuery({
    queryKey: ['growth-suggestions', orgId],
    queryFn: async (): Promise<GrowthSuggestion[]> => {
      if (!orgId) return [];

      const suggestions: GrowthSuggestion[] = [];

      // Parallel checks
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

      // No products at all
      if (p === 0) {
        suggestions.push({
          id: 'create-product',
          emoji: '📦',
          title: 'Créez votre premier produit',
          desc: 'Un ebook, une formation ou un template. L\'IA peut vous aider à le créer en 5 minutes.',
          actionUrl: '/admin/products',
          priority: 100,
        });
      }

      // Products exist but none published
      if (p > 0 && pub === 0) {
        suggestions.push({
          id: 'publish-product',
          emoji: '🚀',
          title: 'Publiez votre produit',
          desc: `Vous avez ${p} produit(s) en brouillon. Publiez-en un pour commencer à vendre.`,
          actionUrl: '/admin/products',
          priority: 95,
        });
      }

      // No cover image or description
      if (org?.data && (!org.data.logo_url || !org.data.description)) {
        suggestions.push({
          id: 'complete-profile',
          emoji: '🎨',
          title: 'Complétez votre page',
          desc: !org.data.logo_url ? 'Ajoutez un logo pour inspirer confiance.' : 'Ajoutez une description pour présenter votre organisation.',
          actionUrl: '/admin/settings',
          priority: 85,
        });
      }

      // No KYC
      if (org?.data && (!org.data.kyc_status || org.data.kyc_status === 'none') && s > 0) {
        suggestions.push({
          id: 'start-kyc',
          emoji: '🔒',
          title: 'Vérifiez votre identité (KYC)',
          desc: 'Complétez le KYC pour débloquer les retraits et rassurer vos clients.',
          actionUrl: '/admin/kyc',
          priority: 90,
        });
      }

      // Affiliation not enabled
      if (!org?.data?.affiliation_enabled && pub > 0) {
        suggestions.push({
          id: 'enable-affiliation',
          emoji: '🤝',
          title: 'Activez le programme ambassadeur',
          desc: 'Laissez vos fans vendre pour vous et gagnez ensemble. Commission personnalisable.',
          actionUrl: '/admin/settings',
          priority: 80,
        });
      }

      // No campaign
      if (c === 0 && pub > 0) {
        suggestions.push({
          id: 'create-campaign',
          emoji: '🎯',
          title: 'Lancez une campagne de dons',
          desc: 'Collectez des fonds pour un projet spécifique. Intégré à votre page publique.',
          actionUrl: '/admin/campaigns',
          priority: 60,
        });
      }

      // Has sales but few members
      if (s > 0 && m < 10) {
        suggestions.push({
          id: 'grow-audience',
          emoji: '📢',
          title: 'Développez votre communauté',
          desc: 'Partagez votre page sur les réseaux sociaux pour attirer plus de membres.',
          actionUrl: '/admin/settings',
          priority: 70,
        });
      }

      // No media content
      if (med === 0 && pub > 0) {
        suggestions.push({
          id: 'add-media',
          emoji: '🎬',
          title: 'Ajoutez du contenu média',
          desc: 'Vidéos, audios ou articles enrichissent votre page et fidélisent votre audience.',
          actionUrl: '/admin/media',
          priority: 50,
        });
      }

      // Published products but no sales
      if (pub > 0 && s === 0) {
        suggestions.push({
          id: 'first-sale',
          emoji: '💡',
          title: 'Décrochez votre première vente',
          desc: 'Partagez vos produits sur WhatsApp, créez un code promo ou activez les ambassadeurs.',
          actionUrl: '/admin/products',
          priority: 75,
        });
      }

      return suggestions.sort((a, b) => b.priority - a.priority).slice(0, 5);
    },
    enabled: !!orgId,
    staleTime: 5 * 60 * 1000,
  });
}
