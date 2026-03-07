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

    // Step 1: If URL has a ?code= param (PKCE flow), exchange it explicitly
    const url = new URL(window.location.href);
    const code = url.searchParams.get('code');

    if (code) {
      supabase.auth.exchangeCodeForSession(code).then(({ data, error }) => {
        if (error) {
          console.error('Code exchange failed:', error.message);
          // Fallback: try getSession in case Supabase auto-handled it
          supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) handleRedirect(session);
            else navigate('/auth', { replace: true });
          });
        } else if (data.session) {
          handleRedirect(data.session);
        }
      });
    } else {
      // No code param — check hash fragments (implicit flow) or existing session
      supabase.auth.getSession().then(({ data: { session } }) => {
        if (session) handleRedirect(session);
      });
    }

    // Step 2: Also listen for auth state changes as fallback
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        handleRedirect(session);
      }
    });

    // Step 3: Safety timeout — redirect to auth if nothing happens in 10s
    const timeout = setTimeout(() => {
      if (!handled.current) {
        console.warn('Auth callback timeout — redirecting to /auth');
        navigate('/auth', { replace: true });
      }
    }, 10_000);

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
