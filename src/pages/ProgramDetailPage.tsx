import { useParams } from 'react-router-dom';
import { useProgram, useProgramModules, useEnrollment, useLessonProgress, useEnrollInProgram, useToggleLessonComplete } from '@/hooks/usePrograms';
import { useAuth } from '@/contexts/AuthContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Checkbox } from '@/components/ui/checkbox';
import { motion } from 'framer-motion';
import { BookOpen, Layers, Clock, CheckCircle, Play, FileText, Video, Music, Link2, Loader2, Lock } from 'lucide-react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useState, useMemo } from 'react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { ProgramCertificate } from '@/components/programs/ProgramCertificate';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { useI18n } from '@/i18n/I18nContext';

const CONTENT_ICONS: Record<string, typeof FileText> = {
  text: FileText,
  video: Video,
  audio: Music,
  link: Link2,
};

export default function ProgramDetailPage() {
  const { programId } = useParams();
  const { user } = useAuth();
  const { toast } = useToast();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { data: program, isLoading } = useProgram(programId);
  const { data: modules = [] } = useProgramModules(programId);
  const { data: enrollment } = useEnrollment(programId);
  const { data: progress = {} } = useLessonProgress(programId);
  const enrollMutation = useEnrollInProgram();
  const toggleLesson = useToggleLessonComplete();

  const [openModules, setOpenModules] = useState<Set<string>>(new Set());

  const totalLessons = useMemo(() => modules.reduce((sum: number, m: any) => sum + (m.lessons?.length || 0), 0), [modules]);
  const completedLessons = useMemo(() => Object.values(progress).filter((p: any) => p.completed).length, [progress]);
  const progressPercent = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : 0;

  const isEnrolled = !!enrollment;

  const handleEnroll = async () => {
    if (!programId || !user) return;
    try {
      await enrollMutation.mutateAsync(programId);
      toast({ title: isFr ? '🎉 Vous êtes inscrit !' : '🎉 You are enrolled!' });
    } catch {
      toast({ title: isFr ? 'Erreur' : 'Error', variant: 'destructive' });
    }
  };

  const handleToggleLesson = async (lessonId: string, completed: boolean) => {
    if (!programId) return;
    await toggleLesson.mutateAsync({ lessonId, completed, programId });
  };

  const toggleModule = (moduleId: string) => {
    setOpenModules(prev => {
      const next = new Set(prev);
      next.has(moduleId) ? next.delete(moduleId) : next.add(moduleId);
      return next;
    });
  };

  if (isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }

  if (!program) {
    return <div className="min-h-screen flex items-center justify-center"><p className="text-muted-foreground">{isFr ? 'Programme introuvable' : 'Program not found'}</p></div>;
  }

  const orgName = (program as any).organizations?.name || '';

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={`${program.title} — ${orgName}`} description={program.description || (isFr ? `Programme de formation par ${orgName}` : `Training program by ${orgName}`)} />

      {/* Hero */}
      <div className="relative bg-gradient-to-br from-primary/15 to-primary/5 border-b border-border">
        <div className="container max-w-4xl py-8 px-4">
          <div className="flex flex-col sm:flex-row gap-6">
            {program.cover_image_url ? (
              <img src={program.cover_image_url} alt="" className="h-40 w-full sm:w-56 rounded-xl object-cover shrink-0" />
            ) : (
              <div className="h-40 w-full sm:w-56 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <BookOpen className="h-12 w-12 text-primary/40" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                {orgName}
                {((program as any).organizations?.is_verified || (program as any).organizations?.kyc_status === 'level1' || (program as any).organizations?.kyc_status === 'level2') && <VerifiedBadge size="xs" />}
              </p>
              <h1 className="text-2xl font-bold mb-2">{program.title}</h1>
              {program.description && <p className="text-sm text-muted-foreground mb-4">{program.description}</p>}
              <div className="flex items-center gap-4 text-xs text-muted-foreground mb-4">
                <span className="flex items-center gap-1"><Layers className="h-3.5 w-3.5" /> {modules.length} modules</span>
                <span className="flex items-center gap-1"><FileText className="h-3.5 w-3.5" /> {totalLessons} {isFr ? 'leçons' : 'lessons'}</span>
              </div>

              {!user ? (
                <Button asChild><a href="/auth">{isFr ? 'Se connecter pour s\'inscrire' : 'Sign in to enroll'}</a></Button>
              ) : !isEnrolled ? (
                <Button onClick={handleEnroll} disabled={enrollMutation.isPending} className="gap-1.5">
                  {enrollMutation.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Play className="h-3.5 w-3.5" />}
                  {isFr ? 'S\'inscrire gratuitement' : 'Enroll for free'}
                </Button>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-primary" />
                    <span className="text-sm font-medium text-primary">{isFr ? 'Inscrit' : 'Enrolled'}</span>
                    <span className="text-xs text-muted-foreground ml-2">{completedLessons}/{totalLessons} {isFr ? 'leçons complétées' : 'lessons completed'}</span>
                  </div>
                  <Progress value={progressPercent} className="h-2" />
                  <p className="text-[10px] text-muted-foreground">{progressPercent}% {isFr ? 'terminé' : 'completed'}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Certificate */}
      {isEnrolled && (
        <div className="container max-w-4xl px-4 pt-4">
          <ProgramCertificate
            programId={programId!}
            programTitle={program.title}
            orgName={orgName}
            orgLogo={(program as any).organizations?.logo_url}
            progressPercent={progressPercent}
            totalLessons={totalLessons}
            completedLessons={completedLessons}
          />
        </div>
      )}

      {/* Content */}
      <div className="container max-w-4xl py-6 px-4 space-y-3">
        {modules.map((mod: any, mi: number) => {
          const moduleLessons = mod.lessons || [];
          const moduleCompleted = moduleLessons.filter((l: any) => progress[l.id]?.completed).length;
          const isModuleComplete = moduleLessons.length > 0 && moduleCompleted === moduleLessons.length;

          return (
            <Collapsible key={mod.id} open={openModules.has(mod.id)} onOpenChange={() => toggleModule(mod.id)}>
              <motion.div
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: mi * 0.05 }}
                className="bg-card border border-border rounded-xl overflow-hidden"
              >
                <CollapsibleTrigger className="w-full flex items-center gap-3 p-4 hover:bg-muted/30 transition-colors">
                  <div className={cn(
                    'h-8 w-8 rounded-lg flex items-center justify-center text-xs font-bold shrink-0',
                    isModuleComplete ? 'bg-primary/15 text-primary' : 'bg-primary/10 text-primary'
                  )}>
                    {isModuleComplete ? <CheckCircle className="h-4 w-4" /> : `${mi + 1}`}
                  </div>
                  <div className="flex-1 text-left min-w-0">
                    <p className="text-sm font-semibold truncate">{mod.title}</p>
                    <p className="text-[10px] text-muted-foreground">
                      {moduleLessons.length} {isFr ? `leçon${moduleLessons.length !== 1 ? 's' : ''}` : `lesson${moduleLessons.length !== 1 ? 's' : ''}`} · {moduleCompleted} {isFr ? `complétée${moduleCompleted !== 1 ? 's' : ''}` : 'completed'}
                    </p>
                  </div>
                </CollapsibleTrigger>

                <CollapsibleContent>
                  <div className="border-t border-border divide-y divide-border/50">
                    {moduleLessons.map((lesson: any, li: number) => {
                      const LessonIcon = CONTENT_ICONS[lesson.content_type] || FileText;
                      const isComplete = progress[lesson.id]?.completed;

                      return (
                        <div key={lesson.id} className="flex items-center gap-3 px-4 py-3 hover:bg-muted/20 transition-colors">
                          {isEnrolled ? (
                            <Checkbox
                              checked={isComplete}
                              onCheckedChange={(checked) => handleToggleLesson(lesson.id, !!checked)}
                              className="shrink-0"
                            />
                          ) : (
                            <Lock className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                          )}
                          <LessonIcon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
                          <div className="flex-1 min-w-0">
                            <p className={cn('text-sm', isComplete && 'line-through text-muted-foreground')}>{lesson.title}</p>
                          </div>
                          {lesson.duration_minutes && (
                            <span className="text-[10px] text-muted-foreground flex items-center gap-0.5 shrink-0">
                              <Clock className="h-2.5 w-2.5" /> {lesson.duration_minutes}min
                            </span>
                          )}
                          {lesson.content_url && isEnrolled && (
                            <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" asChild>
                              <a href={lesson.content_url} target="_blank" rel="noreferrer">{isFr ? 'Ouvrir' : 'Open'}</a>
                            </Button>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </CollapsibleContent>
              </motion.div>
            </Collapsible>
          );
        })}
      </div>
    </div>
  );
}
