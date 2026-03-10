import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/db';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { BookOpen, CheckCircle2, Clock, ChevronRight, GraduationCap } from 'lucide-react';
import { VerifiedBadge } from '@/components/ui/VerifiedBadge';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { EmptyState } from '@/components/ui/EmptyState';
import { SEOHead } from '@/components/seo/SEOHead';

const stagger = { hidden: {}, visible: { transition: { staggerChildren: 0.06 } } };
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

export default function MyProgramsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: enrollments = [], isLoading } = useQuery({
    queryKey: ['my-enrollments', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await db
        .from('program_enrollments')
        .select('*, programs(id, title, description, cover_image_url, is_published, organization_id, organizations(name, slug, logo_url))')
        .eq('user_id', user.id)
        .order('enrolled_at', { ascending: false });
      return data || [];
    },
    enabled: !!user?.id,
  });

  // Fetch lesson progress for all enrolled programs
  const programIds = enrollments.map((e: any) => e.program_id);
  const { data: progressData = [] } = useQuery({
    queryKey: ['my-lesson-progress', user?.id, programIds],
    queryFn: async () => {
      if (!user?.id || programIds.length === 0) return [];
      // Get all lessons for enrolled programs
      const { data: modules } = await db
        .from('program_modules')
        .select('id, program_id, program_lessons(id)')
        .in('program_id', programIds);
      
      const { data: progress } = await db
        .from('lesson_progress')
        .select('lesson_id, completed')
        .eq('user_id', user.id)
        .eq('completed', true);

      const completedSet = new Set((progress || []).map((p: any) => p.lesson_id));

      // Compute per-program progress
      const programProgress: Record<string, { total: number; completed: number }> = {};
      (modules || []).forEach((mod: any) => {
        const pid = mod.program_id;
        if (!programProgress[pid]) programProgress[pid] = { total: 0, completed: 0 };
        (mod.program_lessons || []).forEach((l: any) => {
          programProgress[pid].total++;
          if (completedSet.has(l.id)) programProgress[pid].completed++;
        });
      });
      return programProgress;
    },
    enabled: !!user?.id && programIds.length > 0,
  });

  const getProgress = (programId: string) => {
    const p = (progressData as any)[programId];
    if (!p || p.total === 0) return { percent: 0, total: 0, completed: 0 };
    return { percent: Math.round((p.completed / p.total) * 100), ...p };
  };

  return (
    <div className="container max-w-4xl py-6 space-y-6">
      <SEOHead title="Mes Programmes — Siteviral" description="Retrouvez vos cours et programmes en ligne." />
      
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <GraduationCap className="h-5 w-5 text-primary" />
        </div>
        <div>
          <h1 className="text-xl font-bold">Mes Programmes</h1>
          <p className="text-xs text-muted-foreground">Vos cours et formations en ligne</p>
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-28 bg-muted rounded-2xl animate-pulse" />
          ))}
        </div>
      ) : enrollments.length === 0 ? (
        <EmptyState
          title="Aucun programme"
          description="Vous n'êtes inscrit à aucun programme pour le moment. Explorez les organisations pour trouver des formations."
          action={{ label: 'Explorer', onClick: () => navigate('/discover') }}
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
              <motion.button
                key={enrollment.id}
                variants={fadeUp}
                onClick={() => navigate(`/program/${program.id}`)}
                className="w-full flex items-center gap-4 bg-card border border-border rounded-2xl p-4 hover:border-primary/30 hover:shadow-sm transition-all text-left group"
              >
                {/* Cover */}
                <div className="h-20 w-28 rounded-xl bg-muted overflow-hidden shrink-0">
                  {program.cover_image_url ? (
                    <img src={program.cover_image_url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <BookOpen className="h-6 w-6 text-muted-foreground" />
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-sm truncate">{program.title}</h3>
                    {isComplete && (
                      <Badge className="bg-primary/10 text-primary border-primary/20 text-[9px]">
                        <CheckCircle2 className="h-2.5 w-2.5 mr-0.5" /> Terminé
                      </Badge>
                    )}
                  </div>
                  {org && (
                    <p className="text-[10px] text-muted-foreground truncate flex items-center gap-1">
                      par {org.name}
                      {(org.is_verified || (org as any).kyc_status === 'level1' || (org as any).kyc_status === 'level2') && <VerifiedBadge size="xs" />}
                    </p>
                  )}
                  <div className="flex items-center gap-3">
                    <Progress value={progress.percent} className="h-1.5 flex-1" />
                    <span className="text-[10px] font-medium text-muted-foreground shrink-0">
                      {progress.completed}/{progress.total} leçons
                    </span>
                  </div>
                  <div className="flex items-center gap-1 text-[10px] text-muted-foreground">
                    <Clock className="h-2.5 w-2.5" />
                    Inscrit le {new Date(enrollment.enrolled_at).toLocaleDateString('fr-FR')}
                  </div>
                </div>

                <ChevronRight className="h-4 w-4 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity shrink-0" />
              </motion.button>
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
