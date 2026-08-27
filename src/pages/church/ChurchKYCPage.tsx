import { useEffect } from 'react';
import { Link, Navigate, useNavigate } from '@/lib/router-compat';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import IdentityVerificationWizard from '@/components/verification/IdentityVerificationWizard';

export default function ChurchKYCPage() {
  const { user, loading } = useAuth();
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const navigate = useNavigate();

  useEffect(() => {
    document.title = fr ? 'Vérification KYC — SiteViral Church' : 'KYC verification — SiteViral Church';
  }, [fr]);

  const { data, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ['church-kyc', user?.id],
    queryFn: async () => {
      const { data: provider, error } = await supabase
        .from('church_providers')
        .select('id, name, status, kyc_submission_id')
        .eq('user_id', user!.id)
        .maybeSingle();
      if (error) throw error;
      if (!provider) return { provider: null, submission: null };
      let submission: { status: string | null; rejection_reason: string | null } | null = null;
      if (provider.kyc_submission_id) {
        const { data: sub } = await supabase
          .from('kyc_submissions')
          .select('status, rejection_reason')
          .eq('id', provider.kyc_submission_id)
          .maybeSingle();
        submission = sub ?? null;
      }
      return { provider, submission };
    },
  });

  if (loading || isLoading) {
    return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  }
  if (!user) return <Navigate to="/auth?returnTo=/church/pro/kyc" replace />;
  if (!data?.provider) return <Navigate to="/church/pro/onboarding" replace />;

  const { provider, submission } = data;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate('/church/pro')} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <p className="text-xs text-muted-foreground">SiteViral Church</p>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              {fr ? 'Vérification KYC' : 'KYC Verification'}
            </h1>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-sm">
          <p className="font-semibold text-amber-900 dark:text-amber-100">
            {fr ? "Requis pour apparaître dans l'annuaire" : 'Required to appear in the directory'}
          </p>
          <p className="text-xs text-amber-800/80 dark:text-amber-200/80 mt-1">
            {fr ? (
              <>Tant que votre KYC n'est pas validé, votre église <strong>{provider.name}</strong> reste invisible dans la découverte SiteViral Church et ne peut pas recevoir de dons.</>
            ) : (
              <>Until KYC is approved, your church <strong>{provider.name}</strong> stays hidden from discovery and cannot receive donations.</>
            )}
          </p>
        </div>

        <IdentityVerificationWizard
          mode="church"
          entityId={provider.id}
          status={submission?.status ?? 'none'}
          rejectionReason={submission?.rejection_reason ?? null}
        />

        <p className="text-center text-xs text-muted-foreground">
          {fr ? "Besoin d'aide ?" : 'Need help?'}{' '}
          <Link to="/help" className="text-primary underline underline-offset-2">
            {fr ? 'Contactez le support' : 'Contact support'}
          </Link>
        </p>
      </div>
    </div>
  );
}
