import { useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Sparkles, X } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { Button } from '@/components/ui/button';
import { setIntent } from '@/lib/intent';

/**
 * Non-blocking nudge for existing providers letting them know they can
 * add new SiteViral feature families (services, appointments, donations, events…)
 * to their existing workspace. Dismisses per-user via localStorage.
 */
export function PlatformEvolvedBanner() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentOrg } = useOrg();
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const dismissKey = user ? `sv_evolved_banner_dismissed_${user.id}` : '';
  const [dismissed, setDismissed] = useState<boolean>(() => {
    try { return !!dismissKey && !!localStorage.getItem(dismissKey); } catch { return false; }
  });

  const shouldShow = useMemo(() => {
    if (!user || !currentOrg || dismissed) return false;
    const count = (currentOrg.enabled_features ?? []).length;
    return count < 4;
  }, [user, currentOrg, dismissed]);

  if (!shouldShow) return null;

  const dismiss = () => {
    try { if (dismissKey) localStorage.setItem(dismissKey, '1'); } catch {}
    setDismissed(true);
  };

  return (
    <div className="rounded-2xl border border-primary/30 bg-gradient-to-br from-primary/10 via-card to-card p-4 flex items-start gap-3">
      <div className="h-9 w-9 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
        <Sparkles className="h-4 w-4 text-primary" />
      </div>
      <div className="flex-1 min-w-0">
        <h3 className="text-sm font-bold">
          {isFr ? 'SiteViral a évolué' : 'SiteViral has evolved'}
        </h3>
        <p className="text-xs text-muted-foreground mt-0.5">
          {isFr
            ? 'Vous pouvez maintenant ajouter des services, rendez-vous, dons, événements ou autres fonctionnalités à votre page.'
            : 'You can now add services, appointments, donations, events and more features to your page.'}
        </p>
        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            onClick={() => { setIntent('provider'); navigate('/start?context=add-feature'); }}
            className="h-7 text-xs"
          >
            {isFr ? 'Ajouter des fonctionnalités' : 'Add features'}
          </Button>
          <Button size="sm" variant="ghost" onClick={dismiss} className="h-7 text-xs">
            {isFr ? 'Plus tard' : 'Later'}
          </Button>
        </div>
      </div>
      <button
        onClick={dismiss}
        aria-label={isFr ? 'Fermer' : 'Dismiss'}
        className="text-muted-foreground hover:text-foreground shrink-0"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
