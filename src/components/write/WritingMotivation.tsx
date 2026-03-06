import { motion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nContext';

export function WritingMotivation({ step }: { step: number }) {
  const { t } = useI18n();

  const TIPS = [
    { icon: '✍️', text: t('write.motivation_1') },
    { icon: '💰', text: t('write.motivation_2') },
    { icon: '📤', text: t('write.motivation_3') },
    { icon: '🌍', text: t('write.motivation_4') },
  ];

  const tip = TIPS[step % TIPS.length];

  return (
    <motion.div
      key={step}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -8 }}
      className="flex items-center gap-2 justify-center py-2 text-xs text-muted-foreground"
    >
      <span className="text-sm">{tip.icon}</span>
      <span>{tip.text}</span>
    </motion.div>
  );
}
