import { useEffect } from "react";
import { Link, Navigate, useNavigate } from "@/lib/router-compat";
import { useQuery } from "@tanstack/react-query";
import { ArrowLeft, Loader2, Shield } from "lucide-react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import IdentityVerificationWizard from "@/components/verification/IdentityVerificationWizard";

export default function BeautyKYCPage() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    document.title = "Vérification KYC — SiteViral Beauty";
  }, []);

  const { data, isLoading } = useQuery({
    enabled: !!user,
    queryKey: ["beauty-kyc", user?.id],
    queryFn: async () => {
      const { data: provider, error } = await supabase
        .from("beauty_providers")
        .select("id, business_name, status, kyc_submission_id")
        .eq("user_id", user!.id)
        .maybeSingle();
      if (error) throw error;
      if (!provider) return { provider: null, submission: null };

      let submission: { status: string | null; rejection_reason: string | null } | null = null;
      if (provider.kyc_submission_id) {
        const { data: sub } = await supabase
          .from("kyc_submissions")
          .select("status, rejection_reason")
          .eq("id", provider.kyc_submission_id)
          .maybeSingle();
        submission = sub ?? null;
      }
      return { provider, submission };
    },
  });

  if (loading || isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) return <Navigate to="/auth?returnTo=/admin/beauty/kyc" replace />;
  if (!data?.provider) return <Navigate to="/beauty/pro/onboarding" replace />;

  const { provider, submission } = data;

  return (
    <div className="beauty-scope min-h-screen bg-background">
      <div className="mx-auto max-w-2xl px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")} className="shrink-0">
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div>
            <p className="text-xs text-muted-foreground">SiteViral Beauty</p>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Shield className="h-5 w-5 text-primary" />
              Vérification KYC
            </h1>
          </div>
        </div>

        <div className="rounded-2xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-4 text-sm">
          <p className="font-semibold text-amber-900 dark:text-amber-100">
            Requis pour apparaître dans l'Explore
          </p>
          <p className="text-xs text-amber-800/80 dark:text-amber-200/80 mt-1">
            Tant que votre KYC n'est pas validé, votre profil <strong>{provider.business_name}</strong> reste
            invisible dans la recherche SiteViral Beauty. Votre lien public reste partageable manuellement.
          </p>
        </div>

        <IdentityVerificationWizard
          mode="beauty"
          entityId={provider.id}
          status={submission?.status ?? "none"}
          rejectionReason={submission?.rejection_reason ?? null}
        />

        <p className="text-center text-xs text-muted-foreground">
          Besoin d'aide ?{" "}
          <Link to="/help" className="text-primary underline underline-offset-2">
            Contactez le support
          </Link>
        </p>
      </div>
    </div>
  );
}
