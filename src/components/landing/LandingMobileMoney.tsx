import { motion } from 'framer-motion';
import { Smartphone, Globe, CreditCard, CheckCircle } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

const operators = [
  { name: 'Orange Money', region: '🇨🇮🇸🇳' },
  { name: 'MTN MoMo', region: '🇬🇭🇨🇮' },
  { name: 'Wave', region: '🇸🇳🇨🇮' },
  { name: 'M-Pesa', region: '🇰🇪' },
  { name: 'Airtel Money', region: '🇰🇪🇬🇭' },
  { name: 'Visa / Mastercard', region: '🌍' },
  { name: 'Stripe', region: '🇺🇸🇬🇧🇫🇷🇿🇦' },
];

export function LandingMobileMoney() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <section className="py-24 px-4 bg-muted/30 border-y border-border/50">
      <div className="container max-w-4xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
          <div className="inline-flex items-center gap-3 mb-4">
            <Smartphone className="h-5 w-5 text-accent" />
            <Globe className="h-5 w-5 text-primary" />
            <CreditCard className="h-5 w-5 text-muted-foreground" />
          </div>
          <h2 className="text-3xl sm:text-4xl font-extrabold">
            {isFr ? (
              <>Mobile Money <span className="text-accent">ou</span> carte bancaire</>
            ) : (
              <>Mobile Money <span className="text-accent">or</span> credit card</>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-3 max-w-md mx-auto">
            {isFr
              ? 'Tes clients payent comme ils veulent. Tu reçois tes gains directement, partout dans le monde.'
              : 'Your customers pay how they want. You receive your earnings directly, anywhere in the world.'}
          </p>
        </motion.div>

        {/* Operators */}
        <div className="flex flex-wrap items-center justify-center gap-3 mb-10">
          {operators.map((op) => (
            <div key={op.name} className="bg-card border border-border/60 rounded-full px-5 py-2.5 text-xs font-semibold flex items-center gap-2 hover:border-primary/20 transition-colors">
              <span className="text-sm">{op.region}</span> {op.name}
            </div>
          ))}
        </div>

        {/* Reassurance */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="grid sm:grid-cols-3 gap-4 max-w-2xl mx-auto">
          {(isFr ? [
            { label: 'Mobile Money', desc: 'GHS, KES, XOF — Ghana, Kenya, UEMOA' },
            { label: 'Cartes bancaires', desc: 'Visa, Mastercard — monde entier' },
            { label: '11+ devises', desc: 'USD, EUR, GBP, ZAR, NGN et plus' },
          ] : [
            { label: 'Mobile Money', desc: 'GHS, KES, XOF — Ghana, Kenya, WAEMU' },
            { label: 'Credit/Debit Cards', desc: 'Visa, Mastercard — worldwide' },
            { label: '11+ currencies', desc: 'USD, EUR, GBP, ZAR, NGN and more' },
          ]).map((item) => (
            <div key={item.label} className="flex items-center gap-3 bg-card border border-border/60 rounded-xl p-4">
              <CheckCircle className="h-5 w-5 text-accent shrink-0" />
              <div>
                <p className="text-sm font-bold">{item.label}</p>
                <p className="text-xs text-muted-foreground">{item.desc}</p>
              </div>
            </div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
