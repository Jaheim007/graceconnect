import { useEffect } from 'react';
import { Link, useParams, useSearchParams } from '@/lib/router-compat';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, HandHeart, Church, Loader2, XCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useI18n } from '@/i18n/I18nContext';

export default function ChurchGiveSuccessPage() {
  const { slug } = useParams<{ slug: string }>();
  const [params] = useSearchParams();
  const reference = params.get('reference');
  const { locale } = useI18n();
  const fr = locale === 'fr';

  const { data: donation, refetch } = useQuery({
    enabled: !!reference,
    queryKey: ['church-donation', reference],
    queryFn: async () => {
      const { data } = await supabase.functions.invoke('church-giving-status', { body: { reference } });
      return (data as any) || null;
    },
    refetchInterval: (q) => (q.state.data?.status === 'pending' ? 3000 : false),
  });

  useEffect(() => { document.title = fr ? 'Merci pour votre don' : 'Thank you for your gift'; }, [fr]);

  useEffect(() => {
    // Nudge refetch after mount
    const t = setTimeout(() => refetch(), 1500);
    return () => clearTimeout(t);
  }, [refetch]);

  const status = donation?.status;

  return (
    <div className="sv-nav-clearance min-h-[100dvh] bg-background flex items-start sm:items-center justify-center p-4 pb-10 sm:py-10">
      <div className="max-w-md w-full text-center space-y-4">
        {status === 'completed' ? (
          <>
            <div className="mx-auto h-16 w-16 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center">
              <CheckCircle2 className="h-8 w-8 text-emerald-600" />
            </div>
            <h1 className="text-2xl font-bold">{fr ? 'Merci pour votre don !' : 'Thank you for your gift!'}</h1>
            <p className="text-sm text-muted-foreground">
              {fr ? `Votre don de ${Number(donation.amount).toLocaleString()} ${donation.currency} a été reçu.` : `Your gift of ${Number(donation.amount).toLocaleString()} ${donation.currency} was received.`}
            </p>
            <p className="text-xs text-muted-foreground">{fr ? 'Un reçu vous sera envoyé par email.' : 'A receipt will be emailed to you.'}</p>
          </>
        ) : status === 'failed' ? (
          <>
            <div className="mx-auto h-16 w-16 rounded-full bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center">
              <XCircle className="h-8 w-8 text-rose-600" />
            </div>
            <h1 className="text-2xl font-bold">{fr ? 'Paiement échoué' : 'Payment failed'}</h1>
            <p className="text-sm text-muted-foreground">{fr ? 'Aucun montant n\'a été prélevé.' : 'No amount was charged.'}</p>
          </>
        ) : (
          <>
            <div className="mx-auto h-16 w-16 rounded-full bg-amber-100 dark:bg-amber-900/30 flex items-center justify-center">
              {donation ? <Clock className="h-8 w-8 text-amber-600" /> : <Loader2 className="h-8 w-8 text-amber-600 animate-spin" />}
            </div>
            <h1 className="text-2xl font-bold">{fr ? 'Confirmation en cours…' : 'Confirming payment…'}</h1>
            <p className="text-sm text-muted-foreground">{fr ? 'Cela peut prendre quelques secondes.' : 'This may take a few seconds.'}</p>
          </>
        )}
        <Button asChild variant="outline">
          <Link to={`/church/${slug}`}><Church className="mr-2 h-4 w-4" /> {fr ? 'Retour à l\'église' : 'Back to the church'}</Link>
        </Button>
      </div>
    </div>
  );
}
