import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { t } = useI18n();
  const handled = useRef(false);

  useEffect(() => {
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

      const savedReturnTo = sessionStorage.getItem('sv_auth_returnTo');
      if (savedReturnTo) {
        sessionStorage.removeItem('sv_auth_returnTo');
        navigate(savedReturnTo, { replace: true });
        return;
      }

      const createdAt = new Date(session.user.created_at).getTime();
      const now = Date.now();
      const isNewUser = now - createdAt < 60_000;

      if (isNewUser) {
        navigate('/welcome', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    };

    // Listen for auth state changes FIRST (before any async work)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if ((event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED' || event === 'INITIAL_SESSION') && session) {
        handleRedirect(session);
      }
    });

    const attemptSessionRecovery = async () => {
      const url = new URL(window.location.href);
      const code = url.searchParams.get('code');

      if (code) {
        // PKCE flow: exchange code for session
        const { data, error } = await supabase.auth.exchangeCodeForSession(code);
        if (!error && data.session) {
          handleRedirect(data.session);
          return;
        }
        // Code exchange failed — might already be consumed by Supabase internally
        console.warn('Code exchange failed, checking existing session...', error?.message);
      }

      // Check for hash fragments (implicit flow) or existing session
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        handleRedirect(session);
        return;
      }

      // Retry: wait a bit and check again (Supabase may still be processing)
      for (let i = 0; i < 5; i++) {
        await new Promise(r => setTimeout(r, 2000));
        if (handled.current) return;
        const { data: { session: retrySession } } = await supabase.auth.getSession();
        if (retrySession) {
          handleRedirect(retrySession);
          return;
        }
      }

      // All retries failed — redirect to auth
      if (!handled.current) {
        console.warn('Auth callback: all session recovery attempts failed, redirecting to /auth');
        navigate('/auth', { replace: true });
      }
    };

    attemptSessionRecovery();

    // Safety timeout — 20s (increased from 10s for slow mobile connections)
    const timeout = setTimeout(() => {
      if (!handled.current) {
        console.warn('Auth callback timeout — redirecting to /auth');
        navigate('/auth', { replace: true });
      }
    }, 20_000);

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
