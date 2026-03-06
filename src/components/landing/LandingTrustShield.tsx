import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Fingerprint } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function LandingTrustShield() {
  return (
    <section className="py-16 px-4">
      <div className="container max-w-3xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-8">
          <div className="inline-flex items-center justify-center h-14 w-14 rounded-2xl bg-primary/10 mx-auto mb-4">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold">
            Tes contenus sont <span className="text-primary">protégés</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            8 couches de sécurité. Watermark. Traçabilité. Chaque copie est unique et identifiable.
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-3 max-w-lg mx-auto">
          {[
            { icon: Lock, label: 'Watermark intelligent', desc: 'Email de l\'acheteur en diagonale sur chaque document' },
            { icon: Eye, label: 'Prévisualisation sécurisée', desc: 'Aperçu flou 20% — pas de téléchargement avant achat' },
            { icon: Fingerprint, label: 'Hash forensique', desc: 'Chaque copie est unique et traçable' },
            { icon: Shield, label: 'Anti-piratage actif', desc: 'Logs de téléchargement + signalement intégré' },
          ].map((feature, i) => (
            <motion.div
              key={feature.label}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              transition={{ delay: i * 0.08 }}
              className="flex gap-3 items-start bg-card border border-border rounded-xl p-4"
            >
              <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                <feature.icon className="h-4 w-4 text-primary" />
              </div>
              <div>
                <p className="font-bold text-xs">{feature.label}</p>
                <p className="text-[10px] text-muted-foreground leading-snug">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
