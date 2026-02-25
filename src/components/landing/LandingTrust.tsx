import { motion } from 'framer-motion';
import { Shield, CheckCircle, Globe, CreditCard, Lock } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

const trustItems = [
  { icon: Lock, label: 'Chiffrement SSL' },
  { icon: CreditCard, label: 'Certifié Paystack & Stripe' },
  { icon: Shield, label: 'Conforme GDPR' },
  { icon: Globe, label: 'Delaware C-Corp (USA)' },
];

export function LandingTrust() {
  return (
    <section className="py-20 px-4">
      <div className="container max-w-3xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center space-y-4">
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold">Sécurité & confiance de niveau entreprise</h2>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Vos paiements sont traités par des processeurs certifiés internationaux. Vos documents sont protégés par watermark. Vos données sont chiffrées.
          </p>
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {trustItems.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/60 rounded-full px-3 py-1.5 border border-border">
                <item.icon className="h-3 w-3 text-primary" /> {item.label}
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
