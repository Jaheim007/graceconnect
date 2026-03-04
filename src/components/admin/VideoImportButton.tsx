import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Youtube, CheckCircle, AlertCircle, Video, Globe } from 'lucide-react';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';

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

function extractChannelHandle(url: string): string | null {
  // Match @handle or /c/name or /channel/ID
  const patterns = [
    /youtube\.com\/@([a-zA-Z0-9_-]+)/,
    /youtube\.com\/c\/([a-zA-Z0-9_-]+)/,
    /youtube\.com\/channel\/([a-zA-Z0-9_-]+)/,
    /^@([a-zA-Z0-9_-]+)$/,
  ];
  for (const p of patterns) {
    const m = url.match(p);
    if (m) return m[1];
  }
  return null;
}

interface VideoPreview {
  title: string;
  author: string;
  thumbnail: string;
  videoId: string;
  platform: string;
  url: string;
}

export function VideoImportButton() {
  const [open, setOpen] = useState(false);
  const [url, setUrl] = useState('');
  const [channelUrl, setChannelUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [preview, setPreview] = useState<VideoPreview | null>(null);
  const [channelVideos, setChannelVideos] = useState<VideoPreview[]>([]);
  const [error, setError] = useState('');
  const [importingAll, setImportingAll] = useState(false);
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();

  const fetchSinglePreview = async () => {
    setError('');
    setPreview(null);
    const trimmed = url.trim();

    // YouTube
    const videoId = extractYouTubeId(trimmed);
    if (videoId) {
      setLoading(true);
      try {
        const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        if (!res.ok) throw new Error('Vidéo introuvable ou privée');
        const data = await res.json();
        setPreview({
          title: data.title,
          author: data.author_name,
          thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
          videoId,
          platform: 'youtube',
          url: `https://www.youtube.com/watch?v=${videoId}`,
        });
      } catch (err: any) {
        setError(err.message || 'Impossible de récupérer les infos.');
      } finally {
        setLoading(false);
      }
      return;
    }

    // Facebook / TikTok / Other - generic approach
    if (trimmed.includes('facebook.com') || trimmed.includes('fb.watch')) {
      setPreview({
        title: 'Vidéo Facebook',
        author: 'Facebook',
        thumbnail: '',
        videoId: trimmed,
        platform: 'facebook',
        url: trimmed,
      });
      return;
    }

    if (trimmed.includes('tiktok.com')) {
      setPreview({
        title: 'Vidéo TikTok',
        author: 'TikTok',
        thumbnail: '',
        videoId: trimmed,
        platform: 'tiktok',
        url: trimmed,
      });
      return;
    }

    // Generic video URL
    if (trimmed.startsWith('http')) {
      setPreview({
        title: 'Vidéo externe',
        author: new URL(trimmed).hostname,
        thumbnail: '',
        videoId: trimmed,
        platform: 'other',
        url: trimmed,
      });
      return;
    }

    setError('URL non reconnue. Collez un lien YouTube, Facebook, TikTok ou autre.');
  };

  const fetchChannelVideos = async () => {
    setError('');
    setChannelVideos([]);
    const handle = extractChannelHandle(channelUrl.trim());
    
    if (!handle) {
      setError('URL de chaîne invalide. Collez un lien comme https://youtube.com/@NomDeLaChaine');
      return;
    }

    setLoading(true);
    try {
      // Use RSS feed to get channel videos (no API key needed)
      // Try the feed URL approach
      const feedUrl = `https://www.youtube.com/feeds/videos.xml?channel_id=${handle}`;
      const rssUrl = channelUrl.includes('/channel/') 
        ? feedUrl 
        : `https://www.youtube.com/@${handle}`;

      // Since we can't directly fetch RSS due to CORS, we'll use oEmbed for individual videos
      // For channel import, we inform the user about the approach
      toast({
        title: '📡 Import de chaîne',
        description: 'L\'import de chaîne complète nécessite l\'URL de chaque vidéo. Collez les URLs une par une ou utilisez l\'import individuel.',
      });
      
      setError('Pour importer une chaîne complète, collez les URLs des vidéos une par une dans l\'onglet "Vidéo unique". L\'import automatique de chaîne sera bientôt disponible avec l\'API YouTube.');
    } catch (err: any) {
      setError(err.message || 'Erreur lors de la récupération de la chaîne.');
    } finally {
      setLoading(false);
    }
  };

  const importVideo = async (video: VideoPreview) => {
    if (!currentOrg || !user) return;
    setLoading(true);
    try {
      const { error: insertError } = await db.from('media_content').insert({
        organization_id: currentOrg.id,
        created_by: user.id,
        title: video.title,
        description: `Importé depuis ${video.platform === 'youtube' ? 'YouTube' : video.platform === 'facebook' ? 'Facebook' : video.platform === 'tiktok' ? 'TikTok' : 'le web'} · Par ${video.author}`,
        media_type: 'video',
        media_url: video.url,
        thumbnail_url: video.thumbnail || null,
        is_published: true,
        speaker: video.author,
      });
      if (insertError) throw insertError;

      qc.invalidateQueries({ queryKey: ['org-media'] });
      toast({ title: '✅ Vidéo importée !', description: `"${video.title}" est dans votre médiathèque.` });
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
        <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
        Importer vidéo
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Video className="h-5 w-5 text-primary" />
              Importer des vidéos
            </DialogTitle>
            <DialogDescription>
              Importez depuis YouTube, Facebook, TikTok ou tout autre lien vidéo.
            </DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single" className="text-xs">Vidéo unique</TabsTrigger>
              <TabsTrigger value="channel" className="text-xs">Chaîne YouTube</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>URL de la vidéo</Label>
                <div className="flex gap-2">
                  <Input
                    value={url}
                    onChange={(e) => { setUrl(e.target.value); setPreview(null); setError(''); }}
                    placeholder="YouTube, Facebook, TikTok..."
                    className="flex-1"
                  />
                  <Button onClick={fetchSinglePreview} disabled={loading || !url.trim()} size="sm">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Aperçu'}
                  </Button>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Youtube className="h-2.5 w-2.5 text-red-500" /> YouTube
                  </span>
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Globe className="h-2.5 w-2.5 text-blue-500" /> Facebook
                  </span>
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Globe className="h-2.5 w-2.5" /> TikTok
                  </span>
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex items-center gap-1">
                    <Globe className="h-2.5 w-2.5" /> Autre
                  </span>
                </div>
              </div>

              {error && (
                <p className="text-xs text-destructive flex items-center gap-1">
                  <AlertCircle className="h-3 w-3" /> {error}
                </p>
              )}

              {preview && (
                <div className="rounded-xl border border-border bg-muted/50 overflow-hidden">
                  {preview.thumbnail && (
                    <img src={preview.thumbnail} alt={preview.title} className="w-full h-40 object-cover" />
                  )}
                  <div className="p-3 space-y-1">
                    <p className="font-semibold text-sm line-clamp-2">{preview.title}</p>
                    <p className="text-xs text-muted-foreground">Par {preview.author} · {preview.platform}</p>
                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                      <CheckCircle className="h-3 w-3" /> Prêt à importer
                    </div>
                  </div>
                </div>
              )}

              {preview && (
                <Button onClick={() => importVideo(preview)} disabled={loading} className="w-full gap-2">
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                  {loading ? 'Import en cours…' : 'Ajouter à ma médiathèque'}
                </Button>
              )}
            </TabsContent>

            <TabsContent value="channel" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>URL ou nom de la chaîne YouTube</Label>
                <div className="flex gap-2">
                  <Input
                    value={channelUrl}
                    onChange={(e) => { setChannelUrl(e.target.value); setError(''); }}
                    placeholder="https://youtube.com/@NomDeLaChaine"
                    className="flex-1"
                  />
                  <Button onClick={fetchChannelVideos} disabled={loading || !channelUrl.trim()} size="sm">
                    {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Chercher'}
                  </Button>
                </div>
              </div>

              {error && (
                <p className="text-xs text-muted-foreground flex items-center gap-1">
                  <AlertCircle className="h-3 w-3 text-amber-500" /> {error}
                </p>
              )}

              <p className="text-[10px] text-muted-foreground text-center">
                💡 Astuce : Copiez les liens de vos vidéos depuis YouTube et importez-les une par une dans l'onglet "Vidéo unique".
              </p>
            </TabsContent>
          </Tabs>

          <p className="text-[10px] text-muted-foreground text-center">
            Les vidéos restent hébergées sur leur plateforme. Seules les métadonnées sont importées.
          </p>
        </DialogContent>
      </Dialog>
    </>
  );
}
