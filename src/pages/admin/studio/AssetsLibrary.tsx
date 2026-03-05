import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, FolderOpen } from 'lucide-react';

export default function AssetsLibrary() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <FolderOpen className="h-6 w-6 text-primary" /> Bibliothèque d'assets
      </h1>
      <Card>
        <CardContent className="py-16 text-center">
          <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium">Bibliothèque centralisée</p>
          <p className="text-sm text-muted-foreground mt-1">
            Tous vos assets IA (images, audios, PDF) en un seul endroit. Disponible en Phase 2.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
