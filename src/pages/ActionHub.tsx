import { motion } from 'framer-motion';
import { BookOpen, Store, Share2, Compass, ArrowRight, Sparkles, Package, LayoutDashboard, Building2, GraduationCap, Shield } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { Button } from '@/components/ui/button';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { GlobalPreferencesSelector } from '@/components/global/GlobalPreferencesSelector';
import { cn } from '@/lib/utils';
import { useUserProfile } from '@/hooks/useUserProfile';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08, delayChildren: 0.15 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20, scale: 0.95 },
  show: { opacity: 1, y: 0, scale: 1, transition: { type: 'spring' as const, stiffness: 300, damping: 24 } },
};

export default function ActionHub() {
  const navigate = useNavigate();
  const { user, isSuperadmin } = useAuth();
  const { userOrgs, canManage } = useOrg();
  const { locale, t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { hasPurchases, hasOrgs, hasAffiliateLinks } = useUserProfile();
  const isFr = locale === 'fr';
  const hasManageableOrg = userOrgs.some(o => canManage(o.id));
  const hasActivity = hasManageableOrg || hasAffiliateLinks || hasPurchases;

  const displayName = user?.user_metadata?.display_name || user?.user_metadata?.full_name;

  const actions = [
    ...(user && hasPurchases ? [{
      id: 'purchases',
      icon: Package,
      emoji: '📚',
      title: isFr ? 'Mes achats' : 'My Purchases',
      desc: isFr ? 'Accéder à mes livres et ressources' : 'Access my books and resources',
      route: '/resources',
      border: 'border-primary/30 hover:border-primary/60',
      iconBg: 'bg-primary/15',
      iconColor: 'text-primary',
    }] : []),
    {
      id: 'write',
      icon: BookOpen,
      emoji: '✏️',
      title: isFr ? 'Écrire un livre' : 'Write a book',
      desc: isFr ? "Crée ton livre avec l'IA et vends-le" : 'Create your book with AI and sell it',
      route: '/ecrire',
      border: 'border-primary/30 hover:border-primary/60',
      iconBg: 'bg-primary/15',
      iconColor: 'text-primary',
    },
    {
      id: 'course',
      icon: GraduationCap,
      emoji: '🎓',
      title: isFr ? 'Créer une formation' : 'Create a course',
      desc: isFr ? "Crée ta formation avec l'IA en quelques minutes" : 'Create your course with AI in minutes',
      route: hasManageableOrg ? '/admin/programs' : user ? '/create-org' : '/creer-formation',
      border: 'border-sky-500/30 hover:border-sky-500/60',
      iconBg: 'bg-sky-500/15',
      iconColor: 'text-sky-500',
    },
    {
      id: 'sell',
      icon: Store,
      emoji: '🛒',
      title: isFr ? 'Vendre' : 'Sell',
      desc: isFr ? 'Vends tes livres, formations et plus' : 'Sell your books, courses & more',
      route: hasManageableOrg ? '/admin/products' : user ? '/create-org' : '/vendre',
      border: 'border-amber-500/30 hover:border-amber-500/60',
      iconBg: 'bg-amber-500/15',
      iconColor: 'text-amber-500',
    },
    {
      id: 'share',
      icon: Share2,
      emoji: '💰',
      title: isFr ? 'Gagner' : 'Earn',
      desc: isFr ? 'Partage et gagne de l\'argent' : 'Share & earn money',
      route: '/gagner',
      border: 'border-emerald-500/30 hover:border-emerald-500/60',
      iconBg: 'bg-emerald-500/15',
      iconColor: 'text-emerald-500',
    },
    {
      id: 'discover',
      icon: Compass,
      emoji: '🔍',
      title: isFr ? 'Découvrir' : 'Discover',
      desc: isFr ? 'Voir et acheter des livres, formations et plus' : 'Browse & buy books, courses & more',
      route: '/discover',
      border: 'border-violet-500/30 hover:border-violet-500/60',
      iconBg: 'bg-violet-500/15',
      iconColor: 'text-violet-500',
    },
    ...(user && hasActivity ? [{
      id: 'dashboard',
      icon: LayoutDashboard,
      emoji: '📊',
      title: isFr ? 'Tableau de bord' : 'Dashboard',
      desc: isFr ? 'Voir tes chiffres et statistiques' : 'View your stats and numbers',
      route: '/dashboard',
      border: 'border-slate-500/30 hover:border-slate-500/60',
      iconBg: 'bg-slate-500/15',
      iconColor: 'text-slate-500',
    }] : []),
    ...(user && hasOrgs ? [{
      id: 'orgs',
      icon: Building2,
      emoji: '🏪',
      title: isFr ? 'Mes organisations' : 'My organizations',
      desc: isFr ? 'Voir ou créer une boutique / organisation' : 'View or create a store / organization',
      route: hasManageableOrg ? '/admin' : '/create-org',
      border: 'border-orange-500/30 hover:border-orange-500/60',
      iconBg: 'bg-orange-500/15',
      iconColor: 'text-orange-500',
    }] : []),
    ...(isSuperadmin ? [{
      id: 'superadmin',
      icon: Shield,
      emoji: '🛡️',
      title: 'Super Admin',
      desc: isFr ? 'Gérer la plateforme' : 'Manage the platform',
      route: '/superadmin',
      border: 'border-rose-500/30 hover:border-rose-500/60',
      iconBg: 'bg-rose-500/15',
      iconColor: 'text-rose-500',
    }] : []),
  ];

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <SEOHead
        title="SiteViral — Écris. Vends. Gagne."
        description="Écris ton livre en 5 minutes avec l'IA. Vends-le. Fais-le distribuer par des ambassadeurs. Mobile Money inclus. Gratuit."
        canonicalUrl="https://siteviral.com"
        keywords="écrire un livre IA, vendre ebook Afrique, gagner argent en partageant, programme ambassadeur, Mobile Money"
        jsonLd={[
          {
            '@context': 'https://schema.org',
            '@type': 'SoftwareApplication',
            name: 'SiteViral',
            url: 'https://siteviral.com',
            applicationCategory: 'BusinessApplication',
            operatingSystem: 'Web',
            description: "Écris ton livre en 5 minutes avec l'IA. Vends-le. Fais-le distribuer par des ambassadeurs.",
            offers: {
              '@type': 'Offer',
              price: '0',
              priceCurrency: 'XOF',
              description: 'Gratuit. Commission de 10% sur les ventes uniquement.',
            },
          },
        ]}
      />

      {/* Minimal top bar */}
      <header className="h-14 sticky top-0 z-40 glass border-b border-border flex items-center px-4 gap-3">
        <SiteLogo size="sm" animate />
        <div className="flex-1" />
        <GlobalPreferencesSelector />
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        {user ? (
          <Button size="sm" className="h-8 text-xs" onClick={() => navigate('/dashboard')}>
            {isFr ? 'Tableau de bord' : 'Dashboard'}
          </Button>
        ) : (
          <Button size="sm" className="h-8 text-xs" onClick={() => navigate('/auth')}>
            {t('topbar.sign_in')}
          </Button>
        )}
      </header>

      {/* Main content */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-8">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="w-full max-w-md space-y-6"
        >
          {/* Hero text */}
          <motion.div variants={item} className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-2">
              <Sparkles className="h-3 w-3" />
              {isFr ? 'Gratuit pour commencer' : 'Free to start'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground">
              {user && displayName
                ? (isFr ? `Salut ${displayName} 👋` : `Hey ${displayName} 👋`)
                : (isFr ? 'Que veux-tu faire ?' : 'What do you want to do?')}
            </h1>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {user
                ? (isFr ? 'Que veux-tu faire aujourd\'hui ?' : 'What would you like to do today?')
                : (isFr ? 'Crée, vends et gagne — tout en un seul endroit.' : 'Create, sell & earn — all in one place.')}
            </p>
          </motion.div>

          {/* Action cards */}
          <div className="space-y-3">
            {actions.map((action) => (
              <motion.button
                key={action.id}
                variants={item}
                onClick={() => navigate(action.route)}
                className={cn(
                  'w-full flex items-center gap-4 p-4 rounded-2xl border bg-card transition-all duration-200 group text-left',
                  'hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5 active:scale-[0.98]',
                  action.border
                )}
              >
                <div className={cn('h-12 w-12 rounded-xl flex items-center justify-center shrink-0', action.iconBg)}>
                  <action.icon className={cn('h-5 w-5', action.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-sm text-foreground">{action.title}</div>
                  <div className="text-xs text-muted-foreground mt-0.5">{action.desc}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground group-hover:translate-x-0.5 transition-all shrink-0" />
              </motion.button>
            ))}
          </div>

          {/* Secondary link */}
          <motion.div variants={item} className="text-center pt-2">
            <button
              onClick={() => navigate('/a-propos')}
              className="text-xs text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
            >
              {isFr ? 'En savoir plus sur SiteViral' : 'Learn more about SiteViral'}
            </button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
