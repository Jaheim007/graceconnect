import { Card, CardContent } from '@/components/ui/card';
import { Sparkles, Layout } from 'lucide-react';

export default function OrgTemplates() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Layout className="h-6 w-6 text-primary" /> Templates
      </h1>
      <Card>
        <CardContent className="py-16 text-center">
          <Sparkles className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground font-medium">Gestionnaire de templates</p>
          <p className="text-sm text-muted-foreground mt-1">
            Créez et gérez vos templates personnalisés. Disponible en Phase 4.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
