import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion, AnimatePresence } from 'framer-motion';
import { Lightbulb, Image, FileText, Share2, Star, TrendingUp, ArrowRight, Zap, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@/lib/router-compat';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

interface CoachTip {
  id: string;
  title: string;
  description: string;
  action: string;
  route: string;
  icon: typeof Lightbulb;
  color: string;
  impact: string;
}

export function CreatorCoachBanner() {
  const { currentOrg } = useOrg();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const { data: insights } = useQuery({
    queryKey: ['creator-coach', currentOrg?.id],
    queryFn: async () => {
      if (!currentOrg?.id) return null;

      const [productsRes, mediaRes, membersRes, salesRes] = await Promise.all([
        db.from('digital_products').select('id, title, cover_image_url, description, sales_count, average_rating, price', { count: 'exact' })
          .eq('organization_id', currentOrg.id).eq('is_published', true),
        db.from('media_content').select('id', { count: 'exact', head: true })
          .eq('organization_id', currentOrg.id).eq('is_published', true),
        db.from('organization_members').select('id', { count: 'exact', head: true })
          .eq('organization_id', currentOrg.id),
        db.from('product_purchases').select('id', { count: 'exact', head: true })
          .eq('organization_id', currentOrg.id).eq('status', 'completed'),
      ]);

      const products = productsRes.data || [];
      const productCount = productsRes.count || 0;
      const mediaCount = mediaRes.count || 0;
      const memberCount = membersRes.count || 0;
      const salesCount = salesRes.count || 0;

      const productsWithoutCover = products.filter(p => !p.cover_image_url);
      const productsWithoutDesc = products.filter(p => !p.description || p.description.length < 50);
      const productsNoSales = products.filter(p => (p.sales_count || 0) === 0);
      const productsNoRating = products.filter(p => !p.average_rating);
      const freeProducts = products.filter(p => !p.price || p.price === 0);

      return {
        productCount, mediaCount, memberCount, salesCount,
        productsWithoutCover: productsWithoutCover.length,
        productsWithoutDesc: productsWithoutDesc.length,
        productsNoSales: productsNoSales.length,
        productsNoRating: productsNoRating.length,
        freeProducts: freeProducts.length,
        hasLogo: !!currentOrg.logo_url,
        hasBanner: !!(currentOrg as any).banner_url,
        hasDescription: !!currentOrg.description && currentOrg.description.length > 30,
        affiliationEnabled: !!(currentOrg as any).affiliation_enabled,
      };
    },
    enabled: !!currentOrg?.id,
    staleTime: 5 * 60 * 1000,
  });

  if (!insights) return null;

  const tips: CoachTip[] = [];

  if (insights.productCount === 0) {
    tips.push({
      id: 'first-product',
      title: isFr ? 'Publiez votre premier produit' : 'Publish your first product',
      description: isFr ? 'Les organisations qui publient dans les premières 24h ont 5x plus de succès.' : 'Organizations that publish within 24h are 5x more successful.',
      action: isFr ? 'Créer un produit' : 'Create a product',
      route: '/admin/products/new',
      icon: FileText,
      color: 'text-emerald-500',
      impact: isFr ? '+500% chances de succès' : '+500% success rate',
    });
  }

  if (insights.productsWithoutCover > 0) {
    const n = insights.productsWithoutCover;
    tips.push({
      id: 'add-covers',
      title: isFr ? `${n} produit${n > 1 ? 's' : ''} sans image de couverture` : `${n} product${n > 1 ? 's' : ''} without cover image`,
      description: isFr ? 'Les produits avec une couverture professionnelle reçoivent 3x plus de clics.' : 'Products with a professional cover get 3x more clicks.',
      action: isFr ? 'Ajouter des couvertures' : 'Add covers',
      route: '/admin/products',
      icon: Image,
      color: 'text-violet-500',
      impact: '+200% clicks',
    });
  }

  if (insights.productsWithoutDesc > 0) {
    const n = insights.productsWithoutDesc;
    tips.push({
      id: 'add-descriptions',
      title: isFr ? `${n} produit${n > 1 ? 's' : ''} avec description trop courte` : `${n} product${n > 1 ? 's' : ''} with short description`,
      description: isFr ? 'Une description détaillée augmente la conversion de 40%.' : 'A detailed description increases conversion by 40%.',
      action: isFr ? 'Enrichir les descriptions' : 'Improve descriptions',
      route: '/admin/products',
      icon: FileText,
      color: 'text-blue-500',
      impact: '+40% conversion',
    });
  }

  if (insights.productsNoSales > 0 && insights.productCount > 0) {
    const n = insights.productsNoSales;
    tips.push({
      id: 'promote-products',
      title: isFr ? `${n} produit${n > 1 ? 's' : ''} sans aucune vente` : `${n} product${n > 1 ? 's' : ''} with no sales`,
      description: isFr ? 'Partagez-les sur WhatsApp et activez vos ambassadeurs pour booster les ventes.' : 'Share them on WhatsApp and activate your ambassadors to boost sales.',
      action: isFr ? 'Partager maintenant' : 'Share now',
      route: '/admin/products',
      icon: Share2,
      color: 'text-rose-500',
      impact: isFr ? 'Premières ventes' : 'First sales',
    });
  }

  if (!insights.affiliationEnabled && insights.productCount > 0) {
    tips.push({
      id: 'enable-affiliation',
      title: isFr ? 'Activez le programme ambassadeur' : 'Enable the ambassador program',
      description: isFr ? 'Chaque ambassadeur peut vendre pour vous et toucher des commissions automatiquement.' : 'Each ambassador can sell for you and earn commissions automatically.',
      action: isFr ? 'Activer' : 'Enable',
      route: '/admin/settings',
      icon: TrendingUp,
      color: 'text-amber-500',
      impact: isFr ? 'x8 ambassadeurs' : 'x8 ambassadors',
    });
  }

  if (!insights.hasLogo) {
    tips.push({
      id: 'add-logo',
      title: isFr ? 'Ajoutez votre logo' : 'Add your logo',
      description: isFr ? 'Un logo inspire confiance. Les organisations avec logo reçoivent 3x plus de visites.' : 'A logo builds trust. Organizations with a logo get 3x more visits.',
      action: isFr ? 'Ajouter un logo' : 'Add a logo',
      route: '/admin/settings',
      icon: Image,
      color: 'text-teal-500',
      impact: isFr ? '+200% visites' : '+200% visits',
    });
  }

  if (tips.length === 0) return null;

  const tip = tips[0];
  const TipIcon = tip.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/10 via-primary/5 to-transparent p-5"
    >
      <div className="absolute top-0 right-0 w-32 h-32 bg-primary/5 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
      
      <div className="relative flex items-start gap-4">
        <div className={cn(
          'h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 border',
          'bg-background/80 border-current/20',
          tip.color
        )}>
          <TipIcon className={cn('h-6 w-6', tip.color)} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <Lightbulb className="h-4 w-4 text-primary shrink-0" />
            <span className="text-[10px] font-semibold uppercase tracking-widest text-primary">
              {isFr ? 'Coach IA' : 'AI Coach'}
            </span>
            {tip.impact && (
              <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                {tip.impact}
              </span>
            )}
          </div>
          
          <h3 className="font-bold text-sm leading-snug">{tip.title}</h3>
          <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{tip.description}</p>
          
          <Button
            size="sm"
            className="mt-3 gap-1.5 h-8 text-xs"
            onClick={() => navigate(tip.route)}
          >
            <Target className="h-3.5 w-3.5" />
            {tip.action}
            <ArrowRight className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {tips.length > 1 && (
        <p className="text-[10px] text-muted-foreground mt-3 text-right">
          +{tips.length - 1} {isFr
            ? `autre${tips.length > 2 ? 's' : ''} recommandation${tips.length > 2 ? 's' : ''}`
            : `more recommendation${tips.length > 2 ? 's' : ''}`}
        </p>
      )}
    </motion.div>
  );
}
