import { motion } from 'framer-motion';
import { Sparkles, Clock, Gift } from 'lucide-react';

/**
 * Motivational tips shown during writing wizard to reduce drop-off.
 */
const TIPS = [
  { icon: '✍️', text: 'Ton livre sera prêt en 5 minutes avec l\'IA' },
  { icon: '💰', text: 'Chaque vente = revenu passif automatique' },
  { icon: '📤', text: 'Tes ambassadeurs vendent pour toi' },
  { icon: '🌍', text: 'Accessible dans tout le monde francophone' },
];

export function WritingMotivation({ step }: { step: number }) {
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
