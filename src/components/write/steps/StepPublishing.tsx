import { motion } from 'framer-motion';
import { Loader2, Building2, BookMarked, FileCheck2, Zap } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

type PublishingStage = 'preparing' | 'org' | 'book' | 'pdf' | 'finalizing';

interface Props {
  stage: PublishingStage;
  willCreateOrg: boolean;
}

export function StepPublishing({ stage, willCreateOrg }: Props) {
  const { t } = useI18n();

  const stages: { key: PublishingStage; icon: typeof Loader2; label: string }[] = [
    { key: 'preparing', icon: Zap, label: t('write.publish_stage_preparing') },
    { key: 'org', icon: Building2, label: willCreateOrg ? t('write.publish_stage_org_create') : t('write.publish_stage_org_check') },
    { key: 'book', icon: BookMarked, label: t('write.publish_stage_book') },
    { key: 'pdf', icon: FileCheck2, label: t('write.publish_stage_pdf') },
    { key: 'finalizing', icon: FileCheck2, label: t('write.publish_stage_finalizing') },
  ];

  const activeIndex = stages.findIndex((item) => item.key === stage);

  return (
    <div className="space-y-8 pt-12">
      {/* Animated splash */}
      <motion.div
        className="text-center space-y-3"
        initial={{ opacity: 0, scale: 0.8 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ type: 'spring', duration: 0.6 }}
      >
        {/* Pulsing ring animation */}
        <div className="relative h-28 w-28 mx-auto flex items-center justify-center">
          <motion.div
            className="absolute inset-0 rounded-full bg-primary/10"
            animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          />
          <motion.div
            className="absolute inset-2 rounded-full bg-primary/15"
            animate={{ scale: [1, 1.2, 1], opacity: [0.7, 0.1, 0.7] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut', delay: 0.3 }}
          />
          <div className="relative h-20 w-20 rounded-3xl bg-primary/10 flex items-center justify-center">
            <Loader2 className="h-10 w-10 text-primary animate-spin" />
          </div>
        </div>

        <motion.h2
          className="text-2xl sm:text-3xl font-extrabold"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
        >
          {t('write.publishing')}
        </motion.h2>
        <motion.p
          className="text-sm text-muted-foreground max-w-sm mx-auto"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          {willCreateOrg ? t('write.publish_org_notice') : t('write.publish_org_existing_notice')}
        </motion.p>
      </motion.div>

      {/* Progress stages */}
      <motion.div
        className="rounded-2xl border border-border bg-card p-4 space-y-3"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        {stages.map((item, index) => {
          const isActive = index === activeIndex;
          const isDone = index < activeIndex;
          const Icon = item.icon;

          return (
            <motion.div
              key={item.key}
              className="flex items-center gap-3"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.5 + index * 0.1 }}
            >
              <div className={`h-8 w-8 rounded-full flex items-center justify-center transition-colors ${isDone ? 'bg-primary/20' : 'bg-muted'}`}>
                {isDone ? (
                  <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}>
                    <svg className="h-4 w-4 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                ) : (
                  <Icon className={`h-4 w-4 ${isActive ? 'text-primary animate-spin' : 'text-muted-foreground'}`} />
                )}
              </div>
              <p className={`text-sm ${isActive || isDone ? 'text-foreground font-medium' : 'text-muted-foreground'}`}>
                {item.label}
              </p>
            </motion.div>
          );
        })}
      </motion.div>
    </div>
  );
}
