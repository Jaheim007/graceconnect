import { useMyCertificates } from '@/hooks/useCertificates';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { SEOHead } from '@/components/seo/SEOHead';
import { EmptyState } from '@/components/ui/EmptyState';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Award, Download, GraduationCap } from 'lucide-react';
import { motion } from 'framer-motion';
import { downloadCertificate } from '@/lib/certificate';
import { useNavigate } from 'react-router-dom';

export default function CertificatesPage() {
  const { data: certs = [], isLoading } = useMyCertificates();
  const { profile, user } = useAuth();
  const { locale } = useI18n();
  const navigate = useNavigate();
  const isFr = locale === 'fr';

  return (
    <>
      <SEOHead title={isFr ? 'Mes Certificats' : 'My Certificates'} />
      <div className="container max-w-2xl py-6 space-y-6">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
            <GraduationCap className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-bold">{isFr ? 'Mes Certificats' : 'My Certificates'}</h1>
            <p className="text-xs text-muted-foreground">{certs.length} {isFr ? 'certificat(s) obtenu(s)' : 'certificate(s) earned'}</p>
          </div>
        </div>

        {certs.length === 0 && !isLoading ? (
          <EmptyState
            title={isFr ? 'Aucun certificat' : 'No certificates yet'}
            description={isFr ? 'Terminez un programme pour obtenir votre certificat.' : 'Complete a program to earn your certificate.'}
            action={{ label: isFr ? 'Voir les programmes' : 'Browse programs', onClick: () => navigate('/programs') }}
          />
        ) : (
          <div className="space-y-3">
            {certs.map((cert: any, i: number) => (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-card border border-border rounded-2xl p-4 flex items-center gap-4"
              >
                <div className="h-12 w-12 rounded-xl bg-amber-500/10 flex items-center justify-center shrink-0">
                  <Award className="h-6 w-6 text-amber-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{cert.programs?.title || 'Programme'}</p>
                  <p className="text-[11px] text-muted-foreground">
                    {cert.organizations?.name} · {new Date(cert.issued_at).toLocaleDateString(isFr ? 'fr-FR' : 'en-US')}
                  </p>
                  <Badge variant="outline" className="text-[9px] mt-1 border-0 bg-primary/10 text-primary">
                    N° {cert.certificate_number}
                  </Badge>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  className="text-xs gap-1.5 shrink-0"
                  onClick={() =>
                    downloadCertificate({
                      studentName: profile?.display_name || user?.email || 'Apprenant',
                      programTitle: cert.programs?.title || 'Programme',
                      orgName: cert.organizations?.name || '',
                      completionDate: cert.issued_at,
                      certificateId: cert.certificate_number,
                    })
                  }
                >
                  <Download className="h-3.5 w-3.5" /> PDF
                </Button>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </>
  );
}
