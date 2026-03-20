import { motion } from 'framer-motion';
import { Store, BarChart3, Sparkles, Users } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import storefrontScreenshot from '@/assets/screenshots/storefront.png';
import dashboardScreenshot from '@/assets/screenshots/dashboard-sales.png';

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
    <section className="py-16 sm:py-24 px-4">
      <div className="container max-w-6xl">
        {/* Section 1: Storefront */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center mb-20 sm:mb-28">
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
          >
            <p className="text-xs font-bold text-primary uppercase tracking-wider mb-3">
              {isFr ? 'Votre boutique' : 'Your store'}
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight mb-4">
              {isFr
                ? 'Une boutique pro qui vous ressemble'
                : 'A pro store that looks like you'}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
              {isFr
                ? 'Personnalisez votre boutique avec votre logo, vos couleurs et vos produits. Vos clients achètent en confiance avec Mobile Money ou carte bancaire.'
                : 'Customize your store with your logo, colors and products. Your customers buy with confidence using Mobile Money or card.'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {features.slice(0, 2).map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/30"
                >
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <f.icon className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">{f.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 40, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
          >
            <div className="rounded-2xl overflow-hidden border border-border/50 shadow-premium bg-card">
              <div className="flex items-center gap-1.5 px-4 py-2.5 bg-muted/50 border-b border-border/30">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
                <span className="ml-3 text-[9px] text-muted-foreground font-mono bg-background/50 rounded px-2 py-0.5">
                  siteviral.com/store/your-brand
                </span>
              </div>
              <img
                src={storefrontScreenshot}
                alt={isFr ? "Boutique digitale SiteViral" : "SiteViral digital storefront"}
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
          </motion.div>
        </div>

        {/* Section 2: Dashboard (reversed) */}
        <div className="grid lg:grid-cols-2 gap-10 lg:gap-16 items-center">
          <motion.div
            initial={{ opacity: 0, x: -40, scale: 0.95 }}
            whileInView={{ opacity: 1, x: 0, scale: 1 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
            className="order-2 lg:order-1"
          >
            <div className="rounded-2xl overflow-hidden border border-border/50 shadow-premium bg-card">
              <div className="flex items-center gap-1.5 px-4 py-2.5 bg-muted/50 border-b border-border/30">
                <span className="h-2.5 w-2.5 rounded-full bg-red-400/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-amber-400/60" />
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-400/60" />
                <span className="ml-3 text-[9px] text-muted-foreground font-mono bg-background/50 rounded px-2 py-0.5">
                  siteviral.com/admin/sales
                </span>
              </div>
              <img
                src={dashboardScreenshot}
                alt={isFr ? "Dashboard des ventes SiteViral" : "SiteViral sales dashboard"}
                className="w-full h-auto"
                loading="lazy"
              />
            </div>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, amount: 0.2 }}
            variants={fadeUp}
            className="order-1 lg:order-2"
          >
            <p className="text-xs font-bold text-accent uppercase tracking-wider mb-3">
              {isFr ? 'Tableau de bord' : 'Dashboard'}
            </p>
            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight leading-tight mb-4">
              {isFr
                ? 'Pilotez vos ventes en un coup d\'œil'
                : 'Track your sales at a glance'}
            </h2>
            <p className="text-sm sm:text-base text-muted-foreground leading-relaxed mb-6">
              {isFr
                ? 'Revenus, transactions, commissions affiliés — tout est visible en temps réel. Exportez vos données, gérez vos retraits, suivez la performance de chaque ambassadeur.'
                : 'Revenue, transactions, affiliate commissions — everything visible in real-time. Export your data, manage payouts, track every ambassador\'s performance.'}
            </p>
            <div className="grid grid-cols-2 gap-3">
              {features.slice(2, 4).map((f, i) => (
                <motion.div
                  key={f.label}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: 0.2 + i * 0.1 }}
                  className="flex items-start gap-2.5 p-3 rounded-xl bg-muted/30 border border-border/30"
                >
                  <div className="h-8 w-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <f.icon className="h-4 w-4 text-accent" />
                  </div>
                  <div>
                    <p className="text-xs font-bold">{f.label}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{f.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
