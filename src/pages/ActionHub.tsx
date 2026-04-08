import { motion } from 'framer-motion';
import { BookOpen, Store, Share2, Compass, ArrowRight, Sparkles } from 'lucide-react';
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
  const { user } = useAuth();
  const { userOrgs, canManage } = useOrg();
  const { locale, t } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const isFr = locale === 'fr';
  const hasManageableOrg = userOrgs.some(o => canManage(o.id));

  const actions = [
    {
      id: 'write',
      icon: BookOpen,
      emoji: '✏️',
      title: isFr ? 'Écrire un livre' : 'Write a book',
      desc: isFr ? "L'IA écrit, tu publies en 5 min" : 'AI writes, you publish in 5 min',
      route: user ? '/ecrire' : '/ecrire',
      gradient: 'from-primary/20 to-primary/5',
      border: 'border-primary/30 hover:border-primary/60',
      iconBg: 'bg-primary/15',
      iconColor: 'text-primary',
    },
    {
      id: 'sell',
      icon: Store,
      emoji: '🛒',
      title: isFr ? 'Vendre' : 'Sell',
      desc: isFr ? 'Publie et monétise tes créations' : 'Publish & monetize your creations',
      route: hasManageableOrg ? '/admin/products' : user ? '/create-org' : '/auth?mode=signup&next=/create-org',
      gradient: 'from-amber-500/20 to-amber-500/5',
      border: 'border-amber-500/30 hover:border-amber-500/60',
      iconBg: 'bg-amber-500/15',
      iconColor: 'text-amber-500',
    },
    {
      id: 'share',
      icon: Share2,
      emoji: '💰',
      title: isFr ? 'Gagner' : 'Earn',
      desc: isFr ? 'Partage et gagne des commissions' : 'Share & earn commissions',
      route: '/gagner',
      gradient: 'from-emerald-500/20 to-emerald-500/5',
      border: 'border-emerald-500/30 hover:border-emerald-500/60',
      iconBg: 'bg-emerald-500/15',
      iconColor: 'text-emerald-500',
    },
    {
      id: 'discover',
      icon: Compass,
      emoji: '🔍',
      title: isFr ? 'Découvrir' : 'Discover',
      desc: isFr ? 'Explore livres, cours et plus' : 'Explore books, courses & more',
      route: '/discover',
      gradient: 'from-violet-500/20 to-violet-500/5',
      border: 'border-violet-500/30 hover:border-violet-500/60',
      iconBg: 'bg-violet-500/15',
      iconColor: 'text-violet-500',
    },
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
            {isFr ? 'Mon espace' : 'My space'}
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
              {isFr ? 'Que veux-tu faire ?' : 'What do you want to do?'}
            </h1>
            <p className="text-sm text-muted-foreground max-w-xs mx-auto">
              {isFr
                ? 'Crée, vends et gagne — tout en un seul endroit.'
                : 'Create, sell & earn — all in one place.'}
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
