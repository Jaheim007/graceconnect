import { motion } from 'framer-motion';
import { ArrowRight, Sparkles } from 'lucide-react';
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
import { getActionNavItems } from '@/lib/navigation/actionNavItems';

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 400, damping: 28 } },
};

export default function ActionHub() {
  const navigate = useNavigate();
  const { user, isSuperadmin } = useAuth();
  const { userOrgs, canManage } = useOrg();
  const { locale } = useI18n();
  const { theme, toggleTheme } = useTheme();
  const { hasPurchases, hasOrgs } = useUserProfile();
  const isFr = locale === 'fr';
  const hasManageableOrg = userOrgs.some(o => canManage(o.id));

  const displayName = user?.user_metadata?.display_name || user?.user_metadata?.full_name;

  const resolveRoute = (id: string) => {
    switch (id) {
      case 'course': return hasManageableOrg ? '/admin/programs' : user ? '/create-org' : '/creer-formation';
      case 'sell': return hasManageableOrg ? '/admin/products' : user ? '/create-org' : '/vendre';
      case 'orgs': return hasManageableOrg ? '/admin' : '/create-org';
      default: return '';
    }
  };

  const actions = getActionNavItems({
    isAuthenticated: !!user,
    hasPurchases,
    hasManageableOrg,
    hasOrgs,
    isSuperadmin,
  }, resolveRoute);

  return (
    <div className="min-h-[100dvh] flex flex-col bg-background">
      <SEOHead
        title="SiteViral — Écris. Vends. Gagne."
        description="Écris ton livre en 5 minutes avec l'IA. Vends-le. Fais-le distribuer par des ambassadeurs. Mobile Money inclus. Gratuit."
        canonicalUrl="https://siteviral.com"
        keywords="écrire un livre IA, vendre ebook Afrique, gagner argent en partageant, programme ambassadeur, Mobile Money"
        jsonLd={[{
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
        }]}
      />

      {/* Compact mobile-first top bar */}
      <header className="h-12 sm:h-14 sticky top-0 z-40 glass border-b border-border flex items-center px-3 sm:px-4 gap-2">
        <SiteLogo size="sm" animate />
        <div className="flex-1" />
        <GlobalPreferencesSelector />
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        {user ? (
          <Button size="sm" className="h-8 text-xs font-semibold rounded-xl px-4" onClick={() => navigate('/dashboard')}>
            {isFr ? 'Tableau de bord' : 'Dashboard'}
          </Button>
        ) : (
          <Button size="sm" className="h-8 text-xs font-semibold rounded-xl px-4" onClick={() => navigate('/auth')}>
            {isFr ? 'Connexion' : 'Sign in'}
          </Button>
        )}
      </header>

      {/* Main content — centered vertically, mobile-optimized spacing */}
      <main className="flex-1 flex flex-col items-center justify-center px-4 py-6 pb-28 sm:pb-8">
        <motion.div
          variants={container}
          initial="hidden"
          animate="show"
          className="w-full max-w-md space-y-5"
        >
          {/* Compact hero */}
          <motion.div variants={item} className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold mb-1">
              <Sparkles className="h-3 w-3" />
              {isFr ? 'Gratuit pour commencer' : 'Free to start'}
            </div>
            <h1 className="text-xl sm:text-2xl font-black tracking-tight text-foreground leading-tight">
              {user && displayName
                ? (isFr ? `Salut ${displayName} 👋` : `Hey ${displayName} 👋`)
                : (isFr ? 'Que veux-tu faire ?' : 'What do you want to do?')}
            </h1>
            {!user && (
              <p className="text-xs text-muted-foreground max-w-[260px] mx-auto">
                {isFr ? 'Crée, vends et gagne — tout en un seul endroit.' : 'Create, sell & earn — all in one place.'}
              </p>
            )}
          </motion.div>

          {/* Action cards — larger touch targets */}
          <div className="space-y-2.5">
            {actions.map((action) => (
              <motion.button
                key={action.id}
                variants={item}
                onClick={() => navigate(action.route)}
                className={cn(
                  'w-full flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl border bg-card transition-all duration-150 group text-left',
                  'active:scale-[0.97] active:opacity-80',
                  'hover:shadow-lg hover:shadow-black/5 hover:-translate-y-0.5',
                  action.borderClass
                )}
              >
                <div className={cn('h-11 w-11 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center shrink-0', action.iconBg)}>
                  <action.icon className={cn('h-5 w-5', action.iconColor)} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-bold text-[13px] sm:text-sm text-foreground leading-tight">{isFr ? action.titleFr : action.titleEn}</div>
                  <div className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-snug">{isFr ? action.descFr : action.descEn}</div>
                </div>
                <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-foreground transition-all shrink-0" />
              </motion.button>
            ))}
          </div>

          {/* Footer link */}
          <motion.div variants={item} className="text-center pt-1">
            <button
              onClick={() => navigate('/a-propos')}
              className="text-[10px] text-muted-foreground hover:text-foreground transition-colors underline underline-offset-2"
            >
              {isFr ? 'En savoir plus sur SiteViral' : 'Learn more about SiteViral'}
            </button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
