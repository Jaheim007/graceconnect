import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Link } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Zap, BookOpen, Baby, Palette, GraduationCap, Church, Megaphone, FolderOpen, Cpu, Image, Clock, ArrowRight, Plus, Layers } from 'lucide-react';

const PROJECT_TYPE_META: Record<string, { label: string; icon: typeof BookOpen; color: string }> = {
  ebook: { label: 'Ebook', icon: BookOpen, color: 'text-blue-500' },
  kids_book: { label: 'Livre Enfant', icon: Baby, color: 'text-pink-500' },
  coloring_book: { label: 'Coloriage', icon: Palette, color: 'text-orange-500' },
  course_pack: { label: 'Cours', icon: GraduationCap, color: 'text-emerald-500' },
  sermon_pack: { label: 'Prédication', icon: Church, color: 'text-purple-500' },
  bible_pack: { label: 'Pack Bible', icon: BookOpen, color: 'text-amber-600' },
  marketing_pack: { label: 'Marketing', icon: Megaphone, color: 'text-red-500' },
};

const STATUS_LABELS: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Brouillon', variant: 'secondary' },
  generating: { label: 'En cours', variant: 'default' },
  review: { label: 'En revue', variant: 'outline' },
  ready_to_publish: { label: 'Prêt', variant: 'default' },
  published: { label: 'Publié', variant: 'default' },
  archived: { label: 'Archivé', variant: 'secondary' },
};

export default function StudioHome() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;

  const { data: stats, isLoading } = useQuery({
    queryKey: ['studio-stats', orgId],
    queryFn: async () => {
      if (!orgId) return null;
      const [projectsRes, jobsRes, assetsRes] = await Promise.all([
        db.from('ai_content_projects').select('id, status', { count: 'exact', head: false }).eq('organization_id', orgId),
        db.from('ai_generation_jobs').select('id', { count: 'exact', head: true }).eq('organization_id', orgId).in('status', ['queued', 'running']),
        db.from('ai_project_assets').select('id', { count: 'exact', head: true }).eq('organization_id', orgId),
      ]);
      const projects = projectsRes.data || [];
      const published = projects.filter(p => p.status === 'published').length;
      return {
        total: projects.length,
        published,
        activeJobs: jobsRes.count || 0,
        assets: assetsRes.count || 0,
      };
    },
    enabled: !!orgId,
  });

  const { data: recentProjects } = useQuery({
    queryKey: ['studio-recent', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db.from('ai_content_projects')
        .select('id, title, project_type, status, created_at, updated_at')
        .eq('organization_id', orgId)
        .order('updated_at', { ascending: false })
        .limit(5);
      return data || [];
    },
    enabled: !!orgId,
  });

  const ctaItems = [
    { type: 'ebook', label: 'Créer un ebook', icon: BookOpen },
    { type: 'kids_book', label: 'Créer un livre enfant', icon: Baby },
    { type: 'coloring_book', label: 'Cahier de coloriage', icon: Palette },
    { type: 'course_pack', label: 'Créer un cours', icon: GraduationCap },
    { type: 'sermon_pack', label: 'Pack prédication', icon: Church },
    { type: 'marketing_pack', label: 'Pack marketing', icon: Megaphone },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            
            Studio IA
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Créez et publiez des contenus professionnels avec l'intelligence artificielle
          </p>
        </div>
        <Button asChild>
          <Link to="/admin/studio/projects/new">
            <Plus className="h-4 w-4 mr-2" /> Nouveau projet
          </Link>
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {isLoading ? (
          Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="pt-6"><Skeleton className="h-8 w-16" /><Skeleton className="h-4 w-24 mt-2" /></CardContent></Card>
          ))
        ) : (
          <>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <FolderOpen className="h-8 w-8 text-primary/60" />
                  <div>
                    <p className="text-2xl font-bold">{stats?.total ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Projets</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Cpu className="h-8 w-8 text-yellow-500/60" />
                  <div>
                    <p className="text-2xl font-bold">{stats?.activeJobs ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Jobs en cours</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Image className="h-8 w-8 text-emerald-500/60" />
                  <div>
                    <p className="text-2xl font-bold">{stats?.assets ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Assets</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-3">
                  <Layers className="h-8 w-8 text-purple-500/60" />
                  <div>
                    <p className="text-2xl font-bold">{stats?.published ?? 0}</p>
                    <p className="text-xs text-muted-foreground">Publiés</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-lg font-semibold mb-3">Créer un nouveau contenu</h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {ctaItems.map(item => (
            <Link key={item.type} to={`/admin/studio/projects/new?type=${item.type}`}>
              <Card className="hover:border-primary/50 hover:shadow-md transition-all cursor-pointer group">
                <CardContent className="pt-5 pb-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center group-hover:bg-primary/20 transition-colors">
                    <item.icon className="h-5 w-5 text-primary" />
                  </div>
                  <span className="font-medium text-sm">{item.label}</span>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Recent Projects */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold">Derniers projets</h2>
          <Button variant="ghost" size="sm" asChild>
            <Link to="/admin/studio/projects">
              Voir tout <ArrowRight className="h-4 w-4 ml-1" />
            </Link>
          </Button>
        </div>

        {!recentProjects?.length ? (
          <Card>
            <CardContent className="py-12 text-center">
              
              <p className="text-muted-foreground font-medium">Aucun projet encore</p>
              <p className="text-sm text-muted-foreground mt-1">
                Lancez votre premier projet IA pour créer du contenu professionnel
              </p>
              <Button className="mt-4" asChild>
                <Link to="/admin/studio/projects/new">
                  <Plus className="h-4 w-4 mr-2" /> Créer mon premier projet
                </Link>
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-2">
            {recentProjects.map(project => {
              const meta = PROJECT_TYPE_META[project.project_type] || PROJECT_TYPE_META.ebook;
              const statusMeta = STATUS_LABELS[project.status] || STATUS_LABELS.draft;
              const Icon = meta.icon;
              return (
                <Link key={project.id} to={`/admin/studio/projects/${project.id}`}>
                  <Card className="hover:border-primary/30 transition-colors cursor-pointer">
                    <CardContent className="py-3 flex items-center gap-3">
                      <Icon className={`h-5 w-5 ${meta.color} shrink-0`} />
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm truncate">{project.title}</p>
                        <p className="text-xs text-muted-foreground">{meta.label}</p>
                      </div>
                      <Badge variant={statusMeta.variant} className="shrink-0 text-xs">
                        {statusMeta.label}
                      </Badge>
                      <Clock className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                      <span className="text-xs text-muted-foreground shrink-0">
                        {new Date(project.updated_at).toLocaleDateString('fr')}
                      </span>
                    </CardContent>
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
