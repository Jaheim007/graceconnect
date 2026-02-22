import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { useState, useEffect } from 'react';
import { Settings, Save, Shield, Percent, Globe, AlertTriangle } from 'lucide-react';
import { motion } from 'framer-motion';

/**
 * Platform-wide settings managed via organizations table defaults.
 * Since there's no dedicated platform_settings table, this panel lets
 * the superadmin view/edit the default rates applied to new orgs
 * and bulk-update existing orgs.
 */
export default function SuperadminSettings() {
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: orgs = [] } = useQuery({
    queryKey: ['sa-orgs-settings'],
    queryFn: async () => {
      const { data } = await db.from('organizations').select('id, name, platform_fee_percent, affiliation_commission_percent, affiliation_enabled, monetization_enabled, currency');
      return data || [];
    },
  });

  const [defaultFee, setDefaultFee] = useState(10);
  const [defaultCommission, setDefaultCommission] = useState(10);
  const [defaultCurrency, setDefaultCurrency] = useState('XOF');

  useEffect(() => {
    if (orgs.length > 0) {
      // Use the most common values as "defaults"
      const fees = orgs.map((o: any) => o.platform_fee_percent || 10);
      const comms = orgs.map((o: any) => o.affiliation_commission_percent || 10);
      setDefaultFee(Math.round(fees.reduce((a: number, b: number) => a + b, 0) / fees.length));
      setDefaultCommission(Math.round(comms.reduce((a: number, b: number) => a + b, 0) / comms.length));
      const currencies = orgs.map((o: any) => o.currency || 'XOF');
      const currencyCount: Record<string, number> = {};
      currencies.forEach((c: string) => { currencyCount[c] = (currencyCount[c] || 0) + 1; });
      setDefaultCurrency(Object.entries(currencyCount).sort((a, b) => b[1] - a[1])[0]?.[0] || 'XOF');
    }
  }, [orgs]);

  const bulkUpdateMutation = useMutation({
    mutationFn: async () => {
      // Update all orgs with new defaults
      const { error } = await db.from('organizations').update({
        platform_fee_percent: defaultFee,
        affiliation_commission_percent: defaultCommission,
      }).gte('created_at', '2000-01-01'); // match all
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-orgs-settings'] });
      toast({ title: 'Paramètres appliqués à toutes les organisations ✅' });
    },
    onError: () => toast({ title: 'Erreur lors de la mise à jour', variant: 'destructive' }),
  });

  // Stats
  const monetizationEnabled = orgs.filter((o: any) => o.monetization_enabled).length;
  const affiliationEnabled = orgs.filter((o: any) => o.affiliation_enabled).length;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">Paramètres Plateforme</h1>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-5 space-y-5">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <Percent className="h-4 w-4 text-primary" /> Taux & Commissions
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">Commission plateforme (%)</Label>
            <Input type="number" min={0} max={50} value={defaultFee}
              onChange={e => setDefaultFee(Number(e.target.value))} />
            <p className="text-[10px] text-muted-foreground">Frais prélevés sur chaque transaction</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">Commission affiliation (%)</Label>
            <Input type="number" min={0} max={50} value={defaultCommission}
              onChange={e => setDefaultCommission(Number(e.target.value))} />
            <p className="text-[10px] text-muted-foreground">Commission versée aux affiliés</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">Devise par défaut</Label>
          <Input value={defaultCurrency} onChange={e => setDefaultCurrency(e.target.value)} maxLength={5} className="w-32" />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            <p className="text-xs font-medium">Appliquer à toutes les organisations</p>
            <p className="text-[10px] text-muted-foreground">Met à jour les taux de {orgs.length} organisations</p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => bulkUpdateMutation.mutate()}
            disabled={bulkUpdateMutation.isPending}>
            <Save className="h-3.5 w-3.5" />
            {bulkUpdateMutation.isPending ? 'Application...' : 'Appliquer'}
          </Button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" /> État de la plateforme
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-muted/30">
            <p className="text-lg font-bold">{orgs.length}</p>
            <p className="text-[10px] text-muted-foreground">Organisations total</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/30">
            <p className="text-lg font-bold">{monetizationEnabled}</p>
            <p className="text-[10px] text-muted-foreground">Monétisation activée</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/30">
            <p className="text-lg font-bold">{affiliationEnabled}</p>
            <p className="text-[10px] text-muted-foreground">Affiliation activée</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/30">
            <p className="text-lg font-bold">{defaultFee}%</p>
            <p className="text-[10px] text-muted-foreground">Taux moyen plateforme</p>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-destructive/5 border border-destructive/20 rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold text-sm flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-4 w-4" /> Zone dangereuse
        </h2>
        <p className="text-xs text-muted-foreground">
          Les modifications ici affectent immédiatement toutes les organisations de la plateforme.
          Procédez avec prudence.
        </p>
      </motion.div>
    </div>
  );
}
