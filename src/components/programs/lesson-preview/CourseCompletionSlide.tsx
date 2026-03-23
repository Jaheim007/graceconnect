import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Star, Trophy, Flame, PartyPopper, Target, Share2, Award, Download, Loader2 } from 'lucide-react';
import { useState, useEffect } from 'react';
import type { SlideTheme } from './slideThemes';
import { SlideDecoration } from './SlideDecorations';
import { SocialShareKit } from '@/components/sharing/SocialShareKit';
import { useI18n } from '@/i18n/I18nContext';
import { useSaveCertificate, useSaveSlideProgress, useCertificate } from '@/hooks/useLearnerProgress';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { Button } from '@/components/ui/button';
import { LessonImageBackdrop } from './LessonImageBackdrop';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
interface CourseCompletionSlideProps {
  theme: SlideTheme;
  starsEarned: number;
  totalQuizzes: number;
  assessmentScore?: number;
  assessmentTotal?: number;
  courseTitle: string;
  programId?: string;
  orgLogoUrl?: string | null;
  deviceMode: 'mobile' | 'tablet' | 'desktop';
  lessonImageUrl?: string;
  gamificationEnabled?: boolean;
  mode?: 'creator' | 'learner';
}

// Animated floating particles
function FloatingParticles() {
  const particles = Array.from({ length: 15 }, (_, i) => ({
    id: i,
    x: Math.random() * 100,
    delay: Math.random() * 3,
    duration: 3 + Math.random() * 4,
    size: 3 + Math.random() * 6,
    color: ['#FFD700', '#FF6B35', '#00D4AA', '#FF3366', '#7B61FF'][i % 5],
  }));

  return (
    <div className="absolute inset-0 pointer-events-none z-[2] overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          initial={{ y: '110%', x: `${p.x}%`, opacity: 0 }}
          animate={{ y: '-10%', opacity: [0, 0.8, 0] }}
          transition={{
            duration: p.duration,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
          }}
          style={{ backgroundColor: p.color, width: p.size, height: p.size }}
          className="absolute rounded-full"
        />
      ))}
    </div>
  );
}

