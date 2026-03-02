import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export default function AuthCallbackPage() {
  const navigate = useNavigate();

  useEffect(() => {
    const handleRedirect = async (session: any) => {
      if (!session) return;

      // Apply saved intent from pre-auth flow
      const savedIntent = sessionStorage.getItem('sv_auth_intent');
      if (savedIntent === 'ambassador' || savedIntent === 'creator') {
        sessionStorage.removeItem('sv_auth_intent');
        try { localStorage.setItem('sv_app_mode', savedIntent); } catch {}
      }

      // Check if user is new (created within last 60 seconds)
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
        <p className="text-muted-foreground text-sm">Connexion en cours…</p>
      </div>
    </div>
  );
}
