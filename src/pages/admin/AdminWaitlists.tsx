import { AdminPageShell } from './AdminPageShell';
import { useI18n } from '@/i18n/I18nContext';
import { Clock as ClockIcon, Clock } from 'lucide-react';

export default function AdminWaitlists() {
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  return (
    <AdminPageShell title="Waitlists" backRoute="/admin">
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
        <div className="h-16 w-16 rounded-2xl bg-primary/10 flex items-center justify-center">
          <ClockIcon className="h-8 w-8 text-primary" />
        </div>
        <div className="space-y-2">
          <div className="flex items-center justify-center gap-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <h2 className="text-lg font-semibold">{isFr ? 'Interface bientôt disponible' : 'Interface coming soon'}</h2>
          </div>
          <p className="text-sm text-muted-foreground max-w-md">
            {isFr
              ? 'La gestion des waitlists sera disponible prochainement. Restez connecté !'
              : 'Waitlist management tools are coming soon. Stay tuned!'}
          </p>
        </div>
      </div>
    </AdminPageShell>
  );
}
