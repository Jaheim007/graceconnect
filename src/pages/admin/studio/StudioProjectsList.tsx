import { useState } from 'react';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Link } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Zap, Plus, Search, BookOpen, Baby, Palette, GraduationCap, Church, Megaphone, Clock, FolderOpen } from 'lucide-react';

const TYPE_META: Record<string, { label: string; icon: typeof BookOpen; color: string }> = {
  ebook: { label: 'Ebook', icon: BookOpen, color: 'text-blue-500' },
  kids_book: { label: 'Livre Enfant', icon: Baby, color: 'text-pink-500' },
  coloring_book: { label: 'Coloriage', icon: Palette, color: 'text-orange-500' },
  course_pack: { label: 'Cours', icon: GraduationCap, color: 'text-emerald-500' },
  sermon_pack: { label: 'Prédication', icon: Church, color: 'text-purple-500' },
  bible_pack: { label: 'Pack Bible', icon: BookOpen, color: 'text-amber-600' },
  marketing_pack: { label: 'Marketing', icon: Megaphone, color: 'text-red-500' },
};

const STATUS_META: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
  draft: { label: 'Brouillon', variant: 'secondary' },
  generating: { label: 'En cours', variant: 'default' },
  review: { label: 'En revue', variant: 'outline' },
  ready_to_publish: { label: 'Prêt', variant: 'default' },
  published: { label: 'Publié', variant: 'default' },
  archived: { label: 'Archivé', variant: 'secondary' },
};

export default function StudioProjectsList() {
  const { currentOrg } = useOrg();
  const orgId = currentOrg?.id;
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');

  const { data: projects, isLoading } = useQuery({
    queryKey: ['studio-projects', orgId, typeFilter, statusFilter],
    queryFn: async () => {
      if (!orgId) return [];
      let q = db.from('ai_content_projects')
        .select('*')
        .eq('organization_id', orgId)
        .order('updated_at', { ascending: false });
      if (typeFilter !== 'all') q = q.eq('project_type', typeFilter as any);
      if (statusFilter !== 'all') q = q.eq('status', statusFilter as any);
      const { data } = await q;
      return data || [];
    },
    enabled: !!orgId,
  });

  const filtered = (projects || []).filter(p =>
    !search || p.title.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <FolderOpen className="h-6 w-6 text-primary" /> Projets Studio
        </h1>
        <Button asChild>
          <Link to="/admin/studio/projects/new">
            <Plus className="h-4 w-4 mr-2" /> Nouveau
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Rechercher un projet…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Type" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les types</SelectItem>
            {Object.entries(TYPE_META).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[160px]"><SelectValue placeholder="Statut" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Tous les statuts</SelectItem>
            {Object.entries(STATUS_META).map(([k, v]) => (
              <SelectItem key={k} value={k}>{v.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* List */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i}><CardContent className="py-4"><div className="h-6 bg-muted animate-pulse rounded" /></CardContent></Card>
          ))}
        </div>
      ) : !filtered.length ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Zap className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">
              {search || typeFilter !== 'all' || statusFilter !== 'all'
                ? 'Aucun projet ne correspond aux filtres'
                : 'Aucun projet encore'}
            </p>
            {!search && typeFilter === 'all' && statusFilter === 'all' && (
              <Button className="mt-4" asChild>
                <Link to="/admin/studio/projects/new">
                  <Plus className="h-4 w-4 mr-2" /> Créer un projet
                </Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {filtered.map(project => {
            const meta = TYPE_META[project.project_type] || TYPE_META.ebook;
            const statusM = STATUS_META[project.status] || STATUS_META.draft;
            const Icon = meta.icon;
            return (
              <Link key={project.id} to={`/admin/studio/projects/${project.id}`}>
                <Card className="hover:border-primary/30 transition-colors cursor-pointer">
                  <CardContent className="py-3 flex items-center gap-3">
                    <Icon className={`h-5 w-5 ${meta.color} shrink-0`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{project.title}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-xs text-muted-foreground">{meta.label}</span>
                        {project.language && (
                          <span className="text-xs text-muted-foreground">• {project.language.toUpperCase()}</span>
                        )}
                      </div>
                    </div>
                    <Badge variant={statusM.variant} className="shrink-0 text-xs">{statusM.label}</Badge>
                    <div className="flex items-center gap-1 shrink-0">
                      <Clock className="h-3.5 w-3.5 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">
                        {new Date(project.updated_at).toLocaleDateString('fr')}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
