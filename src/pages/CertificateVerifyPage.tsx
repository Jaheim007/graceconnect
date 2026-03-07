import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { SEOHead } from '@/components/seo/SEOHead';
import { Award, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { motion } from 'framer-motion';

export default function CertificateVerifyPage() {
  const { certNumber } = useParams();

  const { data: cert, isLoading, isError } = useQuery({
    queryKey: ['verify-certificate', certNumber],
    queryFn: async () => {
      if (!certNumber) return null;
      const { data, error } = await db.from('program_certificates')
        .select('*, programs(title, organization_id, organizations(name, logo_url)), profiles!program_certificates_user_id_fkey(display_name)')
        .eq('certificate_number', certNumber)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!certNumber,
  });

  const isValid = !!cert;
  const recipientName = cert?.profiles?.display_name || 'Apprenant';
  const programTitle = cert?.programs?.title || '';
  const orgName = cert?.programs?.organizations?.name || '';
  const orgLogo = cert?.programs?.organizations?.logo_url;
  const issuedAt = cert?.issued_at ? format(new Date(cert.issued_at), 'dd MMMM yyyy', { locale: fr }) : '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-background to-background dark:from-amber-950/10 flex items-center justify-center p-4">
      <SEOHead
        title={isValid ? `Certificat vérifié — ${recipientName}` : 'Vérification de certificat'}
        description={isValid ? `${recipientName} a complété la formation "${programTitle}" sur Siteviral.` : 'Vérifiez un certificat Siteviral.'}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {isLoading ? (
          <div className="text-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground mt-3">Vérification en cours…</p>
          </div>
        ) : isValid ? (
          <div className="bg-card rounded-2xl border border-amber-300/40 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-center text-white">
              <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h1 className="text-lg font-bold">Certificat Authentique ✓</h1>
              <p className="text-xs text-white/80 mt-1">Ce certificat est vérifié et valide</p>
            </div>

            {/* Details */}
            <div className="p-6 space-y-5">
              {/* Recipient */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Décerné à</p>
                <p className="text-xl font-bold mt-1">{recipientName}</p>
              </div>

              {/* Program */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">Formation</p>
                <p className="text-base font-semibold text-primary mt-1">« {programTitle} »</p>
              </div>

              {/* Organization */}
              <div className="flex items-center justify-center gap-2">
                {orgLogo ? (
                  <img src={orgLogo} alt="" className="h-6 w-6 rounded-lg object-cover" />
                ) : null}
                <span className="text-sm text-muted-foreground">{orgName}</span>
              </div>

              {/* Meta */}
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground border-t pt-4">
                <span>📅 {issuedAt}</span>
                <span className="font-mono text-[10px]">N° {certNumber}</span>
              </div>

              {/* Seal */}
              <div className="flex justify-center">
                <div className="h-16 w-16 rounded-full bg-gradient-to-br from-amber-400 to-amber-600 flex items-center justify-center shadow-lg">
                  <Award className="h-7 w-7 text-white" />
                </div>
              </div>

              <p className="text-center text-[10px] text-muted-foreground">
                Vérifié par Siteviral — siteviral.com
              </p>
            </div>
          </div>
        ) : (
          <div className="bg-card rounded-2xl border border-destructive/30 shadow-xl p-8 text-center">
            <div className="h-14 w-14 rounded-full bg-destructive/10 flex items-center justify-center mx-auto mb-4">
              <XCircle className="h-8 w-8 text-destructive" />
            </div>
            <h1 className="text-lg font-bold mb-2">Certificat introuvable</h1>
            <p className="text-sm text-muted-foreground">
              Le numéro de certificat <span className="font-mono font-semibold">{certNumber}</span> n'existe pas dans notre système.
            </p>
            <p className="text-xs text-muted-foreground mt-3">
              Vérifiez que le numéro est correct et réessayez.
            </p>
          </div>
        )}
      </motion.div>
    </div>
  );
}
