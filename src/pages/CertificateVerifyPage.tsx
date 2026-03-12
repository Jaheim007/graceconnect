import { useParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { SEOHead } from '@/components/seo/SEOHead';
import { Award, CheckCircle, XCircle, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { motion } from 'framer-motion';
import { useI18n } from '@/i18n/I18nContext';

export default function CertificateVerifyPage() {
  const { certNumber } = useParams();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const dateLoc = isFr ? fr : enUS;

  const { data: certData, isLoading } = useQuery({
    queryKey: ['verify-certificate', certNumber],
    queryFn: async () => {
      if (!certNumber) return null;
      const { data: cert, error } = await db.from('program_certificates')
        .select('*, programs(title, organization_id, organizations(name, logo_url))')
        .eq('certificate_number', certNumber)
        .maybeSingle();
      if (error) throw error;
      if (!cert) return null;

      // Fetch profile separately (no FK from program_certificates to profiles)
      const { data: profile } = await db.from('profiles')
        .select('display_name')
        .eq('id', cert.user_id)
        .maybeSingle();

      return { ...cert, profile };
    },
    enabled: !!certNumber,
  });

  const isValid = !!certData;
  const recipientName = certData?.profile?.display_name || (isFr ? 'Apprenant' : 'Learner');
  const programTitle = (certData?.programs as any)?.title || '';
  const orgName = (certData?.programs as any)?.organizations?.name || '';
  const orgLogo = (certData?.programs as any)?.organizations?.logo_url;
  const issuedAt = certData?.issued_at ? format(new Date(certData.issued_at), 'dd MMMM yyyy', { locale: dateLoc }) : '';
  const orgName = (certData?.programs as any)?.organizations?.name || '';
  const orgLogo = (certData?.programs as any)?.organizations?.logo_url;
  const issuedAt = certData?.issued_at ? format(new Date(certData.issued_at), 'dd MMMM yyyy', { locale: fr }) : '';

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50/50 via-background to-background dark:from-amber-950/10 flex items-center justify-center p-4">
      <SEOHead
        title={isValid ? (isFr ? `Certificat vérifié — ${recipientName}` : `Certificate verified — ${recipientName}`) : (isFr ? 'Vérification de certificat' : 'Certificate verification')}
        description={isValid ? (isFr ? `${recipientName} a complété la formation "${programTitle}" sur Siteviral.` : `${recipientName} completed the "${programTitle}" program on Siteviral.`) : (isFr ? 'Vérifiez un certificat Siteviral.' : 'Verify a Siteviral certificate.')}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full max-w-md"
      >
        {isLoading ? (
          <div className="text-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto" />
            <p className="text-sm text-muted-foreground mt-3">{isFr ? 'Vérification en cours…' : 'Verifying…'}</p>
          </div>
        ) : isValid ? (
          <div className="bg-card rounded-2xl border border-amber-300/40 shadow-xl overflow-hidden">
            {/* Header */}
            <div className="bg-gradient-to-r from-amber-500 to-amber-600 p-6 text-center text-white">
              <div className="h-14 w-14 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-8 w-8" />
              </div>
              <h1 className="text-lg font-bold">{isFr ? 'Certificat Authentique ✓' : 'Authentic Certificate ✓'}</h1>
              <p className="text-xs text-white/80 mt-1">{isFr ? 'Ce certificat est vérifié et valide' : 'This certificate is verified and valid'}</p>
            </div>

            {/* Details */}
            <div className="p-6 space-y-5">
              {/* Recipient */}
              <div className="text-center">
                <p className="text-xs text-muted-foreground uppercase tracking-wider">{isFr ? 'Décerné à' : 'Awarded to'}</p>
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
