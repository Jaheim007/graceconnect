import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Download, Smartphone, CheckCircle, Share, ArrowRight, Wifi, BellRing, Zap } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useI18n } from '@/i18n/I18nContext';

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

export default function InstallPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setIsInstalled(true);
    }
    const ua = navigator.userAgent;
    setIsIOS(/iPad|iPhone|iPod/.test(ua) && !(window as any).MSStream);

    const handler = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  const handleInstall = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') setIsInstalled(true);
    setDeferredPrompt(null);
  };

  const benefits = [
    { icon: Zap, text: t('install.fast') },
    { icon: Wifi, text: t('install.offline') },
    { icon: BellRing, text: t('install.push') },
    { icon: Smartphone, text: t('install.native') },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4 py-10">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md space-y-6 text-center"
      >
        <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center mx-auto">
          <Download className="h-8 w-8 text-primary-foreground" />
        </div>

        <div className="space-y-2">
          <h1 className="text-2xl font-extrabold tracking-tight">{t('install.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('install.subtitle')}</p>
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

            {deferredPrompt ? (
              <Button size="lg" className="w-full bg-primary text-primary-foreground h-12 text-base gap-2" onClick={handleInstall}>
                <Download className="h-5 w-5" /> {t('install.install_now')}
              </Button>
            ) : isIOS ? (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3 text-left">
                <Badge variant="secondary" className="text-xs">iPhone / iPad</Badge>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-foreground shrink-0">1.</span>
                    {t('install.ios_step1')} <Share className="inline h-4 w-4 text-primary mx-0.5" /> {t('install.ios_step1b')}
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-foreground shrink-0">2.</span>
                    {t('install.ios_step2')} <strong className="text-foreground">{t('install.ios_step2b')}</strong>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-foreground shrink-0">3.</span>
                    {t('install.ios_step3')} <strong className="text-foreground">{t('install.ios_step3b')}</strong>
                  </li>
                </ol>
              </div>
            ) : (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-3 text-left">
                <Badge variant="secondary" className="text-xs">Android / Desktop</Badge>
                <ol className="space-y-2 text-sm text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-foreground shrink-0">1.</span>
                    {t('install.android_step1')} <strong className="text-foreground">(⋮)</strong>
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="font-bold text-foreground shrink-0">2.</span>
                    {t('install.android_step2')} <strong className="text-foreground">{t('install.android_step2b')}</strong>
                  </li>
                </ol>
              </div>
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