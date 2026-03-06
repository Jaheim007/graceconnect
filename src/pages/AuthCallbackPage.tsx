import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';
import { useI18n } from '@/i18n/I18nContext';

export default function AuthCallbackPage() {
  const navigate = useNavigate();
  const { t } = useI18n();

  useEffect(() => {
    const handleRedirect = async (session: any) => {
      if (!session) return;

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

    supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        handleRedirect(session);
      }
    });

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        handleRedirect(session);
      }
    });
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