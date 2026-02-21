import { useMyPurchases } from '@/hooks/usePurchases';
import { useAuth } from '@/contexts/AuthContext';
import { EmptyState } from '@/components/ui/EmptyState';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Download, ExternalLink, ShoppingBag, FileText, Link2, Music, BookOpen, Eye,
} from 'lucide-react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useState } from 'react';

const typeIcons: Record<string, React.ReactNode> = {
  pdf: <FileText className="h-4 w-4" />,
  ebook: <BookOpen className="h-4 w-4" />,
  audio: <Music className="h-4 w-4" />,
  link: <Link2 className="h-4 w-4" />,
};

export default function ResourcesPage() {
  const { data: purchases, isLoading } = useMyPurchases();
  const { user } = useAuth();
  const { toast } = useToast();
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleFileAction = async (purchase: (typeof purchases extends (infer T)[] | undefined ? T : never), mode: 'download' | 'inline') => {
    if (!purchase.product.file_url || !user) return;

    setDownloading(purchase.id);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/watermark-download`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session?.access_token}`,
          },
          body: JSON.stringify({
            file_url: purchase.product.file_url,
            product_id: purchase.product_id,
            product_title: purchase.product.title,
            inline: mode === 'inline',
          }),
        }
      );

      if (!res.ok) {
        console.warn('Watermark service unavailable, falling back to direct');
        window.open(purchase.product.file_url, '_blank');
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);

      if (mode === 'inline') {
        // Open in new tab for reading
        window.open(url, '_blank');
      } else {
        const a = document.createElement('a');
        a.href = url;
        const ext = purchase.product.file_url.split('.').pop() || 'pdf';
        a.download = `${purchase.product.title}.${ext}`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }

      toast({
        title: mode === 'inline' ? 'Document ouvert' : 'Téléchargement lancé',
        description: mode === 'inline' ? 'Le document s\'ouvre dans un nouvel onglet.' : 'Votre fichier est en cours de téléchargement.',
      });
    } catch (err) {
      console.error('File action error:', err);
      window.open(purchase.product.file_url, '_blank');
    } finally {
      setDownloading(null);
    }
  };

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto p-4 space-y-4">
        <h1 className="text-2xl font-bold">Mes Ressources</h1>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className="h-28 w-full rounded-xl" />
        ))}
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 space-y-6">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <ShoppingBag className="h-6 w-6 text-primary" />
          Mes Ressources
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Tous les produits que vous avez achetés. Téléchargez-les à tout moment.
        </p>
      </div>

      {!purchases?.length ? (
        <EmptyState
          variant="purchases"
          title="Aucun achat"
          description="Vous n'avez pas encore acheté de produit. Explorez les organisations pour découvrir des ressources."
        />
      ) : (
        <div className="space-y-3">
          {purchases.map((purchase) => (
            <div
              key={purchase.id}
              className="flex gap-4 p-4 rounded-xl border border-border bg-card hover:bg-accent/30 transition-colors"
            >
              {/* Cover */}
              <div className="shrink-0 w-20 h-20 rounded-lg overflow-hidden bg-muted">
                {purchase.product.cover_image_url ? (
                  <img
                    src={purchase.product.cover_image_url}
                    alt={purchase.product.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                    {typeIcons[purchase.product.product_type] || <FileText className="h-8 w-8" />}
                  </div>
                )}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold truncate">{purchase.product.title}</h3>
                {purchase.product.description && (
                  <p className="text-sm text-muted-foreground line-clamp-1 mt-0.5">
                    {purchase.product.description}
                  </p>
                )}
                <div className="flex items-center gap-2 mt-2">
                  <Badge variant="outline" className="text-[10px] capitalize">
                    {purchase.product.product_type}
                  </Badge>
                  <span className="text-xs text-muted-foreground">
                    Acheté le {purchase.completed_at
                      ? format(new Date(purchase.completed_at), 'dd MMM yyyy', { locale: fr })
                      : format(new Date(purchase.created_at), 'dd MMM yyyy', { locale: fr })}
                  </span>
                </div>
              </div>

              {/* Actions */}
              <div className="shrink-0 flex flex-col gap-2 justify-center">
                {purchase.product.file_url && (
                  <>
                    <Button
                      size="sm"
                      variant="outline"
                      className="gap-1.5"
                      onClick={() => handleFileAction(purchase, 'inline')}
                      disabled={downloading === purchase.id}
                    >
                      <Eye className="h-3.5 w-3.5" />
                      Lire
                    </Button>
                    <Button
                      size="sm"
                      className="gap-1.5 gold-gradient text-primary-foreground border-0 shadow-gold"
                      onClick={() => handleFileAction(purchase, 'download')}
                      disabled={downloading === purchase.id}
                    >
                      <Download className="h-3.5 w-3.5" />
                      {downloading === purchase.id ? 'En cours…' : 'Télécharger'}
                    </Button>
                  </>
                )}
                {purchase.product.external_link && (
                  <a href={purchase.product.external_link} target="_blank" rel="noreferrer">
                    <Button size="sm" variant="outline" className="gap-1.5 w-full">
                      <ExternalLink className="h-3.5 w-3.5" />
                      Accéder
                    </Button>
                  </a>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
