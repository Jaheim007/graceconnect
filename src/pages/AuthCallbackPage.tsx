import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';
import { getIntent, clearIntent } from '@/lib/intent';

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

      const savedIntent = sessionStorage.getItem('sv_auth_intent');
      if (savedIntent === 'ambassador' || savedIntent === 'creator') {
        sessionStorage.removeItem('sv_auth_intent');
        try { localStorage.setItem('sv_app_mode', savedIntent); } catch {}
      } else if (savedIntent === 'partner') {
        sessionStorage.removeItem('sv_auth_intent');
      }

      // Check if user came from a custom domain/subdomain and redirect back
      const originDomain = sessionStorage.getItem('sv_auth_origin_domain');
      if (originDomain) {
        sessionStorage.removeItem('sv_auth_origin_domain');
        const savedReturnTo = sessionStorage.getItem('sv_auth_returnTo');
        sessionStorage.removeItem('sv_auth_returnTo');
        // Redirect back to their domain — session will sync via shared Supabase auth
        const returnPath = savedReturnTo || '/dashboard';
        window.location.replace(`${originDomain}${returnPath}`);
        return;
      }

      const savedReturnTo = sessionStorage.getItem('sv_auth_returnTo');
      if (savedReturnTo) {
        sessionStorage.removeItem('sv_auth_returnTo');
        navigate(savedReturnTo, { replace: true });
        return;
      }

      const createdAt = new Date(session.user.created_at).getTime();
      const now = Date.now();
      const isNewUser = now - createdAt < 60_000;

      // Intent-first routing (§AuthCallback)
      const intent = getIntent();
      if (intent) {
        clearIntent();
        if (intent.kind === 'provider') {
          // Provider intent: brand-new → /start; existing users get their dashboard.
          navigate(isNewUser ? '/start' : (intent.returnTo || '/dashboard'), { replace: true });
          return;
        }
        // Client intent: never route to /start or seller dashboard.
        navigate(intent.returnTo || '/services', { replace: true });
        return;
      }

      // Vertical-aware fallback: last engaged vertical before auth.
      try {
        const lastVertical = localStorage.getItem('sv_last_vertical');
        if (!isNewUser && lastVertical && lastVertical !== 'digital') {
          navigate(`/${lastVertical}`, { replace: true });
          return;
        }
      } catch {}

      // Brand-new user with no intent → intent chooser. Existing → dashboard.
      navigate(isNewUser ? '/welcome-intent' : '/dashboard', { replace: true });
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
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');

      if (code) {
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error && data.session) {
          await handleRedirect(data.session);
          return;
        }
        console.warn('OAuth code exchange did not return a session immediately, retrying recovery...', error?.message);
      }

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
