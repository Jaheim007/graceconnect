import { cn } from '@/lib/utils';
import { motion } from 'framer-motion';
import { Star, Trophy, Flame, PartyPopper, Target } from 'lucide-react';
import type { SlideTheme } from './slideThemes';
import { SlideDecoration } from './SlideDecorations';

interface CourseCompletionSlideProps {
  theme: SlideTheme;
  starsEarned: number;
  totalQuizzes: number;
  assessmentScore?: number;
  assessmentTotal?: number;
  courseTitle: string;
  orgLogoUrl?: string | null;
  deviceMode: 'mobile' | 'tablet' | 'desktop';
  gamificationEnabled?: boolean;
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
  orgLogoUrl,
  deviceMode,
  gamificationEnabled = true,
}: CourseCompletionSlideProps) {
  const isMobile = deviceMode === 'mobile';
  const hasAssessment = assessmentScore !== undefined && assessmentTotal !== undefined;
  const assessmentPct = hasAssessment ? Math.round((assessmentScore! / assessmentTotal!) * 100) : 0;
  const overallStarRating = hasAssessment 
    ? Math.round((assessmentScore! / assessmentTotal!) * 5)
    : totalQuizzes > 0 
      ? Math.min(5, Math.round((starsEarned / totalQuizzes) * 5))
      : 5;

  return (
    <div className={cn('h-full flex flex-col text-white relative overflow-hidden bg-gradient-to-br', theme.gradient)}>
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
      <div className="flex-1 flex flex-col items-center justify-center px-6 relative z-10 gap-5">
        {/* Trophy */}
        <motion.div
          initial={{ scale: 0, rotate: -20 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', damping: 8, delay: 0.3 }}
        >
          <div className="relative">
            <Trophy className="h-20 w-20 text-yellow-400 drop-shadow-[0_0_20px_rgba(250,204,21,0.4)]" />
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: [1, 1.3, 1] }}
              transition={{ delay: 0.8, duration: 0.5 }}
              className="absolute -top-2 -right-2"
            >
              <Flame className="h-8 w-8 text-orange-400" />
            </motion.div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
          className="text-center"
        >
          <h1 className={cn('font-bold mb-1', isMobile ? 'text-2xl' : 'text-3xl')}>
            🎉 Cours terminé !
          </h1>
          <p className="text-white/60 text-sm">Félicitations pour avoir complété ce cours</p>
        </motion.div>

        {/* Star rating */}
        {gamificationEnabled && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            className="flex items-center gap-2"
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
                    'h-9 w-9',
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
          className={cn('grid gap-3 w-full max-w-sm', hasAssessment ? 'grid-cols-2' : 'grid-cols-1')}
        >
          {gamificationEnabled && totalQuizzes > 0 && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Star className="h-4 w-4 text-yellow-400 fill-yellow-400" />
                <span className="text-lg font-bold">{starsEarned}</span>
              </div>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">Étoiles gagnées</p>
            </div>
          )}
          
          {hasAssessment && (
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-4 text-center border border-white/10">
              <div className="flex items-center justify-center gap-1.5 mb-1">
                <Target className="h-4 w-4 text-emerald-400" />
                <span className="text-lg font-bold">{assessmentPct}%</span>
              </div>
              <p className="text-[10px] text-white/50 uppercase tracking-wider">Score final</p>
            </div>
          )}
        </motion.div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.8 }}
          className="text-xs text-white/40 text-center max-w-xs"
        >
          {overallStarRating >= 4 
            ? '🔥 Performance exceptionnelle ! Vous maîtrisez ce sujet.'
            : overallStarRating >= 3
              ? '👏 Bon travail ! Vous progressez bien.'
              : '💪 Continuez à apprendre ! La pratique mène à la perfection.'}
        </motion.p>
      </div>
    </div>
  );
}
