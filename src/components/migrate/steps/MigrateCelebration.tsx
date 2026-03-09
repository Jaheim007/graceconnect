import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { PartyPopper, ExternalLink, Upload } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { SocialShareKit } from '@/components/sharing/SocialShareKit';
import { useI18n } from '@/i18n/I18nContext';
import type { MigrateState } from '../MigrateWizard';

interface Props {
  state: MigrateState;
}

export function MigrateCelebration({ state }: Props) {
  const navigate = useNavigate();
  const [showConfetti, setShowConfetti] = useState(true);
  const { t } = useI18n();

  useEffect(() => {
    const timer = setTimeout(() => setShowConfetti(false), 4000);
    return () => clearTimeout(timer);
  }, []);

  const shareUrl = `https://siteviral.com/discover`;

  return (
    <div className="space-y-8 pt-8 text-center relative overflow-hidden">
      {showConfetti && (
        <div className="fixed inset-0 pointer-events-none z-50">
          {Array.from({ length: 50 }).map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 rounded-full"
              style={{
                left: `${Math.random() * 100}%`,
                backgroundColor: ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899'][i % 6],
              }}
              initial={{ y: -20, opacity: 1 }}
              animate={{ y: window.innerHeight + 20, x: (Math.random() - 0.5) * 200, rotate: Math.random() * 720, opacity: 0 }}
              transition={{ duration: 2 + Math.random() * 2, delay: Math.random() * 0.5 }}
            />
          ))}
        </div>
      )}

      <motion.div initial={{ scale: 0.5, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} transition={{ type: 'spring', delay: 0.2 }} className="space-y-4">
        <div className="h-20 w-20 mx-auto rounded-3xl bg-primary/10 flex items-center justify-center">
          <PartyPopper className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-3xl sm:text-4xl font-extrabold">{t('migrate.published')}</h2>
        <p className="text-muted-foreground text-sm max-w-sm mx-auto">
          « <strong className="text-foreground">{state.title}</strong> » {t('migrate.on_sale')}
          <br />{t('migrate.difference')} <strong className="text-emerald-500">{t('migrate.readers_sell')}</strong>
        </p>
      </motion.div>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }}>
        <SocialShareKit
          url={shareUrl}
          title={state.title}
          description={t('migrate.discover_title').replace('{title}', state.title)}
          context="post-publication"
          price={state.isFree ? undefined : state.price}
        />
      </motion.div>

      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.8 }} className="space-y-3 pt-4">
        <Button variant="outline" className="gap-2 w-full sm:w-auto" onClick={() => navigate('/dashboard')}>
          <ExternalLink className="h-4 w-4" /> {t('migrate.dashboard')}
        </Button>
        <div>
          <Button variant="ghost" className="gap-2 text-sm" onClick={() => navigate('/migrer')}>
            <Upload className="h-4 w-4" /> {t('migrate.import_another')}
          </Button>
        </div>
      </motion.div>
    </div>
  );
}
