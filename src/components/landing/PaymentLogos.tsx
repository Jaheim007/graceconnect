import { motion } from 'framer-motion';
import { Shield, CreditCard, Smartphone } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

export function PaymentLogos() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const methods = [
    { name: 'Mobile Money', desc: 'Orange, MTN, Wave, Moov', icon: Smartphone, color: 'text-orange-500 bg-orange-500/10' },
    { name: 'Visa / Mastercard', desc: isFr ? 'Paiement par carte sécurisé' : 'Secure card payments', icon: CreditCard, color: 'text-blue-500 bg-blue-500/10' },
    { name: 'Paystack', desc: isFr ? 'Certifié PCI-DSS Niveau 1' : 'PCI-DSS Level 1 certified', icon: Shield, color: 'text-green-500 bg-green-500/10' },
    { name: 'Stripe', desc: isFr ? 'Paiements internationaux' : 'International payments', icon: Shield, color: 'text-violet-500 bg-violet-500/10' },
  ];

  return (
    <section className="py-12 px-4">
      <div className="container max-w-4xl">
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="text-center text-xs font-bold uppercase tracking-widest text-muted-foreground mb-6"
        >
          {isFr ? 'Moyens de paiement acceptés' : 'Accepted payment methods'}
        </motion.p>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {methods.map((m, i) => (
            <motion.div
              key={m.name}
              initial={{ opacity: 0, y: 8 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.05 }}
              className="flex items-center gap-3 p-3 rounded-xl bg-card border border-border"
            >
              <div className={`h-9 w-9 rounded-lg flex items-center justify-center shrink-0 ${m.color}`}>
                <m.icon className="h-4 w-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold">{m.name}</p>
                <p className="text-[10px] text-muted-foreground">{m.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
