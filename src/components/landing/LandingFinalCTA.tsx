import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, Share2, Building2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

export function LandingFinalCTA() {
  const navigate = useNavigate();

  return (
    <section className="py-20 px-4">
      <div className="container max-w-2xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-primary" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
          <div className="relative z-10 p-8 sm:p-12 text-center space-y-5">
            <h2 className="text-2xl sm:text-3xl font-extrabold text-primary-foreground">
              Prêt à gagner ?
            </h2>
            <p className="text-primary-foreground/80 text-sm max-w-sm mx-auto">
              Choisis ta voie. Commence en 60 secondes.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" className="bg-background text-foreground hover:bg-background/90 border-0 px-6 h-12 text-sm gap-2 group w-full sm:w-auto" onClick={() => navigate('/auth?mode=signup&intent=ambassador')}>
                <Share2 className="h-4 w-4" /> 💰 Gagner <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="border-2 border-primary-foreground/70 text-primary-foreground hover:bg-primary-foreground/20 px-6 h-12 text-sm gap-2 w-full sm:w-auto" onClick={() => navigate('/auth?mode=signup&intent=creator')}>
                <Building2 className="h-4 w-4" /> 🏢 Vendre
              </Button>
            </div>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
