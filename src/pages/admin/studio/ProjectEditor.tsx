import { useParams, Link } from 'react-router-dom';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useToast } from '@/hooks/use-toast';
import { useState, useCallback, useEffect } from 'react';
import {
  ArrowLeft, Plus, Trash2, GripVertical, Save, FileText,
  Sparkles, Loader2, ChevronLeft, ChevronRight
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface Chapter {
  id: string;
  title: string;
  content: string;
  order: number;
}

export default function ProjectEditor() {
  const { id } = useParams<{ id: string }>();
  const { currentOrg } = useOrg();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [chapters, setChapters] = useState<Chapter[]>([]);
  const [activeChapterId, setActiveChapterId] = useState<string | null>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  // Fetch project
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

  // Initialize chapters from structure_json
  useEffect(() => {
    if (project?.structure_json) {
      const stored = project.structure_json as { chapters?: Chapter[] };
      if (stored.chapters?.length) {
        setChapters(stored.chapters);
        if (!activeChapterId) setActiveChapterId(stored.chapters[0].id);
        return;
      }
    }
    // Default: one chapter
    if (chapters.length === 0) {
      const defaultCh: Chapter = {
        id: crypto.randomUUID(),
        title: 'Chapitre 1',
        content: '',
        order: 0,
      };
      setChapters([defaultCh]);
      setActiveChapterId(defaultCh.id);
    }
  }, [project]);

  const activeChapter = chapters.find(c => c.id === activeChapterId) || null;

  const updateChapter = useCallback((chId: string, patch: Partial<Chapter>) => {
    setChapters(prev => prev.map(c => c.id === chId ? { ...c, ...patch } : c));
    setDirty(true);
  }, []);

  const addChapter = useCallback(() => {
    const newCh: Chapter = {
      id: crypto.randomUUID(),
      title: `Chapitre ${chapters.length + 1}`,
      content: '',
      order: chapters.length,
    };
    setChapters(prev => [...prev, newCh]);
    setActiveChapterId(newCh.id);
    setDirty(true);
  }, [chapters.length]);

  const removeChapter = useCallback((chId: string) => {
    if (chapters.length <= 1) {
      toast({ title: 'Impossible', description: 'Vous devez garder au moins un chapitre.' });
      return;
    }
    setChapters(prev => {
      const next = prev.filter(c => c.id !== chId).map((c, i) => ({ ...c, order: i }));
      if (activeChapterId === chId) {
        setActiveChapterId(next[0]?.id || null);
      }
      return next;
    });
    setDirty(true);
  }, [chapters.length, activeChapterId, toast]);

  const moveChapter = useCallback((chId: string, direction: -1 | 1) => {
    setChapters(prev => {
      const idx = prev.findIndex(c => c.id === chId);
      const newIdx = idx + direction;
      if (newIdx < 0 || newIdx >= prev.length) return prev;
      const copy = [...prev];
      [copy[idx], copy[newIdx]] = [copy[newIdx], copy[idx]];
      return copy.map((c, i) => ({ ...c, order: i }));
    });
    setDirty(true);
  }, []);

  // Save to DB
  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!id) return;
      const structureJson = { chapters };
      const { error } = await db.from('ai_content_projects')
        .update({ structure_json: structureJson, updated_at: new Date().toISOString() })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      setDirty(false);
      toast({ title: 'Sauvegardé ✓' });
      queryClient.invalidateQueries({ queryKey: ['studio-project', id] });
    },
    onError: () => {
      toast({ title: 'Erreur', description: 'Impossible de sauvegarder.', variant: 'destructive' });
    },
  });

  const handleSave = () => {
    setSaving(true);
    saveMutation.mutate(undefined, { onSettled: () => setSaving(false) });
  };

  // Auto-save every 30s if dirty
  useEffect(() => {
    if (!dirty) return;
    const timer = setTimeout(() => {
      saveMutation.mutate();
    }, 30_000);
    return () => clearTimeout(timer);
  }, [dirty, chapters]);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-8 w-64" />
        <Skeleton className="h-[70vh] w-full rounded-xl" />
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

  return (
    <div className="flex flex-col h-[calc(100vh-120px)]">
      {/* Top bar */}
      <div className="flex items-center justify-between pb-3 border-b border-border mb-3">
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/admin/studio/projects/${id}`}>
              <ArrowLeft className="h-4 w-4 mr-1" /> Projet
            </Link>
          </Button>
          <span className="text-sm font-semibold truncate max-w-[200px]">{project.title}</span>
          {dirty && <Badge variant="outline" className="text-[10px]">Non sauvegardé</Badge>}
        </div>
        <div className="flex items-center gap-2">
          <Button variant="ghost" size="sm" onClick={() => setSidebarOpen(!sidebarOpen)}>
            {sidebarOpen ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
          </Button>
          <Button size="sm" onClick={handleSave} disabled={saving || !dirty}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
            Sauvegarder
          </Button>
        </div>
      </div>

      {/* Main layout */}
      <div className="flex flex-1 gap-3 overflow-hidden">
        {/* Sidebar: chapters list */}
        {sidebarOpen && (
          <div className="w-56 shrink-0 border border-border rounded-xl bg-card flex flex-col overflow-hidden">
            <div className="px-3 py-2 border-b border-border flex items-center justify-between">
              <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Chapitres</span>
              <Button variant="ghost" size="icon" className="h-6 w-6" onClick={addChapter}>
                <Plus className="h-3.5 w-3.5" />
              </Button>
            </div>
            <ScrollArea className="flex-1">
              <div className="p-1.5 space-y-0.5">
                {chapters.map((ch, idx) => (
                  <button
                    key={ch.id}
                    onClick={() => setActiveChapterId(ch.id)}
                    className={cn(
                      'w-full text-left px-2.5 py-2 rounded-lg text-sm flex items-center gap-2 group transition-colors',
                      ch.id === activeChapterId
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'hover:bg-muted text-foreground'
                    )}
                  >
                    <FileText className="h-3.5 w-3.5 shrink-0 opacity-60" />
                    <span className="flex-1 truncate text-xs">{ch.title}</span>
                    <div className="hidden group-hover:flex items-center gap-0.5">
                      {idx > 0 && (
                        <button onClick={(e) => { e.stopPropagation(); moveChapter(ch.id, -1); }} className="p-0.5 hover:bg-muted rounded">
                          <GripVertical className="h-3 w-3 rotate-90" />
                        </button>
                      )}
                      <button
                        onClick={(e) => { e.stopPropagation(); removeChapter(ch.id); }}
                        className="p-0.5 hover:bg-destructive/10 text-destructive rounded"
                      >
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </div>
                  </button>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* Center: Editor */}
        <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
          {activeChapter ? (
            <>
              <Input
                value={activeChapter.title}
                onChange={(e) => updateChapter(activeChapter.id, { title: e.target.value })}
                className="text-lg font-semibold border-0 border-b border-border rounded-none px-1 mb-2 focus-visible:ring-0 bg-transparent"
                placeholder="Titre du chapitre"
              />
              <div className="flex-1 overflow-auto">
                <RichTextEditor
                  value={activeChapter.content}
                  onChange={(html) => updateChapter(activeChapter.id, { content: html })}
                  placeholder="Écrivez le contenu de ce chapitre..."
                  className="min-h-[400px]"
                  showAIButton={false}
                />
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground">
              <p>Sélectionnez ou créez un chapitre</p>
            </div>
          )}
        </div>

        {/* Right panel: context & actions */}
        <div className="w-60 shrink-0 border border-border rounded-xl bg-card overflow-auto hidden lg:block">
          <div className="p-3 space-y-4">
            <div>
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Projet</h3>
              <div className="space-y-1.5 text-xs">
                {project.tone && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Ton</span><span className="capitalize">{project.tone}</span></div>
                )}
                {project.target_audience && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Cible</span><span className="truncate ml-2">{project.target_audience}</span></div>
                )}
                {project.target_length && (
                  <div className="flex justify-between"><span className="text-muted-foreground">Pages</span><span>{project.target_length}</span></div>
                )}
              </div>
            </div>

            <div className="border-t border-border pt-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Actions IA</h3>
              <div className="space-y-1.5">
                <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8 gap-2" disabled>
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Générer ce chapitre
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8 gap-2" disabled>
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Regénérer sélection
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8 gap-2" disabled>
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Générer couverture
                </Button>
                <Button variant="outline" size="sm" className="w-full justify-start text-xs h-8 gap-2" disabled>
                  <Sparkles className="h-3.5 w-3.5 text-primary" /> Créer PDF
                </Button>
              </div>
              <p className="text-[10px] text-muted-foreground mt-2">
                La génération IA sera activée en Phase 3
              </p>
            </div>

            <div className="border-t border-border pt-3">
              <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-2">Statistiques</h3>
              <div className="text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Chapitres</span>
                  <span>{chapters.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Mots (total)</span>
                  <span>{chapters.reduce((sum, c) => sum + (c.content.replace(/<[^>]*>/g, ' ').split(/\s+/).filter(Boolean).length), 0)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
