import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Loader2, Youtube, CheckCircle, AlertCircle, Video, Globe, Trash2 } from 'lucide-react';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useQueryClient } from '@tanstack/react-query';
import { useI18n } from '@/i18n/I18nContext';

function extractYouTubeId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?.*v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/|youtube\.com\/live\/|m\.youtube\.com\/watch\?.*v=)([a-zA-Z0-9_-]{11})/,
    /^([a-zA-Z0-9_-]{11})$/,
  ];
  for (const p of patterns) { const m = url.match(p); if (m) return m[1]; }
  return null;
}

interface VideoPreview {
  title: string; author: string; thumbnail: string; videoId: string; platform: string; url: string; description?: string; selected?: boolean;
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
  const { locale } = useI18n();
  const isFr = locale === 'fr';

  const fetchSinglePreview = async () => {
    setError(''); setPreview(null);
    const trimmed = url.trim();
    const videoId = extractYouTubeId(trimmed);
    if (videoId) {
      setLoading(true);
      try {
        const res = await fetch(`https://www.youtube.com/oembed?url=https://www.youtube.com/watch?v=${videoId}&format=json`);
        if (!res.ok) throw new Error(isFr ? 'Vidéo introuvable ou privée' : 'Video not found or private');
        const data = await res.json();
        setPreview({ title: data.title, author: data.author_name, thumbnail: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`, videoId, platform: 'youtube', url: `https://www.youtube.com/watch?v=${videoId}` });
      } catch (err: any) { setError(err.message); } finally { setLoading(false); }
      return;
    }
    if (trimmed.includes('facebook.com') || trimmed.includes('fb.watch')) { setPreview({ title: isFr ? 'Vidéo Facebook' : 'Facebook Video', author: 'Facebook', thumbnail: '', videoId: trimmed, platform: 'facebook', url: trimmed }); return; }
    if (trimmed.includes('tiktok.com')) { setPreview({ title: isFr ? 'Vidéo TikTok' : 'TikTok Video', author: 'TikTok', thumbnail: '', videoId: trimmed, platform: 'tiktok', url: trimmed }); return; }
    if (trimmed.startsWith('http')) { setPreview({ title: isFr ? 'Vidéo externe' : 'External video', author: new URL(trimmed).hostname, thumbnail: '', videoId: trimmed, platform: 'other', url: trimmed }); return; }
    setError(isFr ? 'URL non reconnue. Collez un lien YouTube, Facebook ou TikTok.' : 'Unrecognized URL. Paste a YouTube, Facebook or TikTok link.');
  };

  const fetchChannelVideos = async () => {
    setError(''); setChannelVideos([]); setLoading(true);
    try {
      const { data, error: fnError } = await supabase.functions.invoke('youtube-channel-import', { body: { channelUrl: channelUrl.trim() } });
      if (fnError) throw fnError;
      if (data?.error) throw new Error(data.error);
      if (data?.videos?.length) {
        setChannelVideos(data.videos.map((v: any) => ({ ...v, platform: 'youtube', selected: true, description: v.description || '' })));
        toast({ title: `📡 ${data.videos.length} ${isFr ? 'vidéos trouvées' : 'videos found'}`, description: `${isFr ? 'Chaîne' : 'Channel'}: ${data.channelName}` });
      } else {
        setError(isFr ? 'Aucune vidéo trouvée pour cette chaîne.' : 'No videos found for this channel.');
      }
    } catch (err: any) { setError(err.message || (isFr ? 'Erreur lors de la récupération.' : 'Error fetching videos.')); }
    finally { setLoading(false); }
  };

  const importVideo = async (video: VideoPreview) => {
    if (!currentOrg || !user) return;
    try {
      const { error: insertError } = await db.from('media_content').insert({
        organization_id: currentOrg.id, created_by: user.id, title: video.title,
        description: video.description || `${isFr ? 'Importé depuis' : 'Imported from'} ${video.platform} · ${isFr ? 'Par' : 'By'} ${video.author}`,
        media_type: 'video', media_url: video.url, thumbnail_url: video.thumbnail || null,
        is_published: true, speaker: video.author,
      });
      if (insertError) throw insertError;
      return true;
    } catch { return false; }
  };

  const importSingle = async (video: VideoPreview) => {
    setLoading(true);
    const ok = await importVideo(video);
    if (ok) { qc.invalidateQueries({ queryKey: ['org-media'] }); toast({ title: isFr ? '✅ Vidéo importée !' : '✅ Video imported!', description: `"${video.title}"` }); setOpen(false); setUrl(''); setPreview(null); }
    else toast({ title: isFr ? 'Erreur' : 'Error', variant: 'destructive' });
    setLoading(false);
  };

  const importAllSelected = async () => {
    if (!currentOrg || !user) return;
    const selected = channelVideos.filter(v => v.selected);
    if (!selected.length) return;
    setImportingAll(true);
    let count = 0;
    for (const v of selected) { const ok = await importVideo(v); if (ok) count++; }
    qc.invalidateQueries({ queryKey: ['org-media'] });
    toast({ title: `✅ ${count} ${isFr ? 'vidéo(s) importée(s) !' : 'video(s) imported!'}` });
    setImportingAll(false); setOpen(false); setChannelVideos([]);
  };

  const toggleVideo = (idx: number) => { setChannelVideos(prev => prev.map((v, i) => i === idx ? { ...v, selected: !v.selected } : v)); };
  const selectedCount = channelVideos.filter(v => v.selected).length;

  return (
    <>
      <Button variant="outline" size="sm" onClick={() => setOpen(true)} className="gap-2 text-xs h-8 sm:h-9 shrink-0">
        <Video className="h-3.5 w-3.5 sm:h-4 sm:w-4" /> {isFr ? 'Importer' : 'Import'}
      </Button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2"><Video className="h-5 w-5 text-primary" /> {isFr ? 'Importer des vidéos' : 'Import videos'}</DialogTitle>
            <DialogDescription>YouTube, Facebook, TikTok {isFr ? 'ou tout autre lien vidéo.' : 'or any other video link.'}</DialogDescription>
          </DialogHeader>

          <Tabs defaultValue="single" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="single" className="text-xs">{isFr ? 'Vidéo unique' : 'Single video'}</TabsTrigger>
              <TabsTrigger value="channel" className="text-xs">{isFr ? 'Chaîne YouTube' : 'YouTube channel'}</TabsTrigger>
            </TabsList>

            <TabsContent value="single" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>{isFr ? 'URL de la vidéo' : 'Video URL'}</Label>
                <div className="flex gap-2">
                  <Input value={url} onChange={(e) => { setUrl(e.target.value); setPreview(null); setError(''); }} placeholder={isFr ? 'Collez le lien ici...' : 'Paste link here...'} className="flex-1" />
                  <Button onClick={fetchSinglePreview} disabled={loading || !url.trim()} size="sm">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isFr ? 'Aperçu' : 'Preview')}</Button>
                </div>
                <p className="text-[10px] text-muted-foreground">
                  💡 {isFr ? 'Sur YouTube, cliquez sur Partager et collez le lien. Les liens watch, shorts et live marchent aussi.' : 'On YouTube, click Share and paste the link. Watch, shorts, and live links work too.'}
                </p>
                <div className="flex gap-1.5 flex-wrap">
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex items-center gap-1"><Youtube className="h-2.5 w-2.5 text-red-500" /> YouTube</span>
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex items-center gap-1"><Globe className="h-2.5 w-2.5 text-blue-500" /> Facebook</span>
                  <span className="text-[10px] text-muted-foreground bg-muted px-2 py-0.5 rounded-full flex items-center gap-1"><Globe className="h-2.5 w-2.5" /> TikTok</span>
                </div>
              </div>
              {error && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {error}</p>}
              {preview && (
                <div className="rounded-xl border border-border bg-muted/50 overflow-hidden">
                  {preview.thumbnail && <img src={preview.thumbnail} alt={preview.title} className="w-full h-40 object-cover" />}
                  <div className="p-3 space-y-1">
                    <p className="font-semibold text-sm line-clamp-2">{preview.title}</p>
                    <p className="text-xs text-muted-foreground">{isFr ? 'Par' : 'By'} {preview.author}</p>
                    <div className="flex items-center gap-1 text-xs text-green-600 dark:text-green-400"><CheckCircle className="h-3 w-3" /> {isFr ? 'Prêt à importer' : 'Ready to import'}</div>
                  </div>
                </div>
              )}
              {preview && <Button onClick={() => importSingle(preview)} disabled={loading} className="w-full gap-2">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />} {isFr ? 'Ajouter à ma médiathèque' : 'Add to my media library'}</Button>}
            </TabsContent>

