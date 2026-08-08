import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/db';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, Clock, ChevronRight, GraduationCap, Play } from 'lucide-react';
import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { useCourseResume } from '@/hooks/useCourseResume';
import { LessonPlayerOverlay } from '@/components/programs/LessonPlayerOverlay';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/ui/EmptyState';
import { SEOHead } from '@/components/seo/SEOHead';
import { useI18n } from '@/i18n/I18nContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AchievementsSection } from '@/components/programs/AchievementsSection';


const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

export default function MyProgramsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['my-enrollments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await db
        .from('program_enrollments')
        .select('*, programs(id, title, description, cover_image_url, is_published, organization_id, organizations(name, slug, logo_url))')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      return data || [];
    },
    enabled: !!user?.id,
  });

  const programIds = enrollments.map((e: any) => e.program_id);
  const { data: resumeMap = {} } = useCourseResume(programIds);
  const [activeCourse, setActiveCourse] = useState<{ programId: string; slideId: string | null; slideIndex: number } | null>(null);

  const getProgress = (programId: string) => {
    const info = (resumeMap as any)[programId];
    if (!info) return { percent: 0, total: 0, completed: 0, resume: null as any };
    return {
      percent: info.progressPercent || 0,
      total: info.totalCountableSlides,
      completed: info.completedSlideCount,
      resume: info.resume,
    };
  };

  if (activeCourse) {
    return (
      <LessonPlayerOverlay
        programId={activeCourse.programId}
        initialSlideId={activeCourse.slideId}
        initialSlideIndex={activeCourse.slideIndex}
        onClose={() => setActiveCourse(null)}
      />
    );
  }

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <SEOHead title={isFr ? "Mes Cours — Siteviral" : "My Courses — Siteviral"} description={isFr ? "Retrouvez vos cours en ligne." : "Find your online courses."} />
      
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <GraduationCap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">{isFr ? 'Mes Cours' : 'My Courses'}</h1>
          <p className="text-xs text-muted-foreground">{isFr ? 'Vos cours et formations en ligne' : 'Your online courses and training'}</p>
        </div>
      </div>

      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="courses" className="text-xs">{isFr ? 'Mes cours' : 'My courses'}</TabsTrigger>
          <TabsTrigger value="achievements" className="text-xs gap-1.5">
            <Award className="h-3 w-3" />
            {isFr ? 'Réussites' : 'Achievements'}
          </TabsTrigger>
        </TabsList>

        <TabsContent value="achievements" className="mt-0">
          <AchievementsSection onExplore={() => navigate('/discover')} />
        </TabsContent>

        <TabsContent value="courses" className="mt-0 space-y-3">
      {isLoading ? (

        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : enrollments.length === 0 ? (
        <EmptyState
          title={isFr ? "Aucun cours" : "No courses"}
          description={isFr ? "Vous n'êtes inscrit à aucun cours pour le moment. Explorez les organisations pour trouver des formations." : "You're not enrolled in any courses yet. Explore organizations to find courses."}
          action={{ label: isFr ? 'Explorer' : 'Explore', onClick: () => navigate('/discover') }}
        />
      ) : (
        <motion.div variants={stagger} initial="hidden" animate="visible" className="space-y-3">
          {enrollments.map((enrollment: any) => {
            const program = enrollment.programs;
            if (!program) return null;
            const org = program.organizations;
            const progress = getProgress(program.id);
            const isComplete = progress.percent === 100 && progress.total > 0;

            return (
              <motion.div
                key={enrollment.id}
                variants={fadeUp}
                role="button"
                tabIndex={0}
                onClick={() => navigate(`/program/${program.id}`)}
                onKeyDown={(e) => { if (e.key === 'Enter') navigate(`/program/${program.id}`); }}
                className="w-full cursor-pointer flex items-center gap-4 bg-card border border-border rounded-2xl p-4 hover:border-primary/30 hover:shadow-sm transition-all text-left group"
              >
                <div className="h-20 w-28 rounded-xl bg-muted overflow-hidden shrink-0">
                  {program.cover_image_url ? (
                    <img src={program.cover_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm truncate">{program.title}</h3>
                    {isComplete && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px]">
                        <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> {isFr ? 'Terminé' : 'Completed'}
                      </Badge>
                    )}
                  </div>
                  {org && (
                    <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                      {isFr ? 'par' : 'by'} {org.name}
                      {(org.is_verified || (org as any).kyc_status === 'level1' || (org as any).kyc_status === 'level2') && <VerifiedBadge size="xs" />}
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <Progress value={progress.percent} className="h-1.5 flex-1" />
                    <span className="text-[10px] font-medium text-muted-foreground shrink-0">
                      {progress.completed}/{progress.total} {isFr ? 'diapos' : 'slides'}
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-2.5 w-2.5" />
                    {isFr ? 'Inscrit le' : 'Enrolled on'} {new Date(enrollment.created_at).toLocaleDateString(isFr ? 'fr-FR' : 'en-US')}
                  </div>

                  {progress.resume && !isComplete && (
                    <Button
                      size="sm"
                      className="h-7 gap-1.5 text-[11px] mt-1"
                      onClick={(e) => {
                        e.stopPropagation();
                        setActiveCourse({
                          programId: program.id,
                          slideId: progress.resume.slideId,
                          slideIndex: progress.resume.flatIndex,
                        });
                      }}
                    >
                      <Play className="h-3 w-3" />
                      {isFr
                        ? `Reprendre — Leçon ${progress.resume.lessonNumber}, diapo ${progress.resume.slideNumber} sur ${progress.resume.slidesInLesson}`
                        : `Resume — Lesson ${progress.resume.lessonNumber}, slide ${progress.resume.slideNumber} of ${progress.resume.slidesInLesson}`}
                    </Button>
                  )}
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </motion.div>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
