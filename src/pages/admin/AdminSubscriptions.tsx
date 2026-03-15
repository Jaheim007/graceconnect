import { AdminPageShell } from './AdminPageShell';
import { useI18n } from '@/i18n/I18nContext';
import { CreditCard, Clock } from 'lucide-react';

export default function AdminSubscriptions() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <AdminPageShell
      title={isFr ? 'Abonnements' : 'Subscriptions'}
      subtitle={isFr ? 'Plans, abonnés et revenus récurrents' : 'Plans, subscribers and recurring revenue'}
      backRoute="/admin"
    >
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <CreditCard className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{isFr ? 'Interface bientôt disponible' : 'Interface coming soon'}</h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            {isFr
              ? 'La gestion des abonnements et revenus récurrents sera disponible prochainement. Restez connecté !'
              : 'Subscription management and recurring revenue tools are coming soon. Stay tuned!'}
          </p>
        </div>
      </div>
    </AdminPageShell>
  );
}
