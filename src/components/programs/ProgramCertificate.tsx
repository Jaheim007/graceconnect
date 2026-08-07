import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Award, Download, Share2, Loader2, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { buildShareUrlForPath } from '@/lib/shareMeta';
import { useI18n } from '@/i18n/I18nContext';
import {
  certificateErrorMessage,
  certificateFilename,
  downloadCertificatePdf,
  issueProgramCertificate,
} from '@/lib/certificates';

interface Props {
  programId: string;
  programTitle: string;
  orgName: string;
  orgLogo?: string | null;
  progressPercent: number;
  totalLessons: number;
  completedLessons: number;
}

/**
 * Course-page certificate card.
 *
 * Issuance goes through the server function issue_program_certificate();
 * rendering goes through the generate-certificate-pdf edge function, which is
 * the single certificate renderer. The previous canvas/PNG renderer is gone.
 */
export function ProgramCertificate({
  programId, programTitle, orgName,
  progressPercent, totalLessons,
}: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const dateLoc = isFr ? fr : enUS;
  const qc = useQueryClient();
  const [downloading, setDownloading] = useState(false);

  const isComplete = progressPercent >= 100;

  const { data: certificate } = useQuery({
    queryKey: ['program-certificate', programId, user?.id],
    queryFn: async () => {
      if (!user) return null;
      const { data } = await db.from('program_certificates')
        .select('*')
        .eq('program_id', programId)
        .eq('user_id', user.id)
        .maybeSingle();
      return data;
    },
    enabled: !!user && isComplete,
  });

  const issueCert = useMutation({
    mutationFn: async () => {
      const result = await issueProgramCertificate(programId);
      if (!result.ok) {
        const err = new Error(result.error || 'issue_failed');
        (err as any).code = result.error;
        throw err;
      }
      return result;
    },
    onSuccess: (result) => {
      qc.invalidateQueries({ queryKey: ['program-certificate', programId] });
      qc.invalidateQueries({ queryKey: ['certificate', programId] });
      toast({
        title: isFr ? 'Certificat émis' : 'Certificate issued',
        description: result.certificate_number
          ? `N° ${result.certificate_number}`
          : undefined,
      });
    },
    onError: (err: any) => {
      toast({
        title: isFr ? 'Certificat indisponible' : 'Certificate unavailable',
        description: certificateErrorMessage(err?.code, isFr),
        variant: 'destructive',
      });
    },
  });

  const certNumber = certificate?.certificate_number;
  const certDate = certificate?.issued_at
    ? format(new Date(certificate.issued_at), 'dd MMMM yyyy', { locale: dateLoc })
    : '';

  const handleDownload = async () => {
    if (!certificate?.id) return;
    setDownloading(true);
    try {
      await downloadCertificatePdf({
        certificateId: certificate.id,
        filename: certificateFilename(programTitle, certNumber || undefined),
      });
      toast({ title: isFr ? 'Certificat téléchargé' : 'Certificate downloaded' });
    } catch {
      toast({
        title: isFr ? 'Erreur lors du téléchargement' : 'Download failed',
        variant: 'destructive',
      });
    } finally {
      setDownloading(false);
    }
  };

  const handleShare = (platform: 'whatsapp' | 'x' | 'linkedin') => {
    if (!certNumber) return;
    const verifyUrl = buildShareUrlForPath(`/verify/${certNumber}`);
    const text = isFr
      ? `J'ai obtenu mon certificat « ${programTitle} » délivré par ${orgName} sur Siteviral. Vérifiez-le ici :`
      : `I earned my "${programTitle}" certificate from ${orgName} on Siteviral. Verify it here:`;
    const fullText = `${text}\n${verifyUrl}`;

    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`, '_blank');
    } else if (platform === 'x') {
      window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(verifyUrl)}`, '_blank');
    } else {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`, '_blank');
    }
  };

  if (!isComplete) return null;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      className="rounded-2xl border border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 p-5 space-y-4"
    >
      <div className="flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center shrink-0">
          <Award className="h-5 w-5 text-amber-600" />
        </div>
        <div className="min-w-0">
          <h3 className="font-bold text-sm">
            {isFr ? 'Félicitations !' : 'Congratulations!'}
          </h3>
          <p className="text-xs text-muted-foreground">
            {isFr
              ? `Vous avez terminé les ${totalLessons} leçons de cette formation.`
              : `You completed all ${totalLessons} lessons of this course.`}
          </p>
        </div>
      </div>

      {certificate ? (
        <>
          <div className="rounded-xl border bg-background/60 px-4 py-3 space-y-1">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {isFr ? 'Certificat officiel' : 'Official certificate'}
            </p>
            <p className="font-mono text-sm font-semibold">{certNumber}</p>
            {certDate && (
              <p className="text-xs text-muted-foreground">
                {isFr ? 'Émis le' : 'Issued on'} {certDate}
              </p>
            )}
          </div>

          <div className="flex flex-wrap gap-2">
            <Button
              size="sm"
              className="gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white"
              onClick={handleDownload}
              disabled={downloading}
            >
              {downloading
                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                : <Download className="h-3.5 w-3.5" />}
              {isFr ? 'Télécharger le PDF' : 'Download PDF'}
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => handleShare('linkedin')}>
              <Share2 className="h-3.5 w-3.5" /> LinkedIn
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => handleShare('whatsapp')}>
              <Share2 className="h-3.5 w-3.5" /> WhatsApp
            </Button>
            <Button size="sm" variant="ghost" className="gap-1.5 text-xs" asChild>
              <a href={`/verify/${certNumber}`} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
                {isFr ? 'Page de vérification' : 'Verification page'}
              </a>
            </Button>
          </div>
        </>
      ) : (
        <Button
          size="sm"
          className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
          onClick={() => issueCert.mutate()}
          disabled={issueCert.isPending}
        >
          {issueCert.isPending
            ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
            : <Award className="h-3.5 w-3.5" />}
          {isFr ? 'Obtenir mon certificat' : 'Claim my certificate'}
        </Button>
      )}
    </motion.div>
  );
}
