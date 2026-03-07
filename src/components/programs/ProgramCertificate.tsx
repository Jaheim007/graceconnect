import { useState, useRef, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Award, Download, Share2, Loader2, CheckCircle, ExternalLink } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { buildShareUrlForPath } from '@/lib/shareMeta';

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

const CERT_WIDTH = 800;
const CERT_HEIGHT = 566;

function drawCertificate(
  canvas: HTMLCanvasElement,
  opts: {
    displayName: string;
    programTitle: string;
    orgName: string;
    certDate: string;
    certNumber: string;
    totalLessons: number;
  }
) {
  const ctx = canvas.getContext('2d')!;
  const w = CERT_WIDTH;
  const h = CERT_HEIGHT;
  canvas.width = w * 2;
  canvas.height = h * 2;
  ctx.scale(2, 2);

  // Background
  const bg = ctx.createLinearGradient(0, 0, w, h);
  bg.addColorStop(0, '#FFFDF5');
  bg.addColorStop(0.5, '#FFFFFF');
  bg.addColorStop(1, '#FFF8E7');
  ctx.fillStyle = bg;
  ctx.fillRect(0, 0, w, h);

  // Outer gold border
  ctx.strokeStyle = '#D4A853';
  ctx.lineWidth = 4;
  ctx.strokeRect(16, 16, w - 32, h - 32);

  // Inner border
  ctx.strokeStyle = '#E8D5A0';
  ctx.lineWidth = 1.5;
  ctx.strokeRect(24, 24, w - 48, h - 48);

  // Corner ornaments
  const corners = [
    [32, 32], [w - 32, 32], [32, h - 32], [w - 32, h - 32]
  ];
  ctx.fillStyle = '#D4A853';
  corners.forEach(([cx, cy]) => {
    ctx.beginPath();
    ctx.arc(cx, cy, 5, 0, Math.PI * 2);
    ctx.fill();
  });

  // Top decorative line
  ctx.beginPath();
  ctx.moveTo(w / 2 - 120, 60);
  ctx.lineTo(w / 2 + 120, 60);
  ctx.strokeStyle = '#D4A853';
  ctx.lineWidth = 1;
  ctx.stroke();

  // Org name
  ctx.fillStyle = '#8B7355';
  ctx.font = '500 11px "Inter", system-ui, sans-serif';
  ctx.textAlign = 'center';
  ctx.fillText(opts.orgName.toUpperCase(), w / 2, 52);

  // Award icon (unicode star)
  ctx.fillStyle = '#D4A853';
  ctx.font = '36px serif';
  ctx.fillText('★', w / 2, 105);

  // Title
  ctx.fillStyle = '#8B6914';
  ctx.font = 'bold 22px "Georgia", "Times New Roman", serif';
  ctx.fillText('CERTIFICAT DE RÉUSSITE', w / 2, 140);

  // Subtitle line
  ctx.beginPath();
  ctx.moveTo(w / 2 - 80, 152);
  ctx.lineTo(w / 2 + 80, 152);
  ctx.strokeStyle = '#D4A853';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // "Décerné à"
  ctx.fillStyle = '#8B7355';
  ctx.font = 'italic 12px "Georgia", serif';
  ctx.fillText('Décerné à', w / 2, 185);

  // Name
  ctx.fillStyle = '#1A1A1A';
  ctx.font = 'bold 32px "Georgia", "Times New Roman", serif';
  ctx.fillText(opts.displayName, w / 2, 225);

  // Name underline
  const nameWidth = Math.min(ctx.measureText(opts.displayName).width + 40, 500);
  ctx.beginPath();
  ctx.moveTo(w / 2 - nameWidth / 2, 235);
  ctx.lineTo(w / 2 + nameWidth / 2, 235);
  ctx.strokeStyle = '#D4A853';
  ctx.lineWidth = 1;
  ctx.stroke();

  // "Pour avoir complété"
  ctx.fillStyle = '#8B7355';
  ctx.font = 'italic 12px "Georgia", serif';
  ctx.fillText('Pour avoir complété avec succès la formation', w / 2, 270);

  // Program title
  ctx.fillStyle = '#2D2D2D';
  ctx.font = 'bold 18px "Georgia", "Times New Roman", serif';
  // Wrap long titles
  const maxTitleWidth = w - 120;
  const titleText = `« ${opts.programTitle} »`;
  if (ctx.measureText(titleText).width > maxTitleWidth) {
    ctx.font = 'bold 15px "Georgia", "Times New Roman", serif';
  }
  ctx.fillText(titleText, w / 2, 305);

  // Stats
  ctx.fillStyle = '#8B7355';
  ctx.font = '11px "Inter", system-ui, sans-serif';
  ctx.fillText(`${opts.totalLessons} leçons complétées  •  ${opts.certDate}`, w / 2, 340);

  // Bottom decorative elements
  ctx.beginPath();
  ctx.moveTo(w / 2 - 150, 380);
  ctx.lineTo(w / 2 + 150, 380);
  ctx.strokeStyle = '#E8D5A0';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Seal circle
  ctx.beginPath();
  ctx.arc(w / 2, 420, 30, 0, Math.PI * 2);
  const sealGrad = ctx.createRadialGradient(w / 2, 420, 0, w / 2, 420, 30);
  sealGrad.addColorStop(0, '#F0D875');
  sealGrad.addColorStop(1, '#C49B2C');
  ctx.fillStyle = sealGrad;
  ctx.fill();
  ctx.strokeStyle = '#A67C00';
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Seal text
  ctx.fillStyle = '#FFFFFF';
  ctx.font = 'bold 10px "Inter", system-ui, sans-serif';
  ctx.fillText('VÉRIFIÉ', w / 2, 423);

  // Certificate number
  ctx.fillStyle = '#B8A88A';
  ctx.font = '9px "Courier New", monospace';
  ctx.fillText(`N° ${opts.certNumber}`, w / 2, 475);

  // Footer
  ctx.fillStyle = '#C4B896';
  ctx.font = '9px "Inter", system-ui, sans-serif';
  ctx.fillText('Vérifié par Siteviral  •  siteviral.com', w / 2, h - 40);

  // Verification URL
  ctx.fillStyle = '#D4A853';
  ctx.font = '8px "Inter", system-ui, sans-serif';
  ctx.fillText(`siteviral.com/verify/${opts.certNumber}`, w / 2, h - 26);
}

