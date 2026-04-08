import { lazy, Suspense } from 'react';
import { SEOHead } from '@/components/seo/SEOHead';
import { AdaptiveLayout } from '@/components/layout/AdaptiveLayout';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { BookOpen, ArrowRight, Sparkles } from 'lucide-react';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { Sun, Moon } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';

const WriteWizard = lazy(() => import('@/components/write/WriteWizard'));

export default function EcrirePage() {
  const { t } = useI18n();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  // Guest gate: show a compelling sign-up prompt
  if (!user) {
    return (
      <div className="min-h-[100dvh] flex flex-col bg-background">
        <SEOHead
          title={t('write.seo_title')}
          description={t('write.seo_desc')}
          canonicalUrl="https://siteviral.com/ecrire"
          keywords="écrire un livre IA, créer ebook, publier livre numérique, vendre ebook Afrique, write book AI"
        />
        <header className="h-14 sticky top-0 z-40 glass border-b border-border flex items-center px-4 gap-3">
          <SiteLogo size="sm" animate linked to="/" />
          <div className="flex-1" />
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={toggleTheme}>
            {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          </Button>
        </header>

        <main className="flex-1 flex flex-col items-center justify-center px-4 py-12">
          <div className="max-w-md w-full text-center space-y-6">
            <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <div className="space-y-2">
              <h1 className="text-2xl font-black tracking-tight">
                {isFr ? 'Écris ton livre en 5 minutes' : 'Write your book in 5 minutes'}
              </h1>
              <p className="text-sm text-muted-foreground">
                {isFr
                  ? "L'IA écrit ton livre, tu le publies, tu le vends. Gratuit pour commencer."
                  : 'AI writes your book, you publish it, you sell it. Free to start.'}
              </p>
            </div>
            <div className="space-y-3">
              <Button
                size="lg"
                className="w-full gap-2 text-sm font-bold"
                onClick={() => navigate('/auth?mode=signup&next=/ecrire')}
              >
                <Sparkles className="h-4 w-4" />
                {isFr ? 'Créer mon compte gratuit' : 'Create my free account'}
                <ArrowRight className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-muted-foreground"
                onClick={() => navigate('/auth?next=/ecrire')}
              >
                {isFr ? "J'ai déjà un compte" : 'I already have an account'}
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <AdaptiveLayout>
      <SEOHead
        title={t('write.seo_title')}
        description={t('write.seo_desc')}
        canonicalUrl="https://siteviral.com/ecrire"
        keywords="écrire un livre IA, créer ebook, publier livre numérique, vendre ebook Afrique, write book AI"
      />
      <Suspense fallback={
        <div className="min-h-[60dvh] flex items-center justify-center">
          <div className="animate-pulse text-muted-foreground text-sm">{t('write.loading_studio')}</div>
        </div>
      }>
        <WriteWizard />
      </Suspense>
    </AdaptiveLayout>
  );
}
