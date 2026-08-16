import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Package, Upload, Share2, Zap, ArrowRight, SkipForward } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { useI18n } from '@/i18n/I18nContext';
import { useUserProfile } from '@/hooks/useUserProfile';
import { setOnboardingIntent, type OnboardingIntent } from '@/lib/siteviral/onboardingIntent';

export default function WelcomeIntentPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { userOrgs, canManage } = useOrg();
  const { locale } = useI18n();
  const { hasPurchases } = useUserProfile();
  const isFr = locale === 'fr';
  const hasManagedOrgs = userOrgs.some((org) => canManage(org.id));

  const intents = [
    // Show "My Purchases" only if user has purchases
    ...(hasPurchases ? [{
      key: 'purchases',
      icon: Package,
      emoji: '📚',
      title: isFr ? 'Voir mes achats' : 'My Purchases',
      desc: isFr ? 'Accéder à mes livres, formations et ressources achetées' : 'Access my purchased books, courses and resources',
      color: 'border-primary/30 hover:border-primary',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      badge: null as string | null,
      route: '/my-purchases',
    }] : []),
    {
      key: 'create',
      icon: Zap,
      emoji: '',
      title: isFr ? 'Créer ou publier du contenu' : 'Create or publish content',
      desc: isFr ? 'Écris un livre avec l\'IA ou publie ton propre contenu numérique' : 'Write a book with AI or publish your own digital content',
      color: 'border-purple-500/30 hover:border-purple-500',
      iconBg: 'bg-purple-500/10',
      iconColor: 'text-purple-500',
      badge: isFr ? 'Populaire' : 'Popular',
      route: hasManagedOrgs ? '/admin/create' : '/ecrire',
    },
    {
      key: 'upload',
      icon: Upload,
      emoji: '📤',
      title: isFr ? 'Ajouter mes produits' : 'Upload my products',
      desc: isFr ? 'J\'ai déjà un livre, un guide ou une ressource prête à publier' : 'I already have a book, guide or resource ready to publish',
      color: 'border-amber-500/30 hover:border-amber-500',
      iconBg: 'bg-amber-500/10',
      iconColor: 'text-amber-500',
      badge: null as string | null,
      route: (() => {
        const managed = userOrgs.filter((org) => canManage(org.id));
        if (managed.length >= 1) return '/admin/content';
        return '/create-org';
      })(),
    },
    {
      key: 'earn',
      icon: Share2,
      emoji: '🔗',
      title: isFr ? 'Partager et gagner' : 'Share and earn',
      desc: isFr ? 'Partage des produits et gagne jusqu\'à 50% de commission' : 'Share products and earn up to 50% commission',
      color: 'border-emerald-500/30 hover:border-emerald-500',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
      badge: isFr ? '5-50% commission' : '5-50% commission',
      route: '/gagner',
    },
  ];

  const markSeen = () => {
    if (user) {
      sessionStorage.setItem(`sv_welcome_seen_${user.id}`, 'true');
    }
  };

  const handleSelect = (intent: typeof intents[0]) => {
    markSeen();
    // The intent is a sorting hint only — it never locks the user into a role.
    setOnboardingIntent(intent.key as OnboardingIntent);
    if (user) {
      import('@/lib/db').then(({ db }) => {
        db.from('profiles').update({ onboarding_intent: intent.key }).eq('id', user.id);
      });
    }
    navigate(intent.route);
  };

  const handleSkip = () => {
    markSeen();
    navigate('/dashboard');
  };

  return (
    <div className="sv-nav-clearance min-h-[100dvh] bg-background flex items-start sm:items-center justify-center p-4 pb-10 sm:py-10">
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
          <motion.button
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            onClick={handleSkip}
            className="mt-3 inline-flex items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-primary transition-colors"
          >
            <SkipForward className="h-3.5 w-3.5" />
            {isFr ? 'Passer cette étape' : 'Skip this step'}
          </motion.button>
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

      </div>
    </div>
  );
}
