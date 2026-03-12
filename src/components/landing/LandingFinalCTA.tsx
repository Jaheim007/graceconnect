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
    <section className="py-20 px-4">
      <div className="container max-w-2xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-primary" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_70%)]" />

          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent"
            animate={{ x: ['-100%', '200%'] }}
            transition={{ duration: 4, repeat: Infinity, ease: 'linear', repeatDelay: 3 }}
          />

          <div className="relative z-10 p-8 sm:p-12 text-center space-y-5">
            <motion.h2
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: 0.15 }}
              className="text-2xl sm:text-3xl font-extrabold text-primary-foreground"
            >
              {isFr ? "Ton livre attend d'être écrit." : "Your book is waiting to be written."}
            </motion.h2>
            <motion.p
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="text-primary-foreground/80 text-sm max-w-sm mx-auto"
            >
              {isFr ? "Commence maintenant. C'est gratuit. 5 minutes suffisent." : "Start now. It's free. 5 minutes is all you need."}
            </motion.p>

            {/* Country flags */}
            <div className="flex items-center justify-center gap-1.5 text-lg">
              {['🇬🇭', '🇰🇪', '🇨🇮', '🇳🇬', '🇿🇦', '🇺🇸', '🇬🇧', '🇫🇷'].map(f => <span key={f}>{f}</span>)}
            </div>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" className="bg-background text-foreground hover:bg-background/90 border-0 px-6 h-12 text-sm gap-2 group w-full sm:w-auto relative overflow-hidden" onClick={() => navigate('/auth?mode=signup&intent=writer')}>
                <span className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/10 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-700" />
                <PenLine className="h-4 w-4" /> ✏️ {isFr ? 'Écrire mon livre' : 'Write my book'} <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" className="bg-primary-foreground/20 text-primary-foreground border-2 border-primary-foreground hover:bg-primary-foreground/30 px-6 h-12 text-sm gap-2 w-full sm:w-auto" onClick={() => navigate('/auth?mode=signup&intent=ambassador')}>
                <Share2 className="h-4 w-4" /> 💰 {isFr ? 'Gagner en partageant' : 'Earn by sharing'}
              </Button>
            </div>
            <button
              onClick={() => navigate('/discover')}
              className="text-xs text-primary-foreground/60 hover:text-primary-foreground transition-colors underline underline-offset-2"
            >
              {isFr ? 'Ou simplement explorer les ressources →' : 'Or simply explore resources →'}
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
