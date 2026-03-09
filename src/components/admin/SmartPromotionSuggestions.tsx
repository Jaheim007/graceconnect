import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useOrg } from '@/contexts/OrgContext';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { TrendingDown, Zap, Tag, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { formatCurrency } from '@/lib/currency';

/**
 * SmartPromotionSuggestions — Detects high-traffic/low-conversion products
 * and suggests creators create promotions or improve descriptions.
 */
export function SmartPromotionSuggestions() {
  const { currentOrg } = useOrg();
  const navigate = useNavigate();
  const orgId = currentOrg?.id;

  const { data: suggestions = [] } = useQuery({
    queryKey: ['smart-promo-suggestions', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      // Get published products with their stats
      const { data: products } = await db
        .from('digital_products')
        .select('id, title, price, currency, sales_count, cover_image_url, description, slug')
        .eq('organization_id', orgId)
        .eq('is_published', true);

      if (!products || products.length === 0) return [];

      // Get view counts from client_events for these products
      const result: Array<{
        id: string;
        title: string;
        price: number;
        currency: string;
        sales: number;
        issue: string;
        action: string;
        actionUrl: string;
        emoji: string;
      }> = [];

      for (const p of products) {
        const sales = p.sales_count || 0;
        const hasDescription = p.description && p.description.length > 100;
        const hasCover = !!p.cover_image_url;

        // Product published but 0 sales
        if (sales === 0 && !p.cover_image_url) {
          result.push({
            id: p.id,
            title: p.title,
            price: p.price || 0,
            currency: p.currency || 'XOF',
            sales: 0,
            issue: 'Pas d\'image de couverture — les produits avec couverture convertissent 3× plus.',
            action: 'Ajouter une couverture',
            actionUrl: `/admin/products/${p.id}`,
            emoji: '🖼️',
          });
        } else if (sales === 0 && !hasDescription) {
          result.push({
            id: p.id,
            title: p.title,
            price: p.price || 0,
            currency: p.currency || 'XOF',
            sales: 0,
            issue: 'Description trop courte — ajoutez au moins 100 caractères.',
            action: 'Améliorer la description',
            actionUrl: `/admin/products/${p.id}`,
            emoji: '✍️',
          });
        } else if (sales === 0 && hasCover && hasDescription) {
          result.push({
            id: p.id,
            title: p.title,
            price: p.price || 0,
            currency: p.currency || 'XOF',
            sales: 0,
            issue: 'Produit complet mais 0 vente — créez un code promo pour booster le lancement.',
            action: 'Créer un code promo',
            actionUrl: '/admin/promo-codes',
            emoji: '🏷️',
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
          Suggestions de promotion
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
              <p className="text-[10px] text-muted-foreground mt-0.5">{s.issue}</p>
            </div>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
              {s.action} <ArrowRight className="h-3 w-3 ml-1" />
            </Button>
          </motion.div>
        ))}
      </CardContent>
    </Card>
  );
}
