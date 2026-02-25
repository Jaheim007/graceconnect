import { Wrench, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { SEOHead } from '@/components/seo/SEOHead';

interface MaintenancePageProps {
  message?: string;
}

export default function MaintenancePage({ message }: MaintenancePageProps) {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center px-4">
      <SEOHead title="Maintenance — SiteViral" description="Le site est en maintenance." />
      <div className="text-center max-w-md space-y-6">
        <div className="mx-auto h-20 w-20 rounded-3xl bg-primary/10 border border-primary/20 flex items-center justify-center">
          <Wrench className="h-10 w-10 text-primary animate-pulse" />
        </div>
        <div>
          <h1 className="text-2xl font-bold">Maintenance en cours</h1>
          <p className="text-muted-foreground mt-2 text-sm">
            {message || 'Nous effectuons une maintenance programmée. Nous serons de retour très bientôt.'}
          </p>
        </div>
        <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
          <RefreshCw className="h-4 w-4" /> Rafraîchir la page
        </Button>
        <p className="text-xs text-muted-foreground">
          Si le problème persiste, contactez-nous à{' '}
          <a href="mailto:support@siteviral.com" className="text-primary underline">support@siteviral.com</a>
        </p>
      </div>
    </div>
  );
}
