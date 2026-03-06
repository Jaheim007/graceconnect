import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, RefreshCw, Sparkles } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Tip {
  emoji: string;
  title: string;
  desc: string;
  category: 'creator' | 'ambassador' | 'general';
}

const ALL_TIPS: Tip[] = [
  // Creator tips
  { emoji: '✏️', title: 'Écris ton premier livre', desc: 'L\'IA peut t\'aider à écrire un ebook complet en 5 minutes. Essaie maintenant !', category: 'creator' },
  { emoji: '📸', title: 'Soigne ta couverture', desc: 'Un beau visuel = 3x plus de clics. Utilise un design coloré et lisible.', category: 'creator' },
  { emoji: '💡', title: 'Titre accrocheur', desc: 'Les titres avec des chiffres ("7 secrets pour...") se vendent 2x mieux.', category: 'creator' },
  { emoji: '📦', title: 'Crée un bundle', desc: 'Combine plusieurs produits en un pack à prix réduit pour augmenter ton panier moyen.', category: 'creator' },
  { emoji: '🎓', title: 'Lance une formation', desc: 'Transforme ton expertise en cours en ligne. Les formations ont le meilleur taux de rétention.', category: 'creator' },

  // Ambassador tips
  { emoji: '💬', title: 'Partage sur WhatsApp', desc: 'WhatsApp est le canal #1 en Afrique. Partage dans tes groupes pour un maximum de visibilité.', category: 'ambassador' },
  { emoji: '📊', title: 'Cible les bons groupes', desc: 'Partage des produits pertinents dans des groupes thématiques. Qualité > Quantité.', category: 'ambassador' },
  { emoji: '🔄', title: 'Partage régulièrement', desc: 'Les meilleurs ambassadeurs partagent 2-3 fois par semaine. La constance paie !', category: 'ambassador' },
  { emoji: '💰', title: 'Choisis les top commissions', desc: 'Filtre par commission élevée dans la marketplace pour maximiser tes gains.', category: 'ambassador' },
  { emoji: '📱', title: 'Utilise les stories', desc: 'Partage tes gains et découvertes en story WhatsApp/Instagram pour inspirer ton réseau.', category: 'ambassador' },

  // General
  { emoji: '🎯', title: 'Complète ton profil', desc: 'Un profil complet avec photo inspire confiance et améliore tes conversions.', category: 'general' },
  { emoji: '⭐', title: 'Laisse des avis', desc: 'Les avis aident les autres acheteurs et renforcent la communauté.', category: 'general' },
  { emoji: '🤝', title: 'Invite tes amis', desc: 'Chaque ami invité qui achète te rapporte des récompenses. Partage ton lien !', category: 'general' },
];

interface GrowthTipsWidgetProps {
  category?: 'creator' | 'ambassador' | 'general' | 'all';
  className?: string;
}

/**
 * GrowthTipsWidget — daily actionable tips for users
 * Rotates through relevant tips based on user type
 */
export function GrowthTipsWidget({ category = 'all', className }: GrowthTipsWidgetProps) {
  const filteredTips = useMemo(() => {
    if (category === 'all') return ALL_TIPS;
    return ALL_TIPS.filter(t => t.category === category || t.category === 'general');
  }, [category]);

  // Daily tip based on date seed
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const [tipIndex, setTipIndex] = useState(dayOfYear % filteredTips.length);

  const tip = filteredTips[tipIndex];

  const nextTip = () => {
    setTipIndex((tipIndex + 1) % filteredTips.length);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn('bg-card border border-border rounded-2xl p-4', className)}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Astuce du jour</span>
        </div>
        <button
          onClick={nextTip}
          className="p-1.5 rounded-lg hover:bg-muted transition-colors"
          title="Astuce suivante"
        >
          <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      <motion.div
        key={tipIndex}
        initial={{ opacity: 0, x: 10 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.2 }}
        className="flex items-start gap-3"
      >
        <span className="text-2xl shrink-0">{tip.emoji}</span>
        <div>
          <p className="text-sm font-bold">{tip.title}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{tip.desc}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
