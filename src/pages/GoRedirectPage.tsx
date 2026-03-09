import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

/**
 * Redirect page for short links: /go/:code
 *
 * For human visitors (browser): resolves the target_path from DB and redirects.
 * For crawlers: they hit the edge function URL (via the share URL), not this page.
 */
export default function GoRedirectPage() {
  const { code } = useParams<{ code: string }>();
  const [error, setError] = useState(false);

  useEffect(() => {
    if (!code) {
      window.location.replace('/');
      return;
    }

    (async () => {
      try {
        const { data } = await (supabase as any)
          .from('short_links')
          .select('target_path')
          .eq('id', code)
          .maybeSingle();

        if (data?.target_path) {
          // Increment clicks (fire-and-forget)
          Promise.resolve(supabase.rpc('increment_short_link_clicks', { _code: code })).catch(() => {});
          window.location.replace(data.target_path);
        } else {
          setError(true);
          setTimeout(() => window.location.replace('/'), 2000);
        }
      } catch {
        setError(true);
        setTimeout(() => window.location.replace('/'), 2000);
      }
    })();
  }, [code]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-2">
        {error ? (
          <>
            <p className="text-sm text-destructive font-medium">Lien introuvable</p>
            <p className="text-xs text-muted-foreground">Redirection vers l'accueil…</p>
          </>
        ) : (
          <>
            <div className="h-8 w-8 border-2 border-primary border-t-transparent rounded-full animate-spin mx-auto" />
            <p className="text-sm text-muted-foreground">Redirection en cours…</p>
          </>
        )}
      </div>
    </div>
  );
}
