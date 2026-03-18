import { useOrg } from '@/contexts/OrgContext';
import { useOrgPrograms } from '@/hooks/usePrograms';
import { useOrgEnrollmentStats } from '@/hooks/useLearnerProgress';
import { AdminPageShell } from './AdminPageShell';
import { useI18n } from '@/i18n/I18nContext';
import { BarChart3, Users, BookOpen, Trophy, TrendingUp } from 'lucide-react';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { Progress } from '@/components/ui/progress';

export default function AdminLearnerProgress() {
  const { currentOrg } = useOrg();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { data: stats, isLoading } = useOrgEnrollmentStats(currentOrg?.id);

  const totalEnrollments = stats?.enrollments?.length || 0;
  const completedEnrollments = stats?.enrollments?.filter((e: any) => e.status === 'completed').length || 0;
  const avgProgress = totalEnrollments > 0
    ? Math.round((stats?.enrollments || []).reduce((s: number, e: any) => s + (e.progress_percent || 0), 0) / totalEnrollments)
    : 0;

  // Group enrollments by program
  const programStats = (stats?.programs || []).map((prog: any) => {
    const progEnrollments = (stats?.enrollments || []).filter((e: any) => e.program_id === prog.id);
    const completed = progEnrollments.filter((e: any) => e.status === 'completed').length;
    const avgProg = progEnrollments.length > 0
      ? Math.round(progEnrollments.reduce((s: number, e: any) => s + (e.progress_percent || 0), 0) / progEnrollments.length)
      : 0;
    const avgStars = progEnrollments.length > 0
      ? Math.round(progEnrollments.reduce((s: number, e: any) => s + (e.total_stars || 0), 0) / progEnrollments.length * 10) / 10
      : 0;
    return {
      ...prog,
      enrollmentCount: progEnrollments.length,
      completedCount: completed,
      avgProgress: avgProg,
      avgStars,
      enrollments: progEnrollments,
    };
  });

  return (
    <AdminPageShell
      title={isFr ? "Suivi des apprenants" : "Learner Progress"}
      subtitle={isFr ? "Suivez la progression de vos apprenants sur vos cours." : "Track your learners' progress across your courses."}
      backRoute="/admin"
    >
      {isLoading ? <SkeletonRow count={3} /> : (
        <div className="space-y-6">
          {/* Summary cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              icon={<Users className="h-5 w-5 text-primary" />}
              label={isFr ? 'Inscrits' : 'Enrolled'}
              value={totalEnrollments}
            />
            <StatCard
              icon={<Trophy className="h-5 w-5 text-yellow-500" />}
              label={isFr ? 'Complétés' : 'Completed'}
              value={completedEnrollments}
            />
            <StatCard
              icon={<TrendingUp className="h-5 w-5 text-emerald-500" />}
              label={isFr ? 'Progression moy.' : 'Avg progress'}
              value={`${avgProgress}%`}
            />
            <StatCard
              icon={<BookOpen className="h-5 w-5 text-blue-500" />}
              label={isFr ? 'Cours' : 'Courses'}
              value={stats?.programs?.length || 0}
            />
          </div>

          {/* Per-course breakdown */}
          <div className="space-y-4">
            <h3 className="text-sm font-semibold flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-primary" />
              {isFr ? 'Par cours' : 'By course'}
            </h3>

            {programStats.length === 0 ? (
              <p className="text-sm text-muted-foreground">{isFr ? 'Aucun cours publié.' : 'No published courses.'}</p>
            ) : (
              <div className="space-y-3">
                {programStats.map((prog: any) => (
                  <div key={prog.id} className="bg-card border border-border rounded-xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <h4 className="text-sm font-semibold">{prog.title}</h4>
                      <span className="text-xs text-muted-foreground">
                        {prog.enrollmentCount} {isFr ? 'inscrits' : 'enrolled'}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 text-center">
                      <div>
                        <p className="text-lg font-bold text-primary">{prog.avgProgress}%</p>
                        <p className="text-[10px] text-muted-foreground">{isFr ? 'Progression moy.' : 'Avg progress'}</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-emerald-600">{prog.completedCount}</p>
                        <p className="text-[10px] text-muted-foreground">{isFr ? 'Complétés' : 'Completed'}</p>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-yellow-600">{prog.avgStars}</p>
                        <p className="text-[10px] text-muted-foreground">{isFr ? 'Étoiles moy.' : 'Avg stars'}</p>
                      </div>
                    </div>

                    {/* Learner list */}
                    {prog.enrollments.length > 0 && (
                      <div className="border-t border-border pt-3 space-y-2">
                        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                          {isFr ? 'Apprenants' : 'Learners'}
                        </span>
                        {prog.enrollments.slice(0, 10).map((enrollment: any) => {
                          const profile = enrollment.profiles;
                          const displayName = profile?.display_name || enrollment.user_id?.slice(0, 8) + '...';
                          return (
                            <div key={enrollment.id} className="flex items-center gap-3">
                              {profile?.avatar_url ? (
                                <img src={profile.avatar_url} alt="" className="h-6 w-6 rounded-full object-cover shrink-0" />
                              ) : (
                                <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center shrink-0">
                                  <Users className="h-3 w-3 text-muted-foreground" />
                                </div>
                              )}
                              <div className="flex-1 min-w-0">
                                <p className="text-xs font-medium truncate">{displayName}</p>
                              </div>
                              <div className="w-24 shrink-0">
                                <Progress value={enrollment.progress_percent || 0} className="h-1.5" />
                              </div>
                              <span className="text-[10px] text-muted-foreground w-10 text-right">
                                {enrollment.progress_percent || 0}%
                              </span>
                              {enrollment.status === 'completed' && (
                                <Trophy className="h-3 w-3 text-yellow-500 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                        {prog.enrollments.length > 10 && (
                          <p className="text-[10px] text-muted-foreground">
                            +{prog.enrollments.length - 10} {isFr ? 'de plus' : 'more'}
                          </p>
                        )}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}

function StatCard({ icon, label, value }: { icon: React.ReactNode; label: string; value: string | number }) {
  return (
    <div className="bg-card border border-border rounded-xl p-4 flex items-center gap-3">
      <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center shrink-0">
        {icon}
      </div>
      <div>
        <p className="text-xl font-bold">{value}</p>
        <p className="text-[10px] text-muted-foreground">{label}</p>
      </div>
    </div>
  );
}
