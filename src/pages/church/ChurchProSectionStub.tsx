import { Link, useLocation } from '@/lib/router-compat';
import { ArrowLeft, Zap, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useI18n } from '@/i18n/I18nContext';

/**
 * Placeholder for pro sections that will be built in later phases
 * (Sermons+AI, Giving, Events, Prayer, Members, Settings).
 */
export default function ChurchProSectionStub({ titleFr, titleEn, phase }: { titleFr: string; titleEn: string; phase: string }) {
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const { pathname } = useLocation();
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/dashboard"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <p className="text-xs text-muted-foreground">SiteViral Church</p>
            <h1 className="text-xl font-bold">{fr ? titleFr : titleEn}</h1>
          </div>
        </div>
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
          <div className="h-12 w-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-4">
            <Clock className="h-6 w-6 text-primary" />
          </div>
          <h2 className="font-semibold mb-1">{fr ? 'Bientôt disponible' : 'Coming soon'}</h2>
          <p className="text-sm text-muted-foreground max-w-md mx-auto">
            {fr
              ? `Cette section (${titleFr}) sera livrée dans la ${phase}. Le plan complet est validé.`
              : `This section (${titleEn}) ships in ${phase}. The full plan is approved.`}
          </p>
          <p className="text-[10px] text-muted-foreground mt-4 font-mono">{pathname}</p>
        </div>
      </div>
    </div>
  );
}
