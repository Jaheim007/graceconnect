import { useParams, Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Upload, Sparkles } from 'lucide-react';

export default function ProjectPublishWizard() {
  const { id } = useParams<{ id: string }>();
  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/admin/studio/projects/${id}`}><ArrowLeft className="h-4 w-4 mr-1" /> Projet</Link>
        </Button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Upload className="h-5 w-5 text-primary" /> Publier le projet
        </h1>
      </div>
      <Card>
        <CardContent className="py-16 text-center">
          <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium">Assistant de publication</p>
          <p className="text-sm text-muted-foreground mt-1">
            La publication vers Produits/Cours sera disponible en Phase 4
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
