import { useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useI18n } from '@/i18n/I18nContext';

/**
 * Behavioral in-app notification triggers.
 * Runs once per session and creates smart notifications based on user/org state.
 * Anti-spam: only fires if same notification type hasn't been sent in the last N days.
 */
export function useBehavioralNotifications() {
  const { user } = useAuth();
  const { currentOrg, canManage } = useOrg();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const fired = useRef(false);
  const qc = useQueryClient();

  const orgId = currentOrg?.id;
  const isManager = orgId ? canManage(orgId) : false;

  const createNotif = useMutation({
    mutationFn: async ({ title, body, type }: { title: string; body: string; type: string }) => {
      if (!user?.id) return;
      // Anti-spam check: same type in last 3 days
      const threeDaysAgo = new Date(Date.now() - 3 * 86400000).toISOString();
      const { count } = await db.from('user_notifications')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('notification_type', type)
        .gte('created_at', threeDaysAgo);
      if ((count || 0) > 0) return; // Already sent recently

      await db.from('user_notifications').insert({
        user_id: user.id,
        organization_id: orgId || null,
        title,
        body,
        notification_type: type,
      });
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['notifications'] });
      qc.invalidateQueries({ queryKey: ['unread-count'] });
    },
  });

  // Fetch org state for triggering
  const { data: orgState } = useQuery({
    queryKey: ['behavioral-org-state', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const [products, sales, media, affiliates] = await Promise.all([
        db.from('digital_products').select('id, is_published, preview_images, description, sales_count', { count: 'exact' }).eq('organization_id', orgId),
        db.from('product_purchases').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('status', 'completed'),
        db.from('media_content').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
        db.from('affiliate_links').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).eq('is_active', true),
      ]);
      return {
        products: products.data || [],
        productCount: products.data?.length || 0,
        publishedProducts: (products.data || []).filter((p: any) => p.is_published).length,
        salesCount: sales.count || 0,
        mediaCount: media.count || 0,
        affiliateCount: affiliates.count || 0,
        hasLogo: !!currentOrg?.logo_url,
        hasBanner: !!currentOrg?.banner_url,
        kycStatus: currentOrg?.kyc_status,
        affiliationEnabled: currentOrg?.affiliation_enabled,
      };
    },
    enabled: !!orgId && isManager,
    staleTime: 300_000, // 5min
  });

  useEffect(() => {
    if (!user || !orgState || !isManager || fired.current) return;
    fired.current = true;

    const triggers = async () => {
      // 1. No logo → identity notification
      if (!orgState.hasLogo && !orgState.hasBanner) {
        createNotif.mutate({
          title: isFr ? '🎨 Ajoutez votre identité visuelle' : '🎨 Add your branding',
          body: isFr ? 'Les organisations avec un logo reçoivent 3x plus de visites. Ajoutez le vôtre dans les paramètres.' : 'Organizations with a logo get 3x more visits. Add yours in settings.',
          type: 'activation_branding',
        });
      }

      // 2. Products with 0 sales → conversion help
      const zeroSaleProducts = orgState.products.filter((p: any) => p.is_published && (p.sales_count || 0) === 0);
      if (zeroSaleProducts.length > 0 && orgState.salesCount === 0) {
        createNotif.mutate({
          title: isFr ? '📦 Vos produits attendent leur première vente' : '📦 Your products are waiting for their first sale',
          body: isFr ? `${zeroSaleProducts.length} produit(s) publié(s) mais 0 vente. Partagez-les sur WhatsApp ou activez les ambassadeurs !` : `${zeroSaleProducts.length} published product(s) but 0 sales. Share them on WhatsApp or activate ambassadors!`,
          type: 'conversion_help',
        });
      }

      // 3. Products without preview images → optimization
      const noPreviewProducts = orgState.products.filter((p: any) => p.is_published && (!p.preview_images || p.preview_images.length === 0));
      if (noPreviewProducts.length > 0) {
        createNotif.mutate({
          title: isFr ? '🖼️ Ajoutez des images de preview' : '🖼️ Add preview images',
          body: isFr ? `${noPreviewProducts.length} produit(s) sans images de preview. Les produits avec images se vendent 30% mieux.` : `${noPreviewProducts.length} product(s) without preview images. Products with images sell 30% better.`,
          type: 'product_optimization',
        });
      }

      // 4. Products with short descriptions → optimization
      const shortDescProducts = orgState.products.filter((p: any) => p.is_published && (p.description?.length || 0) < 50);
      if (shortDescProducts.length > 0) {
        createNotif.mutate({
          title: isFr ? '✍️ Enrichissez vos descriptions' : '✍️ Enrich your descriptions',
          body: isFr ? `${shortDescProducts.length} produit(s) avec une description courte. Détaillez les bénéfices pour convaincre.` : `${shortDescProducts.length} product(s) with short descriptions. Detail the benefits to convince buyers.`,
          type: 'description_optimization',
        });
      }

      // 5. No affiliates but has products → ambassador nudge
      if (orgState.affiliateCount === 0 && orgState.publishedProducts > 0 && orgState.affiliationEnabled) {
        createNotif.mutate({
          title: isFr ? '🤝 Vos ambassadeurs vous attendent' : '🤝 Your ambassadors are waiting',
          body: isFr ? 'Vous avez des produits mais aucun ambassadeur actif. Partagez votre lien pour recruter des vendeurs.' : 'You have products but no active ambassadors. Share your link to recruit sellers.',
          type: 'ambassador_nudge',
        });
      }

      // 6. KYC needed but has sales
      if (orgState.salesCount > 0 && (orgState.kycStatus === 'none' || orgState.kycStatus === 'rejected')) {
        createNotif.mutate({
          title: isFr ? '⚠️ Vérification requise pour recevoir vos paiements' : '⚠️ Verification required to receive payments',
          body: isFr ? 'Vous avez des ventes ! Complétez votre vérification KYC pour pouvoir retirer vos fonds.' : 'You have sales! Complete your KYC verification to withdraw your funds.',
          type: 'kyc_urgency',
        });
      }

      // 7. 10+ sales milestone
      if (orgState.salesCount >= 10) {
        createNotif.mutate({
          title: '🎉 Félicitations — 10 ventes atteintes !',
          body: 'Votre organisation a franchi le cap des 10 ventes. Vous êtes sur la bonne voie !',
          type: 'milestone_10_sales',
        });
      }

      // 8. 0 media content → content nudge
      if (orgState.mediaCount === 0 && orgState.productCount > 0) {
        createNotif.mutate({
          title: '📹 Publiez du contenu pour attirer du trafic',
          body: 'Les organisations qui publient des vidéos/audios reçoivent 5x plus de visites que les pages produits seules.',
          type: 'content_nudge',
        });
      }

      // 9. "Dernière chance" for inactive ambassadors
      // Check if user has affiliate links but hasn't shared in a while
      if (user?.id) {
        const { data: myLinks } = await db
          .from('affiliate_links')
          .select('id, clicks, created_at')
          .eq('user_id', user.id)
          .eq('is_active', true)
          .limit(5);

        if (myLinks && myLinks.length > 0) {
          const hasLowActivity = myLinks.every((l: any) => (l.clicks || 0) < 3);
          if (hasLowActivity) {
            const futureDate = new Date(Date.now() + 48 * 3600000);
            const dateStr = futureDate.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' });
            createNotif.mutate({
              title: '⏳ Votre avantage ambassadeur est en pause',
              body: `Vos liens n'ont reçu aucun clic récemment. Partagez avant le ${dateStr} pour réactiver votre visibilité et ne pas manquer de commissions.`,
              type: 'ambassador_last_chance',
            });
          }
        }
      }
    };

    triggers();
  }, [orgState, user, isManager]);
}
