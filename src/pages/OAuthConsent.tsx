import { useEffect, useState } from 'react';
import { useSearchParams } from '@/lib/router-compat';
import { supabase } from '@/integrations/supabase/client';
import { SiteLogo } from '@/components/ui/SiteLogo';
import { Button } from '@/components/ui/button';
import { Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

export default function OAuthConsent() {
  const [params] = useSearchParams();
  const authorizationId = params.get('authorization_id') ?? '';
  const [details, setDetails] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const { locale, t } = useI18n();
  const isFr = locale === 'fr';

  useEffect(() => {
    let active = true;
    (async () => {
      if (!authorizationId) return setError(isFr ? 'Identifiant de demande manquant' : 'Missing authorization_id');
      const { data: sess } = await supabase.auth.getSession();
      if (!sess.session) {
        const next = window.location.pathname + window.location.search;
        window.location.href = '/auth?returnTo=' + encodeURIComponent(next);
        return;
      }
      const anyAuth = supabase.auth as any;
      const { data, error } = await anyAuth.oauth.getAuthorizationDetails(authorizationId);
      if (!active) return;
      if (error) return setError(error.message);
      const immediate = data?.redirect_url ?? data?.redirect_to;
      if (immediate && !data?.client) { window.location.href = immediate; return; }
      setDetails(data);
    })();
    return () => { active = false; };
  }, [authorizationId, isFr]);

  async function decide(approve: boolean) {
    setBusy(true);
    const anyAuth = supabase.auth as any;
    const { data, error } = approve
      ? await anyAuth.oauth.approveAuthorization(authorizationId)
      : await anyAuth.oauth.denyAuthorization(authorizationId);
    if (error) { setBusy(false); return setError(error.message); }
    const target = data?.redirect_url ?? data?.redirect_to;
    if (!target) { setBusy(false); return setError(isFr ? 'Aucune redirection retournée' : 'No redirect returned by the authorization server.'); }
    window.location.href = target;
  }

  if (error) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="max-w-md w-full bg-card border border-border rounded-2xl p-6 shadow-lg">
          <div className="mb-4 flex justify-center">
            <SiteLogo className="h-8" />
          </div>
          <h1 className="text-xl font-bold mb-2 text-center">{isFr ? 'Erreur d\'autorisation' : 'Authorization error'}</h1>
          <p className="text-sm text-muted-foreground text-center">{error}</p>
        </div>
      </main>
    );
  }

  if (!details) {
    return (
      <main className="min-h-screen flex items-center justify-center p-6 bg-background">
        <div className="flex flex-col items-center gap-3 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin" />
          <p className="text-sm">{isFr ? 'Chargement…' : 'Loading…'}</p>
        </div>
      </main>
    );
  }

  const clientName = details.client?.name ?? (isFr ? 'Cette application' : 'This application');
  return (
    <main className="min-h-screen flex items-center justify-center p-6 bg-background">
      <div className="max-w-md w-full bg-card border border-border rounded-2xl p-8 shadow-xl">
        <div className="text-center mb-6">
          <div className="h-14 w-14 mx-auto rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
            <SiteLogo className="h-7" />
          </div>
          <h1 className="text-xl font-bold">
            {isFr ? `Connecter ${clientName} à SiteViral` : `Connect ${clientName} to SiteViral`}
          </h1>
          <p className="text-sm text-muted-foreground mt-2">
            {isFr
              ? `${clientName} pourra agir en ton nom sur tes espaces, produits, achats et statistiques SiteViral.`
              : `${clientName} will be able to access your SiteViral organizations, products, purchases, and analytics on your behalf.`}
          </p>
        </div>

        <div className="rounded-xl border border-border bg-muted/30 p-4 mb-6">
          <p className="text-xs text-muted-foreground">
            {isFr
              ? 'Aucun contenu ne sera publié automatiquement. Les créations arrivent en brouillon et conservent tes règles de prix et de publication.'
              : 'No content will be published automatically. Creations arrive as drafts and keep your pricing and publishing rules.'}
          </p>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            disabled={busy}
            onClick={() => decide(false)}
            className="flex-1 h-11"
          >
            {isFr ? 'Refuser' : 'Deny'}
          </Button>
          <Button
            disabled={busy}
            onClick={() => decide(true)}
            className="flex-1 h-11"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : (isFr ? 'Approuver' : 'Approve')}
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground/70 text-center mt-4">
          {isFr
            ? 'Tu peux révoquer cet accès à tout moment depuis les paramètres de ton compte SiteViral.'
            : 'You can revoke access anytime from your SiteViral account settings.'}
        </p>
      </div>
    </main>
  );
}
