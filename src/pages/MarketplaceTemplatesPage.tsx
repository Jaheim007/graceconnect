import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useI18n } from '@/i18n/I18nContext';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Star, Download, Search } from 'lucide-react';
import { formatCurrency } from '@/lib/currency';

const KIND_LABELS: Record<string, { fr: string; en: string; emoji: string }> = {
  formation: { fr: 'Formation', en: 'Course', emoji: '🎓' },
  ebook: { fr: 'Ebook', en: 'Ebook', emoji: '📘' },
  prompt: { fr: 'Prompt AI', en: 'AI Prompt', emoji: '🪄' },
  landing: { fr: 'Landing page', en: 'Landing page', emoji: '🚀' },
  email_sequence: { fr: 'Séquence email', en: 'Email sequence', emoji: '✉️' },
  other: { fr: 'Autre', en: 'Other', emoji: '🔷' },
};

export default function MarketplaceTemplatesPage() {
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const [search, setSearch] = useState('');
  const [kindFilter, setKindFilter] = useState<string>('');

  const { data: templates, isLoading } = useQuery({
    queryKey: ['marketplace-templates', search, kindFilter],
    queryFn: async () => {
      let q = db.from('marketplace_templates')
        .select('id, title, description, cover_image_url, kind, clone_price, currency, tags, language, clones_count, avg_rating, reviews_count, author_org_id, organizations:author_org_id(name, slug, logo_url)')
        .eq('status', 'approved')
        .order('clones_count', { ascending: false })
        .limit(60);
      if (search) q = q.ilike('title', `%${search}%`);
      if (kindFilter) q = q.eq('kind', kindFilter as any);
      const { data } = await q;
      return data || [];
    },
  });

  return (
    <div className="container max-w-6xl py-8 px-4">
      <header className="mb-8">
        <h1 className="text-3xl md:text-4xl font-bold mb-2">
          {fr ? '🛍️ Marketplace Templates' : '🛍️ Templates Marketplace'}
        </h1>
        <p className="text-muted-foreground">
          {fr
            ? 'Clonez en un clic les meilleures formations, ebooks et prompts publiés par les créateurs SiteViral.'
            : 'Clone in one click the best courses, ebooks, and prompts published by SiteViral creators.'}
        </p>
      </header>

      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={fr ? 'Rechercher un template...' : 'Search templates...'}
            className="pl-9"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          <Button size="sm" variant={!kindFilter ? 'default' : 'outline'} onClick={() => setKindFilter('')}>
            {fr ? 'Tout' : 'All'}
          </Button>
          {Object.entries(KIND_LABELS).map(([k, v]) => (
            <Button key={k} size="sm" variant={kindFilter === k ? 'default' : 'outline'} onClick={() => setKindFilter(k)}>
              {v.emoji} {fr ? v.fr : v.en}
            </Button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <p className="text-center text-muted-foreground py-12">{fr ? 'Chargement...' : 'Loading...'}</p>
      ) : !templates?.length ? (
        <Card className="p-12 text-center">
          <p className="text-muted-foreground">
            {fr ? 'Aucun template publié pour le moment.' : 'No templates published yet.'}
          </p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {templates.map((t: any) => {
            const kind = KIND_LABELS[t.kind] || KIND_LABELS.other;
            return (
              <Link key={t.id} to={`/marketplace/templates/${t.id}`}>
                <Card className="overflow-hidden hover:shadow-lg transition h-full flex flex-col">
                  <div className="aspect-video bg-muted relative">
                    {t.cover_image_url ? (
                      <img src={t.cover_image_url} alt={t.title} loading="lazy" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-5xl">{kind.emoji}</div>
                    )}
                    <Badge className="absolute top-2 left-2 bg-background/90 text-foreground">
                      {kind.emoji} {fr ? kind.fr : kind.en}
                    </Badge>
                  </div>
                  <div className="p-4 flex-1 flex flex-col">
                    <h3 className="font-semibold mb-1 line-clamp-2">{t.title}</h3>
                    <p className="text-xs text-muted-foreground mb-3">
                      {fr ? 'Par' : 'By'} {t.organizations?.name || '—'}
                    </p>
                    <div className="mt-auto flex items-center justify-between text-sm">
                      <span className="font-bold text-primary">
                        {Number(t.clone_price) === 0
                          ? (fr ? 'Gratuit' : 'Free')
                          : formatCurrency(Number(t.clone_price), t.currency)}
                      </span>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        {t.avg_rating && (
                          <span className="flex items-center gap-1">
                            <Star className="w-3 h-3 fill-yellow-500 text-yellow-500" />
                            {Number(t.avg_rating).toFixed(1)}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Download className="w-3 h-3" />
                          {t.clones_count}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
