import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Loader2, Youtube, CheckCircle, AlertCircle } from 'lucide-react';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { db } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

/**
 * Extracts YouTube video ID from various URL formats.
 */
function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

interface YouTubeOEmbed {
  title: string;
  author_name: string;
  thumbnail_url: string;
}

export function YouTubeImportButton() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<YouTubeOEmbed | null>(null);
  const [error, setError] = useState('');
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const { toast } = useToast();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const qc = useQueryClient();

  const fetchPreview = async () => {
    setError('');
    setPreview(null);
    const videoId = extractYouTubeId(url.trim());
    if (!videoId) {
      setError(isFr ? 'URL YouTube invalide. Collez un lien comme https://youtube.com/watch?v=...' : 'Invalid YouTube URL. Paste a link like https://youtube.com/watch?v=...');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
      if (!res.ok) throw new Error(isFr ? 'Vidéo introuvable ou privée' : 'Video not found or private');
      const data: YouTubeOEmbed = await res.json();
      data.thumbnail_url = `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`;
      setPreview(data);
    } catch (err: any) {
      setError(err.message || (isFr ? 'Impossible de récupérer les infos de la vidéo.' : 'Unable to fetch video information.'));
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!preview || !currentOrg || !user) return;
    const videoId = extractYouTubeId(url.trim());
    if (!videoId) return;

    setLoading(true);
    try {
      const { error: insertError } = await db.from('media_content').insert({
        organization_id: currentOrg.id,
        created_by: user.id,
        title: preview.title,
        description: `Importé depuis YouTube · Par ${preview.author_name}`,
        media_type: 'video',
        media_url: `https://www.youtube.com/watch?v=${videoId}`,
        thumbnail_url: preview.thumbnail_url,
        is_published: true,
        speaker: preview.author_name,
      });
      if (insertError) throw insertError;

      qc.invalidateQueries({ queryKey: ['org-media'] });
      toast({ title: '✅ Vidéo importée !', description: `"${preview.title}" est maintenant dans votre médiathèque.` });
      setOpen(false);
      setUrl('');
      setPreview(null);
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(true)}
        className="gap-2 text-xs h-8 sm:h-9 border-red-500/30 text-red-600 dark:text-red-400 hover:bg-red-500/10"
      >
        <Youtube className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        Importer YouTube
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Youtube className="h-5 w-5 text-red-500" />
              Importer depuis YouTube
            </DialogTitle>
            <DialogDescription>
              Collez un lien YouTube pour ajouter la vidéo à votre médiathèque automatiquement.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>URL de la vidéo YouTube</Label>
              <div className="flex gap-2">
                <Input
                  value={url}
                  onChange={(e) => { setUrl(e.target.value); setPreview(null); setError(''); }}
                  placeholder="https://youtube.com/watch?v=..."
                  className="flex-1"
                />
                <Button onClick={fetchPreview} disabled={loading || !url.trim()} size="sm">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aperçu'}
                </Button>
              </div>
              {error && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {error}
                </p>
              )}
            </div>

            {preview && (
              <div className="rounded-xl border border-border bg-muted/50 overflow-hidden">
                <img
                  src={preview.thumbnail_url}
                  alt={preview.title}
                  className="w-full h-40 object-cover"
                />
                <div className="p-3 space-y-1">
                  <p className="font-semibold text-sm line-clamp-2">{preview.title}</p>
                  <p className="text-xs text-muted-foreground">Par {preview.author_name}</p>
                  <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                    <CheckCircle className="h-3 w-3" /> Prêt à importer
                  </div>
                </div>
              </div>
            )}

            {preview && (
              <Button onClick={handleImport} disabled={loading} className="w-full gap-2">
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Youtube className="h-4 w-4" />}
                {loading ? 'Import en cours…' : 'Ajouter à ma médiathèque'}
              </Button>
            )}

            <p className="text-[10px] text-muted-foreground text-center">
              La vidéo reste hébergée sur YouTube. Seules les métadonnées sont importées.
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
