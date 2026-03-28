import { motion } from 'framer-motion';
import { Store, BarChart3, Sparkles, Users } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: 'easeOut' as const } },
};

export function LandingPlatformShowcase() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const features = isFr ? [
    { icon: Store, label: 'Boutique personnalisée', desc: 'Votre vitrine à votre image, prête en quelques clics.' },
    { icon: BarChart3, label: 'Ventes en temps réel', desc: 'Suivez chaque transaction, chaque ambassadeur.' },
    { icon: Sparkles, label: 'IA intégrée', desc: 'Créez des livres, ebooks et contenus automatiquement.' },
    { icon: Users, label: 'Programme ambassadeur', desc: 'Vos lecteurs deviennent vos vendeurs.' },
  ] : [
    { icon: Store, label: 'Custom storefront', desc: 'Your branded store, ready in clicks.' },
    { icon: BarChart3, label: 'Real-time sales', desc: 'Track every transaction, every ambassador.' },
    { icon: Sparkles, label: 'Built-in AI', desc: 'Create books, ebooks and content automatically.' },
    { icon: Users, label: 'Ambassador program', desc: 'Your readers become your sellers.' },
  ];

  return (
    <section className="py-24 px-4">
      <div className="container max-w-5xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-16">
          <p className="text-xs font-bold text-primary uppercase tracking-[0.2em] mb-3">
            {isFr ? 'La plateforme' : 'The platform'}
          </p>
          <h2 className="text-3xl sm:text-4xl font-extrabold">
            {isFr ? 'Tout ce dont tu as besoin' : 'Everything you need'}
          </h2>
          <p className="text-sm text-muted-foreground mt-3 max-w-lg mx-auto">
            {isFr ? 'Boutique, analytics, ambassadeurs, IA — tout est intégré.' : 'Store, analytics, ambassadors, AI — everything built-in.'}
          </p>
        </motion.div>

        {/* Cobalt-style feature grid */}
        <div className="grid sm:grid-cols-2 gap-6">
          {features.map((f, i) => (
            <motion.div
              key={f.label}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1, duration: 0.4 }}
              className="rounded-2xl border border-border/60 bg-card p-8 hover:border-primary/20 hover:shadow-[var(--shadow-elevated)] transition-all duration-300 group"
            >
              <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/15 transition-colors">
                <f.icon className="h-6 w-6 text-primary" />
              </div>
              <h3 className="font-bold text-lg mb-2">{f.label}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
