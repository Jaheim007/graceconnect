import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Upload, ArrowRight, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';

const fadeUp = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

export function LandingMigration() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <section className="py-16 px-4">
      <div className="container max-w-3xl">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeUp} className="bg-card border border-border rounded-2xl p-8 sm:p-10 text-center">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
            <Upload className="h-6 w-6 text-primary" />
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold mb-2">
            {isFr ? 'Tu as déjà du contenu ?' : 'Already have content?'}
          </h2>
          <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
            {isFr
              ? "Upload tes ebooks, guides, formations. En 3 minutes, ils sont en vente avec une armée d'ambassadeurs."
              : "Upload your ebooks, guides, courses. In 3 minutes, they're on sale with an army of ambassadors."}
          </p>

          <div className="flex flex-wrap items-center justify-center gap-4 mb-6">
            {(isFr
              ? [{ label: 'Upload ton PDF', icon: '📄' }, { label: 'Prix en 1 clic', icon: '💰' }, { label: 'Ambassadeurs activés', icon: '🚀' }]
              : [{ label: 'Upload your PDF', icon: '📄' }, { label: 'Set price in 1 click', icon: '💰' }, { label: 'Ambassadors activated', icon: '🚀' }]
            ).map((step) => (
              <div key={step.label} className="flex items-center gap-1.5 text-xs font-medium">
                <span>{step.icon}</span> {step.label}
              </div>
            ))}
          </div>

          <div className="bg-muted/50 border border-border rounded-xl p-4 mb-6 max-w-md mx-auto">
            <p className="text-xs text-muted-foreground mb-2">
              {isFr ? 'La différence avec les autres plateformes :' : 'The difference from other platforms:'}
            </p>
            <div className="flex items-center gap-2 text-sm font-bold text-primary">
              <Users className="h-4 w-4" />
              {isFr ? 'Ici, tes lecteurs vendent pour toi.' : 'Here, your readers sell for you.'}
            </div>
          </div>

          <Button className="gap-2" onClick={() => navigate('/migrer')}>
            {isFr ? 'Importer mon contenu' : 'Import my content'} <ArrowRight className="h-4 w-4" />
          </Button>
        </motion.div>
      </div>
    </section>
  );
}
