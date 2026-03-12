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
import { useI18n } from '@/i18n/I18nContext';

export default function SuperadminSettings() {
  const { toast } = useToast();
  const qc = useQueryClient();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

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
      const { error } = await db.from('organizations').update({
        platform_fee_percent: defaultFee,
        affiliation_commission_percent: defaultCommission,
      }).gte('created_at', '2000-01-01');
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sa-orgs-settings'] });
      toast({ title: isFr ? 'Paramètres appliqués à toutes les organisations ✅' : 'Settings applied to all organizations ✅' });
    },
    onError: () => toast({ title: isFr ? 'Erreur lors de la mise à jour' : 'Update error', variant: 'destructive' }),
  });

  const monetizationEnabled = orgs.filter((o: any) => o.monetization_enabled).length;
  const affiliationEnabled = orgs.filter((o: any) => o.affiliation_enabled).length;

  return (
    <div className="space-y-6 max-w-2xl">
      <div className="flex items-center gap-2">
        <Settings className="h-5 w-5 text-primary" />
        <h1 className="text-xl font-bold">{isFr ? 'Paramètres Plateforme' : 'Platform Settings'}</h1>
      </div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
        className="bg-card border border-border rounded-2xl p-5 space-y-5">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <Percent className="h-4 w-4 text-primary" /> {isFr ? 'Taux & Commissions' : 'Rates & Commissions'}
        </h2>

        <div className="grid sm:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label className="text-xs">{isFr ? 'Commission plateforme (%)' : 'Platform fee (%)'}</Label>
            <Input type="number" min={0} max={50} value={defaultFee}
              onChange={e => setDefaultFee(Number(e.target.value))} />
            <p className="text-[10px] text-muted-foreground">{isFr ? 'Frais prélevés sur chaque transaction' : 'Fee charged on each transaction'}</p>
          </div>
          <div className="space-y-2">
            <Label className="text-xs">{isFr ? 'Commission affiliation (%)' : 'Affiliate commission (%)'}</Label>
            <Input type="number" min={0} max={50} value={defaultCommission}
              onChange={e => setDefaultCommission(Number(e.target.value))} />
            <p className="text-[10px] text-muted-foreground">{isFr ? 'Commission versée aux affiliés' : 'Commission paid to affiliates'}</p>
          </div>
        </div>

        <div className="space-y-2">
          <Label className="text-xs">{isFr ? 'Devise par défaut' : 'Default currency'}</Label>
          <Input value={defaultCurrency} onChange={e => setDefaultCurrency(e.target.value)} maxLength={5} className="w-32" />
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border">
          <div>
            <p className="text-xs font-medium">{isFr ? 'Appliquer à toutes les organisations' : 'Apply to all organizations'}</p>
            <p className="text-[10px] text-muted-foreground">{isFr ? `Met à jour les taux de ${orgs.length} organisations` : `Updates rates for ${orgs.length} organizations`}</p>
          </div>
          <Button size="sm" className="gap-1.5" onClick={() => bulkUpdateMutation.mutate()}
            disabled={bulkUpdateMutation.isPending}>
            <Save className="h-3.5 w-3.5" />
            {bulkUpdateMutation.isPending ? (isFr ? 'Application...' : 'Applying...') : (isFr ? 'Appliquer' : 'Apply')}
          </Button>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
        className="bg-card border border-border rounded-2xl p-5 space-y-4">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <Globe className="h-4 w-4 text-primary" /> {isFr ? 'État de la plateforme' : 'Platform Status'}
        </h2>
        <div className="grid grid-cols-2 gap-3">
          <div className="p-3 rounded-xl bg-muted/30">
            <p className="text-lg font-bold">{orgs.length}</p>
            <p className="text-[10px] text-muted-foreground">{isFr ? 'Organisations total' : 'Total organizations'}</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/30">
            <p className="text-lg font-bold">{monetizationEnabled}</p>
            <p className="text-[10px] text-muted-foreground">{isFr ? 'Monétisation activée' : 'Monetization enabled'}</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/30">
            <p className="text-lg font-bold">{affiliationEnabled}</p>
            <p className="text-[10px] text-muted-foreground">{isFr ? 'Affiliation activée' : 'Affiliation enabled'}</p>
          </div>
          <div className="p-3 rounded-xl bg-muted/30">
            <p className="text-lg font-bold">{defaultFee}%</p>
            <p className="text-[10px] text-muted-foreground">{isFr ? 'Taux moyen plateforme' : 'Avg. platform rate'}</p>
          </div>
        </div>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
        className="bg-destructive/5 border border-destructive/20 rounded-2xl p-5 space-y-3">
        <h2 className="font-semibold text-sm flex items-center gap-2 text-destructive">
          <AlertTriangle className="h-4 w-4" /> {isFr ? 'Zone dangereuse' : 'Danger zone'}
        </h2>
        <p className="text-xs text-muted-foreground">
          {isFr
            ? 'Les modifications ici affectent immédiatement toutes les organisations de la plateforme. Procédez avec prudence.'
            : 'Changes here immediately affect all organizations on the platform. Proceed with caution.'}
        </p>
      </motion.div>
    </div>
  );
}
