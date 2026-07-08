import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Search, Rocket } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';
import { setIntent } from '@/lib/intent';

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
      <div className="container max-w-5xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-[hsl(220,70%,10%)] via-[hsl(220,65%,16%)] to-[hsl(220,60%,12%)]" />
          <div className="absolute top-0 left-1/4 w-[500px] h-[250px] rounded-full blur-[130px] opacity-30 bg-primary" />
          <div className="absolute bottom-0 right-1/4 w-[400px] h-[220px] rounded-full blur-[130px] opacity-25 bg-accent" />

          <div className="relative z-10 p-10 sm:p-16 text-center space-y-6">
            <h2 className="text-3xl sm:text-5xl font-black text-white leading-tight tracking-tight">
              {isFr ? 'Prêt à passer à l’action ?' : 'Ready to get started?'}
            </h2>
            <p className="text-white/70 text-base sm:text-lg max-w-xl mx-auto">
              {isFr
                ? 'Trouvez un service vérifié ou proposez le vôtre en quelques minutes.'
                : 'Find a verified service or offer your own in minutes.'}
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
              <Button
                size="lg"
                className="px-8 h-12 gap-2 group w-full sm:w-auto shadow-lg shadow-primary/40 bg-primary hover:bg-primary/90"
                onClick={() => { setIntent('client', '/looking-for'); navigate('/looking-for'); }}
              >
                <Search className="h-4 w-4" /> {isFr ? 'Trouver un service' : 'Find a service'}
                <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button
                size="lg"
                variant="outline"
                className="bg-white/5 text-white border-white/25 hover:bg-white/10 hover:text-white px-8 h-12 gap-2 w-full sm:w-auto"
                onClick={() => { setIntent('provider'); navigate('/start-selling'); }}
              >
                <Rocket className="h-4 w-4" /> {isFr ? 'Devenir vendeur' : 'Become a seller'}
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
