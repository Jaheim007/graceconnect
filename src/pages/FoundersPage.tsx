import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/i18n/I18nContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Crown, Zap } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

interface FounderRow {
  slot_number: number;
  display_name: string;
  avatar_url: string | null;
  claimed_at: string;
}

const TOTAL_SLOTS = 50;

export default function FoundersPage() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [founders, setFounders] = useState<FounderRow[]>([]);
  const [remaining, setRemaining] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const [{ data: wall }, { data: rem }] = await Promise.all([
          supabase.rpc('get_founders_wall' as any),
          supabase.rpc('founders_remaining' as any),
        ]);
        if (cancelled) return;
        setFounders((wall as FounderRow[]) || []);
        setRemaining(typeof rem === 'number' ? rem : null);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const claimed = founders.length;
  const slots = Array.from({ length: TOTAL_SLOTS }, (_, i) => i + 1);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title={isFr ? 'Le Mur des 50 Founders — SiteViral' : 'Wall of 50 Founders — SiteViral'}
        description={isFr
          ? 'Découvrez les 50 fondateurs historiques de SiteViral : accès Pro à vie, badge public, soutien direct.'
          : 'Meet the 50 lifetime founders of SiteViral: lifetime Pro access, public badge, direct support.'}
        keywords="founders, lifetime, SiteViral, pro"
      />

      <section className="container max-w-5xl px-4 py-16 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 border border-primary/20 mb-6">
          <Crown className="h-4 w-4 text-primary" />
          <span className="text-xs font-semibold text-primary uppercase tracking-wide">
            {isFr ? 'Programme Founder' : 'Founder Program'}
          </span>
        </div>

        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
          {isFr ? 'Le Mur des 50 Founders' : 'The Wall of 50 Founders'}
        </h1>
        <p className="text-lg text-muted-foreground max-w-2xl mx-auto mb-8">
          {isFr
            ? 'Les 50 premiers à croire en SiteViral. Pro à vie, badge public, voix directe sur la roadmap.'
            : 'The first 50 believers in SiteViral. Lifetime Pro, public badge, direct voice on the roadmap.'}
        </p>

        {remaining !== null && (
          <div className="inline-flex items-center gap-3 mb-10">
            <div className="text-5xl font-extrabold text-primary tabular-nums">{claimed}</div>
            <div className="text-left">
              <div className="text-sm font-semibold">/ {TOTAL_SLOTS} {isFr ? 'places prises' : 'spots claimed'}</div>
              <div className="text-xs text-muted-foreground">
                {remaining > 0
                  ? (isFr ? `${remaining} places restantes` : `${remaining} spots left`)
                  : (isFr ? '🎉 Programme complet' : '🎉 Program complete')}
              </div>
            </div>
          </div>
        )}

        <div className="w-full max-w-md mx-auto h-2 bg-muted rounded-full overflow-hidden mb-10">
          <div
            className="h-full bg-gradient-to-r from-primary to-primary/60 transition-all duration-700"
            style={{ width: `${(claimed / TOTAL_SLOTS) * 100}%` }}
          />
        </div>

        {remaining !== null && remaining > 0 && (
          <Link to="/pricing#founder">
            <Button size="lg" className="gap-2">
              
              {isFr ? `Réserver ma place (${remaining} restantes)` : `Claim my spot (${remaining} left)`}
            </Button>
          </Link>
        )}
      </section>

      {/* Wall grid */}
      <section className="container max-w-6xl px-4 pb-20">
        {loading ? (
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {slots.map((n) => (
              <div key={n} className="aspect-square rounded-xl bg-muted animate-pulse" />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-5 sm:grid-cols-6 md:grid-cols-8 lg:grid-cols-10 gap-3">
            {slots.map((n) => {
              const f = founders.find((x) => x.slot_number === n);
              if (f) {
                const initials = f.display_name.split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();
                return (
                  <div
                    key={n}
                    className="group relative aspect-square rounded-xl bg-gradient-to-br from-primary/20 to-primary/5 border-2 border-primary/40 flex items-center justify-center hover:scale-105 transition-transform shadow-xs"
                    title={`#${n} — ${f.display_name}`}
                  >
                    <Avatar className="h-12 w-12">
                      <AvatarImage src={f.avatar_url || undefined} alt={f.display_name} />
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm font-bold">
                        {initials}
                      </AvatarFallback>
                    </Avatar>
                    <span className="absolute -top-1 -right-1 px-1.5 py-0.5 rounded-full bg-primary text-primary-foreground text-[10px] font-bold leading-none">
                      #{n}
                    </span>
                    <div className="absolute inset-x-0 -bottom-7 opacity-0 group-hover:opacity-100 transition-opacity text-[10px] text-center text-foreground/80 truncate px-1">
                      {f.display_name}
                    </div>
                  </div>
                );
              }
              return (
                <Link
                  key={n}
                  to="/pricing#founder"
                  className="aspect-square rounded-xl bg-muted/40 border-2 border-dashed border-border flex items-center justify-center text-muted-foreground/50 text-xs hover:border-primary/50 hover:text-primary transition-colors"
                  title={isFr ? `Place #${n} disponible` : `Spot #${n} available`}
                >
                  #{n}
                </Link>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
