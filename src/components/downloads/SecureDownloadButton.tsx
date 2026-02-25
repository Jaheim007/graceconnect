import { useState } from 'react';
import { Download, Eye, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  fetchWatermarkedFile,
  isPdfLikeFile,
  openFileInline,
  triggerBrowserDownload,
} from '@/lib/secureDownload';

interface SecureDownloadButtonProps {
  fileUrl: string;
  productId: string;
  productTitle: string;
  variant?: 'download' | 'preview' | 'both';
  className?: string;
}

export function SecureDownloadButton({
  fileUrl,
  productId,
  productTitle,
  variant = 'both',
  className,
}: SecureDownloadButtonProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [downloading, setDownloading] = useState(false);
  const [previewing, setPreviewing] = useState(false);
  const isPdf = isPdfLikeFile(fileUrl);

  const handleAction = async (inline: boolean) => {
    if (!user) return;

    const setter = inline ? setPreviewing : setDownloading;
    setter(true);

    try {
      const file = await fetchWatermarkedFile({
        fileUrl,
        productId,
        productTitle,
        inline,
      });

      if (inline) {
        openFileInline(file);
      } else {
        triggerBrowserDownload(file);
      }

      toast({ title: inline ? '📖 Document ouvert' : '✅ Téléchargement réussi' });
    } catch (err: any) {
      console.error('[SecureDownload]', err);
      toast({
        title: 'Erreur',
        description: err?.message || 'Impossible de récupérer le fichier sécurisé.',
        variant: 'destructive',
      });
    } finally {
      setter(false);
    }
  };

  return (
    <div className={`flex items-center gap-2 ${className || ''}`}>
      {(variant === 'download' || variant === 'both') && (
        <Button
          size="sm"
          onClick={() => handleAction(false)}
          disabled={downloading || previewing}
          className="gap-1.5"
        >
          {downloading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
          Télécharger
        </Button>
      )}
      {isPdf && (variant === 'preview' || variant === 'both') && (
        <Button
          size="sm"
          variant="outline"
          onClick={() => handleAction(true)}
          disabled={downloading || previewing}
          className="gap-1.5"
        >
          {previewing ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Eye className="h-3.5 w-3.5" />}
          Lire
        </Button>
      )}
      <ShieldCheck className="h-3.5 w-3.5 text-muted-foreground" />
    </div>
  );
}