export function ProgramCertificate({
  programId, programTitle, orgName, orgLogo,
  progressPercent, totalLessons, completedLessons,
}: Props) {
  const { user, profile } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const [showCert, setShowCert] = useState(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

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
  const certDate = certificate?.issued_at
    ? format(new Date(certificate.issued_at), 'dd MMMM yyyy', { locale: fr })
    : format(new Date(), 'dd MMMM yyyy', { locale: fr });
  const certNumber = certificate?.certificate_number || 'SV-XXXXXXXX';

  // Draw certificate when modal opens
  const drawOnOpen = useCallback(() => {
    requestAnimationFrame(() => {
      if (canvasRef.current) {
        drawCertificate(canvasRef.current, {
          displayName,
          programTitle,
          orgName,
          certDate,
          certNumber,
          totalLessons,
        });
      }
    });
  }, [displayName, programTitle, orgName, certDate, certNumber, totalLessons]);

  const handleDownload = () => {
    if (!canvasRef.current) return;
    const link = document.createElement('a');
    link.download = `certificat-${certNumber}.png`;
    link.href = canvasRef.current.toDataURL('image/png');
    link.click();
    toast({ title: '📥 Certificat téléchargé !' });
  };

  const handleShare = (platform: 'whatsapp' | 'x' | 'linkedin') => {
    const verifyUrl = buildShareUrlForPath(`/verify/${certNumber}`);
    const text = `🎓 J'ai obtenu mon certificat "${programTitle}" délivré par ${orgName} sur Siteviral ! Vérifiez-le ici :`;
    const fullText = `${text}\n${verifyUrl}`;

    if (platform === 'whatsapp') {
      window.open(`https://wa.me/?text=${encodeURIComponent(fullText)}`, '_blank');
    } else if (platform === 'x') {
      window.open(`https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(verifyUrl)}`, '_blank');
    } else if (platform === 'linkedin') {
      window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(verifyUrl)}`, '_blank');
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
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => { setShowCert(true); drawOnOpen(); }}>
              <Award className="h-3.5 w-3.5" /> Voir mon certificat
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => handleShare('linkedin')}>
              <Share2 className="h-3.5 w-3.5" /> LinkedIn
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => handleShare('whatsapp')}>
              <Share2 className="h-3.5 w-3.5" /> WhatsApp
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
      <Dialog open={showCert} onOpenChange={(open) => {
        setShowCert(open);
        if (open) drawOnOpen();
      }}>
        <DialogContent className="max-w-[850px] p-0 overflow-hidden">
          <div className="p-4 bg-card">
            <canvas
              ref={canvasRef}
              style={{ width: CERT_WIDTH, maxWidth: '100%', height: 'auto' }}
              className="rounded-lg shadow-xl mx-auto block"
            />
          </div>

          <div className="flex flex-wrap justify-center gap-2 p-4 border-t bg-card">
            <Button size="sm" className="gap-1.5 text-xs bg-amber-600 hover:bg-amber-700 text-white" onClick={handleDownload}>
              <Download className="h-3.5 w-3.5" /> Télécharger PNG
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => handleShare('whatsapp')}>
              WhatsApp
            </Button>
            <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={() => handleShare('x')}>
              X / Twitter
            </Button>
            <Button size="sm" className="gap-1.5 text-xs bg-[#0077B5] hover:bg-[#006097] text-white" onClick={() => handleShare('linkedin')}>
              LinkedIn
            </Button>
            <Button size="sm" variant="ghost" className="gap-1.5 text-xs" asChild>
              <a href={`/verify/${certNumber}`} target="_blank" rel="noreferrer">
                <ExternalLink className="h-3.5 w-3.5" /> Page de vérification
              </a>
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
