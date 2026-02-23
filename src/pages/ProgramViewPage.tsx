import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { ArrowLeft, CheckCircle, Circle, PlayCircle, Lock, GraduationCap } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useState } from 'react';

export default function ProgramViewPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const [activeLesson, setActiveLesson] = useState<string | null>(null);

  const { data: program } = useQuery({
    queryKey: ['program', id],
    queryFn: async () => {
      const { data } = await db.from('programs').select('*, organizations(name, slug, logo_url)')
        .eq('id', id!).single();
      return data;
    },
    enabled: !!id,
  });

  const { data: modules = [] } = useQuery({
    queryKey: ['program-modules', id],
    queryFn: async () => {
      const { data } = await db.from('program_modules').select('*, program_lessons(*)')
        .eq('program_id', id!).order('order_index');
      return (data || []).map((m: any) => ({
        ...m,
        program_lessons: (m.program_lessons || []).sort((a: any, b: any) => a.order_index - b.order_index),
      }));
    },
    enabled: !!id,
  });

  const { data: enrollment } = useQuery({
    queryKey: ['enrollment', id, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await db.from('program_enrollments').select('*')
        .eq('program_id', id!).eq('user_id', user.id).maybeSingle();
      return data;
    },
    enabled: !!id && !!user,
  });

  const { data: progress = [] } = useQuery({
    queryKey: ['lesson-progress', user?.id],
    queryFn: async () => {
      if (!user) return [];
      const lessonIds = modules.flatMap((m: any) => m.program_lessons.map((l: any) => l.id));
      if (!lessonIds.length) return [];
      const { data } = await db.from('lesson_progress').select('*')
        .eq('user_id', user.id).in('lesson_id', lessonIds);
      return data || [];
    },
    enabled: !!user && modules.length > 0,
  });

  const completedIds = new Set(progress.filter((p: any) => p.completed).map((p: any) => p.lesson_id));
  const totalLessons = modules.reduce((s: number, m: any) => s + m.program_lessons.length, 0);
  const completedCount = completedIds.size;
  const progressPercent = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;

  const enroll = useMutation({
    mutationFn: async () => {
      if (!user || !id) throw new Error('Login required');
      if (!program?.is_free && (program?.price || 0) > 0) {
        toast({ title: 'Programme payant', description: 'L\'achat de programmes sera disponible prochainement.' });
        return;
      }
      const { error } = await db.from('program_enrollments').insert({ program_id: id, user_id: user.id });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: '🎓 Inscrit avec succès !' });
      qc.invalidateQueries({ queryKey: ['enrollment', id, user?.id] });
      qc.invalidateQueries({ queryKey: ['my-enrollments'] });
    },
    onError: (e: any) => toast({ title: 'Erreur', description: e.message, variant: 'destructive' }),
  });

  const markComplete = useMutation({
    mutationFn: async (lessonId: string) => {
      if (!user) return;
      const { error } = await db.from('lesson_progress').upsert({
        user_id: user.id,
        lesson_id: lessonId,
        completed: true,
        completed_at: new Date().toISOString(),
      }, { onConflict: 'user_id,lesson_id' });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['lesson-progress', user?.id] });
    },
  });

  const currentLessonData = activeLesson ? modules.flatMap((m: any) => m.program_lessons).find((l: any) => l.id === activeLesson) : null;

  if (!program) return null;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div className="flex-1 min-w-0">
          <h1 className="text-lg font-bold truncate">{program.title}</h1>
          <p className="text-xs text-muted-foreground">{(program as any).organizations?.name}</p>
        </div>
        {!enrollment && (
          <Button size="sm" className="bg-primary text-primary-foreground text-xs"
            onClick={() => user ? enroll.mutate() : navigate('/auth')}
            disabled={enroll.isPending}>
            {program.is_free ? 'S\'inscrire gratuitement' : `S'inscrire · ${program.price?.toLocaleString('fr-FR')} ${program.currency}`}
          </Button>
        )}
      </div>

      {/* Progress bar */}
      {enrollment && (
        <div className="bg-card border border-border rounded-2xl p-4 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-medium">Progression</span>
            <span className="text-xs text-muted-foreground">{completedCount}/{totalLessons} leçons · {progressPercent}%</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
          {progressPercent === 100 && (
            <div className="flex items-center gap-2 text-primary text-xs font-medium pt-1">
              <GraduationCap className="h-4 w-4" /> Programme terminé ! 🎉
            </div>
          )}
        </div>
      )}

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Modules & Lessons */}
        <div className="lg:col-span-1 space-y-3">
          <h2 className="font-semibold text-sm">Contenu du programme</h2>
          <Accordion type="multiple" className="space-y-2">
            {modules.map((mod: any, mi: number) => (
              <AccordionItem key={mod.id} value={mod.id} className="border border-border rounded-xl overflow-hidden bg-card">
                <AccordionTrigger className="px-3 py-2.5 text-xs font-medium hover:no-underline">
                  Module {mi + 1}: {mod.title}
                </AccordionTrigger>
                <AccordionContent className="px-3 pb-3 space-y-1">
                  {mod.program_lessons.map((lesson: any) => {
                    const done = completedIds.has(lesson.id);
                    const locked = !enrollment && !lesson.is_free_preview;
                    return (
                      <button
                        key={lesson.id}
                        disabled={locked}
                        onClick={() => !locked && setActiveLesson(lesson.id)}
                        className={cn(
                          'w-full flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs text-left transition-all',
                          activeLesson === lesson.id ? 'bg-primary/10 text-primary' : 'hover:bg-muted',
                          locked && 'opacity-50 cursor-not-allowed'
                        )}
                      >
                        {locked ? <Lock className="h-3 w-3 shrink-0" /> : done ? <CheckCircle className="h-3 w-3 text-primary shrink-0" /> : <Circle className="h-3 w-3 shrink-0 text-muted-foreground" />}
                        <span className="flex-1 truncate">{lesson.title}</span>
                        {lesson.duration_minutes && <span className="text-muted-foreground text-[10px]">{lesson.duration_minutes}min</span>}
                      </button>
                    );
                  })}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* Lesson content */}
        <div className="lg:col-span-2">
          {currentLessonData ? (
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              {currentLessonData.video_url && (
                <div className="aspect-video rounded-xl overflow-hidden bg-black">
                  <video src={currentLessonData.video_url} controls className="w-full h-full" />
                </div>
              )}
              <h2 className="font-semibold">{currentLessonData.title}</h2>
              {currentLessonData.content && (
                <div className="prose prose-sm dark:prose-invert max-w-none text-sm" dangerouslySetInnerHTML={{ __html: currentLessonData.content }} />
              )}
              {enrollment && !completedIds.has(currentLessonData.id) && (
                <Button size="sm" className="gap-1.5 text-xs" onClick={() => markComplete.mutate(currentLessonData.id)}>
                  <CheckCircle className="h-3.5 w-3.5" /> Marquer comme terminé
                </Button>
              )}
              {completedIds.has(currentLessonData.id) && (
                <Badge variant="secondary" className="text-xs gap-1"><CheckCircle className="h-3 w-3" /> Terminé</Badge>
              )}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-2xl p-8 text-center space-y-3">
              {program.cover_image_url && (
                <img src={program.cover_image_url} alt="" className="w-full max-h-48 object-cover rounded-xl mx-auto" />
              )}
              <h2 className="font-semibold">{program.title}</h2>
              <p className="text-sm text-muted-foreground max-w-md mx-auto">{program.description}</p>
              <div className="flex items-center justify-center gap-3 text-xs text-muted-foreground">
                <span>{modules.length} modules</span>
                <span>·</span>
                <span>{totalLessons} leçons</span>
                <span>·</span>
                <Badge variant="secondary" className="text-[10px]">
                  {program.is_free ? 'Gratuit' : `${program.price?.toLocaleString('fr-FR')} ${program.currency}`}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">← Sélectionnez une leçon pour commencer</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
