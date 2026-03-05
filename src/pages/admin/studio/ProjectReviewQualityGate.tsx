import { useParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, XCircle, AlertTriangle, Shield } from 'lucide-react';

export default function ProjectReviewQualityGate() {
  const { id } = useParams<{ id: string }>();

  const { data: project } = useQuery({
    queryKey: ['studio-project', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await db.from('ai_content_projects')
        .select('id, title, status, quality_score, quality_flags, requires_human_review, reviewed_by, reviewed_at, review_notes')
        .eq('id', id)
        .single();
      return data;
    },
    enabled: !!id,
  });

  const score = project?.quality_score;
  const flags = project?.quality_flags || [];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/admin/studio/projects/${id}`}><ArrowLeft className="h-4 w-4 mr-1" /> Projet</Link>
        </Button>
        <h1 className="text-xl font-bold flex items-center gap-2">
          <Shield className="h-5 w-5 text-primary" /> Qualité & Revue
        </h1>
      </div>

      {/* Score */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Score de qualité</CardTitle></CardHeader>
        <CardContent>
          {score != null ? (
            <div className="flex items-center gap-4">
              <div className={`text-4xl font-bold ${
                score >= 8 ? 'text-emerald-500' : score >= 5 ? 'text-yellow-500' : 'text-destructive'
              }`}>
                {score}/10
              </div>
              <div>
                {score >= 8 && <p className="text-sm text-emerald-600 flex items-center gap-1"><CheckCircle className="h-4 w-4" /> Excellent</p>}
                {score >= 5 && score < 8 && <p className="text-sm text-yellow-600 flex items-center gap-1"><AlertTriangle className="h-4 w-4" /> Améliorations possibles</p>}
                {score < 5 && <p className="text-sm text-destructive flex items-center gap-1"><XCircle className="h-4 w-4" /> Qualité insuffisante</p>}
              </div>
            </div>
          ) : (
            <p className="text-muted-foreground text-sm">
              Aucune vérification de qualité effectuée. Lancez une génération pour obtenir un score.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Flags */}
      {flags.length > 0 && (
        <Card>
          <CardHeader><CardTitle className="text-sm">Points d'attention</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {flags.map((flag: string, i: number) => (
                <div key={i} className="flex items-start gap-2 text-sm">
                  <AlertTriangle className="h-4 w-4 text-yellow-500 shrink-0 mt-0.5" />
                  <span>{flag}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Human review */}
      {project?.requires_human_review && (
        <Card className="border-yellow-300 dark:border-yellow-800">
          <CardContent className="py-6 text-center">
            <Shield className="h-8 w-8 mx-auto text-yellow-500 mb-3" />
            <p className="font-medium">Revue humaine requise</p>
            <p className="text-sm text-muted-foreground mt-1">
              Ce projet nécessite une approbation avant publication
            </p>
            {!project.reviewed_at ? (
              <div className="flex gap-3 justify-center mt-4">
                <Button variant="outline" className="gap-1">
                  <XCircle className="h-4 w-4" /> Rejeter
                </Button>
                <Button className="gap-1">
                  <CheckCircle className="h-4 w-4" /> Approuver
                </Button>
              </div>
            ) : (
              <Badge variant="default" className="mt-3">
                {project.reviewed_by ? 'Approuvé' : 'Revu'} le {new Date(project.reviewed_at).toLocaleDateString('fr')}
              </Badge>
            )}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
