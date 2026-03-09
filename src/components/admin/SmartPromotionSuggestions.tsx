import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useOrg } from '@/contexts/OrgContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingDown, Zap, Tag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
        actionKey: string;
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
            issueKey: 'promo.no_cover', actionKey: 'promo.add_cover',
            actionUrl: `/admin/products/${p.id}`, emoji: '🖼️',
          });
        } else if (sales === 0 && !hasDescription) {
          result.push({
            id: p.id, title: p.title, price: p.price || 0, currency: p.currency || 'XOF', sales: 0,
            issueKey: 'promo.short_desc', actionKey: 'promo.improve_desc',
            actionUrl: `/admin/products/${p.id}`, emoji: '✍️',
          });
        } else if (sales === 0 && hasCover && hasDescription) {
          result.push({
            id: p.id, title: p.title, price: p.price || 0, currency: p.currency || 'XOF', sales: 0,
            issueKey: 'promo.zero_sales', actionKey: 'promo.create_code',
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
    <Card className="border-amber-500/20 bg-amber-500/5">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm flex items-center gap-2">
          <Zap className="h-4 w-4 text-amber-500" />
          {t('promo.suggestions_title')}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {suggestions.map((s, i) => (
          <motion.div
            key={s.id}
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="flex items-start gap-3 p-3 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors cursor-pointer group"
            onClick={() => navigate(s.actionUrl)}
          >
            <span className="text-lg shrink-0">{s.emoji}</span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-semibold truncate">{s.title}</p>
              <p className="text-[10px] text-muted-foreground mt-0.5">{t(s.issueKey)}</p>
            </div>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              {t(s.actionKey)} <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}
