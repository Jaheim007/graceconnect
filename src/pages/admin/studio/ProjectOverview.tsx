import { useParams, Link } from 'react-router-dom';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  ArrowLeft, Edit3, Image, CheckCircle, Upload, ExternalLink,
  BookOpen, Baby, Palette, GraduationCap, Church, Megaphone,
  Clock, Cpu, Eye
} from 'lucide-react';

const TYPE_META: Record<string, { label: string; icon: typeof BookOpen }> = {
  ebook: { label: 'Ebook', icon: BookOpen },
  kids_book: { label: 'Livre Enfant', icon: Baby },
  coloring_book: { label: 'Coloriage', icon: Palette },
  course_pack: { label: 'Cours', icon: GraduationCap },
  sermon_pack: { label: 'Prédication', icon: Church },
  bible_pack: { label: 'Pack Bible', icon: BookOpen },
  marketing_pack: { label: 'Marketing', icon: Megaphone },
};

const STATUS_FLOW = ['draft', 'generating', 'review', 'ready_to_publish', 'published'];
const STATUS_LABELS: Record<string, string> = {
  draft: 'Brouillon',
  generating: 'Génération',
  review: 'Revue',
  ready_to_publish: 'Prêt',
  published: 'Publié',
  archived: 'Archivé',
};

export default function ProjectOverview() {
  const { id } = useParams<{ id: string }>();
  const { currentOrg } = useOrg();

  const { data: project, isLoading } = useQuery({
    queryKey: ['studio-project', id],
    queryFn: async () => {
      if (!id) return null;
      const { data, error } = await db.from('ai_content_projects')
        .select('*')
        .eq('id', id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: jobCount } = useQuery({
    queryKey: ['studio-project-jobs', id],
    queryFn: async () => {
      if (!id) return 0;
      const { count } = await db.from('ai_generation_jobs')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', id);
      return count || 0;
    },
    enabled: !!id,
  });

  const { data: assetCount } = useQuery({
    queryKey: ['studio-project-assets-count', id],
    queryFn: async () => {
      if (!id) return 0;
      const { count } = await db.from('ai_project_assets')
        .select('id', { count: 'exact', head: true })
        .eq('project_id', id);
      return count || 0;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-40 w-full rounded-2xl" />
        <Skeleton className="h-32 w-full rounded-2xl" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-16">
        <p className="text-muted-foreground">Projet introuvable</p>
        <Button className="mt-4" variant="outline" asChild>
          <Link to="/admin/studio/projects"><ArrowLeft className="h-4 w-4 mr-2" /> Retour</Link>
        </Button>
      </div>
    );
  }

  const meta = TYPE_META[project.project_type] || TYPE_META.ebook;
  const TypeIcon = meta.icon;
  const currentIdx = STATUS_FLOW.indexOf(project.status);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <Button variant="ghost" size="sm" asChild className="mb-2">
            <Link to="/admin/studio/projects"><ArrowLeft className="h-4 w-4 mr-1" /> Projets</Link>
          </Button>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <TypeIcon className="h-6 w-6 text-primary" />
            {project.title}
          </h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">{meta.label}</Badge>
            <Badge variant={project.status === 'published' ? 'default' : 'outline'}>
              {STATUS_LABELS[project.status]}
            </Badge>
            {project.language && (
              <span className="text-xs text-muted-foreground">{project.language.toUpperCase()}</span>
            )}
          </div>
        </div>
      </div>

      {/* Timeline */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Progression</CardTitle></CardHeader>
        <CardContent>
          <div className="flex items-center gap-1">
            {STATUS_FLOW.map((s, i) => {
              const isActive = i <= currentIdx;
              const isCurrent = s === project.status;
              return (
                <div key={s} className="flex items-center flex-1">
                  <div className={`flex items-center gap-1.5 ${isCurrent ? 'font-semibold' : ''}`}>
                    <div className={`h-3 w-3 rounded-full ${
                      isActive ? 'bg-primary' : 'bg-muted'
                    } ${isCurrent ? 'ring-2 ring-primary/30' : ''}`} />
                    <span className={`text-xs ${isActive ? 'text-foreground' : 'text-muted-foreground'}`}>
                      {STATUS_LABELS[s]}
                    </span>
                  </div>
                  {i < STATUS_FLOW.length - 1 && (
                    <div className={`flex-1 h-0.5 mx-1 ${i < currentIdx ? 'bg-primary' : 'bg-muted'}`} />
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Actions */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
          <Link to={`/admin/studio/projects/${id}/assets`}>
            <Image className="h-5 w-5" />
            <span className="text-xs">Assets ({assetCount})</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
          <Link to={`/admin/studio/projects/${id}/editor`}>
            <Edit3 className="h-5 w-5" />
            <span className="text-xs">Éditeur</span>
          </Link>
        </Button>
        <Button variant="outline" className="h-auto py-4 flex-col gap-2" asChild>
          <Link to={`/admin/studio/projects/${id}/review`}>
            <CheckCircle className="h-5 w-5" />
            <span className="text-xs">Qualité</span>
          </Link>
        </Button>
        <Button
          variant="outline"
          className="h-auto py-4 flex-col gap-2"
          asChild
          disabled={project.status !== 'ready_to_publish'}
        >
          <Link to={`/admin/studio/projects/${id}/publish`}>
            <Upload className="h-5 w-5" />
            <span className="text-xs">Publier</span>
          </Link>
        </Button>
      </div>

      {/* Details */}
      <Card>
        <CardHeader><CardTitle className="text-sm">Détails du projet</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-y-3 text-sm">
            {project.objective && <>
              <span className="text-muted-foreground">Objectif</span>
              <span>{project.objective}</span>
            </>}
            {project.target_audience && <>
              <span className="text-muted-foreground">Public cible</span>
              <span>{project.target_audience}</span>
            </>}
            <span className="text-muted-foreground">Ton</span>
            <span className="capitalize">{project.tone}</span>
            {project.target_length && <>
              <span className="text-muted-foreground">Longueur cible</span>
              <span>{project.target_length} pages/chapitres</span>
            </>}
            {project.keywords?.length > 0 && <>
              <span className="text-muted-foreground">Mots-clés</span>
              <div className="flex flex-wrap gap-1">
                {project.keywords.map((k: string) => (
                  <Badge key={k} variant="secondary" className="text-xs">{k}</Badge>
                ))}
              </div>
            </>}
            <span className="text-muted-foreground">Jobs</span>
            <span>{jobCount} tâche(s) IA</span>
            <span className="text-muted-foreground">Créé le</span>
            <span>{new Date(project.created_at).toLocaleDateString('fr')}</span>
            {project.linked_product_id && <>
              <span className="text-muted-foreground">Produit lié</span>
              <Link to={`/admin/products/${project.linked_product_id}/edit`} className="text-primary hover:underline flex items-center gap-1">
                Voir le produit <ExternalLink className="h-3 w-3" />
              </Link>
            </>}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
