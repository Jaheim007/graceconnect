import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Search, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';
import { setIntent } from '@/lib/intent';

/**
 * Centered, full-width editorial hero.
 * No right-side UI montage — search + brand promise dominate the first viewport.
 */
export function MarketplaceHero() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const [q, setQ] = useState('');

  const submit = (e: React.FormEvent) => {
    e.preventDefault();
    setIntent('client', '/discover');
    const target = q.trim() ? `/discover?q=${encodeURIComponent(q.trim())}` : '/discover';
    navigate(target);
  };

  return (
    <section className="relative overflow-hidden bg-sidebar text-sidebar-foreground">
      {/* Brand-tinted glow */}
      <div
        className="absolute inset-0 pointer-events-none opacity-70"
        style={{
          backgroundImage:
            'radial-gradient(circle at 15% 15%, hsl(var(--accent)/0.28), transparent 55%), radial-gradient(circle at 85% 85%, hsl(var(--primary)/0.32), transparent 60%)',
        }}
      />
      {/* Fine grid texture */}
      <div
        className="absolute inset-0 opacity-[0.06] pointer-events-none"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='48' height='48' viewBox='0 0 48 48'%3E%3Cg fill='none' stroke='%23ffffff' stroke-width='0.5'%3E%3Cpath d='M0 0h48v48H0z'/%3E%3C/g%3E%3C/svg%3E\")",
        }}
      />

      <div className="relative container max-w-4xl px-4 sm:px-6 pt-20 sm:pt-28 lg:pt-32 pb-20 sm:pb-28 lg:pb-32 text-center">
        <h1 className="mx-auto text-[2.25rem] sm:text-6xl lg:text-[76px] font-black leading-[1.05] tracking-[-0.02em] max-w-3xl">
          {fr ? (
            <>Trouvez le bon <span className="text-accent">produit</span>, service ou professionnel.</>
          ) : (
            <>Find the right <span className="text-accent">product</span>, service or professional.</>
          )}
        </h1>

        <p className="mx-auto mt-5 sm:mt-6 text-base sm:text-lg text-sidebar-foreground/70 max-w-2xl leading-relaxed">
          {fr
            ? 'Découvrez des produits digitaux, des artisans, des professionnels de la beauté, des tuteurs, des coachs, des musiciens et des créateurs.'
            : 'Discover digital products, artisans, beauty professionals, tutors, coaches, musicians and creators.'}
        </p>

        <form
          onSubmit={submit}
          className="mx-auto mt-8 sm:mt-10 flex items-stretch gap-2 max-w-2xl bg-background rounded-2xl p-1.5 shadow-2xl shadow-black/30"
        >
          <div className="flex items-center flex-1 min-w-0 pl-3 sm:pl-4">
            <Search className="h-5 w-5 text-muted-foreground shrink-0" />
            <input
              value={q}
              onChange={e => setQ(e.target.value)}
              placeholder={fr ? 'Rechercher produits, services ou professionnels' : 'Search products, services or professionals'}
              className="flex-1 min-w-0 bg-transparent border-0 outline-none px-3 py-3 sm:py-3.5 text-sm sm:text-base text-foreground placeholder:text-muted-foreground"
              aria-label={fr ? 'Recherche' : 'Search'}
            />
          </div>
          <Button type="submit" className="h-12 sm:h-13 px-5 sm:px-7 rounded-xl text-sm font-bold shrink-0">
            {fr ? 'Rechercher' : 'Search'}
          </Button>
        </form>

        {/* Provider prompt — benefit-led */}
        <div className="mx-auto mt-12 sm:mt-16 max-w-xl flex flex-col items-center gap-3">
          <p className="text-xl sm:text-2xl font-black tracking-tight text-sidebar-foreground">
            {fr ? 'Transformez vos compétences en revenus.' : 'Turn your skills into income.'}
          </p>
          <p className="text-sm sm:text-base text-sidebar-foreground/70 max-w-md">
            {fr
              ? 'Créez votre espace pro en quelques minutes, encaissez en toute sécurité, développez votre clientèle.'
              : 'Set up your pro space in minutes, get paid securely, and grow your client base.'}
          </p>
          <Button
            onClick={() => { setIntent('provider', '/start'); navigate('/start'); }}
            className="h-12 px-6 rounded-xl bg-accent text-accent-foreground hover:bg-accent/90 font-bold gap-1.5 mt-2 shadow-lg shadow-accent/20"
          >
            {fr ? 'Commencer à vendre' : 'Start selling'}
            <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    </section>
  );
}
