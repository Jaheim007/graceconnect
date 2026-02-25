import { useState } from 'react';
import { Download, Eye, Loader2, ShieldCheck } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

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

  const handleAction = async (inline: boolean) => {
    if (!user) return;
    const setter = inline ? setPreviewing : setDownloading;
    setter(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Non authentifié');

      const res = await supabase.functions.invoke('watermark-download', {
        body: { file_url: fileUrl, product_id: productId, product_title: productTitle, inline },
      });

      if (res.error) throw new Error(res.error.message || 'Erreur de téléchargement');

      const blob = new Blob([res.data], { type: inline ? 'application/pdf' : 'application/octet-stream' });
      const url = URL.createObjectURL(blob);

      if (inline) {
        window.open(url, '_blank');
      } else {
        const a = document.createElement('a');
        a.href = url;
        a.download = `${productTitle.replace(/[^\w\s-]/g, '_').substring(0, 60)}.pdf`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
      }
      
      setTimeout(() => URL.revokeObjectURL(url), 30000);
      toast({ title: inline ? '📖 Document ouvert' : '✅ Téléchargement réussi' });
    } catch (err: any) {
      console.error('[SecureDownload]', err);
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setter(false);
    }
  };

  const isPdf = fileUrl?.toLowerCase().includes('.pdf');

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
