import { motion } from 'framer-motion';
import { Smartphone, Globe, CreditCard, CheckCircle } from 'lucide-react';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const operators = [
  'Orange Money', 'MTN MoMo', 'Wave', 'M-Pesa', 'Airtel Money', 'Moov Money', 'Free Money',
];

export function LandingMobileMoney() {
  return (
    <section className="py-16 px-4 bg-accent/5">
      <div className="container max-w-4xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
          <div className="inline-flex items-center gap-2 mb-4">
            <Smartphone className="h-5 w-5 text-accent" />
            <Globe className="h-5 w-5 text-primary" />
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </div>
          <h2 className="text-2xl sm:text-3xl font-extrabold">
            Même <span className="text-accent">sans banque</span>, tu peux vendre
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-md mx-auto">
            Mobile Money natif. Tes clients payent avec leur téléphone. Tu reçois tes gains directement.
          </p>
        </motion.div>

        {/* Operators grid */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-8">
          {operators.map((op) => (
            <div key={op} className="bg-card border border-border rounded-full px-4 py-2 text-xs font-semibold">
              📱 {op}
            </div>
          ))}
        </div>

        {/* Reassurance */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="grid sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
          {[
            { label: 'Mobile Money', desc: 'FCFA, GHS, KES et plus' },
            { label: 'Cartes bancaires', desc: 'Visa, Mastercard, intl.' },
            { label: '11+ devises', desc: 'Vends partout dans le monde' },
          ].map((item) => (
            <div key={item.label} className="flex items-center gap-2 bg-card border border-border rounded-xl p-3">
              <CheckCircle className="h-4 w-4 text-accent shrink-0" />
              <div>
                <p className="text-xs font-bold">{item.label}</p>
                <p className="text-[10px] text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
