import { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { Church, MapPin, Search, ShieldCheck, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/i18n/I18nContext';
import { CHURCH_DENOMINATIONS, getDenominationLabel } from '@/lib/churchDenominations';

export default function ChurchDiscover() {
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const [q, setQ] = useState('');
  const [denom, setDenom] = useState<string>('all');

  useEffect(() => {
    document.title = fr ? 'Découvrir les églises — SiteViral Church' : 'Discover churches — SiteViral Church';
  }, [fr]);

  const { data: churches = [], isLoading } = useQuery({
    queryKey: ['church-discover'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('church_providers')
        .select('id, slug, name, bio, denomination, city, country, logo_url, cover_url, verified')
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .limit(60);
      if (error) throw error;
      return data ?? [];
    },
  });

  const filtered = useMemo(() => {
    const needle = q.trim().toLowerCase();
    return churches.filter((c) => {
      if (denom !== 'all' && c.denomination !== denom) return false;
      if (!needle) return true;
      return (
        c.name?.toLowerCase().includes(needle) ||
        c.city?.toLowerCase().includes(needle) ||
        c.country?.toLowerCase().includes(needle)
      );
    });
  }, [churches, q, denom]);

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/church"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <p className="text-xs text-muted-foreground">SiteViral Church</p>
            <h1 className="text-xl md:text-2xl font-bold flex items-center gap-2">
              <Church className="h-5 w-5 text-primary" />
              {fr ? 'Découvrir les églises' : 'Discover churches'}
            </h1>
          </div>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={fr ? 'Nom, ville ou pays…' : 'Name, city or country…'}
              className="pl-9"
            />
          </div>
          <select
            value={denom}
            onChange={(e) => setDenom(e.target.value)}
            className="rounded-md border border-input bg-background px-3 py-2 text-sm"
          >
            <option value="all">{fr ? 'Toutes les confessions' : 'All denominations'}</option>
            {CHURCH_DENOMINATIONS.map((d) => (
              <option key={d.value} value={d.value}>{fr ? d.fr : d.en}</option>
            ))}
          </select>
        </div>

        {isLoading ? (
          <div className="text-center text-sm text-muted-foreground py-12">{fr ? 'Chargement…' : 'Loading…'}</div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16 rounded-2xl border border-dashed border-border">
            <Church className="mx-auto h-10 w-10 text-muted-foreground/50 mb-3" />
            <p className="text-sm text-muted-foreground">
              {fr ? 'Aucune église vérifiée pour ce filtre.' : 'No verified churches match this filter.'}
            </p>
            <Button asChild variant="outline" size="sm" className="mt-4">
              <Link to="/church/pro/onboarding">{fr ? 'Créer une église' : 'Create a church'}</Link>
            </Button>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-3">
            {filtered.map((c) => (
              <Link
                key={c.id}
                to={`/church/${c.slug}`}
                className="group rounded-2xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow"
              >
                <div className="h-28 bg-gradient-to-br from-primary/20 to-primary/5 relative">
                  {c.cover_url && <img src={c.cover_url} alt="" className="w-full h-full object-cover" />}
                  {c.verified && (
                    <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full bg-background/90 backdrop-blur px-2 py-0.5 text-[10px] font-medium text-primary">
                      <ShieldCheck className="h-3 w-3" /> {fr ? 'Vérifiée' : 'Verified'}
                    </span>
                  )}
                </div>
                <div className="p-4">
                  <div className="flex items-center gap-3 -mt-8 mb-2">
                    <div className="h-12 w-12 rounded-xl border-2 border-background bg-muted overflow-hidden shrink-0">
                      {c.logo_url ? (
                        <img src={c.logo_url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center bg-primary/10">
                          <Church className="h-5 w-5 text-primary" />
                        </div>
                      )}
                    </div>
                  </div>
                  <h3 className="font-semibold text-sm line-clamp-1">{c.name}</h3>
                  <p className="text-xs text-muted-foreground line-clamp-1 mt-0.5">
                    {getDenominationLabel(c.denomination, locale)}
                  </p>
                  {(c.city || c.country) && (
                    <p className="text-xs text-muted-foreground mt-1.5 flex items-center gap-1">
                      <MapPin className="h-3 w-3" />
                      {[c.city, c.country].filter(Boolean).join(', ')}
                    </p>
                  )}
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
