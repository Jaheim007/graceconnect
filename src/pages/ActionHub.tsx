import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, BookOpen, GraduationCap, Store, Compass, HandCoins, Rocket } from 'lucide-react';
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

  /** Visitor menu — the core SiteViral actions, no marketplace surfaces. */
  const visitorActions = [
    { id: 'write', icon: BookOpen, titleFr: 'Écrire un livre avec l\'IA', titleEn: 'Write a book with AI',
      descFr: "De l'idée au livre prêt à vendre", descEn: 'From idea to a sellable book',
      route: '/ecrire', borderClass: 'border-primary/30 hover:border-primary/60',
      iconBg: 'bg-primary/15', iconColor: 'text-primary' },
    { id: 'course', icon: GraduationCap, titleFr: 'Créer une formation', titleEn: 'Create a formation',
      descFr: 'Modules, leçons, quiz et certificats', descEn: 'Modules, lessons, quizzes and certificates',
      route: '/creer-formation', borderClass: 'border-indigo-500/30 hover:border-indigo-500/60',
      iconBg: 'bg-indigo-500/15', iconColor: 'text-indigo-500' },
    { id: 'sell', icon: Store, titleFr: 'Vendre mes produits digitaux', titleEn: 'Sell my digital products',
      descFr: 'Ebooks, PDF, formations — paiements inclus', descEn: 'Ebooks, PDFs, formations — payments included',
      route: '/vendre', borderClass: 'border-amber-500/30 hover:border-amber-500/60',
      iconBg: 'bg-amber-500/15', iconColor: 'text-amber-500' },
    { id: 'platform', icon: Rocket, titleFr: 'Créer ma plateforme', titleEn: 'Create my platform',
      descFr: 'Créateur, organisation, ONG, communauté ou église', descEn: 'Creator, organization, NGO, community or church',
      route: '/create-org', borderClass: 'border-sky-500/30 hover:border-sky-500/60',
      iconBg: 'bg-sky-500/15', iconColor: 'text-sky-500' },
    { id: 'earn', icon: HandCoins, titleFr: 'Gagner avec l\'affiliation', titleEn: 'Earn through affiliation',
      descFr: 'Partage et touche des commissions', descEn: 'Share products and earn commissions',
      route: '/gagner', borderClass: 'border-emerald-500/30 hover:border-emerald-500/60',
      iconBg: 'bg-emerald-500/15', iconColor: 'text-emerald-500' },
    { id: 'discover', icon: Compass, titleFr: 'Découvrir des produits', titleEn: 'Discover products',
      descFr: 'Livres, formations et ressources', descEn: 'Books, formations and resources',
      route: '/discover', borderClass: 'border-violet-500/30 hover:border-violet-500/60',
      iconBg: 'bg-violet-500/15', iconColor: 'text-violet-500' },
  ];

  const authedActions = getActionNavItems({
    isAuthenticated: !!user,
    hasPurchases,
    hasManageableOrg,
    hasOrgs,
    isSuperadmin,
  }, resolveRoute);

  const actions = user ? authedActions : visitorActions;

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
        <Button
          variant="ghost"
          size="sm"
          className="hidden h-8 rounded-xl px-3 text-xs font-semibold text-muted-foreground hover:text-foreground sm:inline-flex"
          onClick={() => navigate('/landing')}
        >
          {isFr ? 'Découvrir SiteViral' : 'About SiteViral'}
        </Button>
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
          className="w-full max-w-2xl space-y-6"
        >
          {/* Compact hero */}
          <motion.div variants={item} className="text-center space-y-1.5">
            <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-primary/10 text-primary text-[11px] font-semibold mb-1">
              <Sparkles className="h-3 w-3" />
              {isFr ? 'Gratuit pour commencer' : 'Free to start'}
            </div>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-foreground leading-tight">
              {user && displayName
                ? (isFr ? `Salut ${displayName} 👋` : `Hey ${displayName} 👋`)
                : (isFr ? 'Que veux-tu faire ?' : 'What do you want to do?')}
            </h1>
            {!user && (
              <p className="text-xs sm:text-sm text-muted-foreground max-w-[340px] mx-auto">
                {isFr ? 'Crée, vends et gagne — tout en un seul endroit.' : 'Create, sell & earn — all in one place.'}
              </p>
            )}
          </motion.div>

          {/* Action cards — larger touch targets */}
          <div className="grid gap-2.5 sm:grid-cols-2">
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
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl px-4 text-xs font-semibold"
              onClick={() => navigate('/landing')}
            >
              {isFr ? 'Voir la page de présentation' : 'See the landing page'}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </motion.div>
        </motion.div>
      </main>
    </div>
  );
}
