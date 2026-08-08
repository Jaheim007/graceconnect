/**
 * Achievements — the learner's certificates inside "My courses".
 *
 * Reads program_certificates for the signed-in learner and renders each one as
 * a card using the course's own certificate design (cover strip + badge, with
 * the organization logo as fallback). Downloading goes through the single
 * certificate renderer (generate-certificate-pdf) via downloadCertificatePdf.
 */
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Award, Download, Loader2, ExternalLink, BadgeCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { EmptyState } from '@/components/ui/EmptyState';
import { useI18n } from '@/i18n/I18nContext';
import { certificateFilename, downloadCertificatePdf } from '@/lib/certificates';

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { type: 'spring' as const, stiffness: 300, damping: 26 } },
};

interface Props {
  onExplore?: () => void;
}

export function AchievementsSection({ onExplore }: Props) {
  const { user } = useAuth();
  const { toast } = useToast();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const t = (fr: string, en: string) => (isFr ? fr : en);
  const [busyId, setBusyId] = useState<string | null>(null);

  const { data: certificates = [], isLoading } = useQuery({
    queryKey: ['my-certificates', user?.id],
    queryFn: async () => {
      if (!user?.id) return [];
      const { data } = await db
        .from('program_certificates')
        .select('*, programs:program_id(title, cover_image_url, certificate_design, organizations:organization_id(name, logo_url))')
        .eq('user_id', user.id)
        .order('issued_at', { ascending: false });
      return data || [];
    },
    enabled: !!user?.id,
  });

  const handleDownload = async (cert: any) => {
    setBusyId(cert.id);
    try {
      await downloadCertificatePdf({
        certificateId: cert.id,
        filename: certificateFilename(cert.programs?.title || cert.course_title || 'course', cert.certificate_number),
      });
    } catch {
      toast({
        title: t('Téléchargement impossible', 'Download failed'),
        description: t('Réessaie dans un instant.', 'Please try again in a moment.'),
        variant: 'destructive',
      });
    } finally {
      setBusyId(null);
    }
  };

  if (isLoading) {
    return (
      <div className="space-y-3">
        {[1, 2].map(i => <div key={i} className="h-32 bg-muted rounded-2xl animate-pulse" />)}
      </div>
    );
  }

  if (certificates.length === 0) {
    return (
      <EmptyState
        title={t('Aucun certificat pour l’instant', 'No certificates yet')}
        description={t(
          'Termine un cours qui délivre un certificat et il apparaîtra ici, prêt à imprimer ou partager.',
          'Finish a course that issues a certificate and it will show up here, ready to print or share.',
        )}
        action={onExplore ? { label: t('Explorer', 'Explore'), onClick: onExplore } : undefined}
      />
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2">
      {certificates.map((cert: any) => {
        const program = cert.programs || {};
        const org = program.organizations || {};
        const design = (program.certificate_design || {}) as Record<string, any>;
        const cover = design.cover_image_url || program.cover_image_url || null;
        const badge = design.badge_image_url || org.logo_url || null;
        const footer = design.footer_text || org.name || '';
        const issued = new Date(cert.issued_at || cert.created_at);

        return (
          <motion.div
            key={cert.id}
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            className="rounded-2xl border border-border bg-card overflow-hidden"
          >
            {cover ? (
              <img src={cover} alt="" className="w-full h-16 object-cover" loading="lazy" />
            ) : (
              <div className="w-full h-16 bg-gradient-to-r from-primary/25 via-primary/10 to-transparent" />
            )}

            <div className="px-4 pb-4 -mt-6">
              <div className="h-12 w-12 rounded-full border-4 border-card bg-muted overflow-hidden grid place-items-center">
                {badge
                  ? <img src={badge} alt="" className="h-full w-full object-cover" loading="lazy" />
                  : <Award className="h-5 w-5 text-muted-foreground" />}
              </div>

              <div className="mt-2 space-y-1">
                <p className="text-[10px] uppercase tracking-[0.2em] text-muted-foreground flex items-center gap-1">
                  <BadgeCheck className="h-3 w-3 text-primary" />
                  {t('Certificat de réussite', 'Certificate of completion')}
                </p>
                <h3 className="font-semibold text-sm leading-snug">
                  {program.title || cert.course_title || t('Cours', 'Course')}
                </h3>
                <p className="text-[11px] text-muted-foreground">
                  {footer && <>{footer} · </>}
                  {issued.toLocaleDateString(isFr ? 'fr-FR' : 'en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
                </p>
                <p className="text-[10px] text-muted-foreground font-mono">
                  {t('N°', 'No.')} {cert.certificate_number}
                </p>
              </div>

              <div className="mt-3 flex flex-wrap gap-2">
                <Button
                  size="sm"
                  className="h-8 gap-1.5 text-[11px]"
                  onClick={() => handleDownload(cert)}
                  disabled={busyId === cert.id}
                >
                  {busyId === cert.id
                    ? <Loader2 className="h-3 w-3 animate-spin" />
                    : <Download className="h-3 w-3" />}
                  {t('Télécharger le PDF', 'Download PDF')}
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="h-8 gap-1.5 text-[11px]"
                  asChild
                >
                  <a href={`/verify/${cert.certificate_number}`} target="_blank" rel="noreferrer">
                    <ExternalLink className="h-3 w-3" />
                    {t('Vérifier', 'Verify')}
                  </a>
                </Button>
              </div>
            </div>
          </motion.div>
        );
      })}
    </div>
  );
}
