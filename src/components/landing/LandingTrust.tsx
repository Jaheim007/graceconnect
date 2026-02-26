import { motion } from 'framer-motion';
import { Shield, CreditCard, Lock, Globe, CheckCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35, ease: 'easeOut' as const } },
};

const trustItems = [
  { icon: Lock, label: 'Chiffrement SSL/TLS' },
  { icon: CreditCard, label: 'Paystack & Stripe' },
  { icon: Shield, label: 'Conforme GDPR' },
  { icon: Globe, label: 'Delaware C-Corp (USA)' },
];

const paymentBadges = [
  'Visa', 'Mastercard', 'Orange Money', 'MTN MoMo', 'Wave', 'Mobile Money',
];

export function LandingTrust() {
  return (
    <section className="py-20 px-4">
      <div className="container max-w-3xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center space-y-6">
          <Badge variant="secondary" className="text-xs px-3 py-1 rounded-full">Sécurité</Badge>
          <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
            <Shield className="h-7 w-7 text-primary" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold">Sécurité & confiance de niveau entreprise</h2>
          <p className="text-muted-foreground max-w-xl mx-auto leading-relaxed">
            Vos paiements sont traités par des processeurs certifiés internationaux. Vos documents sont protégés par watermark. Vos données sont chiffrées.
          </p>
          
          {/* Trust badges */}
          <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
            {trustItems.map((item) => (
              <div key={item.label} className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted/60 rounded-full px-3 py-1.5 border border-border">
                <item.icon className="h-3 w-3 text-primary" /> {item.label}
              </div>
            ))}
          </div>

          {/* Payment methods */}
          <div className="pt-4">
            <p className="text-xs text-muted-foreground mb-3">Méthodes de paiement acceptées</p>
            <div className="flex flex-wrap items-center justify-center gap-2">
              {paymentBadges.map((badge) => (
                <span key={badge} className="text-[11px] font-medium text-foreground/70 bg-card border border-border rounded-lg px-3 py-1.5">
                  {badge}
                </span>
              ))}
            </div>
          </div>

          {/* Security promises */}
          <div className="grid sm:grid-cols-3 gap-4 pt-6">
            {[
              { label: 'Paiement sécurisé', desc: 'Transactions chiffrées bout en bout' },
              { label: 'Données protégées', desc: 'Hébergement conforme aux normes internationales' },
              { label: 'Support réactif', desc: 'Assistance par email et formulaire de contact' },
            ].map((item) => (
              <div key={item.label} className="flex items-start gap-2 text-left bg-muted/30 rounded-xl p-4 border border-border">
                <CheckCircle className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold">{item.label}</p>
                  <p className="text-xs text-muted-foreground">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}
