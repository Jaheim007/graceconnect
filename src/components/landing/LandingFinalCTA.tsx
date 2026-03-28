import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, PenLine, Share2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export function LandingFinalCTA() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <section className="py-24 px-4">
      <div className="container max-w-3xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="relative rounded-3xl overflow-hidden">
          {/* Dark gradient background like Cobalt CTA */}
          <div className="absolute inset-0" style={{
            background: 'linear-gradient(135deg, hsl(220 70% 10%) 0%, hsl(220 65% 18%) 50%, hsl(220 60% 14%) 100%)',
          }} />
          <div className="absolute inset-0" style={{
            backgroundImage: 'radial-gradient(circle, hsla(220, 60%, 50%, 0.08) 1px, transparent 1px)',
            backgroundSize: '24px 24px',
          }} />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[400px] h-[200px] rounded-full blur-[100px] opacity-30"
            style={{ background: 'hsl(220 75% 45%)' }}
          />

          <div className="relative z-10 p-12 sm:p-16 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-white">
              {isFr ? "Ton livre attend d'être écrit." : "Your book is waiting to be written."}
            </h2>
            <p className="text-white/60 text-base max-w-md mx-auto">
              {isFr ? "Commence maintenant. C'est gratuit. 5 minutes suffisent." : "Start now. It's free. 5 minutes is all you need."}
            </p>

            {/* Country flags */}
            <div className="flex items-center justify-center gap-2 text-xl">
              {['🇬🇭', '🇰🇪', '🇨🇮', '🇳🇬', '🇿🇦', '🇺🇸', '🇬🇧', '🇫🇷'].map(f => <span key={f}>{f}</span>)}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" className="px-8 h-13 text-sm gap-2 group w-full sm:w-auto shadow-lg shadow-primary/30" onClick={() => navigate('/auth?mode=signup&intent=writer')}>
                <PenLine className="h-4 w-4" /> ✏️ {isFr ? 'Écrire mon livre' : 'Write my book'} <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" className="bg-white/10 text-white border border-white/20 hover:bg-white/15 px-8 h-13 text-sm gap-2 w-full sm:w-auto" onClick={() => navigate('/auth?mode=signup&intent=ambassador')}>
                <Share2 className="h-4 w-4" /> 💰 {isFr ? 'Gagner en partageant' : 'Earn by sharing'}
              </Button>
            </div>
            <button
              onClick={() => navigate('/discover')}
              className="text-xs text-white/40 hover:text-white/60 transition-colors underline underline-offset-4"
            >
              {isFr ? 'Ou simplement explorer les ressources →' : 'Or simply explore resources →'}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
