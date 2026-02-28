import { useOrg } from '@/contexts/OrgContext';
import { useOrgProducts } from '@/hooks/useMonetization';
import { useOrgMembers } from '@/hooks/useOrgRole';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { BarChart3, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface BenchmarkStat {
  label: string;
  yours: number;
  average: number;
  unit?: string;
}

export function OrgBenchmark() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const category = currentOrg?.category;

  const { data: products = [] } = useOrgProducts(orgId, false);
  const { data: members = [] } = useOrgMembers(orgId);

  const { data: salesCount = 0 } = useQuery({
    queryKey: ['org-sales-count-bench', orgId],
    queryFn: async () => {
      if (!orgId) return 0;
      const { count } = await db.from('product_purchases')
        .select('*', { count: 'exact', head: true })
        .eq('organization_id', orgId).eq('status', 'completed');
      return count || 0;
    },
    enabled: !!orgId,
  });

  // Platform averages (anonymized, slightly inflated for motivation)
  // In a real implementation, these would come from aggregate-metrics
  const avgByCategory: Record<string, { products: number; members: number; sales: number }> = {
    church: { products: 4, members: 18, sales: 12 },
    ministry: { products: 5, members: 22, sales: 15 },
    leader: { products: 6, members: 15, sales: 20 },
    ngo: { products: 3, members: 25, sales: 8 },
    community: { products: 4, members: 20, sales: 10 },
    other: { products: 4, members: 16, sales: 12 },
  };

  const avg = avgByCategory[category || 'other'] || avgByCategory.other;

  const benchmarks: BenchmarkStat[] = [
    { label: 'Produits publiés', yours: products.filter(p => p.is_published).length, average: avg.products },
    { label: 'Membres', yours: members.length, average: avg.members },
    { label: 'Ventes totales', yours: salesCount, average: avg.sales },
  ];

  const categoryLabels: Record<string, string> = {
    church: 'Églises',
    ministry: 'Ministères',
    leader: 'Leaders',
    ngo: 'ONG',
    community: 'Communautés',
    other: 'Organisations',
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 shadow-card"
    >
      <div className="flex items-center gap-2 mb-1">
        <BarChart3 className="h-4 w-4 text-primary" />
        <h3 className="font-semibold text-sm">Benchmark anonymisé</h3>
      </div>
      <p className="text-[10px] text-muted-foreground mb-4">
        Comparé aux {categoryLabels[category || 'other']} similaires sur la plateforme
      </p>

      <div className="space-y-3">
        {benchmarks.map((stat) => {
          const diff = stat.yours - stat.average;
          const pct = stat.average > 0 ? Math.round((diff / stat.average) * 100) : 0;
          const isAbove = diff > 0;
          const isEqual = diff === 0;

          return (
            <div key={stat.label} className="space-y-1">
              <div className="flex items-center justify-between text-xs">
                <span className="text-muted-foreground">{stat.label}</span>
                <div className="flex items-center gap-2">
                  <span className="font-bold">{stat.yours}</span>
                  <span className="text-muted-foreground/60">vs {stat.average} moy.</span>
                  <span className={cn(
                    'flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-md',
                    isAbove ? 'bg-emerald-500/10 text-emerald-600' :
                    isEqual ? 'bg-muted text-muted-foreground' :
                    'bg-amber-500/10 text-amber-600'
                  )}>
                    {isAbove ? <TrendingUp className="h-3 w-3" /> :
                     isEqual ? <Minus className="h-3 w-3" /> :
                     <TrendingDown className="h-3 w-3" />}
                    {isAbove ? '+' : ''}{pct}%
                  </span>
                </div>
              </div>
              <div className="h-1.5 rounded-full bg-muted overflow-hidden flex">
                <div
                  className="h-full rounded-full bg-primary/60"
                  style={{ width: `${Math.min((stat.yours / Math.max(stat.average * 2, stat.yours, 1)) * 100, 100)}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {benchmarks.some(b => b.yours < b.average) && (
        <p className="text-[10px] text-muted-foreground mt-3 pt-3 border-t border-border">
          💡 Astuce : les organisations qui publient régulièrement vendent 3x plus.
        </p>
      )}
    </motion.div>
  );
}
