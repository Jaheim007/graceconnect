import { ArrowLeft, Rocket, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { useI18n } from '@/i18n/I18nContext';
import type { WriteState } from '../WriteWizard';

interface Props {
  state: WriteState;
  update: (patch: Partial<WriteState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function StepPricing({ state, update, onNext, onBack }: Props) {
  const { t } = useI18n();
  const platformFee = Math.round(state.price * 0.10);
  const ambassadorFee = Math.round(state.price * state.commissionRate / 100);
  const creatorEarns = state.price - platformFee - ambassadorFee;

  return (
    <div className="space-y-8 pt-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold">{t('write.set_price')}</h2>
        <p className="text-muted-foreground text-sm">{t('write.set_price_sub')}</p>
      </div>

      {/* Free toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
        <div>
          <p className="font-bold text-sm">{t('write.free_for_email')}</p>
          <p className="text-xs text-muted-foreground">{t('write.free_for_email_desc')}</p>
        </div>
        <Switch
          checked={state.isFree}
          onCheckedChange={v => update({ isFree: v })}
        />
      </div>

      {!state.isFree && (
        <>
          {/* Price slider */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              {t('write.price_label')} : <span className="text-primary font-bold">{state.price.toLocaleString('fr-FR')} FCFA</span>
            </label>
            <Slider
              value={[state.price]}
              onValueChange={([v]) => update({ price: v })}
              min={500}
              max={25000}
              step={500}
            />
            <div className="flex justify-between text-[10px] text-muted-foreground">
              <span>500 FCFA</span>
              <span>25 000 FCFA</span>
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
                <p className="text-xl font-extrabold text-primary">{creatorEarns.toLocaleString('fr-FR')}</p>
                <p className="text-[10px] text-muted-foreground">{t('write.you_keep')} (FCFA)</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-emerald-500">{ambassadorFee.toLocaleString('fr-FR')}</p>
                <p className="text-[10px] text-muted-foreground">{t('write.ambassador')}</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-muted-foreground">{platformFee.toLocaleString('fr-FR')}</p>
                <p className="text-[10px] text-muted-foreground">{t('write.platform_fee')}</p>
              </div>
            </div>
            <p className="text-xs text-muted-foreground text-center mt-3">
              {t('write.simulation')} <strong className="text-foreground">{(creatorEarns * 50).toLocaleString('fr-FR')} FCFA</strong> {t('write.simulation_suffix')}
            </p>
          </div>
        </>
      )}

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
          {t('write.publish')}
        </Button>
      </div>
    </div>
  );
}
