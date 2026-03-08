import { motion } from 'framer-motion';
import { PenLine, Sparkles, Rocket, CheckCircle } from 'lucide-react';

const steps = [
  {
    icon: PenLine,
    title: 'Dis-nous ton sujet',
    desc: 'Une idée, un document, une vidéo — on accepte tout.',
  },
  {
    icon: Sparkles,
    title: 'L\'IA écrit ton livre',
    desc: 'Sommaire, chapitres, couverture — en quelques minutes.',
  },
  {
    icon: Rocket,
    title: 'Publie et vends',
    desc: 'Ton livre est en vente. Tes ambassadeurs le partagent.',
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export function LandingHowItWorksSimple() {
  return (
    <section id="how-it-works" className="py-16 px-4 scroll-mt-16">
      <div className="container max-w-4xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold">
            Comment ça marche en <span className="text-accent">3 étapes</span>
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-6">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              whileInView={{ opacity: 1, y: 0, scale: 1 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5, ease: 'easeOut' as const }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="text-center space-y-3 p-4 rounded-2xl hover:bg-muted/30 transition-colors cursor-default"
            >
              <motion.div
                initial={{ rotate: -10, scale: 0.8 }}
                whileInView={{ rotate: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 + 0.1, duration: 0.4, type: 'spring' }}
                className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto"
              >
                <step.icon className="h-7 w-7 text-accent" />
              </motion.div>
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <span className="text-xs font-bold text-primary">{i + 1}</span>
              </div>
              <h3 className="font-bold text-sm">{step.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        {/* Connecting line between steps on desktop */}

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-8 flex items-center gap-2 justify-center bg-accent/5 border border-accent/20 rounded-xl p-3 max-w-md mx-auto"
        >
          <CheckCircle className="h-4 w-4 text-accent shrink-0" />
          <p className="text-sm font-medium text-accent">Zéro abonnement. Zéro risque. Commence en 5 minutes.</p>
        </motion.div>
      </div>
    </section>
  );
}
