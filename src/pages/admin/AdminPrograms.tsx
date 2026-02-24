import { AdminPageShell } from './AdminPageShell';
import { useI18n } from '@/i18n/I18nContext';
import { GraduationCap, Clock } from 'lucide-react';

export default function AdminPrograms() {
  const { t } = useI18n();

  return (
    <AdminPageShell title={t('admin_programs.title')} subtitle={t('admin_programs.subtitle')} backRoute="/admin">
      <div className="flex flex-col items-center justify-center py-16 space-y-4 text-center">
        <div className="h-16 w-16 rounded-full bg-muted flex items-center justify-center">
          <Clock className="h-8 w-8 text-muted-foreground" />
        </div>
        <h2 className="text-base font-semibold">Bientôt disponible</h2>
        <p className="text-sm text-muted-foreground max-w-sm">
          La fonctionnalité de programmes de formation est en cours de développement. Revenez bientôt !
        </p>
      </div>
    </AdminPageShell>
  );
}