export function CourseCompletionSlide({
  theme,
  starsEarned,
  totalQuizzes,
  assessmentScore,
  assessmentTotal,
  courseTitle,
  programId,
  orgLogoUrl,
  deviceMode,
  lessonImageUrl,
  gamificationEnabled = true,
  mode = 'creator',
}: CourseCompletionSlideProps) {
  const isMobile = deviceMode === 'mobile';
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [showShare, setShowShare] = useState(false);
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const saveCertificate = useSaveCertificate();
  const [certificateSaved, setCertificateSaved] = useState(false);
  const [downloadingPdf, setDownloadingPdf] = useState(false);
  const { data: existingCert } = useCertificate(mode === 'learner' ? programId : undefined);
  
  const hasAssessment = assessmentScore !== undefined && assessmentTotal !== undefined;
  const assessmentPct = hasAssessment ? Math.round((assessmentScore! / assessmentTotal!) * 100) : 0;
  const overallStarRating = hasAssessment 
    ? Math.round((assessmentScore! / assessmentTotal!) * 5)
    : totalQuizzes > 0 
      ? Math.min(5, Math.round((starsEarned / totalQuizzes) * 5))
      : 5;

  // Auto-save certificate for learners
  useEffect(() => {
    if (mode !== 'learner' || !user || !programId || !currentOrg || certificateSaved) return;
    saveCertificate.mutate({
      programId,
      organizationId: currentOrg.id,
      learnerName: (user as any).user_metadata?.display_name || user.email || 'Learner',
      courseTitle,
      starsEarned,
      assessmentScore,
      assessmentTotal,
    });
    setCertificateSaved(true);
  }, [mode, user, programId, currentOrg]);

  const shareUrl = programId ? `/program/${programId}` : '/my-programs';
  const shareDescription = isFr
    ? `🎓 Je viens de terminer le cours « ${courseTitle} » et j'ai obtenu ${overallStarRating}/5 étoiles ! Découvre ce cours 👉`
    : `🎓 I just completed the course "${courseTitle}" and got ${overallStarRating}/5 stars! Check out this course 👉`;

  return (
    <div className={cn('h-full flex flex-col text-white relative overflow-hidden bg-gradient-to-br', theme.gradient)}>
      <LessonImageBackdrop imageUrl={lessonImageUrl} overlayClassName="bg-gradient-to-br from-black/75 via-black/55 to-black/30" />
      <SlideDecoration theme={theme} />
      <FloatingParticles />

      {/* Header */}
      <div className="flex items-center gap-2.5 px-5 py-3 relative z-20">
        {orgLogoUrl ? (
          <img src={orgLogoUrl} alt="" className="h-7 w-7 rounded-full object-cover ring-2 ring-white/20" />
        ) : (
          <div className="h-7 w-7 rounded-full bg-white/20 flex items-center justify-center text-xs font-bold text-white">
            <PartyPopper className="h-4 w-4" />
          </div>
        )}
        <span className="text-xs text-white/60 flex-1 truncate">{courseTitle}</span>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 gap-4 overflow-y-auto scrollbar-none [&::-webkit-scrollbar]:hidden">
        {!showShare ? (
          <>
            {/* Trophy */}
            <motion.div
              initial={{ scale: 0, rotate: -20 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{ type: 'spring', damping: 8, delay: 0.3 }}
            >
              <div className="relative">
                <Trophy className="h-16 w-16 text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.4)]" />
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ delay: 0.8, duration: 0.5 }}
                  className="absolute -top-2 -right-2"
                >
                  <Flame className="h-7 w-7 text-orange-400" />
                </motion.div>
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.5 }}
              className="text-center"
            >
              <h1 className={cn('font-bold mb-1', isMobile ? 'text-xl' : 'text-2xl')}>
                🎉 {isFr ? 'Cours terminé !' : 'Course completed!'}
              </h1>
              <p className="text-white/60 text-xs">{isFr ? 'Félicitations pour avoir complété ce cours' : 'Congratulations on completing this course'}</p>
            </motion.div>

            {/* Star rating */}
            {gamificationEnabled && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.7 }}
                className="flex items-center gap-1.5"
              >
                {[1, 2, 3, 4, 5].map((s) => (
                  <motion.div
                    key={s}
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.8 + s * 0.12, type: 'spring', damping: 10 }}
                  >
                    <Star
                      className={cn(
                        'h-8 w-8',
                        s <= overallStarRating
                          ? 'text-yellow-400 fill-yellow-400 drop-shadow-[0_0_10px_rgba(250,204,21,0.5)]'
                          : 'text-white/20'
                      )}
                    />
                  </motion.div>
                ))}
              </motion.div>
            )}

            {/* Stats */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.4 }}
              className={cn('grid gap-2 w-full max-w-sm', hasAssessment ? 'grid-cols-2' : 'grid-cols-1')}
            >
              {gamificationEnabled && totalQuizzes > 0 && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
                  <div className="flex items-center justify-center gap-1.5 mb-0.5">
                    <Star className="h-3.5 w-3.5 text-yellow-400 fill-yellow-400" />
                    <span className="text-base font-bold">{starsEarned}</span>
                  </div>
                  <p className="text-[9px] text-white/50 uppercase tracking-wider">{isFr ? 'Étoiles gagnées' : 'Stars earned'}</p>
                </div>
              )}
              
              {hasAssessment && (
                <div className="bg-white/10 backdrop-blur-sm rounded-xl p-3 text-center border border-white/10">
                  <div className="flex items-center justify-center gap-1.5 mb-0.5">
                    <Target className="h-3.5 w-3.5 text-emerald-400" />
                    <span className="text-base font-bold">{assessmentPct}%</span>
                  </div>
                  <p className="text-[9px] text-white/50 uppercase tracking-wider">{isFr ? 'Score final' : 'Final score'}</p>
                </div>
              )}
            </motion.div>

            {/* Certificate & Share CTAs */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.8 }}
              className="flex items-center gap-3"
            >
              {mode === 'learner' && (certificateSaved || existingCert) && (
                <button
                  onClick={async () => {
                    const certId = existingCert?.id || saveCertificate.data?.id;
                    if (!certId) return;
                    setDownloadingPdf(true);
                    try {
                      const { data: { session } } = await supabase.auth.getSession();
                      const res = await fetch(
                        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-certificate-pdf`,
                        {
                          method: 'POST',
                          headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${session?.access_token}`,
                          },
                          body: JSON.stringify({ certificateId: certId }),
                        }
                      );
                      if (!res.ok) throw new Error('Failed to generate PDF');
                      const blob = await res.blob();
                      const url = URL.createObjectURL(blob);
                      const a = document.createElement('a');
                      a.href = url;
                      a.download = `certificate-${courseTitle.replace(/\s+/g, '-').toLowerCase()}.pdf`;
                      a.click();
                      URL.revokeObjectURL(url);
                    } catch (err) {
                      toast.error(isFr ? 'Erreur lors du téléchargement' : 'Download failed');
                    } finally {
                      setDownloadingPdf(false);
                    }
                  }}
                  disabled={downloadingPdf}
                  className="flex items-center gap-2 bg-yellow-500/20 hover:bg-yellow-500/30 backdrop-blur-sm rounded-full px-5 py-2.5 border border-yellow-400/30 transition-all hover:scale-105 active:scale-95 disabled:opacity-50"
                >
                  {downloadingPdf ? (
                    <Loader2 className="h-4 w-4 text-yellow-400 animate-spin" />
                  ) : (
                    <Download className="h-4 w-4 text-yellow-400" />
                  )}
                  <span className="text-sm font-medium text-yellow-200">
                    {isFr ? 'Télécharger PDF' : 'Download PDF'}
                  </span>
                </button>
              )}
              <button
                onClick={() => setShowShare(true)}
                className="flex items-center gap-2 bg-white/15 hover:bg-white/25 backdrop-blur-sm rounded-full px-5 py-2.5 border border-white/20 transition-all hover:scale-105 active:scale-95"
              >
                <Share2 className="h-4 w-4" />
                <span className="text-sm font-medium">{isFr ? 'Partager' : 'Share'}</span>
              </button>
            </motion.div>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.0 }}
              className="text-[10px] text-white/40 text-center max-w-xs"
            >
              {overallStarRating >= 4 
                ? (isFr ? '🔥 Performance exceptionnelle ! Vous maîtrisez ce sujet.' : '🔥 Exceptional performance! You mastered this topic.')
                : overallStarRating >= 3
                  ? (isFr ? '👏 Bon travail ! Vous progressez bien.' : '👏 Good job! You are progressing well.')
                  : (isFr ? '💪 Continuez à apprendre ! La pratique mène à la perfection.' : '💪 Keep learning! Practice leads to perfection.')}
            </motion.p>
          </>
        ) : (
          /* Share panel */
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-sm space-y-3"
          >
            <button
              onClick={() => setShowShare(false)}
              className="text-xs text-white/50 hover:text-white/80 transition-colors mb-2"
            >
              ← {isFr ? 'Retour' : 'Back'}
            </button>
            <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/15">
              <SocialShareKit
                url={shareUrl}
                title={courseTitle}
                description={shareDescription}
                context="post-purchase"
              />
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}
