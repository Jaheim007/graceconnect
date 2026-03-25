import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ShoppingBag, Store, Share2, Sparkles, ArrowRight, SkipForward } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { useI18n } from '@/i18n/I18nContext';

export default function WelcomeIntentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const intents = [
    {
      key: 'purchases',
      icon: ShoppingBag,
      emoji: '📦',
      title: isFr ? 'Mes Achats' : 'My Purchases',
      desc: isFr ? 'Voir et gérer mes achats, télécharger mes ressources' : 'View and manage my purchases, download my resources',
      color: 'border-primary/30 hover:border-primary',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      badge: null as string | null,
      route: '/resources',
    },
    {
      key: 'earn',
      icon: Share2,
      emoji: '🔗',
      title: isFr ? 'Gagner en partageant' : 'Earn by sharing',
      desc: isFr ? 'Partager des produits et gagner des commissions' : 'Share products and earn commissions',
      color: 'border-emerald-500/30 hover:border-emerald-500',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
      badge: isFr ? '5-50% commission' : '5-50% commission',
      route: '/affiliation',
    },
    {
      key: 'create',
      icon: Sparkles,
      emoji: '✨',
      title: isFr ? 'Créer avec l\'IA' : 'Create with AI',
      desc: isFr ? 'Écrire un livre ou créer une formation en 5 minutes avec l\'IA' : 'Write a book or create a formation in 5 minutes with AI',
      color: 'border-purple-500/30 hover:border-purple-500',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-500',
      badge: isFr ? 'Nouveau' : 'New',
      route: '/admin/create',
    },
    {
      key: 'sell',
      icon: Store,
      emoji: '🛒',
      title: isFr ? 'Vendre mon contenu' : 'Sell my content',
      desc: isFr ? 'Je veux vendre mes ebooks, formations ou fichiers numériques' : 'I want to sell my ebooks, formations or digital files',
      color: 'border-blue-500/30 hover:border-blue-500',
      iconBg: 'bg-blue-500/10',
      iconColor: 'text-blue-500',
      badge: null,
      route: '/admin/create',
    },
  ];

  const handleSelect = (intent: typeof intents[0]) => {
    sessionStorage.setItem('sv_welcome_seen', 'true');
    if (user) {
      import('@/lib/db').then(({ db }) => {
        db.from('profiles').update({ onboarding_intent: intent.key }).eq('id', user.id);
      });
    }
    navigate(intent.route);
  };

  const handleSkip = () => {
    sessionStorage.setItem('sv_welcome_seen', 'true');
    navigate('/dashboard');
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SEOHead title={`${isFr ? 'Bienvenue' : 'Welcome'} — SiteViral`} description={isFr ? 'Choisissez votre espace' : 'Choose your space'} noindex />
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
            className="mx-auto mb-4"
          >
            <SiteLogo size="xl" linked={false} />
          </motion.div>
          <h1 className="text-2xl sm:text-3xl font-extrabold mb-2">
            {isFr ? 'Bienvenue' : 'Welcome'}{user?.user_metadata?.display_name ? ` ${user.user_metadata.display_name}` : ''} ! 🎉
          </h1>
          <p className="text-muted-foreground text-sm">
            {isFr ? 'Que souhaitez-vous faire aujourd\'hui ?' : 'What would you like to do today?'}
          </p>
        </motion.div>

        <div className="grid gap-3">
          {intents.map((intent, i) => (
            <motion.button
              key={intent.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.3 }}
              onClick={() => handleSelect(intent)}
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

        {/* Skip button below */}
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          onClick={handleSkip}
          className="mt-6 w-full flex items-center justify-center gap-2 text-sm font-medium text-primary hover:text-primary/80 transition-colors py-2.5 rounded-xl border border-primary/20 hover:border-primary/40 bg-primary/5"
        >
          <SkipForward className="h-4 w-4" />
          {isFr ? 'Passer cette étape' : 'Skip this step'}
        </motion.button>
      </div>
    </div>
  );
}
