import { ArrowLeft, Rocket, Sparkles, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';

import { useI18n } from '@/i18n/I18nContext';
import { formatCurrency } from '@/lib/currency';
import type { WriteState } from '../WriteWizard';

interface Props {
  state: WriteState;
  update: (patch: Partial<WriteState>) => void;
  onNext: () => void;
  onBack: () => void;
  orgCurrency?: string | null;
}

/** Price ranges per currency for the write wizard */
const CURRENCY_RANGES: Record<string, { min: number; max: number; step: number }> = {
  XOF: { min: 500, max: 25000, step: 500 },
  XAF: { min: 500, max: 25000, step: 500 },
  NGN: { min: 500, max: 25000, step: 500 },
  USD: { min: 1, max: 50, step: 1 },
  EUR: { min: 1, max: 50, step: 1 },
  GBP: { min: 1, max: 40, step: 1 },
  GHS: { min: 5, max: 250, step: 5 },
  KES: { min: 100, max: 5000, step: 100 },
  ZAR: { min: 10, max: 500, step: 10 },
  MAD: { min: 10, max: 250, step: 10 },
  TND: { min: 3, max: 80, step: 1 },
};

export function StepPricing({ state, update, onNext, onBack, orgCurrency }: Props) {
  const { t } = useI18n();
  const currency = orgCurrency || 'XOF';
  const fmt = (amount: number) => formatCurrency(amount, currency);
  const range = CURRENCY_RANGES[currency] || CURRENCY_RANGES.USD;

  const effectivePrice = Math.max(range.min, Math.min(state.price, range.max));
  const platformFee = Math.round(effectivePrice * 0.10);
  const ambassadorFee = Math.round(effectivePrice * state.commissionRate / 100);
  const creatorEarns = effectivePrice - platformFee - ambassadorFee;

  return (
    <div className="space-y-8 pt-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold">{t('write.set_price')}</h2>
        <p className="text-muted-foreground text-sm">{t('write.set_price_sub')}</p>
      </div>

      {/* AI-generated products cannot be free — info banner */}
      <div className="flex items-center gap-3 p-4 rounded-xl border border-amber-500/30 bg-amber-500/5">
        <Sparkles className="h-5 w-5 text-amber-500 shrink-0" />
        <p className="text-xs text-muted-foreground">
          {t('write.ai_no_free') || 'Les contenus générés par IA ne peuvent pas être gratuits. Un prix minimum est requis.'}
        </p>
      </div>

      {/* Price input + slider */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              {t('write.price_label')}
            </label>
            <div className="flex items-center gap-3">
              <Input
                type="number"
                value={effectivePrice}
                onChange={e => {
                  const v = Number(e.target.value) || 0;
                  update({ price: Math.max(range.min, Math.min(v, range.max)) });
                }}
                min={range.min}
                max={range.max}
                step={range.step}
                className="h-10 w-32 text-center font-bold text-lg"
              />
              <span className="text-sm text-muted-foreground font-medium">{currency}</span>
            </div>
            <Slider
              value={[effectivePrice]}
              onValueChange={([v]) => update({ price: v })}
              min={range.min}
              max={range.max}
              step={range.step}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>{fmt(range.min)}</span>
              <span>{fmt(range.max)}</span>
            </div>
          </div>

          {/* Commission slider */}
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-500" />
              {t('write.commission_label')} : <span className="text-emerald-500 font-bold">{state.commissionRate}%</span>
            </label>
            <Slider
              value={[state.commissionRate]}
              onValueChange={([v]) => update({ commissionRate: v })}
              min={5}
              max={50}
              step={5}
            />
            <p className="text-[10px] text-muted-foreground">{t('write.commission_tip')}</p>
          </div>

          {/* Revenue breakdown */}
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-3">{t('write.per_sale')}</p>
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xl font-extrabold text-primary">{fmt(creatorEarns)}</p>
                <p className="text-[10px] text-muted-foreground">{t('write.you_keep')}</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-emerald-500">{fmt(ambassadorFee)}</p>
                <p className="text-[10px] text-muted-foreground">{t('write.ambassador')}</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-muted-foreground">{fmt(platformFee)}</p>
                <p className="text-[10px] text-muted-foreground">{t('write.platform_fee')}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              {t('write.simulation')} <strong className="text-foreground">{fmt(creatorEarns * 50)}</strong> {t('write.simulation_suffix')}
            </p>
          </div>
        

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="outline" size="lg" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> {t('write.back')}
        </Button>
        <Button
          size="lg"
          className="flex-1 h-14 text-base gap-2 cta-glow"
          onClick={onNext}
        >
          <Rocket className="h-5 w-5" />
          {t('write.continue')}
        </Button>
      </div>
    </div>
  );
}
