import { useEffect, useState } from 'react';
import { Link, useParams, useSearchParams } from 'react-router-dom';
import { CheckCircle2, Loader2, Download, ArrowLeft, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/i18n/I18nContext';

export default function ChurchSermonPdfSuccessPage() {
  const { slug } = useParams<{ slug: string }>();
  const [params] = useSearchParams();
  const reference = params.get('reference') || '';
  const { locale } = useI18n();
  const fr = locale === 'fr';

  const [status, setStatus] = useState<'checking' | 'ready' | 'pending' | 'error'>('checking');
  const [downloadUrl, setDownloadUrl] = useState<string | null>(null);
  const [title, setTitle] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    if (!reference) { setStatus('error'); setError('Missing reference'); return; }
    let attempts = 0;
    const tick = async () => {
      attempts += 1;
      try {
        const { data, error } = await supabase.functions.invoke('church-sermon-pdf-download', {
          body: { reference },
        });
        if (error) throw new Error(error.message);
        const d = data as any;
        if (d?.download_url) {
          setDownloadUrl(d.download_url);
          setTitle(d.title || '');
          setStatus('ready');
          return true;
        }
        if (d?.status && d.status !== 'succeeded') {
          setStatus('pending');
          return false;
        }
        setStatus('pending');
        return false;
      } catch (e: any) {
        if (attempts > 20) { setStatus('error'); setError(e?.message || 'Error'); return true; }
        setStatus('pending');
        return false;
      }
    };
    tick();
    const t = setInterval(async () => {
      const done = await tick();
      if (done) clearInterval(t);
    }, 3000);
    return () => clearInterval(t);
  }, [reference]);

  return (
    <div className="sv-nav-clearance min-h-[100dvh] bg-background flex items-start sm:items-center justify-center px-4 pt-4 pb-10 sm:py-10">
      <div className="max-w-md w-full rounded-3xl border border-border bg-card p-8 text-center space-y-4">
        {status === 'checking' || status === 'pending' ? (
          <>
            <Clock className="h-10 w-10 mx-auto text-primary animate-pulse" />
            <h1 className="text-xl font-bold">{fr ? 'Finalisation du paiement…' : 'Finalizing payment…'}</h1>
            <p className="text-sm text-muted-foreground">{fr ? 'Nous préparons votre téléchargement. Cela prend quelques secondes.' : 'Preparing your download. This takes a few seconds.'}</p>
            <Loader2 className="h-4 w-4 mx-auto animate-spin text-muted-foreground" />
          </>
        ) : status === 'ready' && downloadUrl ? (
          <>
            <CheckCircle2 className="h-12 w-12 mx-auto text-emerald-500" />
            <h1 className="text-xl font-bold">{fr ? 'Paiement confirmé' : 'Payment confirmed'}</h1>
            {title && <p className="text-sm text-muted-foreground">{title}</p>}
            <Button size="lg" asChild className="w-full">
              <a href={downloadUrl} target="_blank" rel="noreferrer">
                <Download className="mr-2 h-4 w-4" /> {fr ? 'Télécharger le PDF' : 'Download PDF'}
              </a>
            </Button>
            <p className="text-[10px] text-muted-foreground">{fr ? 'Le lien de téléchargement expire dans 10 minutes. Rechargez cette page si besoin.' : 'The download link expires in 10 minutes. Reload this page if needed.'}</p>
          </>
        ) : (
          <>
            <h1 className="text-xl font-bold">{fr ? 'Une erreur est survenue' : 'Something went wrong'}</h1>
            <p className="text-sm text-muted-foreground">{error}</p>
          </>
        )}
        <Button variant="ghost" size="sm" asChild>
          <Link to={`/church/${slug || 'discover'}`}><ArrowLeft className="mr-1 h-4 w-4" /> {fr ? 'Retour à l\'église' : 'Back to church'}</Link>
        </Button>
      </div>
    </div>
  );
}
