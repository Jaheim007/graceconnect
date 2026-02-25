import { motion } from 'framer-motion';
import { X, Check, ArrowRight } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
};

export function BeforeAfterSection() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const before = isFr
    ? [
        'Contenu dispersé sur WhatsApp, Drive, email',
        'Pas de boutique — vous ne monétisez rien',
        'Dons manuels par transfert — pas de suivi',
        'Communauté invisible — aucun outil de croissance',
        'Aucune idée de ce qui marche',
      ]
    : [
        'Content scattered on WhatsApp, Drive, email',
        'No store — you monetize nothing',
        'Manual donations via transfer — no tracking',
        'Invisible community — no growth tools',
        'No idea what works',
      ];

  const after = isFr
    ? [
        'Tout centralisé sur votre page publique',
        'Boutique digitale avec paiement intégré',
        'Dons en ligne avec suivi en temps réel',
        'Programme ambassadeur pour la croissance virale',
        'Analytics détaillées : revenus, membres, engagement',
      ]
    : [
        'Everything centralized on your public page',
        'Digital store with integrated payments',
        'Online donations with real-time tracking',
        'Ambassador program for viral growth',
        'Detailed analytics: revenue, members, engagement',
      ];

  return (
    <section className="py-20 px-4 bg-muted/30">
      <div className="container max-w-5xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="text-center mb-12">
          <h2 className="text-3xl sm:text-4xl font-extrabold">
            {isFr ? 'Avant vs. Après ' : 'Before vs. After '}
            <span className="text-primary">Siteviral</span>
          </h2>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-6">
          {/* Before */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            className="bg-card border border-destructive/20 rounded-2xl p-6 space-y-4"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-destructive/10 flex items-center justify-center">
                <X className="h-4 w-4 text-destructive" />
              </div>
              <h3 className="font-bold text-lg">{isFr ? 'Sans Siteviral' : 'Without Siteviral'}</h3>
            </div>
            {before.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <X className="h-4 w-4 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-muted-foreground">{item}</p>
              </div>
            ))}
          </motion.div>

          {/* After */}
          <motion.div
            initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp}
            transition={{ delay: 0.1 }}
            className="bg-card border border-primary/20 rounded-2xl p-6 space-y-4 ring-1 ring-primary/10"
          >
            <div className="flex items-center gap-2 mb-2">
              <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                <Check className="h-4 w-4 text-primary" />
              </div>
              <h3 className="font-bold text-lg text-primary">{isFr ? 'Avec Siteviral' : 'With Siteviral'}</h3>
            </div>
            {after.map((item, i) => (
              <div key={i} className="flex items-start gap-3">
                <Check className="h-4 w-4 text-primary shrink-0 mt-0.5" />
                <p className="text-sm">{item}</p>
              </div>
            ))}
          </motion.div>
        </div>
      </div>
    </section>
  );
}
