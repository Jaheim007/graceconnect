import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { PenLine, Share2, Upload, ShoppingBag, ArrowRight } from 'lucide-react';
import { SEOHead } from '@/components/seo/SEOHead';
import { useAuth } from '@/contexts/AuthContext';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { useI18n } from '@/i18n/I18nContext';

export default function WelcomeIntentPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { t } = useI18n();
  const intentParam = searchParams.get('intent');

  const intents = [
    {
      key: 'writer',
      icon: PenLine,
      emoji: '✏️',
      title: t('welcome.write'),
      desc: t('welcome.write_desc'),
      color: 'border-primary/30 hover:border-primary',
      iconBg: 'bg-primary/10',
      iconColor: 'text-primary',
      badge: null,
      route: '/ecrire',
    },
    {
      key: 'ambassador',
      icon: Share2,
      emoji: '💰',
      title: t('welcome.earn'),
      desc: t('welcome.earn_desc'),
      color: 'border-emerald-500/30 hover:border-emerald-500',
      iconBg: 'bg-emerald-500/10',
      iconColor: 'text-emerald-500',
      badge: t('welcome.earn_badge'),
      route: '/gagner',
    },
    {
      key: 'creator',
      icon: Upload,
      emoji: '📤',
      title: t('welcome.import'),
      desc: t('welcome.import_desc'),
      color: 'border-accent/30 hover:border-accent',
      iconBg: 'bg-accent/10',
      iconColor: 'text-accent',
      badge: null,
      route: '/migrer',
    },
    {
      key: 'buyer',
      icon: ShoppingBag,
      emoji: '🛒',
      title: t('welcome.explore'),
      desc: t('welcome.explore_desc'),
      color: 'border-border hover:border-primary/30',
      iconBg: 'bg-muted',
      iconColor: 'text-muted-foreground',
      badge: null,
      route: '/discover',
    },
  ];

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <SEOHead title={`${t('welcome.title')} — SiteViral`} description={t('welcome.subtitle')} noindex />
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
            {t('welcome.title')}{user?.user_metadata?.display_name ? ` ${user.user_metadata.display_name}` : ''} !
          </h1>
          <p className="text-muted-foreground text-sm">
            {t('welcome.subtitle')}
          </p>
        </motion.div>

        <div className="grid gap-3">
          {intents.map((intent, i) => (
            <motion.button
              key={intent.key}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 + i * 0.08, duration: 0.3 }}
              onClick={() => {
                if (user) {
                  import('@/lib/db').then(({ db }) => {
                    db.from('profiles').update({ onboarding_intent: intent.key }).eq('id', user.id);
                  });
                }
                navigate(intent.route);
              }}
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