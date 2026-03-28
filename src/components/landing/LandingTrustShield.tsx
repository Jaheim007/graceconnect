import { motion } from 'framer-motion';
import { Shield, Lock, Eye, Fingerprint } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function LandingTrustShield() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const features = isFr ? [
    { icon: Lock, label: 'Watermark intelligent', desc: "Email de l'acheteur en diagonale sur chaque document" },
    { icon: Eye, label: 'Prévisualisation sécurisée', desc: 'Aperçu flou 20% — pas de téléchargement avant achat' },
    { icon: Fingerprint, label: 'Hash forensique', desc: 'Chaque copie est unique et traçable' },
    { icon: Shield, label: 'Anti-piratage actif', desc: 'Logs de téléchargement + signalement intégré' },
  ] : [
    { icon: Lock, label: 'Smart watermark', desc: "Buyer's email stamped diagonally on every document" },
    { icon: Eye, label: 'Secure preview', desc: '20% blur preview — no download before purchase' },
    { icon: Fingerprint, label: 'Forensic hash', desc: 'Every copy is unique and traceable' },
    { icon: Shield, label: 'Active anti-piracy', desc: 'Download logs + built-in reporting' },
  ];

  return (
    <section className="py-20 px-4">
      <div className="container max-w-4xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
          <div className="inline-flex items-center justify-center h-16 w-16 rounded-2xl bg-primary/10 mx-auto mb-5">
            <Shield className="h-8 w-8 text-primary" />
          </div>
          <h2 className="text-2xl sm:text-4xl font-extrabold">
            {isFr ? (
              <>Tes contenus sont <span className="text-primary">protégés</span></>
            ) : (
              <>Your content is <span className="text-primary">protected</span></>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-3 max-w-md mx-auto">
            {isFr
              ? '8 couches de sécurité. Watermark. Traçabilité. Chaque copie est unique et identifiable.'
              : '8 security layers. Watermark. Traceability. Every copy is unique and identifiable.'}
          </p>
        </motion.div>

        <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto">
          {features.map((feature, i) => (
            <motion.div
              key={feature.label}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              transition={{ delay: i * 0.08 }}
              className="flex gap-4 items-start bg-card border border-border rounded-2xl p-5 hover:border-primary/20 hover:shadow-md transition-all duration-300"
            >
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                <feature.icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="font-bold text-sm mb-1">{feature.label}</p>
                <p className="text-xs text-muted-foreground leading-relaxed">{feature.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
