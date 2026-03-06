import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PenLine, Share2, Upload, ShoppingBag, ArrowRight, Sparkles } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { useAuth } from '@/contexts/AuthContext';

const intents = [
  {
    key: 'writer',
    icon: PenLine,
    emoji: '✏️',
    title: 'Écrire mon livre',
    desc: 'L\'IA t\'aide à écrire et publier en 5 minutes.',
    color: 'border-primary/30 hover:border-primary',
    iconBg: 'bg-primary/10',
    iconColor: 'text-primary',
    badge: null,
    route: '/ecrire',
  },
  {
    key: 'ambassador',
    icon: Share2,
    emoji: '💰',
    title: 'Gagner en partageant',
    desc: 'Partage des produits. Touche 5-50% de commission.',
    color: 'border-emerald-500/30 hover:border-emerald-500',
    iconBg: 'bg-emerald-500/10',
    iconColor: 'text-emerald-500',
    badge: '🔥 Populaire',
    route: '/gagner',
  },
  {
    key: 'creator',
    icon: Upload,
    emoji: '📤',
    title: 'Importer mon contenu',
    desc: 'Tu as déjà un ebook ou un PDF ? Vends-le ici.',
    color: 'border-accent/30 hover:border-accent',
    iconBg: 'bg-accent/10',
    iconColor: 'text-accent',
    badge: null,
    route: '/migrer',
  },
  {
    key: 'buyer',
    icon: ShoppingBag,
    emoji: '🛒',
    title: 'Explorer les ressources',
    desc: 'Découvre des livres, formations et plus.',
    color: 'border-border hover:border-primary/30',
    iconBg: 'bg-muted',
    iconColor: 'text-muted-foreground',
    badge: null,
    route: '/discover',
  },
];

export default function WelcomeIntentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const intentParam = searchParams.get('intent');

  // If there's a redirect intent from auth, go there directly
  const matchedIntent = intents.find(i => i.key === intentParam);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SEOHead title="Bienvenue — SiteViral" description="Que veux-tu faire sur SiteViral ?" noindex />
      <div className="w-full max-w-md">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="text-center mb-8"
        >
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.1, type: 'spring', stiffness: 200, damping: 15 }}
            className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4"
          >
            <Sparkles className="h-7 w-7 text-primary" />
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
            Bienvenue{user?.user_metadata?.display_name ? ` ${user.user_metadata.display_name}` : ''} ! 🎉
          </h1>
          <p className="text-muted-foreground text-sm">
            Que veux-tu faire ? Tu pourras toujours changer plus tard.
          </p>
        </motion.div>

        <div className="grid gap-3">
          {intents.map((intent, i) => (
            <motion.button
              key={intent.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.3 }}
              onClick={() => navigate(intent.route)}
              className={`relative w-full flex items-center gap-4 p-5 rounded-2xl border-2 ${intent.color} bg-card text-left transition-all duration-200 hover:shadow-elevated group`}
            >
              {intent.badge && (
                <span className="absolute -top-2.5 right-4 bg-emerald-500 text-white text-[10px] font-bold px-3 py-0.5 rounded-full">
                  {intent.badge}
                </span>
              )}
              <div className={`h-11 w-11 rounded-xl ${intent.iconBg} flex items-center justify-center shrink-0`}>
                <intent.icon className={`h-5 w-5 ${intent.iconColor}`} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-base font-bold">{intent.emoji} {intent.title}</h3>
                <p className="text-xs text-muted-foreground mt-0.5">{intent.desc}</p>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground shrink-0 group-hover:translate-x-1 transition-transform" />
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}
