import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

export function LandingFinalCTA() {
  const navigate = useNavigate();

  return (
    <section className="py-28 px-4">
      <div className="container max-w-3xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="relative rounded-3xl overflow-hidden">
          <div className="absolute inset-0 bg-primary" />
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.1),transparent_70%)]" />
          <div className="relative z-10 p-8 sm:p-14 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-extrabold text-primary-foreground leading-tight">
              Prêt à transformer votre contenu en revenus ?
            </h2>
            <p className="text-primary-foreground/70 max-w-md mx-auto">
              Rejoignez des centaines de créateurs, églises et organisations qui monétisent déjà avec Siteviral.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <Button size="lg" className="bg-background text-foreground hover:bg-background/90 border-0 px-8 h-13 text-base gap-2 shadow-lg group" onClick={() => navigate('/auth?mode=signup')}>
                Créer ma plateforme <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Button>
              <Button size="lg" variant="outline" className="border-primary-foreground/30 text-primary-foreground hover:bg-primary-foreground/10 px-8 h-13 text-base gap-2" onClick={() => navigate('/ambassador-program')}>
                Devenir ambassadeur <ArrowRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </motion.div>

        {/* WhatsApp CTA */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mt-8">
          <a
            href="https://wa.me/message/siteviral"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <MessageCircle className="h-4 w-4" />
            Une question ? Contactez-nous sur WhatsApp
          </a>
        </motion.div>
      </div>
    </section>
  );
}
