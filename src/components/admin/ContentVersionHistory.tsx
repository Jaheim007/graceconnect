import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { History, RotateCcw, Eye } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { toast } from 'sonner';

interface Props {
  contentId: string;
  contentType: string;
  onRestore?: (snapshot: Record<string, unknown>) => void;
}

export function ContentVersionHistory({ contentId, contentType, onRestore }: Props) {
  const [open, setOpen] = useState(false);
  const [previewIdx, setPreviewIdx] = useState<number | null>(null);

  const { data: versions = [], isLoading } = useQuery({
    queryKey: ['content-versions', contentId, contentType],
    queryFn: async () => {
      const { data } = await db
        .from('content_versions')
        .select('*')
        .eq('content_id', contentId)
        .eq('content_type', contentType)
        .order('version_number', { ascending: false })
        .limit(20);
      return data || [];
    },
    enabled: open,
  });

  const handleRestore = (snapshot: Record<string, unknown>, versionNumber: number) => {
    if (!onRestore) return;
    onRestore(snapshot);
    toast.success(`Version ${versionNumber} restaurée`);
    setOpen(false);
  };

  if (!contentId) return null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="ghost" size="sm" className="gap-1.5 text-xs h-7">
          <History className="h-3 w-3" /> Historique
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <History className="h-4 w-4" /> Historique des versions
          </DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[400px]">
          {isLoading ? (
            <p className="text-sm text-muted-foreground p-4">Chargement…</p>
          ) : versions.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">Aucune version précédente.</p>
          ) : (
            <div className="space-y-2 p-1">
              {versions.map((v: any, i: number) => (
                <div key={v.id} className="flex items-center gap-3 p-3 rounded-lg border border-border hover:bg-accent/30 transition-colors">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">Version {v.version_number}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(v.created_at), "d MMM yyyy 'à' HH:mm", { locale: fr })}
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-7 text-xs gap-1"
                      onClick={() => setPreviewIdx(previewIdx === i ? null : i)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                    {onRestore && (
                      <Button
                        variant="ghost"
                        size="sm"
                        className="h-7 text-xs gap-1 text-primary"
                        onClick={() => handleRestore(v.snapshot, v.version_number)}
                      >
                        <RotateCcw className="h-3 w-3" /> Restaurer
                      </Button>
                    )}
                  </div>
                  {previewIdx === i && (
                    <div className="col-span-full mt-2 p-2 bg-muted rounded text-xs overflow-auto max-h-40">
                      <pre className="whitespace-pre-wrap">{JSON.stringify(v.snapshot, null, 2)}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
