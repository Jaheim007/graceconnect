import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { AlertTriangle, ArrowRight, RefreshCw, Type, X } from 'lucide-react';
import { CurrencyCode, formatCurrency } from '@/lib/currency';
import { convertCurrency } from '@/lib/currencyConvert';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

type ConvertOption = 'convert' | 'keep' | 'cancel';

interface CurrencyChangeWizardProps {
  open: boolean;
  fromCurrency: string;
  toCurrency: string;
  samplePrices: { title: string; price: number }[];
  onConfirm: (option: 'convert' | 'keep') => void;
  onCancel: () => void;
}

export function CurrencyChangeWizard({
  open, fromCurrency, toCurrency, samplePrices, onConfirm, onCancel,
}: CurrencyChangeWizardProps) {
  const [selected, setSelected] = useState<ConvertOption | null>(null);
  const [confirming, setConfirming] = useState(false);
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  const options: { key: ConvertOption; icon: typeof RefreshCw; label: string; desc: string; recommended?: boolean }[] = [
    {
      key: 'convert',
      icon: RefreshCw,
      label: isFr ? 'Convertir automatiquement' : 'Convert automatically',
      desc: isFr
        ? 'Tous les prix sont convertis selon le taux actuel. La valeur économique est préservée.'
        : 'All prices are converted at the current rate. Economic value is preserved.',
      recommended: true,
    },
    {
      key: 'keep',
      icon: Type,
      label: isFr ? 'Garder les valeurs numériques' : 'Keep numeric values',
      desc: isFr
        ? `Ex: 10 ${from} → 10 ${to}. Vous devrez ajuster manuellement.`
        : `E.g. 10 ${from} → 10 ${to}. You will need to adjust manually.`,
    },
    {
      key: 'cancel',
      icon: X,
      label: isFr ? 'Annuler' : 'Cancel',
      desc: isFr ? 'Aucun changement ne sera effectué.' : 'No changes will be made.',
    },
  ];

  const handleConfirm = () => {
    if (!selected) return;
    if (selected === 'cancel') { onCancel(); return; }
    setConfirming(true);
    onConfirm(selected);
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-amber-500" />
            {isFr ? 'Changement de devise' : 'Currency change'}
          </DialogTitle>
          <DialogDescription>
            {isFr
              ? `Vous changez de ${from} vers ${to}. Choisissez comment traiter vos prix existants.`
              : `You are changing from ${from} to ${to}. Choose how to handle your existing prices.`}
          </DialogDescription>
        </DialogHeader>

        {/* Preview */}
        {samplePrices.length > 0 && (
          <div className="bg-muted/50 rounded-xl p-3 space-y-1.5">
            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
              {isFr ? 'Aperçu de la conversion' : 'Conversion preview'}
            </p>
            {samplePrices.slice(0, 3).map((p, i) => {
              const converted = convertCurrency(p.price, from, to);
              return (
                <div key={i} className="flex items-center justify-between text-sm">
                  <span className="truncate flex-1 mr-2">{p.title}</span>
                  <span className="text-muted-foreground shrink-0">
                    {formatCurrency(p.price, from)}
                    <ArrowRight className="inline h-3 w-3 mx-1" />
                    <strong className="text-foreground">{converted !== null ? formatCurrency(converted, to) : '?'}</strong>
                  </span>
                </div>
              );
            })}
          </div>
        )}

        {/* Options */}
        <div className="space-y-2">
          {options.map(opt => (
            <button
              key={opt.key}
              type="button"
              onClick={() => setSelected(opt.key)}
              className={cn(
                'w-full flex items-start gap-3 p-3 rounded-xl border-2 text-left transition-all',
                selected === opt.key
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/40',
              )}
            >
              <opt.icon className="h-4 w-4 mt-0.5 shrink-0" />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="text-sm font-semibold">{opt.label}</p>
                  {opt.recommended && (
                    <span className="text-[9px] bg-primary/10 text-primary px-1.5 py-0.5 rounded-full font-medium">
                      {isFr ? 'Recommandé' : 'Recommended'}
                    </span>
                  )}
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{opt.desc}</p>
              </div>
            </button>
          ))}
        </div>

        <Button
          onClick={handleConfirm}
          disabled={!selected || confirming}
          className="w-full"
        >
          {confirming
            ? (isFr ? 'Application en cours…' : 'Applying…')
            : selected === 'cancel'
              ? (isFr ? 'Annuler le changement' : 'Cancel change')
              : (isFr ? 'Confirmer' : 'Confirm')}
        </Button>
      </DialogContent>
    </Dialog>
  );
}