            <TabsContent value="channel" className="space-y-4 mt-4">
              <div className="space-y-2">
                <Label>{isFr ? 'URL de la chaîne YouTube' : 'YouTube channel URL'}</Label>
                <div className="flex gap-2">
                  <Input value={channelUrl} onChange={(e) => { setChannelUrl(e.target.value); setError(''); }} placeholder="https://youtube.com/@ChannelName" className="flex-1" />
                  <Button onClick={fetchChannelVideos} disabled={loading || !channelUrl.trim()} size="sm">{loading ? <Loader2 className="h-4 w-4 animate-spin" /> : (isFr ? 'Chercher' : 'Search')}</Button>
                </div>
              </div>
              {error && <p className="text-xs text-destructive flex items-center gap-1"><AlertCircle className="h-3 w-3" /> {error}</p>}

              {channelVideos.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-medium">{channelVideos.length} {isFr ? 'vidéos trouvées' : 'videos found'} · {selectedCount} {isFr ? 'sélectionnées' : 'selected'}</p>
                    <Button variant="ghost" size="sm" className="text-xs h-7" onClick={() => setChannelVideos(prev => prev.map(v => ({ ...v, selected: !prev.every(p => p.selected) })))}>
                      {channelVideos.every(v => v.selected) ? (isFr ? 'Tout désélectionner' : 'Deselect all') : (isFr ? 'Tout sélectionner' : 'Select all')}
                    </Button>
                  </div>
                  <div className="max-h-60 overflow-y-auto space-y-1.5 border border-border rounded-xl p-2">
                    {channelVideos.map((v, i) => (
                      <div key={v.videoId} className={`flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-colors ${v.selected ? 'bg-primary/10 border border-primary/30' : 'bg-muted/30 hover:bg-muted/50'}`} onClick={() => toggleVideo(i)}>
                        <input type="checkbox" checked={v.selected} onChange={() => toggleVideo(i)} className="shrink-0" />
                        {v.thumbnail && <img src={v.thumbnail} alt="" className="h-10 w-16 object-cover rounded shrink-0" />}
                        <span className="text-xs font-medium flex-1 line-clamp-2">{v.title}</span>
                      </div>
                    ))}
                  </div>
                  <Button onClick={importAllSelected} disabled={importingAll || selectedCount === 0} className="w-full gap-2">
                    {importingAll ? <Loader2 className="h-4 w-4 animate-spin" /> : <Video className="h-4 w-4" />}
                    {importingAll ? `${isFr ? 'Import en cours' : 'Importing'} (${selectedCount})…` : `${isFr ? 'Importer' : 'Import'} ${selectedCount} ${isFr ? 'vidéo(s)' : 'video(s)'}`}
                  </Button>
                </div>
              )}

              {!channelVideos.length && !error && !loading && (
                <p className="text-[10px] text-muted-foreground text-center">💡 {isFr ? 'Collez l\'URL d\'une chaîne YouTube pour importer toutes ses vidéos d\'un coup.' : 'Paste a YouTube channel URL to import all its videos at once.'}</p>
              )}
            </TabsContent>
          </Tabs>
          <p className="text-[10px] text-muted-foreground text-center">{isFr ? 'Les vidéos restent hébergées sur leur plateforme. Seules les métadonnées sont importées.' : 'Videos remain hosted on their platform. Only metadata is imported.'}</p>
        </DialogContent>
      </Dialog>
    </>
  );
}
