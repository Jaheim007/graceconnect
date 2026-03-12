import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Lightbulb, RefreshCw } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

interface Tip {
  emoji: string;
  title: { fr: string; en: string };
  desc: { fr: string; en: string };
  category: 'creator' | 'ambassador' | 'general';
}

const ALL_TIPS: Tip[] = [
  { emoji: '✏️', title: { fr: 'Écris ton premier livre', en: 'Write your first book' }, desc: { fr: 'L\'IA peut t\'aider à écrire un ebook complet en 5 minutes. Essaie maintenant !', en: 'AI can help you write a complete ebook in 5 minutes. Try it now!' }, category: 'creator' },
  { emoji: '📸', title: { fr: 'Soigne ta couverture', en: 'Polish your cover' }, desc: { fr: 'Un beau visuel = 3x plus de clics. Utilise un design coloré et lisible.', en: 'A great visual = 3x more clicks. Use a colorful and readable design.' }, category: 'creator' },
  { emoji: '💡', title: { fr: 'Titre accrocheur', en: 'Catchy title' }, desc: { fr: 'Les titres avec des chiffres ("7 secrets pour...") se vendent 2x mieux.', en: 'Titles with numbers ("7 secrets to...") sell 2x better.' }, category: 'creator' },
  { emoji: '📦', title: { fr: 'Crée un bundle', en: 'Create a bundle' }, desc: { fr: 'Combine plusieurs produits en un pack à prix réduit pour augmenter ton panier moyen.', en: 'Combine multiple products into a discounted pack to increase your average cart.' }, category: 'creator' },
  { emoji: '🎓', title: { fr: 'Lance une formation', en: 'Launch a course' }, desc: { fr: 'Transforme ton expertise en cours en ligne. Les formations ont le meilleur taux de rétention.', en: 'Turn your expertise into an online course. Courses have the best retention rate.' }, category: 'creator' },
  { emoji: '💬', title: { fr: 'Partage sur WhatsApp', en: 'Share on WhatsApp' }, desc: { fr: 'WhatsApp est le canal #1 en Afrique. Partage dans tes groupes pour un maximum de visibilité.', en: 'WhatsApp is the #1 channel in Africa. Share in your groups for maximum visibility.' }, category: 'ambassador' },
  { emoji: '📊', title: { fr: 'Cible les bons groupes', en: 'Target the right groups' }, desc: { fr: 'Partage des produits pertinents dans des groupes thématiques. Qualité > Quantité.', en: 'Share relevant products in topic-specific groups. Quality > Quantity.' }, category: 'ambassador' },
  { emoji: '🔄', title: { fr: 'Partage régulièrement', en: 'Share regularly' }, desc: { fr: 'Les meilleurs ambassadeurs partagent 2-3 fois par semaine. La constance paie !', en: 'Top ambassadors share 2-3 times a week. Consistency pays!' }, category: 'ambassador' },
  { emoji: '💰', title: { fr: 'Choisis les top commissions', en: 'Pick top commissions' }, desc: { fr: 'Filtre par commission élevée dans la marketplace pour maximiser tes gains.', en: 'Filter by high commission in the marketplace to maximize your earnings.' }, category: 'ambassador' },
  { emoji: '📱', title: { fr: 'Utilise les stories', en: 'Use stories' }, desc: { fr: 'Partage tes gains et découvertes en story WhatsApp/Instagram pour inspirer ton réseau.', en: 'Share your earnings and discoveries on WhatsApp/Instagram stories to inspire your network.' }, category: 'ambassador' },
  { emoji: '🎯', title: { fr: 'Complète ton profil', en: 'Complete your profile' }, desc: { fr: 'Un profil complet avec photo inspire confiance et améliore tes conversions.', en: 'A complete profile with photo builds trust and improves your conversions.' }, category: 'general' },
  { emoji: '⭐', title: { fr: 'Laisse des avis', en: 'Leave reviews' }, desc: { fr: 'Les avis aident les autres acheteurs et renforcent la communauté.', en: 'Reviews help other buyers and strengthen the community.' }, category: 'general' },
  { emoji: '🤝', title: { fr: 'Invite tes amis', en: 'Invite your friends' }, desc: { fr: 'Chaque ami invité qui achète te rapporte des récompenses. Partage ton lien !', en: 'Every invited friend who buys earns you rewards. Share your link!' }, category: 'general' },
];

interface GrowthTipsWidgetProps {
  category?: 'creator' | 'ambassador' | 'general' | 'all';
  className?: string;
}

export function GrowthTipsWidget({ category = 'all', className }: GrowthTipsWidgetProps) {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const filteredTips = useMemo(() => {
    if (category === 'all') return ALL_TIPS;
    return ALL_TIPS.filter(t => t.category === category || t.category === 'general');
  }, [category]);

  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const [tipIndex, setTipIndex] = useState(dayOfYear % filteredTips.length);
  const tip = filteredTips[tipIndex];
  const nextTip = () => setTipIndex((tipIndex + 1) % filteredTips.length);

  return (
    <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className={cn('bg-card border border-border rounded-2xl p-4', className)}>
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <Lightbulb className="h-4 w-4 text-amber-500" />
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">{isFr ? 'Astuce du jour' : 'Tip of the day'}</span>
        </div>
        <button onClick={nextTip} className="p-1.5 rounded-lg hover:bg-muted transition-colors" title={isFr ? 'Astuce suivante' : 'Next tip'}>
          <RefreshCw className="h-3.5 w-3.5 text-muted-foreground" />
        </button>
      </div>

      <motion.div key={tipIndex} initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.2 }} className="flex items-start gap-3">
        <span className="text-2xl shrink-0">{tip.emoji}</span>
        <div>
          <p className="text-sm font-bold">{isFr ? tip.title.fr : tip.title.en}</p>
          <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">{isFr ? tip.desc.fr : tip.desc.en}</p>
        </div>
      </motion.div>
    </motion.div>
  );
}
