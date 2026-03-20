import { motion } from 'framer-motion';
import { Share2, Users, Banknote, ArrowRight } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';
import { landingScreenshots } from './landingScreenshotRegistry';

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
    <section className="py-16 sm:py-20 px-4 bg-emerald-500/5">
      <div className="container max-w-5xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-10">
          <h2 className="text-2xl sm:text-3xl font-extrabold">
            {isFr ? (
              <>Tes lecteurs <span className="text-emerald-500">vendent pour toi</span></>
            ) : (
              <>Your readers <span className="text-emerald-500">sell for you</span></>
            )}
          </h2>
          <p className="text-sm text-muted-foreground mt-2 max-w-lg mx-auto">
            {isFr
              ? 'Chaque acheteur peut devenir ton ambassadeur. Il partage, ses amis achètent, tout le monde gagne.'
              : 'Every buyer can become your ambassador. They share, their friends buy, everyone earns.'}
          </p>
        </motion.div>

        <div className="grid lg:grid-cols-2 gap-10 items-center">
          {/* Left: Steps */}
          <div>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-6">
              {steps.map((step, i) => (
                <motion.div
                  key={step.label}
                  initial="hidden"
                  whileInView="visible"
                  viewport={{ once: true }}
                  variants={fadeUp}
                  transition={{ delay: i * 0.1 }}
                  className="flex items-center gap-3 sm:flex-col sm:text-center"
                >
                  <div className={`h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 ${step.color}`}>
                    <step.icon className="h-7 w-7" />
                  </div>
                  <div>
                    <p className="font-bold text-sm">{step.label}</p>
                    <p className="text-xs text-muted-foreground">{step.desc}</p>
                  </div>
                  {i < 2 && <ArrowRight className="h-5 w-5 text-muted-foreground/40 hidden sm:block shrink-0" />}
                </motion.div>
              ))}
            </div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="mt-8 text-center">
              <div className="inline-flex items-center gap-2 bg-card border border-border rounded-xl p-4 text-sm">
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

          {/* Right: Ambassador dashboard screenshot */}
          <motion.div
            initial={{ opacity: 0, x: 30, scale: 0.96 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="rounded-2xl overflow-hidden border border-border/60 shadow-elevated bg-card">
              <div className="flex items-center gap-1.5 px-4 py-2 bg-muted/60 border-b border-border/40">
                <span className="h-2 w-2 rounded-full bg-red-400/70" />
                <span className="h-2 w-2 rounded-full bg-amber-400/70" />
                <span className="h-2 w-2 rounded-full bg-emerald-400/70" />
                <span className="ml-3 text-[9px] text-muted-foreground font-mono bg-background/60 rounded px-2 py-0.5">
                  {landingScreenshots.ambassador.chromeLabel}
                </span>
              </div>
              <img
                src={landingScreenshots.ambassador.src}
                alt={isFr ? "Tableau de bord ambassadeur SiteViral" : "SiteViral ambassador dashboard"}
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
