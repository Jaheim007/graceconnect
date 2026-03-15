import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { useI18n } from '@/i18n/I18nContext';
import { useOrg } from '@/contexts/OrgContext';
import { Loader2 } from 'lucide-react';

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: { title: string; description?: string; coverUrl?: string }) => Promise<void>;
}

export function CreateBlankDialog({ open, onOpenChange, onCreate }: Props) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { currentOrg } = useOrg();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [coverUrl, setCoverUrl] = useState('');
  const [creating, setCreating] = useState(false);

  const handleCreate = async () => {
    if (!title.trim()) return;
    setCreating(true);
    try {
      await onCreate({ title, description, coverUrl });
      onOpenChange(false);
      setTitle('');
      setDescription('');
      setCoverUrl('');
    } finally {
      setCreating(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>{isFr ? 'Détails du cours' : 'Course details'}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 pt-2">
          {/* Cover image */}
          <ImageUploader
            value={coverUrl}
            onChange={setCoverUrl}
            folder={`programs/${currentOrg?.id}`}
            label=""
            aspectRatio="video"
          />

          <div>
            <Label className="text-sm">
              {isFr ? 'Titre' : 'Title'} <span className="text-muted-foreground text-xs">({isFr ? 'requis' : 'required'})</span>
            </Label>
            <Input
              value={title}
              onChange={e => setTitle(e.target.value)}
              placeholder={isFr ? 'Cours sans titre' : 'Untitled course'}
              className="mt-1"
            />
          </div>

          <div>
            <Label className="text-sm">Description</Label>
            <Textarea
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder={isFr ? 'Ajoutez une brève description' : 'Add a brief description'}
              rows={3}
              className="mt-1 resize-none"
            />
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={creating}>
            {isFr ? 'Annuler' : 'Cancel'}
          </Button>
          <Button onClick={handleCreate} disabled={!title.trim() || creating} className="gap-1.5">
            {creating && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {isFr ? 'Créer' : 'Create'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
