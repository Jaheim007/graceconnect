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
          <DialogTitle>{fr ? 'Où ajouter cette activité ?' : 'Where should we add this activity?'}</DialogTitle>
          <DialogDescription>
            {fr
              ? 'Vous pouvez enrichir votre espace actuel ou créer un nouvel espace dédié.'
              : 'You can extend your current workspace or create a dedicated new one.'}
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
                ? 'Nous activons uniquement les nouvelles fonctionnalités. Votre type et vos données restent inchangés.'
                : 'We only enable the new features. Your type and data stay the same.'}
            </p>
          </button>
          <button
            onClick={onCreateNew}
            disabled={loading}
            className="text-left rounded-xl border p-4 hover:border-primary/50 transition-all disabled:opacity-50"
          >
            <div className="flex items-center gap-2 font-semibold text-sm">
              <Plus className="h-4 w-4 text-primary" />
              {fr ? 'Créer un nouvel espace' : 'Create a new workspace'}
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {fr
                ? 'Une page publique dédiée pour cette nouvelle activité.'
                : 'A dedicated public page for this new activity.'}
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
