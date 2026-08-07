import { ArrowLeft, Zap, Shield, Bug, Palette, Loader2, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SEOHead } from '@/components/seo/SEOHead';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useI18n } from '@/i18n/I18nContext';

const STATIC_CHANGELOG = [
  { version: '2.5.0', date: '2026-02-25', entries: [
    { type: 'feature', text_fr: 'Dashboard analytics personnel avec statistiques détaillées', text_en: 'Personal analytics dashboard with detailed statistics' },
    { type: 'feature', text_fr: 'Téléchargement sécurisé avec watermark PDF', text_en: 'Secure download with PDF watermark' },
    { type: 'improvement', text_fr: 'Transitions de page animées', text_en: 'Animated page transitions' },
  ]},
  { version: '2.4.0', date: '2026-02-20', entries: [
    { type: 'feature', text_fr: 'Gamification complète : XP, badges, niveaux', text_en: 'Full gamification: XP, badges, levels' },
    { type: 'feature', text_fr: 'Système de partenaires avec KYC et payouts', text_en: 'Partner system with KYC and payouts' },
    { type: 'security', text_fr: 'Rate limiting sur toutes les edge functions critiques', text_en: 'Rate limiting on all critical edge functions' },
  ]},
];

export default function ChangelogPage() {
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const typeConfig: Record<string, { icon: typeof Zap; label: string; color: string }> = {
    feature: { icon: Zap, label: isFr ? 'Nouveau' : 'New', color: 'bg-primary/10 text-primary border-primary/20' },
    improvement: { icon: Zap, label: isFr ? 'Amélioration' : 'Improvement', color: 'bg-accent/10 text-accent-foreground border-accent/20' },
    security: { icon: Shield, label: isFr ? 'Sécurité' : 'Security', color: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' },
    fix: { icon: Bug, label: isFr ? 'Correction' : 'Fix', color: 'bg-muted text-muted-foreground border-border' },
    design: { icon: Palette, label: 'Design', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20' },
  };

  const { data: dbEntries, isLoading } = useQuery({
    queryKey: ['changelog-entries'],
    queryFn: async () => {
      const { data } = await db.from('changelog_entries').select('*').order('release_date', { ascending: false }).order('created_at', { ascending: false });
      return data || [];
    },
    staleTime: 5 * 60_000,
  });

  const dbGrouped = (dbEntries || []).reduce((acc: Record<string, { version: string; date: string; entries: { type: string; text: string }[] }>, e: any) => {
    if (!acc[e.version]) acc[e.version] = { version: e.version, date: e.release_date, entries: [] };
    acc[e.version].entries.push({ type: e.entry_type, text: e.text });
    return acc;
  }, {});

  const changelog = Object.keys(dbGrouped).length > 0
    ? Object.values(dbGrouped)
    : STATIC_CHANGELOG.map(r => ({
        ...r,
        entries: r.entries.map(e => ({ type: e.type, text: isFr ? e.text_fr : e.text_en })),
      }));

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title={isFr ? 'Nouveautés — SiteViral' : 'Changelog — SiteViral'} description={isFr ? 'Découvrez les dernières nouveautés et améliorations de la plateforme SiteViral.' : 'Discover the latest features and improvements on SiteViral.'} />
      <div className="sticky top-0 z-10 glass border-b border-border/40 px-4 h-12 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <span className="font-semibold text-sm">{isFr ? 'Nouveautés' : 'What\'s new'}</span>
      </div>

      <div className="container max-w-2xl py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Changelog</h1>
          <p className="text-sm text-muted-foreground mt-1">{isFr ? 'Toutes les nouveautés et améliorations de SiteViral' : 'All new features and improvements on SiteViral'}</p>
        </div>

        {isLoading && (
          <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>
        )}

        {(changelog as any[]).map((release: any) => (
          <div key={release.version} className="relative pl-6 border-l-2 border-border">
            <div className="absolute -left-2.5 top-0 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
              <Check className="h-3 w-3 text-primary-foreground" />
            </div>
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">v{release.version}</h2>
                <Badge variant="outline" className="text-xs">{new Date(release.date).toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}</Badge>
              </div>
            </div>
            <div className="space-y-2">
              {release.entries.map((entry: any, i: number) => {
                const config = typeConfig[entry.type] || typeConfig.feature;
                const Icon = config.icon;
                return (
                  <div key={i} className="flex items-start gap-2">
                    <Badge variant="outline" className={cn('text-[10px] shrink-0 mt-0.5', config.color)}>
                      <Icon className="h-2.5 w-2.5 mr-0.5" />
                      {config.label}
                    </Badge>
                    <p className="text-sm">{entry.text}</p>
                  </div>
                );
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
