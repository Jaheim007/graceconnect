import { ArrowLeft, Rocket, Upload, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import type { MigrateState } from '../MigrateWizard';

interface Props {
  state: MigrateState;
  update: (patch: Partial<MigrateState>) => void;
  onNext: () => void;
  onBack: () => void;
}

export function MigrateConfig({ state, update, onNext, onBack }: Props) {
  const platformFee = Math.round(state.price * 0.10);
  const ambassadorFee = Math.round(state.price * state.commissionRate / 100);
  const creatorEarns = state.price - platformFee - ambassadorFee;

  return (
    <div className="space-y-6 pt-8">
      <div className="text-center space-y-2">
        <h2 className="text-2xl sm:text-3xl font-extrabold">Configure ton produit</h2>
        <p className="text-muted-foreground text-sm">
          {state.files.length} fichier{state.files.length > 1 ? 's' : ''} importé{state.files.length > 1 ? 's' : ''}. Fixe ton prix et publie.
        </p>
      </div>

      {/* Title */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Titre</label>
        <Input
          value={state.title}
          onChange={e => update({ title: e.target.value })}
          placeholder="Le titre de ton produit"
          className="h-12 text-base"
        />
      </div>

      {/* Description */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Description <span className="text-muted-foreground">(optionnel)</span></label>
        <Textarea
          value={state.description}
          onChange={e => update({ description: e.target.value })}
          placeholder="Décris ton produit en quelques lignes…"
          className="min-h-[80px] resize-none"
        />
      </div>

      {/* Cover upload */}
      <div className="space-y-2">
        <label className="text-sm font-medium">Couverture</label>
        <label className="flex items-center gap-3 p-3 rounded-xl border border-dashed border-border cursor-pointer hover:border-primary/40 hover:bg-primary/5 transition-colors">
          <Upload className="h-5 w-5 text-muted-foreground" />
          <span className="text-sm text-muted-foreground">
            {state.coverFile ? state.coverFile.name : 'Upload une image de couverture'}
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => {
              const f = e.target.files?.[0];
              if (f) update({ coverFile: f });
            }}
          />
        </label>
      </div>

      {/* Free toggle */}
      <div className="flex items-center justify-between p-4 rounded-xl border border-border bg-card">
        <div>
          <p className="font-bold text-sm">Gratuit contre email</p>
          <p className="text-xs text-muted-foreground">Les lecteurs laissent leur email</p>
        </div>
        <Switch checked={state.isFree} onCheckedChange={v => update({ isFree: v })} />
      </div>

      {!state.isFree && (
        <>
          {/* Price */}
          <div className="space-y-3">
            <label className="text-sm font-medium">
              Prix : <span className="text-primary font-bold">{state.price.toLocaleString('fr-FR')} FCFA</span>
            </label>
            <Slider
              value={[state.price]}
              onValueChange={([v]) => update({ price: v })}
              min={500}
              max={50000}
              step={500}
            />
          </div>

          {/* Commission */}
          <div className="space-y-3">
            <label className="text-sm font-medium flex items-center gap-2">
              <Users className="h-4 w-4 text-emerald-500" />
              Commission ambassadeur : <span className="text-emerald-500 font-bold">{state.commissionRate}%</span>
            </label>
            <Slider
              value={[state.commissionRate]}
              onValueChange={([v]) => update({ commissionRate: v })}
              min={5}
              max={50}
              step={5}
            />
          </div>

          {/* Revenue breakdown */}
          <div className="rounded-xl border border-border bg-muted/30 p-4">
            <div className="grid grid-cols-3 gap-3 text-center">
              <div>
                <p className="text-xl font-extrabold text-primary">{creatorEarns.toLocaleString('fr-FR')}</p>
                <p className="text-[10px] text-muted-foreground">Tu gardes</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-emerald-500">{ambassadorFee.toLocaleString('fr-FR')}</p>
                <p className="text-[10px] text-muted-foreground">Ambassadeur</p>
              </div>
              <div>
                <p className="text-xl font-extrabold text-muted-foreground">{platformFee.toLocaleString('fr-FR')}</p>
                <p className="text-[10px] text-muted-foreground">SiteViral</p>
              </div>
            </div>
          </div>
        </>
      )}

      {/* Actions */}
      <div className="flex gap-3 pt-2">
        <Button variant="outline" size="lg" onClick={onBack} className="gap-2">
          <ArrowLeft className="h-4 w-4" /> Retour
        </Button>
        <Button
          size="lg"
          className="flex-1 h-14 text-base gap-2 cta-glow"
          disabled={!state.title.trim()}
          onClick={onNext}
        >
          <Rocket className="h-5 w-5" /> PUBLIER 🚀
        </Button>
      </div>
    </div>
  );
}
