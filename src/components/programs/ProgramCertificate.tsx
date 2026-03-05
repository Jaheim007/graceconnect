import { useState, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Award, Download, Share2, Loader2, CheckCircle } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';

interface Props {
  programId: string;
  programTitle: string;
  orgName: string;
  orgLogo?: string | null;
  progressPercent: number;
  totalLessons: number;
  completedLessons: number;
}

function generateCertNumber() {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = 'SV-';
  for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
  return code;
}

export function ProgramCertificate({
  programId, programTitle, orgName, orgLogo,
  progressPercent, totalLessons, completedLessons,
}: Props) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showCert, setShowCert] = useState(false);
  const certRef = useRef<HTMLDivElement>(null);

  const isComplete = progressPercent >= 100;

  const { data: certificate, isLoading: loadingCert } = useQuery({
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
      if (!user) throw new Error('Not authenticated');
      const { data: org } = await db.from('programs')
        .select('organization_id')
        .eq('id', programId)
        .single();
      
      const certNumber = generateCertNumber();
      const { data, error } = await db.from('program_certificates').insert({
        program_id: programId,
        user_id: user.id,
        organization_id: org.organization_id,
        certificate_number: certNumber,
      }).select().single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['program-certificate', programId] });
      toast({ title: '🎓 Certificat généré !' });
      setShowCert(true);
    },
  });

  const displayName = profile?.display_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Apprenant';
  const certDate = certificate?.issued_at ? format(new Date(certificate.issued_at), 'dd MMMM yyyy', { locale: fr }) : format(new Date(), 'dd MMMM yyyy', { locale: fr });

  const handleShare = async (platform: 'whatsapp' | 'x' | 'linkedin') => {
    const text = `🎓 J'ai obtenu mon certificat "${programTitle}" sur Siteviral ! #Formation #Siteviral`;
    const url = `https://siteviral.com/program/${programId}`;
    const encoded = encodeURIComponent(text + '\n' + url);

    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encoded}`, '_blank');
    } else if (platform === 'x') {
      window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`, '_blank');
    }
  };

  if (!isComplete) return null;

  return (
    <>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-gradient-to-br from-amber-500/10 via-yellow-500/5 to-orange-500/10 border border-amber-500/30 rounded-2xl p-5 space-y-3"
      >
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
            <Award className="h-5 w-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-bold text-sm">🎓 Félicitations !</h3>
            <p className="text-xs text-muted-foreground">
              Vous avez terminé les {totalLessons} leçons de cette formation.
            </p>
          </div>
        </div>

        {certificate ? (
          <div className="flex flex-wrap gap-2">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => setShowCert(true)}>
              <Award className="h-3.5 w-3.5" /> Voir mon certificat
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => handleShare('linkedin')}>
              <Share2 className="h-3.5 w-3.5" /> Partager sur LinkedIn
            </Button>
          </div>
        ) : (
          <Button
            size="sm"
            className="gap-1.5 bg-amber-600 hover:bg-amber-700 text-white"
            onClick={() => issueCert.mutate()}
            disabled={issueCert.isPending}
          >
            {issueCert.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Award className="h-3.5 w-3.5" />}
            Obtenir mon certificat
          </Button>
        )}
      </motion.div>

      {/* Certificate Modal */}
      <Dialog open={showCert} onOpenChange={setShowCert}>
        <DialogContent className="max-w-lg p-0 overflow-hidden">
          <div ref={certRef} className="relative bg-gradient-to-br from-amber-50 via-white to-amber-50 dark:from-amber-950/30 dark:via-background dark:to-amber-950/30 p-8 text-center space-y-4">
            {/* Decorative border */}
            <div className="absolute inset-3 border-2 border-amber-400/30 rounded-xl pointer-events-none" />
            <div className="absolute inset-4 border border-amber-300/20 rounded-lg pointer-events-none" />

            {/* Logo */}
            <div className="flex justify-center gap-3 items-center">
              {orgLogo ? (
                <img src={orgLogo} alt="" className="h-10 w-10 rounded-xl object-cover" />
              ) : null}
              <span className="text-xs font-medium text-muted-foreground uppercase tracking-widest">{orgName}</span>
            </div>

            {/* Title */}
            <div className="space-y-1">
              <Award className="h-10 w-10 mx-auto text-amber-500" />
              <h2 className="text-lg font-bold tracking-wide uppercase text-amber-700 dark:text-amber-400">
                Certificat de réussite
              </h2>
            </div>

            <p className="text-xs text-muted-foreground">Décerné à</p>
            <p className="text-2xl font-bold text-foreground">{displayName}</p>

            <p className="text-xs text-muted-foreground">Pour avoir complété avec succès la formation</p>
            <p className="text-base font-semibold text-primary">« {programTitle} »</p>

            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span>{totalLessons} leçons complétées</span>
              <span>•</span>
              <span>{certDate}</span>
            </div>

            {certificate?.certificate_number && (
              <p className="text-[10px] text-muted-foreground/60 font-mono">
                N° {certificate.certificate_number}
              </p>
            )}

            <div className="pt-4 border-t border-amber-200/50 dark:border-amber-800/30">
              <p className="text-[10px] text-muted-foreground">Vérifié par Siteviral • siteviral.com</p>
            </div>
          </div>

          <div className="flex justify-center gap-2 p-4 border-t bg-card">
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => handleShare('whatsapp')}>
              WhatsApp
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => handleShare('x')}>
              X / Twitter
            </Button>
            <Button size="sm" className="gap-1.5 text-xs bg-[#0077B5] hover:bg-[#006097] text-white" onClick={() => handleShare('linkedin')}>
              LinkedIn
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
