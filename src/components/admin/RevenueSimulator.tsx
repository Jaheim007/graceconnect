import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Slider } from '@/components/ui/slider';
import { Calculator, TrendingUp, Users, DollarSign } from 'lucide-react';
import { useOrg } from '@/contexts/OrgContext';
import { formatCurrency } from '@/lib/currency';
import { useI18n } from '@/i18n/I18nContext';

export function RevenueSimulator() {
  const { currentOrg } = useOrg();
  const { t } = useI18n();
  const [price, setPrice] = useState(5000);
  const [sales, setSales] = useState(50);

  const platformFee = currentOrg?.platform_fee_percent ?? 10;
  const affiliateRate = currentOrg?.affiliation_commission_percent ?? 10;
  const currency = currentOrg?.currency || 'XOF';

  const result = useMemo(() => {
    const gross = price * sales;
    const platformCut = gross * (platformFee / 100);
    const affiliateCut = gross * (affiliateRate / 100);
    const net = gross - platformCut - affiliateCut;
    return { gross, platformCut, affiliateCut, net };
  }, [price, sales, platformFee, affiliateRate]);

  const fmt = (n: number) => formatCurrency(n, currency);

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-card border border-border rounded-2xl p-5"
    >
      <div className="flex items-center gap-2 mb-5">
        <div className="h-8 w-8 rounded-xl bg-primary/10 flex items-center justify-center">
          <Calculator className="h-4 w-4 text-primary" />
        </div>
        <h2 className="font-semibold text-sm">{t('admin.revenue_simulator') || 'Simulateur de revenus'}</h2>
      </div>

      <div className="grid sm:grid-cols-2 gap-5 mb-5">
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground font-medium">Prix unitaire</label>
            <span className="text-sm font-bold text-foreground">{fmt(price)}</span>
          </div>
          <Slider
            value={[price]}
            onValueChange={([v]) => setPrice(v)}
            min={500}
            max={100000}
            step={500}
          />
        </div>
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs text-muted-foreground font-medium">Ventes / mois</label>
            <span className="text-sm font-bold text-foreground">{sales}</span>
          </div>
          <Slider
            value={[sales]}
            onValueChange={([v]) => setSales(v)}
            min={1}
            max={500}
            step={1}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-2">
        <ResultCard label="Revenus bruts" value={fmt(result.gross)} icon={DollarSign} className="bg-muted/50" />
        <ResultCard label={`Frais plateforme (${platformFee}%)`} value={`-${fmt(result.platformCut)}`} icon={DollarSign} className="bg-muted/50" />
        <ResultCard label={`Ambassadeurs (${affiliateRate}%)`} value={`-${fmt(result.affiliateCut)}`} icon={Users} className="bg-muted/50" />
        <ResultCard label="Vous recevez" value={fmt(result.net)} icon={TrendingUp} className="bg-primary/5 border-primary/20 border" highlight />
      </div>
    </motion.div>
  );
}

function ResultCard({ label, value, icon: Icon, className, highlight }: {
  label: string;
  value: string;
  icon: React.ElementType;
  className?: string;
  highlight?: boolean;
}) {
  return (
    <div className={`rounded-xl p-3 ${className}`}>
      <Icon className={`h-3.5 w-3.5 mb-2 ${highlight ? 'text-primary' : 'text-muted-foreground'}`} />
      <p className={`text-sm font-bold ${highlight ? 'text-primary' : ''}`}>{value}</p>
      <p className="text-[10px] text-muted-foreground mt-0.5">{label}</p>
    </div>
  );
}
