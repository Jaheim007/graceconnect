import { ArrowLeft, Sparkles, Zap, Shield, Bug, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useNavigate } from 'react-router-dom';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { SEOHead } from '@/components/seo/SEOHead';

const CHANGELOG = [
  {
    version: '2.5.0',
    date: '2026-02-25',
    entries: [
      { type: 'feature', text: 'Dashboard analytics personnel avec statistiques détaillées' },
      { type: 'feature', text: 'Page "Mes factures" avec export PDF' },
      { type: 'feature', text: 'Admin A/B Testing — créez et gérez vos expériences' },
      { type: 'feature', text: 'Téléchargement sécurisé avec watermark PDF' },
      { type: 'feature', text: 'Mode maintenance et feature flags' },
      { type: 'feature', text: 'Widget de feedback intégré' },
      { type: 'feature', text: 'Sélecteur de devise multi-currency' },
      { type: 'feature', text: 'Pagination infinie sur les listes' },
      { type: 'improvement', text: 'Routing des notifications au clic' },
      { type: 'improvement', text: 'Skeleton loading systématique' },
      { type: 'improvement', text: 'Transitions de page animées' },
      { type: 'improvement', text: 'Polish du mode sombre' },
    ],
  },
  {
    version: '2.4.0',
    date: '2026-02-20',
    entries: [
      { type: 'feature', text: 'Gamification complète : XP, badges, niveaux' },
      { type: 'feature', text: 'Système de partenaires avec KYC et payouts' },
      { type: 'feature', text: 'Stripe Connect intégré' },
      { type: 'feature', text: 'Système de codes promo avancé' },
      { type: 'security', text: 'Rate limiting sur toutes les edge functions critiques' },
      { type: 'security', text: 'Validation HMAC des webhooks Paystack & Stripe' },
    ],
  },
  {
    version: '2.3.0',
    date: '2026-02-15',
    entries: [
      { type: 'feature', text: 'Superadmin AI Chat avec insights intelligents' },
      { type: 'feature', text: 'Système d\'affiliation multi-niveaux' },
      { type: 'feature', text: 'Bundles et upsells de produits' },
      { type: 'improvement', text: 'Internationalisation FR/EN complète' },
      { type: 'fix', text: 'Correction de l\'affichage des devises sur mobile' },
    ],
  },
  {
    version: '2.2.0',
    date: '2026-02-10',
    entries: [
      { type: 'feature', text: 'PWA avec support hors ligne' },
      { type: 'feature', text: 'Push notifications via VAPID' },
      { type: 'feature', text: 'Commentaires imbriqués sur le contenu' },
      { type: 'improvement', text: 'Optimisation des performances (lazy loading)' },
      { type: 'fix', text: 'Correction du calcul des commissions affiliés' },
    ],
  },
];

const typeConfig: Record<string, { icon: typeof Sparkles; label: string; color: string }> = {
  feature: { icon: Sparkles, label: 'Nouveau', color: 'bg-primary/10 text-primary border-primary/20' },
  improvement: { icon: Zap, label: 'Amélioration', color: 'bg-accent/10 text-accent-foreground border-accent/20' },
  security: { icon: Shield, label: 'Sécurité', color: 'bg-green-500/10 text-green-700 dark:text-green-400 border-green-500/20' },
  fix: { icon: Bug, label: 'Correction', color: 'bg-muted text-muted-foreground border-border' },
  design: { icon: Palette, label: 'Design', color: 'bg-purple-500/10 text-purple-700 dark:text-purple-400 border-purple-500/20' },
};

export default function ChangelogPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Changelog — SiteViral" description="Découvrez les dernières nouveautés et améliorations de la plateforme SiteViral." />
      <div className="sticky top-0 z-10 glass border-b border-border/40 px-4 h-12 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <Sparkles className="h-4 w-4 text-primary" />
        <span className="font-semibold text-sm">Nouveautés</span>
      </div>

      <div className="container max-w-2xl py-8 space-y-8">
        <div>
          <h1 className="text-2xl font-bold">Changelog</h1>
          <p className="text-sm text-muted-foreground mt-1">Toutes les nouveautés et améliorations de SiteViral</p>
        </div>

        {CHANGELOG.map((release) => (
          <div key={release.version} className="relative pl-6 border-l-2 border-border">
            <div className="absolute -left-2.5 top-0 h-5 w-5 rounded-full bg-primary flex items-center justify-center">
              <Sparkles className="h-3 w-3 text-primary-foreground" />
            </div>
            <div className="mb-4">
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold">v{release.version}</h2>
                <Badge variant="outline" className="text-xs">{new Date(release.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' })}</Badge>
              </div>
            </div>
            <div className="space-y-2">
              {release.entries.map((entry, i) => {
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
