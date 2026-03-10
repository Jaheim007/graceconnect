import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useOrg } from '@/contexts/OrgContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatCurrency } from '@/lib/currency';
import { useI18n } from '@/i18n/I18nContext';

export function SmartPromotionSuggestions() {
  const { currentOrg } = useOrg();
  const navigate = useNavigate();
  const { t } = useI18n();
  const orgId = currentOrg?.id;

  const { data: suggestions = [] } = useQuery({
    queryKey: ['smart-promo-suggestions', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data: products } = await db
        .from('digital_products')
        .select('id, title, price, currency, sales_count, cover_image_url, description, slug')
        .eq('organization_id', orgId)
        .eq('is_published', true);

      if (!products || products.length === 0) return [];

      const result: Array<{
        id: string;
        title: string;
        price: number;
        currency: string;
        sales: number;
        issueKey: string;
        issueText: string;
        actionKey: string;
        actionText: string;
        actionUrl: string;
        emoji: string;
      }> = [];

      for (const p of products) {
        const sales = p.sales_count || 0;
        const hasDescription = p.description && p.description.length > 100;
        const hasCover = !!p.cover_image_url;

        if (sales === 0 && !p.cover_image_url) {
          result.push({
            id: p.id, title: p.title, price: p.price || 0, currency: p.currency || 'XOF', sales: 0,
            issueKey: 'promo.no_cover',
            issueText: 'Pas de couverture — les produits avec image se vendent 3x mieux.',
            actionKey: 'promo.add_cover',
            actionText: 'Ajouter une couverture',
            actionUrl: `/admin/products/${p.id}`, emoji: '🖼️',
          });
        } else if (sales === 0 && !hasDescription) {
          result.push({
            id: p.id, title: p.title, price: p.price || 0, currency: p.currency || 'XOF', sales: 0,
            issueKey: 'promo.short_desc',
            issueText: 'Description trop courte — ajoutez des bénéfices pour convaincre.',
            actionKey: 'promo.improve_desc',
            actionText: 'Améliorer la description',
            actionUrl: `/admin/products/${p.id}`, emoji: '✍️',
          });
        } else if (sales === 0 && hasCover && hasDescription) {
          result.push({
            id: p.id, title: p.title, price: p.price || 0, currency: p.currency || 'XOF', sales: 0,
            issueKey: 'promo.zero_sales',
            issueText: 'Produit complet mais 0 vente — un code promo peut booster le lancement.',
            actionKey: 'promo.create_code',
            actionText: 'Créer un code promo',
            actionUrl: '/admin/promo-codes', emoji: '🏷️',
          });
        }
      }

      return result.slice(0, 3);
    },
    enabled: !!orgId,
    staleTime: 120_000,
  });

  if (suggestions.length === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-amber-500/20 rounded-2xl p-5 space-y-3"
    >
      <div className="flex items-center gap-2 mb-1">
        <Zap className="h-4 w-4 text-amber-500" />
        <h2 className="font-semibold text-sm">{t('promo.suggestions_title')}</h2>
      </div>

      <div className="space-y-2">
        {suggestions.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-xl border border-border bg-muted/30 hover:bg-muted/50 transition-colors"
          >
            <span className="text-xl shrink-0">{s.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold">{s.title}</p>
              <p className="text-[11px] text-muted-foreground mt-0.5 leading-relaxed">
                {s.issueText}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              className="h-7 text-[11px] shrink-0 gap-1 border-amber-500/30 text-amber-600 dark:text-amber-400 hover:bg-amber-500/10"
              onClick={() => navigate(s.actionUrl)}
            >
              {s.actionText} <ArrowRight className="h-3 w-3" />
            </Button>
          </motion.div>
        ))}
      </div>
    </motion.div>
  );
}
