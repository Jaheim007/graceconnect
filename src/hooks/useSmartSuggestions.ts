import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';

interface SmartSuggestion {
  id: string;
  emoji: string;
  title: string;
  description: string;
  actionLabel: string;
  actionPath: string;
  priority: number;
}

/**
 * useSmartSuggestions — analyses user state and returns contextual suggestions
 * to help them reach their first win. Extended with more nudges for growth automation.
 */
export function useSmartSuggestions() {
  const { user } = useAuth();
  const { userOrgs, canManage } = useOrg();

  const manageableOrg = userOrgs.find(o => canManage(o.id));

  return useQuery({
    queryKey: ['smart-suggestions', user?.id, manageableOrg?.id],
    queryFn: async () => {
      if (!user) return [];
      const suggestions: SmartSuggestion[] = [];

      // Check affiliate links
      const { count: affiliateCount } = await db
        .from('affiliate_links')
        .select('id', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (!manageableOrg) {
        // ── Pure consumer/ambassador path ──
        if ((affiliateCount || 0) === 0) {
          suggestions.push({
            id: 'become-ambassador',
            emoji: '💰',
            title: 'Gagne en partageant',
            description: 'Deviens ambassadeur en 1 clic et gagne 5-50% de commission sur chaque vente.',
            actionLabel: 'Découvrir',
            actionPath: '/gagner',
            priority: 1,
          });
        } else {
          // Ambassador with links — check activity
          const { data: links } = await db
            .from('affiliate_links')
            .select('clicks, conversions')
            .eq('user_id', user.id);
          const totalClicks = (links || []).reduce((s: number, l: any) => s + (l.clicks || 0), 0);
          const totalConversions = (links || []).reduce((s: number, l: any) => s + (l.conversions || 0), 0);

          if (totalClicks === 0) {
            suggestions.push({
              id: 'first-share',
              emoji: '🔗',
              title: 'Partage ton premier lien',
              description: 'Tu as ton lien ambassadeur ! Partage-le sur WhatsApp pour recevoir tes premiers clics.',
              actionLabel: 'Partager',
              actionPath: '/gagner',
              priority: 1,
            });
          } else if (totalClicks > 0 && totalConversions === 0) {
            // Has clicks but no conversion — nudge with better product
            suggestions.push({
              id: 'try-popular-product',
              emoji: '🔥',
              title: 'Essaie un produit plus populaire',
              description: `Tu as ${totalClicks} clic(s) mais pas encore de vente. Partage un produit tendance pour convertir.`,
              actionLabel: 'Voir tendances',
              actionPath: '/discover',
              priority: 1,
            });
          }
        }

        suggestions.push({
          id: 'write-book',
          emoji: '✍️',
          title: 'Écris ton premier ebook',
          description: 'Crée un livre en 5 minutes avec l\'IA et commence à le vendre.',
          actionLabel: 'Écrire',
          actionPath: '/ecrire',
          priority: 2,
        });

        return suggestions.sort((a, b) => a.priority - b.priority).slice(0, 3);
      }

      // ── Creator path ──
      const orgId = manageableOrg.id;

      const [productRes, publishedRes, salesRes, draftProjectsRes] = await Promise.all([
        db.from('digital_products').select('id, cover_image_url, is_published', { count: 'exact' }).eq('organization_id', orgId),
        db.from('digital_products').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('is_published', true),
        db.from('product_purchases').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'completed'),
        db.from('ai_content_projects').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'draft'),
      ]);

      const products = productRes.data || [];
      const productCount = productRes.count || 0;
      const publishedCount = publishedRes.count || 0;
      const salesCount = salesRes.count || 0;
      const draftCount = draftProjectsRes.count || 0;

      // Nudge: unpublished AI draft
      if (draftCount > 0) {
        suggestions.push({
          id: 'publish-draft',
          emoji: '📝',
          title: 'Publie ton livre en attente',
          description: `Tu as ${draftCount} brouillon(s) IA non publié(s). Publie-les et gagne tes premiers revenus.`,
          actionLabel: 'Continuer',
          actionPath: '/ecrire',
          priority: 1,
        });
      }

      if (productCount === 0) {
        suggestions.push({
          id: 'create-product',
          emoji: '📦',
          title: 'Créez votre premier produit',
          description: 'Uploadez un ebook, une formation ou un template pour commencer à vendre.',
          actionLabel: 'Créer',
          actionPath: '/admin/products/new',
          priority: 1,
        });
      } else {
        // Check for products without cover
        const noCover = products.filter((p: any) => !p.cover_image_url);
        if (noCover.length > 0) {
          suggestions.push({
            id: 'add-cover',
            emoji: '🖼️',
            title: 'Ajoutez une couverture',
            description: `${noCover.length} produit(s) sans couverture. +40% de ventes avec une bonne image.`,
            actionLabel: 'Modifier',
            actionPath: `/admin/products/${noCover[0].id}/edit`,
            priority: 2,
          });
        }

        // Published but no sales after 48h
        if (publishedCount > 0 && salesCount === 0) {
          suggestions.push({
            id: 'first-sale',
            emoji: '📢',
            title: 'Partagez pour votre première vente',
            description: 'Votre produit est publié ! Partagez le lien sur WhatsApp pour attirer vos premiers clients.',
            actionLabel: 'Partager',
            actionPath: '/admin/products',
            priority: 1,
          });
        }

        // Has 10+ sales — nudge to enable affiliation
        if (salesCount >= 10 && !manageableOrg.affiliation_enabled) {
          suggestions.push({
            id: 'enable-affiliation-sales',
            emoji: '🚀',
            title: 'Multipliez vos ventes x3',
            description: `Vous avez ${salesCount} ventes ! Activez les ambassadeurs pour qu'ils vendent pour vous.`,
            actionLabel: 'Activer',
            actionPath: '/admin/settings',
            priority: 1,
          });
        }
      }

      if (!manageableOrg.affiliation_enabled && salesCount < 10) {
        suggestions.push({
          id: 'enable-affiliation',
          emoji: '🤝',
          title: 'Activez les ambassadeurs',
          description: 'Laissez d\'autres promouvoir vos produits et gagnez plus sans effort.',
          actionLabel: 'Activer',
          actionPath: '/admin/settings',
          priority: 3,
        });
      }

      return suggestions.sort((a, b) => a.priority - b.priority).slice(0, 3);
    },
    enabled: !!user,
    staleTime: 300_000,
  });
}
