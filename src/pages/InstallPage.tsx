import { useState } from 'react';
import { useNavigate } from '@/lib/router-compat';
import { motion } from 'framer-motion';
import { Download, Smartphone, CheckCircle, Share, ArrowRight, Wifi, BellRing, Zap, Plus, Monitor, Tablet } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n/I18nContext';
import { usePWAInstall } from '@/hooks/usePWAInstall';
import { SEOHead } from '@/components/seo/SEOHead';

export default function InstallPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const { isInstalled, isIOS, canInstall, promptInstall } = usePWAInstall();

  const [installing, setInstalling] = useState(false);

  const handleInstall = async () => {
    setInstalling(true);
    try {
      await promptInstall();
    } catch (error) {
      console.error('[PWA] Install page error:', error);
    } finally {
      setInstalling(false);
    }
  };

  const benefits = [
    { icon: Zap, text: t('install.fast') },
    { icon: Wifi, text: t('install.offline') },
    { icon: BellRing, text: t('install.push') },
    { icon: Smartphone, text: t('install.native') },
  ];

  const isChrome = /chrome/i.test(navigator.userAgent) && !/edg/i.test(navigator.userAgent);
  const isEdge = /edg/i.test(navigator.userAgent);
  const isFirefox = /firefox/i.test(navigator.userAgent);
  const isSafariDesktop = /safari/i.test(navigator.userAgent) && !/chrome/i.test(navigator.userAgent) && !/mobile/i.test(navigator.userAgent);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <SEOHead title="Installer l'app Siteviral" description="Installez Siteviral sur votre appareil." noindex />
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6 text-center"
      >
        <img src="/logo-s.png" alt="Siteviral" className="h-16 w-16 rounded-2xl mx-auto object-contain" />

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight">{t('install.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('install.subtitle')}</p>
        </div>

        {/* Compatible devices */}
        <div className="flex items-center justify-center gap-4 text-muted-foreground">
          <div className="flex items-center gap-1.5 text-xs">
            <Smartphone className="h-4 w-4" /> Mobile
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Tablet className="h-4 w-4" /> Tablette
          </div>
          <div className="flex items-center gap-1.5 text-xs">
            <Monitor className="h-4 w-4" /> PC / Mac
          </div>
        </div>

        {isInstalled ? (
          <div className="bg-primary/10 border border-primary/30 rounded-2xl p-6 space-y-3">
            <CheckCircle className="h-10 w-10 text-primary mx-auto" />
            <p className="font-semibold">{t('install.already_installed')}</p>
            <p className="text-sm text-muted-foreground">{t('install.already_desc')}</p>
            <Button className="w-full bg-primary text-primary-foreground" onClick={() => navigate('/feed')}>
              {t('install.continue')} <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {benefits.map((b) => (
                <div key={b.text} className="bg-card border border-border rounded-xl p-3 flex items-center gap-2.5">
                  <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center shrink-0">
                    <b.icon className="h-4 w-4 text-primary" />
                  </div>
                  <span className="text-xs font-medium text-left">{b.text}</span>
                </div>
              ))}
            </div>

            {/* ===== Android APK — PRIMARY ===== */}
            {!isIOS && (
              <div className="bg-card border-2 border-primary rounded-2xl p-5 space-y-3 text-center">
                <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">📱 Android — App Native</Badge>
                <p className="text-sm text-muted-foreground">
                  Téléchargez et installez l'application native SiteViral directement sur votre téléphone.
                </p>
                <a href="/downloads/siteviral-android.apk" download="SiteViral.apk">
                  <Button size="lg" className="w-full h-12 text-base gap-2 bg-primary text-primary-foreground">
                    <Download className="h-5 w-5" /> Télécharger SiteViral (.apk)
                  </Button>
                </a>
                <p className="text-[11px] text-muted-foreground">
                  Après le téléchargement, ouvrez le fichier. Si demandé, autorisez l'installation depuis « Sources inconnues ».
                </p>
              </div>
            )}

            {/* ===== iOS Instructions ===== */}
            {isIOS && (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3 text-left">
                <Badge variant="secondary" className="text-xs">iPhone / iPad</Badge>
                <p className="text-sm text-muted-foreground mb-2">
                  L'app native iOS arrive bientôt. En attendant, installez via Safari :
                </p>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-foreground shrink-0">1.</span>
                    Appuyez sur <Share className="inline h-4 w-4 text-primary mx-0.5" /> en bas de Safari
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-foreground shrink-0">2.</span>
                    Faites défiler et appuyez sur <strong className="text-foreground">« Sur l'écran d'accueil »</strong> <Plus className="inline h-4 w-4 text-primary mx-0.5" />
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-foreground shrink-0">3.</span>
                    Confirmez avec <strong className="text-foreground">« Ajouter »</strong>
                  </li>
                </ol>
              </div>
            )}

            {/* ===== PWA as secondary option on desktop ===== */}
            {!isIOS && (canInstall || isSafariDesktop) && (
              <details className="bg-card border border-border rounded-2xl p-4">
                <summary className="text-xs text-muted-foreground cursor-pointer font-medium">
                  💻 Autre option : installer depuis le navigateur (PWA)
                </summary>
                <div className="mt-3 space-y-3">
                  {canInstall && (
                    <Button size="sm" variant="outline" className="w-full gap-2" onClick={handleInstall} disabled={installing}>
                      <Download className="h-4 w-4" /> {installing ? 'Installation…' : 'Installer la version web'}
                    </Button>
                  )}
                  {!canInstall && isSafariDesktop && (
                    <ol className="space-y-2 text-sm text-muted-foreground">
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-foreground shrink-0">1.</span>
                        Cliquez sur <strong className="text-foreground">Fichier → Ajouter au Dock</strong>
                      </li>
                      <li className="flex items-start gap-2">
                        <span className="font-bold text-foreground shrink-0">2.</span>
                        Confirmez avec <strong className="text-foreground">« Ajouter »</strong>
                      </li>
                    </ol>
                  )}
                </div>
              </details>
            )}
          </div>
        )}

        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate(-1)}>
          {t('install.back')}
        </Button>
      </motion.div>
    </div>
  );
}
