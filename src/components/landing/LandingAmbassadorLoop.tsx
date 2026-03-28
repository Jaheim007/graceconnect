import { motion } from 'framer-motion';
import { Share2, Users, Banknote, ArrowRight } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function LandingAmbassadorLoop() {
  const { locale } = useI18n();
  const { fmt, toDisplayAmount } = useDisplayCurrency();
  const isFr = locale === 'fr';

  const steps = isFr ? [
    { icon: Share2, label: 'Tu publies', desc: 'Ton livre est en ligne', color: 'text-primary bg-primary/10' },
    { icon: Users, label: 'Ils partagent', desc: 'Tes ambassadeurs diffusent', color: 'text-emerald-500 bg-emerald-500/10' },
    { icon: Banknote, label: 'Tout le monde gagne', desc: 'Toi + tes ambassadeurs', color: 'text-accent bg-accent/10' },
  ] : [
    { icon: Share2, label: 'You publish', desc: 'Your book goes live', color: 'text-primary bg-primary/10' },
    { icon: Users, label: 'They share', desc: 'Your ambassadors spread the word', color: 'text-emerald-500 bg-emerald-500/10' },
    { icon: Banknote, label: 'Everyone earns', desc: 'You + your ambassadors', color: 'text-accent bg-accent/10' },
  ];

  return (
    <section className="py-24 px-4">
      <div className="container max-w-5xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-14">
          <p className="text-xs font-bold text-emerald-500 uppercase tracking-[0.2em] mb-3">
            {isFr ? 'Programme ambassadeur' : 'Ambassador program'}
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold">
            {isFr ? (
              <>Tes lecteurs <span className="text-emerald-500">vendent pour toi</span></>
            ) : (
              <>Your readers <span className="text-emerald-500">sell for you</span></>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-3 max-w-lg mx-auto">
            {isFr
              ? 'Chaque acheteur peut devenir ton ambassadeur. Il partage, ses amis achètent, tout le monde gagne.'
              : 'Every buyer can become your ambassador. They share, their friends buy, everyone earns.'}
          </p>
        </motion.div>

        {/* Steps flow */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 mb-10">
          {steps.map((step, i) => (
            <motion.div
              key={step.label}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              transition={{ delay: i * 0.1 }}
              className="flex items-center gap-4 sm:flex-col sm:text-center"
            >
              <div className={`h-16 w-16 rounded-2xl flex items-center justify-center shrink-0 ${step.color}`}>
                <step.icon className="h-8 w-8" />
              </div>
              <div>
                <p className="font-bold text-sm">{step.label}</p>
                <p className="text-xs text-muted-foreground">{step.desc}</p>
              </div>
              {i < 2 && <ArrowRight className="h-5 w-5 text-muted-foreground/30 hidden sm:block shrink-0" />}
            </motion.div>
          ))}
        </div>

        {/* Example calculation */}
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center">
          <div className="inline-flex items-center gap-2 bg-card border border-border rounded-xl p-5 text-sm shadow-[var(--shadow-card)]">
            <span className="text-lg">📊</span>
            <span className="text-muted-foreground">{isFr ? 'Exemple' : 'Example'}:</span>
            <span className="font-bold">
              {(() => {
                const sampleBookPrice = toDisplayAmount(10, 'USD');
                const sampleEarning = Math.round(sampleBookPrice * 0.2);
                return isFr ? (
                  <>Livre à {fmt(sampleBookPrice)} × 20% = <span className="text-emerald-500">{fmt(sampleEarning)}</span> par vente</>
                ) : (
                  <>Book at {fmt(sampleBookPrice)} × 20% = <span className="text-emerald-500">{fmt(sampleEarning)}</span> per sale</>
                );
              })()}
            </span>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
