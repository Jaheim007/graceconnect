import { motion } from 'framer-motion';
import { UserPlus, Share2, Bell, PartyPopper } from 'lucide-react';

const winSteps = [
  { icon: UserPlus, label: 'Inscris-toi', desc: '30 secondes, gratuit' },
  { icon: Share2, label: 'Choisis & Partage', desc: 'Un produit, un lien WhatsApp' },
  { icon: Bell, label: 'Confirmation', desc: '"Lien prêt ! Badge 1er partage"' },
  { icon: PartyPopper, label: 'Encaisse', desc: 'Ta 1ère vente peut tomber aujourd\'hui' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function LandingFirstWin() {
  return (
    <section className="py-16 px-4 bg-muted/30">
      <div className="container max-w-3xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold">
            Ton <span className="text-primary">First Win</span> en 60 secondes
          </h2>
          <p className="text-sm text-muted-foreground mt-2">Du compte à la première action — en moins d'une minute.</p>
        </motion.div>

        <div className="flex flex-col sm:flex-row items-stretch gap-3">
          {winSteps.map((step, i) => (
            <motion.div
              key={step.label}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              transition={{ delay: i * 0.08 }}
              className="flex-1 relative bg-card border border-border rounded-xl p-4 text-center"
            >
              {i < winSteps.length - 1 && (
                <div className="hidden sm:block absolute top-1/2 -right-2 w-4 text-muted-foreground/40 text-lg">→</div>
              )}
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-2">
                <step.icon className="h-5 w-5 text-primary" />
              </div>
              <p className="font-bold text-xs mb-0.5">{step.label}</p>
              <p className="text-[11px] text-muted-foreground">{step.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
