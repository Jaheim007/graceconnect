import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { resolvePostAuthRedirect } from '@/lib/authRedirect';
import { safeReturnTo } from '@/lib/pendingAction';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const handled = useRef(false);

  useEffect(() => {
    const clearOAuthPending = () => {
      try { sessionStorage.removeItem('sv_oauth_pending_since'); } catch {}
    };

    const handleRedirect = async (session: any) => {
      if (!session || handled.current) return;
      handled.current = true;

      // Legacy ambassador/creator/partner intent set from marketing pages.
      const savedIntent = sessionStorage.getItem('sv_auth_intent');
      if (savedIntent === 'ambassador' || savedIntent === 'creator') {
        sessionStorage.removeItem('sv_auth_intent');
        try { localStorage.setItem('sv_app_mode', savedIntent); } catch {}
      } else if (savedIntent === 'partner') {
        sessionStorage.removeItem('sv_auth_intent');
      }

      // Custom domain / subdomain bounce — preserve exact returnTo.
      const originDomain = sessionStorage.getItem('sv_auth_origin_domain');
      if (originDomain) {
        sessionStorage.removeItem('sv_auth_origin_domain');
        const savedReturnTo = sessionStorage.getItem('sv_auth_returnTo');
        sessionStorage.removeItem('sv_auth_returnTo');
        const returnPath = safeReturnTo(savedReturnTo) || '/';
        window.location.replace(`${originDomain}${returnPath}`);
        return;
      }

      const createdAt = new Date(session.user.created_at).getTime();
      const isNewUser = Date.now() - createdAt < 60_000;

      const target = resolvePostAuthRedirect({
        isNewUser,
        explicitReturnTo: null, // OAuth loses URL params — pendingAction / sv_auth_returnTo covers it.
      });
      navigate(target, { replace: true });
    };

    const recoverSessionOnce = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        await handleRedirect(session);
        return true;
      }
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: { session: syncedSession } } = await supabase.auth.getSession();
        if (syncedSession) {
          await handleRedirect(syncedSession);
          return true;
        }
      }
      return false;
    };

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') && session) {
        handleRedirect(session);
      }
    });

    const attemptSessionRecovery = async () => {
      // NOTE: The Supabase client is configured with `detectSessionInUrl: true`,
      // so it automatically exchanges the `?code=` param for a session on load.
      // Calling `exchangeCodeForSession` manually here races with that auto-exchange
      // and produces "400: State has already been used" errors that leave the user
      // stuck on the "Connecting…" spinner. We rely on onAuthStateChange +
      // getSession polling below instead.


      if (await recoverSessionOnce()) return;

      for (let i = 0; i < 12; i++) {
        await new Promise((resolve) => setTimeout(resolve, 1500));
        if (handled.current) return;
        if (await recoverSessionOnce()) return;
      }

      if (!handled.current) {
        clearOAuthPending();
        console.warn('Auth callback: session still unavailable after retries, redirecting to /auth');
        navigate('/auth', { replace: true });
      }
    };

    attemptSessionRecovery();

    const timeout = setTimeout(() => {
      if (!handled.current) {
        clearOAuthPending();
        console.warn('Auth callback timeout — redirecting to /auth');
        navigate('/auth', { replace: true });
      }
    }, 45_000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, [navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4">
        <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
        <p className="text-muted-foreground text-sm">{t('auth.connecting')}</p>
      </div>
    </div>
  );
}
