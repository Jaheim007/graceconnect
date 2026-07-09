import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Search, Rocket } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { useI18n } from '@/i18n/I18nContext';
import { setIntent } from '@/lib/intent';
import { MARKET_CATS, type MarketCat } from '@/lib/marketplaceCats';

export function MarketplaceCategories() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const [picked, setPicked] = useState<MarketCat | null>(null);

  const go = (route: string, kind: 'client' | 'provider') => {
    setIntent(kind, route);
    setPicked(null);
    navigate(route);
  };

  // Duplicate the list twice so the marquee loops seamlessly
  const loop = [...MARKET_CATS, ...MARKET_CATS];

  return (
    <section className="container max-w-6xl px-4 py-10 sm:py-12">
      <div className="mb-5">
        <h2 className="text-xl sm:text-2xl font-black tracking-tight">
          {fr ? 'Choisissez une catégorie' : 'Pick a category'}
        </h2>
        <p className="text-xs sm:text-sm text-muted-foreground mt-1">
          {fr ? 'Tapez pour trouver ou pour proposer ce service.' : 'Tap to find or to offer that service.'}
        </p>
      </div>

      {/* Auto-scrolling marquee — pauses on hover */}
      <div
        className="relative overflow-hidden -mx-4 px-4 group"
        style={{
          maskImage: 'linear-gradient(to right, transparent 0, black 6%, black 94%, transparent 100%)',
          WebkitMaskImage: 'linear-gradient(to right, transparent 0, black 6%, black 94%, transparent 100%)',
        }}
      >
        <motion.div
          className="flex gap-3 w-max"
          animate={{ x: ['0%', '-50%'] }}
          transition={{ duration: 38, ease: 'linear', repeat: Infinity }}
          style={{ willChange: 'transform' }}
        >
          {loop.map((c, i) => (
            <button
              key={`${c.key}-${i}`}
              onClick={() => setPicked(c)}
              onMouseEnter={(e) => {
                const el = e.currentTarget.parentElement as HTMLElement | null;
                if (el) el.style.animationPlayState = 'paused';
              }}
              className="shrink-0 w-[160px] sm:w-[190px] group/card relative overflow-hidden rounded-2xl border bg-card text-left hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <div className={`relative aspect-[5/4] bg-gradient-to-br ${c.gradient} overflow-hidden`}>
                <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(255,255,255,0.32),transparent_60%)]" />
                <div className="absolute inset-0 opacity-0 group-hover/card:opacity-100 transition-opacity bg-[radial-gradient(circle_at_70%_70%,rgba(255,255,255,0.25),transparent_55%)]" />
                <div className="absolute bottom-2 left-2 h-10 w-10 rounded-xl bg-white/20 backdrop-blur-md grid place-items-center ring-1 ring-white/30">
                  <c.icon className="h-5 w-5 text-white" />
                </div>
              </div>
              <div className="p-3">
                <span className="text-sm font-bold">{fr ? c.fr : c.en}</span>
              </div>
            </button>
          ))}
        </motion.div>
      </div>

      {/* Find or Propose chooser */}
      <Dialog open={!!picked} onOpenChange={(o) => !o && setPicked(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{picked ? (fr ? picked.fr : picked.en) : ''}</DialogTitle>
            <DialogDescription>
              {fr ? 'Que voulez-vous faire dans cette catégorie ?' : 'What do you want to do in this category?'}
            </DialogDescription>
          </DialogHeader>
          {picked && (
            <div className="grid gap-3 sm:grid-cols-2 mt-2">
              <button
                onClick={() => go(picked.findRoute, 'client')}
                className="rounded-2xl border p-4 text-left hover:border-primary/60 hover:shadow-md transition"
              >
                <div className="h-10 w-10 rounded-xl bg-primary/10 grid place-items-center mb-2">
                  <Search className="h-5 w-5 text-primary" />
                </div>
                <div className="font-bold text-sm">{fr ? 'Je cherche' : "I'm looking"}</div>
                <p className="text-xs text-muted-foreground mt-1">
                  {fr ? 'Voir les pros et réserver.' : 'Browse pros and book.'}
                </p>
              </button>
              <button
                onClick={() => go(picked.proposeRoute, 'provider')}
                className="rounded-2xl border p-4 text-left bg-primary text-primary-foreground hover:shadow-lg transition"
              >
                <div className="h-10 w-10 rounded-xl bg-white/15 grid place-items-center mb-2">
                  <Rocket className="h-5 w-5" />
                </div>
                <div className="font-bold text-sm">{fr ? 'Je propose' : 'I offer'}</div>
                <p className="text-xs text-primary-foreground/85 mt-1">
                  {fr ? 'Publier mon service ici.' : 'List my service here.'}
                </p>
              </button>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
}
