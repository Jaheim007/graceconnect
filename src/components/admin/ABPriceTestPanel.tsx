import { useState } from 'react';
import { useExperiment } from '@/hooks/useExperiment';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { formatCurrency } from '@/lib/currency';
import { motion } from 'framer-motion';
import { FlaskConical, TrendingUp, Eye, ShoppingCart, Percent } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface Props {
  productId: string;
  currentPrice: number;
}

export function ABPriceTestPanel({ productId, currentPrice }: Props) {
  const { currentOrg } = useOrg();
  const currency = currentOrg?.currency || 'XOF';
  const [testPrice, setTestPrice] = useState(Math.round(currentPrice * 1.2));
  const [isActive, setIsActive] = useState(false);

  // Check existing experiment
  const { data: experiment } = useQuery({
    queryKey: ['ab-experiment', productId],
    queryFn: async () => {
      const { data } = await db
        .from('experiments')
        .select('*')
        .eq('name', `price-test-${productId}`)
        .maybeSingle();
      return data;
    },
    enabled: !!productId,
  });

  const handleCreateExperiment = async () => {
    if (!currentOrg) return;
    try {
      const { error } = await db.from('experiments').upsert({
        name: `price-test-${productId}`,
        description: `A/B test prix: ${formatCurrency(currentPrice, currency)} vs ${formatCurrency(testPrice, currency)}`,
        is_active: true,
        traffic_percent: 50,
        variants: {
          control: { price: currentPrice, label: 'Prix actuel' },
          variant_b: { price: testPrice, label: 'Prix test' },
        },
        created_by: null,
      }, { onConflict: 'name' });

      if (error) throw error;
      setIsActive(true);
      toast.success('Test A/B activé !');
    } catch (err: any) {
      toast.error(err.message || 'Erreur');
    }
  };

  const handleStopExperiment = async () => {
    try {
      await db
        .from('experiments')
        .update({ is_active: false })
        .eq('name', `price-test-${productId}`);
      setIsActive(false);
      toast.success('Test arrêté');
    } catch {
      toast.error('Erreur');
    }
  };

  const active = experiment?.is_active || isActive;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5 shadow-card"
    >
      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-violet-500/10 flex items-center justify-center">
          <FlaskConical className="h-4 w-4 text-violet-500" />
        </div>
        <div className="flex-1">
          <h3 className="font-semibold text-sm">A/B Test de prix</h3>
          <p className="text-[10px] text-muted-foreground">Testez un prix différent sur 50% des visiteurs</p>
        </div>
        {active && <Badge variant="outline" className="text-emerald-500 border-emerald-500/30 text-[10px]">Actif</Badge>}
      </div>

      {!active ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label className="text-xs text-muted-foreground">Prix actuel (contrôle)</Label>
              <div className="font-semibold text-sm mt-1">{formatCurrency(currentPrice, currency)}</div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground" htmlFor="test-price">Prix test (variante B)</Label>
              <Input
                id="test-price"
                type="number"
                value={testPrice}
                onChange={(e) => setTestPrice(Number(e.target.value))}
                className="h-8 text-sm mt-1"
              />
            </div>
          </div>

          <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
            <Percent className="h-3 w-3" />
            50% des visiteurs verront chaque prix
          </div>

          <Button size="sm" className="w-full gap-1.5" onClick={handleCreateExperiment}>
            <FlaskConical className="h-3.5 w-3.5" />
            Lancer le test
          </Button>
        </div>
      ) : (
        <div className="space-y-3">
          {experiment?.variants && (
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(experiment.variants as Record<string, any>).map(([key, v]) => (
                <div key={key} className={cn(
                  'p-3 rounded-xl border text-center',
                  key === 'control' ? 'border-primary/20 bg-primary/5' : 'border-violet-500/20 bg-violet-500/5'
                )}>
                  <p className="text-[10px] text-muted-foreground mb-1">{v.label || key}</p>
                  <p className="font-bold text-sm">{formatCurrency(v.price, currency)}</p>
                </div>
              ))}
            </div>
          )}

          <Button variant="outline" size="sm" className="w-full" onClick={handleStopExperiment}>
            Arrêter le test
          </Button>
        </div>
      )}
    </motion.div>
  );
}
