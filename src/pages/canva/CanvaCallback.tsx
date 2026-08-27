import { useEffect, useState } from 'react';
import { useNavigate, useSearchParams } from '@/lib/router-compat';
import { useCanvaAuth } from '@/hooks/useCanvaAuth';
import { Loader2, CheckCircle2, XCircle } from 'lucide-react';

export default function CanvaCallback() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { exchangeCode } = useCanvaAuth();
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    const code = searchParams.get('code');
    const error = searchParams.get('error');

    if (error) {
      setStatus('error');
      setErrorMsg(searchParams.get('error_description') || error);
      return;
    }

    if (!code) {
      setStatus('error');
      setErrorMsg('Aucun code d\'autorisation reçu');
      return;
    }

    exchangeCode(code)
      .then(() => {
        setStatus('success');
        // Redirect back to studio after 1.5s
        setTimeout(() => {
          const returnTo = sessionStorage.getItem('canva_return_to') || '/admin/studio/projects';
          sessionStorage.removeItem('canva_return_to');
          navigate(returnTo, { replace: true });
        }, 1500);
      })
      .catch((e) => {
        setStatus('error');
        setErrorMsg(e.message || 'Échec de la connexion');
      });
  }, [searchParams, exchangeCode, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-4 max-w-sm px-4">
        {status === 'loading' && (
          <>
            <Loader2 className="h-10 w-10 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground">Connexion à Canva en cours...</p>
          </>
        )}
        {status === 'success' && (
          <>
            <CheckCircle2 className="h-10 w-10 text-green-500 mx-auto" />
            <p className="text-sm font-medium">Connecté à Canva !</p>
            <p className="text-xs text-muted-foreground">Redirection en cours...</p>
          </>
        )}
        {status === 'error' && (
          <>
            <XCircle className="h-10 w-10 text-destructive mx-auto" />
            <p className="text-sm font-medium">Erreur de connexion</p>
            <p className="text-xs text-muted-foreground">{errorMsg}</p>
            <button
              onClick={() => {
                const returnTo = sessionStorage.getItem('canva_return_to') || '/admin/studio/projects';
                sessionStorage.removeItem('canva_return_to');
                navigate(returnTo, { replace: true });
              }}
              className="text-xs text-primary underline mt-2"
            >
              Retour
            </button>
          </>
        )}
      </div>
    </div>
  );
}
