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
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
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
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              transition={{ delay: i * 0.1 }}
              className="text-center space-y-3"
            >
              <div className="h-14 w-14 rounded-2xl bg-accent/10 flex items-center justify-center mx-auto">
                <step.icon className="h-7 w-7 text-accent" />
              </div>
              <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                <span className="text-xs font-bold text-primary">{i + 1}</span>
              </div>
              <h3 className="font-bold text-sm">{step.title}</h3>
              <p className="text-xs text-muted-foreground leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mt-8 flex items-center gap-2 justify-center bg-accent/5 border border-accent/20 rounded-xl p-3 max-w-md mx-auto">
          <CheckCircle className="h-4 w-4 text-accent shrink-0" />
          <p className="text-sm font-medium text-accent">Zéro abonnement. Zéro risque. Commence en 5 minutes.</p>
        </motion.div>
      </div>
    </section>
  );
}
