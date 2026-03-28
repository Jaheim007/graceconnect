import { motion } from 'framer-motion';
import { PenLine, Sparkles, Rocket, CheckCircle } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
};

export function LandingHowItWorksSimple() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const steps = isFr ? [
    { icon: PenLine, title: 'Dis-nous ton sujet', desc: 'Une idée, un document, une vidéo — on accepte tout.', num: '01' },
    { icon: Sparkles, title: "L'IA écrit ton livre", desc: 'Sommaire, chapitres, couverture — en quelques minutes.', num: '02' },
    { icon: Rocket, title: 'Publie et vends', desc: 'Ton livre est en vente. Tes ambassadeurs le partagent.', num: '03' },
  ] : [
    { icon: PenLine, title: 'Tell us your topic', desc: 'An idea, a document, a video — we accept anything.', num: '01' },
    { icon: Sparkles, title: 'AI writes your book', desc: 'Outline, chapters, cover — in minutes.', num: '02' },
    { icon: Rocket, title: 'Publish & sell', desc: 'Your book is live. Your ambassadors share it.', num: '03' },
  ];

  return (
    <section id="how-it-works" className="py-20 px-4 scroll-mt-16">
      <div className="container max-w-5xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
          <h2 className="text-2xl sm:text-4xl font-extrabold">
            {isFr ? (
              <>Comment ça marche en <span className="text-primary">3 étapes</span></>
            ) : (
              <>How it works in <span className="text-primary">3 steps</span></>
            )}
          </h2>
        </motion.div>

        <div className="grid sm:grid-cols-3 gap-8">
          {steps.map((step, i) => (
            <motion.div
              key={step.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15, duration: 0.5 }}
              whileHover={{ y: -4, transition: { duration: 0.2 } }}
              className="relative text-center space-y-4 p-6 rounded-2xl border border-border bg-card hover:border-primary/20 hover:shadow-lg transition-all duration-300"
            >
              {/* Step number */}
              <span className="absolute top-4 right-4 text-5xl font-black text-muted/30 leading-none select-none">
                {step.num}
              </span>

              <motion.div
                initial={{ rotate: -10, scale: 0.8 }}
                whileInView={{ rotate: 0, scale: 1 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15 + 0.1, duration: 0.4, type: 'spring' }}
                className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto"
              >
                <step.icon className="h-7 w-7 text-primary" />
              </motion.div>

              <h3 className="font-bold text-base">{step.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{step.desc}</p>
            </motion.div>
          ))}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ delay: 0.5, duration: 0.4 }}
          className="mt-10 flex items-center gap-2 justify-center bg-primary/5 border border-primary/10 rounded-xl p-4 max-w-md mx-auto"
        >
          <CheckCircle className="h-4 w-4 text-primary shrink-0" />
          <p className="text-sm font-medium text-primary">
            {isFr ? 'Zéro abonnement. Zéro risque. Commence en 5 minutes.' : 'Zero subscription. Zero risk. Start in 5 minutes.'}
          </p>
        </motion.div>
      </div>
    </section>
  );
}
