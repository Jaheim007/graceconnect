import { motion } from 'framer-motion';
import { BookOpen, Share2, DollarSign, Zap, ArrowRight, Lightbulb, PenTool, GraduationCap, Church, Users, Briefcase, HandCoins } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from '@/lib/router-compat';
import { useI18n } from '@/i18n/I18nContext';

/**
 * Educational activation content hub.
 * Shows guides/tips organized by intent: Sell, Share, Create.
 * Replaces the need for video content with text-based guides.
 */

interface GuideCard {
  emoji: string;
  icon: React.ElementType;
  title: string;
  desc: string;
  action: string;
  route: string;
  color: string;
  bg: string;
}

export function ActivationContentHub() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const guides: GuideCard[] = isFr ? [
    { emoji: '✍️', icon: PenTool, title: 'Comment écrire un livre en 5 min', desc: 'L\'IA écrit pour toi. Tu choisis le sujet, elle fait le reste.', action: 'Commencer', route: '/ecrire', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { emoji: '🎓', icon: GraduationCap, title: 'Créer une formation en 5 min', desc: 'Transforme ton expertise en cours vendable avec l\'IA.', action: 'Créer', route: '/admin/create', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { emoji: '💰', icon: Share2, title: 'Gagner sans rien créer', desc: 'Partage des produits existants et touche 5 à 50% de commission.', action: 'Voir les produits', route: '/gagner', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { emoji: '🛒', icon: DollarSign, title: 'Vendre ton contenu existant', desc: 'Tu as déjà un ebook, une formation ? Mets-le en vente en 2 min.', action: 'Publier', route: '/admin/content', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { emoji: '⛪', icon: Church, title: 'Pour les églises et ministères', desc: 'Monétisez votre impact spirituel : dévotionnels, formations, dons.', action: 'Découvrir', route: '/eglises', color: 'text-stone-500', bg: 'bg-stone-500/10' },
    { emoji: '👩', icon: Users, title: 'Pour les mamans', desc: 'Écris sur ta vie, tes enfants, ta famille. Ton expérience a de la valeur.', action: 'Écrire', route: '/ecrire', color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { emoji: '🧠', icon: Lightbulb, title: 'Tu as de l\'expertise ?', desc: 'Les gens veulent apprendre de toi. Écris dessus et gagne.', action: 'Commencer', route: '/ecrire', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { emoji: '📢', icon: Briefcase, title: 'Lancer ta pub sur Facebook/TikTok', desc: 'Guide simple pour créer des publicités qui attirent des clients.', action: 'Voir le guide', route: '/blog/comment-lancer-publicite', color: 'text-red-500', bg: 'bg-red-500/10' },
  ] : [
    { emoji: '✍️', icon: PenTool, title: 'Write a book in 5 minutes', desc: 'AI writes for you. Pick a topic, it does the rest.', action: 'Start', route: '/ecrire', color: 'text-purple-500', bg: 'bg-purple-500/10' },
    { emoji: '🎓', icon: GraduationCap, title: 'Create a course in 5 min', desc: 'Turn your expertise into a sellable course with AI.', action: 'Create', route: '/admin/create', color: 'text-blue-500', bg: 'bg-blue-500/10' },
    { emoji: '💰', icon: Share2, title: 'Earn without creating', desc: 'Share existing products and earn 5-50% commission.', action: 'See products', route: '/gagner', color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
    { emoji: '🛒', icon: DollarSign, title: 'Sell your existing content', desc: 'Already have an ebook or course? Put it on sale in 2 min.', action: 'Publish', route: '/admin/content', color: 'text-orange-500', bg: 'bg-orange-500/10' },
    { emoji: '⛪', icon: Church, title: 'For churches & ministries', desc: 'Monetize your spiritual impact: devotionals, courses, donations.', action: 'Discover', route: '/eglises', color: 'text-stone-500', bg: 'bg-stone-500/10' },
    { emoji: '👩', icon: Users, title: 'For moms', desc: 'Write about your life, kids, family. Your experience has value.', action: 'Write', route: '/ecrire', color: 'text-pink-500', bg: 'bg-pink-500/10' },
    { emoji: '🧠', icon: Lightbulb, title: 'Got expertise?', desc: 'People want to learn from you. Write about it and earn.', action: 'Start', route: '/ecrire', color: 'text-amber-500', bg: 'bg-amber-500/10' },
    { emoji: '📢', icon: Briefcase, title: 'Launch ads on Facebook/TikTok', desc: 'Simple guide to create ads that attract customers.', action: 'See guide', route: '/blog/comment-lancer-publicite', color: 'text-red-500', bg: 'bg-red-500/10' },
  ];

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <HandCoins className="h-4 w-4 text-primary shrink-0" />
        <h2 className="text-lg font-extrabold">{isFr ? 'Comment gagner sur SiteViral' : 'How to earn on SiteViral'}</h2>
      </div>

      <div className="grid gap-3 sm:grid-cols-2">
        {guides.map((g, i) => (
          <motion.button
            key={g.title}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            onClick={() => navigate(g.route)}
            className="w-full text-left p-4 rounded-2xl border border-border bg-card hover:border-primary/40 transition-all group"
          >
            <div className="flex items-start gap-3">
              <div className={`h-9 w-9 rounded-xl ${g.bg} flex items-center justify-center shrink-0`}>
                <g.icon className={`h-4 w-4 ${g.color}`} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold mb-0.5">{g.emoji} {g.title}</p>
                <p className="text-[11px] text-muted-foreground leading-relaxed">{g.desc}</p>
                <span className="inline-flex items-center gap-1 mt-2 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
                  {g.action} <ArrowRight className="h-3 w-3" />
                </span>
              </div>
            </div>
          </motion.button>
        ))}
      </div>
    </div>
  );
}
