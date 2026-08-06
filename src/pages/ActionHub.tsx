import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { ArrowRight, Sparkles, BookOpen, GraduationCap, Store, Compass, HandCoins, Rocket, Wallet } from 'lucide-react';

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
  const [prompt, setPrompt] = useState<'revenue' | 'purchases' | null>(null);


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

  const baseAuthed = getActionNavItems({
    isAuthenticated: !!user,
    hasPurchases,
    hasManageableOrg,
    hasOrgs,
    isSuperadmin,
  }, resolveRoute);

  /** Signed-in users always see the full menu — empty states are handled by prompts. */
  const authedActions = (() => {
    const items = [...baseAuthed];
    const has = (id: string) => items.some(i => i.id === id);
    if (!has('sell')) {
      items.splice(2, 0, {
        id: 'sell', icon: Store, emoji: '🛒',
        titleFr: 'Vendre', titleEn: 'Sell',
        descFr: 'Vends tes livres, formations et plus', descEn: 'Sell your books, courses & more',
        route: resolveRoute('sell'),
        borderClass: 'border-amber-500/30 hover:border-amber-500/60',
        iconBg: 'bg-amber-500/15', iconColor: 'text-amber-500',
      });
    }
    if (!has('sales')) {
      items.push({
        id: 'sales', icon: Wallet, emoji: '💵',
        titleFr: 'Revenus', titleEn: 'Revenue',
        descFr: 'Ventes, dons reçus, commissions et retraits', descEn: 'Sales, donations, commissions & payouts',
        route: hasManageableOrg ? '/admin/sales' : '/create-org',
        borderClass: 'border-teal-500/30 hover:border-teal-500/60',
        iconBg: 'bg-teal-500/15', iconColor: 'text-teal-500',
      });
    }
    return items;
  })();

  const actions = user ? authedActions : visitorActions;

  const handleAction = (action: { id: string; route: string }) => {
    if (action.id === 'sales' && !hasManageableOrg) {
      setPrompt('revenue');
      return;
    }
    if (action.id === 'purchases' && !hasPurchases) {
      setPrompt('purchases');
      return;
    }
    navigate(action.route);
  };


  return (
    <div className="relative min-h-[100dvh] flex flex-col bg-background overflow-hidden">
      {/* Ambient glow — same sophisticated glass language as the dashboard shells */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -top-32 left-1/2 h-[420px] w-[820px] -translate-x-1/2 rounded-full bg-primary/12 blur-[120px]" />
        <div className="absolute bottom-[-160px] right-[-120px] h-[380px] w-[520px] rounded-full bg-accent/10 blur-[130px]" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(var(--primary)/0.06),transparent_60%)]" />
      </div>
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
          {/* Hero */}
          <motion.div variants={item} className="text-center space-y-2">
            <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-[11px] font-semibold text-primary shadow-[0_0_24px_-8px_hsl(var(--primary)/0.6)] mb-1">
              <Sparkles className="h-3 w-3" />
              {isFr ? 'Gratuit pour commencer' : 'Free to start'}
            </div>
            <h1 className="text-[26px] sm:text-4xl font-black tracking-tight text-foreground leading-[1.1]">
              {user && displayName
                ? (isFr ? `Salut ${displayName} 👋` : `Hey ${displayName} 👋`)
                : (isFr ? 'Que veux-tu faire ?' : 'What do you want to do?')}
            </h1>
            <p className="text-xs sm:text-sm text-muted-foreground max-w-[380px] mx-auto">
              {user
                ? (isFr ? 'Choisis une action pour continuer.' : 'Pick an action to continue.')
                : (isFr ? 'Crée, vends et gagne — tout en un seul endroit.' : 'Create, sell & earn — all in one place.')}
            </p>
          </motion.div>

          {/* Action cards — glass surface, unified badges */}
          <div className="grid gap-2.5 sm:grid-cols-2">
            {actions.map((action) => (
              <motion.button
                key={action.id}
                variants={item}
                onClick={() => handleAction(action)}
                className={cn(
                  'relative w-full flex items-center gap-3.5 p-3.5 sm:p-4 rounded-2xl text-left group overflow-hidden',
                  'border border-border/60 bg-card/70 backdrop-blur-xl',
                  'shadow-[0_1px_2px_hsl(var(--foreground)/0.04)]',
                  'transition-all duration-200 active:scale-[0.98]',
                  'hover:-translate-y-0.5 hover:border-primary/40 hover:bg-card',
                  'hover:shadow-[0_18px_40px_-22px_hsl(var(--primary)/0.45)]',
                  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40'
                )}
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-300 bg-[radial-gradient(120%_120%_at_0%_0%,hsl(var(--primary)/0.10),transparent_60%)]"
                />
                <div className="relative h-11 w-11 sm:h-12 sm:w-12 rounded-xl flex items-center justify-center shrink-0 bg-primary/10 text-primary ring-1 ring-inset ring-primary/15 transition-transform duration-200 group-hover:scale-[1.04]">
                  <action.icon className="h-5 w-5" />
                </div>
                <div className="relative flex-1 min-w-0">
                  <div className="font-bold text-[13px] sm:text-sm text-foreground leading-tight">{isFr ? action.titleFr : action.titleEn}</div>
                  <div className="text-[11px] sm:text-xs text-muted-foreground mt-0.5 leading-snug">{isFr ? action.descFr : action.descEn}</div>
                </div>
                <ArrowRight className="relative h-4 w-4 text-muted-foreground/70 group-hover:text-primary group-hover:translate-x-0.5 transition-all shrink-0" />
              </motion.button>
            ))}
          </div>

          {/* Footer link */}
          <motion.div variants={item} className="text-center pt-1">
            <Button
              variant="outline"
              size="sm"
              className="h-9 rounded-xl border-border/60 bg-card/60 px-4 text-xs font-semibold backdrop-blur-xl hover:border-primary/40"
              onClick={() => navigate('/landing')}
            >

              {isFr ? 'Voir la page de présentation' : 'See the landing page'}
              <ArrowRight className="ml-1.5 h-3.5 w-3.5" />
            </Button>
          </motion.div>
        </motion.div>
      </main>

      {/* Empty-state prompts */}
      <Dialog open={!!prompt} onOpenChange={(o) => !o && setPrompt(null)}>
        <DialogContent className="max-w-md rounded-2xl">
          <DialogHeader>
            <DialogTitle className="text-lg font-black">
              {prompt === 'revenue'
                ? (isFr ? 'Pas encore de revenus' : 'No revenue yet')
                : (isFr ? 'Aucun achat pour l’instant' : 'No purchases yet')}
            </DialogTitle>
            <DialogDescription className="text-sm">
              {prompt === 'revenue'
                ? (isFr
                    ? 'Commence par créer quelque chose à vendre — tes revenus apparaîtront ici.'
                    : 'Start by creating something to sell — your revenue will show up here.')
                : (isFr
                    ? 'Découvre des livres, formations et ressources à acheter.'
                    : 'Discover books, formations and resources to buy.')}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-2 pt-1">
            {prompt === 'revenue' ? (
              <>
                <Button className="h-11 justify-start gap-2.5 rounded-xl font-semibold"
                  onClick={() => { setPrompt(null); navigate('/ecrire'); }}>
                  <BookOpen className="h-4 w-4" />
                  {isFr ? 'Écrire un livre en 5 min' : 'Write a book in 5 min'}
                </Button>
                <Button variant="outline" className="h-11 justify-start gap-2.5 rounded-xl font-semibold"
                  onClick={() => { setPrompt(null); navigate(resolveRoute('sell')); }}>
                  <Store className="h-4 w-4" />
                  {isFr ? 'Vendre du contenu' : 'Sell content'}
                </Button>
              </>
            ) : (
              <Button className="h-11 justify-start gap-2.5 rounded-xl font-semibold"
                onClick={() => { setPrompt(null); navigate('/discover'); }}>
                <Compass className="h-4 w-4" />
                {isFr ? 'Découvrir des produits' : 'Discover products'}
              </Button>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>

  );
}
