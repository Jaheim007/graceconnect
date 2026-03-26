import { motion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nContext';

const TIPS = {
  fr: [
    { icon: '💡', text: 'Partage tes liens aux heures de pointe (12h-14h et 19h-21h) pour maximiser les clics.' },
    { icon: '🔥', text: 'Les produits gratuits convertissent 3x plus. Utilise-les comme entrée de tunnel.' },
    { icon: '📱', text: 'WhatsApp est le canal #1. Envoie ton lien dans 3 groupes différents.' },
    { icon: '💰', text: 'Choisis les produits à forte commission (30%+) pour des gains plus importants.' },
    { icon: '📊', text: 'Suis tes clics et conversions pour identifier les meilleurs produits à promouvoir.' },
    { icon: '🎯', text: 'Personnalise ton message : "J\'ai lu ce livre et je te le recommande" fonctionne mieux.' },
    { icon: '⚡', text: 'Partage juste après un achat — l\'enthousiasme est contagieux !' },
  ],
  en: [
    { icon: '💡', text: 'Share your links at peak hours (12pm-2pm and 7pm-9pm) to maximize clicks.' },
    { icon: '🔥', text: 'Free products convert 3x more. Use them as a funnel entry.' },
    { icon: '📱', text: 'WhatsApp is the #1 channel. Send your link to 3 different groups.' },
    { icon: '💰', text: 'Choose high-commission products (30%+) for bigger earnings.' },
    { icon: '📊', text: 'Track your clicks and conversions to identify the best products to promote.' },
    { icon: '🎯', text: 'Personalize your message: "I read this book and recommend it" works better.' },
    { icon: '⚡', text: 'Share right after a purchase — enthusiasm is contagious!' },
  ],
};

export function DailyTip() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const tips = isFr ? TIPS.fr : TIPS.en;
  const dayOfYear = Math.floor((Date.now() - new Date(new Date().getFullYear(), 0, 0).getTime()) / 86400000);
  const tip = tips[dayOfYear % tips.length];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.25 }}
      className="flex items-start gap-3 p-4 rounded-xl border border-accent/20 bg-accent/5"
    >
      <span className="text-xl shrink-0 mt-0.5">{tip.icon}</span>
      <div>
        <p className="text-xs font-bold text-accent mb-0.5">💡 {isFr ? 'Astuce du jour' : 'Tip of the day'}</p>
        <p className="text-sm text-foreground leading-relaxed">{tip.text}</p>
      </div>
    </motion.div>
  );
}
