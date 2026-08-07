import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';
import { Plus, Layers } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  currentOrgName?: string;
  onAddToCurrent: () => void;
  onCreateNew: () => void;
  loading?: boolean;
}

export function AddOrNewWorkspaceDialog({ open, onOpenChange, currentOrgName, onAddToCurrent, onCreateNew, loading }: Props) {
  const { locale } = useI18n();
  const fr = locale === 'fr';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{fr ? 'Ajouter à cet espace ou créer une nouvelle page ?' : 'Add to this workspace or create a new page?'}</DialogTitle>
          <DialogDescription>
            {fr
              ? 'Vous n’avez pas besoin d’un autre compte. Choisissez si cette activité appartient à l’espace actuel ou mérite sa propre page.'
              : 'You do not need another account. Choose whether this activity belongs to the current workspace or needs its own page.'}
          </DialogDescription>
        </DialogHeader>
        <div className="grid gap-2">
          <button
            onClick={onAddToCurrent}
            disabled={loading}
            className="text-left rounded-xl border p-4 hover:border-primary/50 transition-all disabled:opacity-50"
          >
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Layers className="h-4 w-4 text-primary" />
              {fr ? 'Ajouter à mon espace actuel' : 'Add to my current workspace'}
              {currentOrgName && <span className="text-muted-foreground font-normal">· {currentOrgName}</span>}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {fr
                ? 'Nous fusionnons seulement les fonctionnalités choisies. Le type principal et les données de cet espace ne changent pas.'
                : 'We only merge the selected features. This workspace’s main type and data do not change.'}
            </p>
          </button>
          <button
            onClick={onCreateNew}
            disabled={loading}
            className="text-left rounded-xl border p-4 hover:border-primary/50 transition-all disabled:opacity-50"
          >
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Plus className="h-4 w-4 text-primary" />
              {fr ? 'Créer une plateforme' : 'Create a platform'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {fr
                ? 'Une page séparée dans le même compte, avec son propre type et ses propres fonctionnalités.'
                : 'A separate page inside the same account, with its own type and features.'}
            </p>
          </button>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            {fr ? 'Annuler' : 'Cancel'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
