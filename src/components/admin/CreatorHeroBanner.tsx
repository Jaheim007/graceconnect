import { motion } from 'framer-motion';
import { PenLine, Store, Share2, Zap, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';

export function CreatorHeroBanner() {
  const navigate = useNavigate();
  const { t } = useI18n();

  const pillars = [
    {
      id: 'write', icon: PenLine,
      title: t('hero.write'), desc: t('hero.write_desc'), cta: t('hero.write_cta'),
      route: '/ecrire', color: 'text-primary', bg: 'bg-primary/10 border-primary/20', highlight: true,
    },
    {
      id: 'sell', icon: Store,
      title: t('hero.sell'), desc: t('hero.sell_desc'), cta: t('hero.sell_cta'),
      route: '/admin/products', color: 'text-amber-500', bg: 'bg-amber-500/10 border-amber-500/20', highlight: false,
    },
    {
      id: 'share', icon: Share2,
      title: t('hero.share'), desc: t('hero.share_desc'), cta: t('hero.share_cta'),
      route: '/gagner', color: 'text-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/20', highlight: false,
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="relative overflow-hidden rounded-2xl border border-primary/20 bg-gradient-to-br from-primary/5 via-card to-amber-500/5 p-5 sm:p-6"
    >
      <div className="absolute -top-20 -right-20 w-40 h-40 rounded-full bg-primary/10 blur-3xl pointer-events-none" />

      <div className="flex items-center gap-2 mb-4">
        <div className="h-8 w-8 rounded-lg bg-primary/15 flex items-center justify-center">
          
        </div>
        <div>
          <h2 className="text-sm font-bold tracking-tight">{t('hero.tagline')}</h2>
          <p className="text-[11px] text-muted-foreground">{t('hero.subtitle')}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
        {pillars.map((p, i) => (
          <motion.button
            key={p.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 + i * 0.08 }}
            onClick={() => navigate(p.route)}
            className={cn(
              'group flex flex-col gap-2.5 p-4 rounded-xl border bg-card/80 backdrop-blur-sm text-left transition-all hover:-translate-y-0.5 hover:shadow-md',
              p.highlight
                ? 'border-primary/30 hover:border-primary/60 ring-1 ring-primary/10'
                : 'border-border hover:border-primary/30'
            )}
          >
            <div className="flex items-center gap-2.5">
              <div className={cn('h-9 w-9 rounded-lg border flex items-center justify-center shrink-0', p.bg)}>
                <p.icon className={cn('h-4 w-4', p.color)} />
              </div>
              <div className="flex-1 min-w-0">
                <span className="text-sm font-bold block">{p.title}</span>
                <span className="text-[11px] text-muted-foreground leading-tight block">{p.desc}</span>
              </div>
            </div>
            <div className="flex items-center gap-1.5 text-xs font-semibold text-primary group-hover:gap-2 transition-all">
              {p.cta}
              <ArrowRight className="h-3.5 w-3.5" />
            </div>
          </motion.button>
        ))}
      </div>

      <div className="mt-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
        <Button onClick={() => navigate('/ecrire')} className="gap-2 flex-1 sm:flex-none cta-glow">
          <PenLine className="h-4 w-4" />
          {t('hero.main_cta')}
        </Button>
        <p className="text-[11px] text-muted-foreground text-center sm:text-left">
          {t('hero.main_sub')}
        </p>
      </div>
    </motion.div>
  );
}
