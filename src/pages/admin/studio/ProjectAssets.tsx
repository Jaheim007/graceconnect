import { useParams, Link } from 'react-router-dom';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';
import { brandUrl } from '@/lib/storageUrl';
import { compressImage } from '@/hooks/useImageOptimizer';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useState, useCallback } from 'react';
import {
  ArrowLeft, Image, Download, Star, Upload, Loader2, Trash2, Eye, StarOff,
  Link2, Plus, Info, Play, ExternalLink, ImagePlus, Sparkles
} from 'lucide-react';

/** Extract YouTube video ID from URL */
function getYouTubeId(url: string): string | null {
  const m = url.match(/(?:youtube\.com\/(?:watch\?.*v=|embed\/|shorts\/)|youtu\.be\/)([\w-]{11})/);
  return m ? m[1] : null;
}

/** Get a thumbnail URL for video assets */
function getVideoThumbnail(url: string): string | null {
  const ytId = getYouTubeId(url);
  if (ytId) return `https://img.youtube.com/vi/${ytId}/hqdefault.jpg`;
  return null;
}

export default function ProjectAssets() {
  const { id } = useParams<{ id: string }>();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [uploadingCover, setUploadingCover] = useState(false);
  const [generatingCover, setGeneratingCover] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [addingLink, setAddingLink] = useState(false);

  const { data: project } = useQuery({
    queryKey: ['studio-project', id],
    queryFn: async () => {
      if (!id) return null;
      const { data } = await db.from('ai_content_projects').select('title, project_type').eq('id', id).single();
      return data;
    },
    enabled: !!id,
  });

  const { data: assets, isLoading } = useQuery({
    queryKey: ['studio-project-assets', id],
    queryFn: async () => {
      if (!id) return [];
      const { data } = await db.from('ai_project_assets')
        .select('*')
        .eq('project_id', id)
        .order('display_order');
      return data || [];
    },
    enabled: !!id,
  });

  const coverAsset = assets?.find((a: any) => a.is_cover);

  const uploadCoverImage = useCallback(async (file: File) => {
    if (!id || !currentOrg?.id) return;
    setUploadingCover(true);
    try {
      const optimized = await compressImage(file);
      const ext = optimized.name?.split('.').pop() || 'webp';
      const path = `studio/${id}/cover-${Date.now()}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('org-uploads')
        .upload(path, optimized, { cacheControl: '31536000' });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from('org-uploads').getPublicUrl(path);
      const brandedUrl = brandUrl(urlData.publicUrl);

      // Remove existing cover flag
      if (coverAsset) {
        await db.from('ai_project_assets').update({ is_cover: false }).eq('id', coverAsset.id);
      }

      await db.from('ai_project_assets').insert({
        project_id: id,
        organization_id: currentOrg.id,
        file_url: brandedUrl,
        asset_type: 'image',
        label: 'Couverture',
        mime_type: file.type,
        file_size: file.size,
        is_cover: true,
        display_order: 0,
      });

      toast({ title: 'Couverture ajoutée ✓' });
      queryClient.invalidateQueries({ queryKey: ['studio-project-assets', id] });
      queryClient.invalidateQueries({ queryKey: ['studio-project-cover', id] });
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setUploadingCover(false);
    }
  }, [id, currentOrg?.id, coverAsset, toast, queryClient]);

  const handleCoverSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) uploadCoverImage(file);
    };
    input.click();
  };

  const generateAiCover = async () => {
    if (!id || !currentOrg?.id || !user?.id || !project) return;
    setGeneratingCover(true);
    try {
      const { data: job, error: jobErr } = await db.from('ai_generation_jobs').insert({
        organization_id: currentOrg.id,
        created_by: user.id,
        project_id: id,
        job_type: 'image',
        input_params: {
          prompt: `Book cover for "${project.title}". Professional, modern design with bold typography. ${project.project_type === 'kids_book' ? 'Colorful, playful, for children.' : 'Elegant, minimalist.'}`,
          purpose: 'cover',
        },
        status: 'queued',
        provider: 'gemini',
      }).select('id').single();

      if (jobErr) throw jobErr;

      // Call edge function for image generation
      const { data, error } = await supabase.functions.invoke('ai-run-job', {
        body: { job_id: job!.id },
      });

      if (error) throw error;

      // Poll for completion
      let attempts = 0;
      const poll = setInterval(async () => {
        attempts++;
        const { data: updatedJob } = await db.from('ai_generation_jobs')
          .select('status, output_data')
          .eq('id', job!.id)
          .single();

        if (updatedJob?.status === 'completed') {
          clearInterval(poll);
          setGeneratingCover(false);
          toast({ title: 'Couverture générée ✓', description: 'La couverture IA a été créée.' });
          queryClient.invalidateQueries({ queryKey: ['studio-project-assets', id] });
          queryClient.invalidateQueries({ queryKey: ['studio-project-cover', id] });
        } else if (updatedJob?.status === 'failed' || attempts > 30) {
          clearInterval(poll);
          setGeneratingCover(false);
          toast({
            title: 'Info',
            description: 'La génération d\'image IA n\'est pas encore configurée. Importez votre couverture manuellement.',
          });
        }
      }, 2000);
    } catch (e: any) {
      setGeneratingCover(false);
      toast({ title: 'Info', description: 'Importez votre couverture manuellement pour le moment.', });
    }
  };

  const uploadAsset = useCallback(async (file: File) => {
    if (!id || !currentOrg?.id) return;
    setUploading(true);
    try {
      const optimized = file.type.startsWith('image/') ? await compressImage(file) : file;
      const ext = optimized.name?.split('.').pop() || 'bin';
      const path = `studio/${id}/${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;

      const { error: upErr } = await supabase.storage
        .from('org-uploads')
        .upload(path, optimized, { cacheControl: '31536000' });
      if (upErr) throw upErr;

      const { data: urlData } = supabase.storage.from('org-uploads').getPublicUrl(path);
      const brandedAssetUrl = brandUrl(urlData.publicUrl);

      const assetType = file.type.startsWith('image/') ? 'image'
        : file.type === 'application/pdf' ? 'pdf'
        : file.type.startsWith('audio/') ? 'audio' : 'text';

      const { error: insertErr } = await db.from('ai_project_assets').insert({
        project_id: id,
        organization_id: currentOrg.id,
        file_url: brandedAssetUrl,
        asset_type: assetType,
        label: file.name,
        mime_type: file.type,
        file_size: file.size,
        display_order: (assets?.length || 0),
      });
      if (insertErr) throw insertErr;

      toast({ title: 'Asset ajouté ✓' });
      queryClient.invalidateQueries({ queryKey: ['studio-project-assets', id] });
    } catch (e: any) {
      toast({ title: 'Erreur upload', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
    }
  }, [id, currentOrg?.id, assets?.length, toast, queryClient]);

  const detectLinkType = (url: string): { assetType: string; label: string; mimeType: string } => {
    const u = url.toLowerCase();
    if (/youtube\.com\/watch|youtu\.be\/|youtube\.com\/shorts/.test(u))
      return { assetType: 'video', label: 'Vidéo YouTube', mimeType: 'video/youtube' };
    if (/tiktok\.com/.test(u))
      return { assetType: 'video', label: 'Vidéo TikTok', mimeType: 'video/tiktok' };
    if (/facebook\.com.*\/video|fb\.watch/.test(u))
      return { assetType: 'video', label: 'Vidéo Facebook', mimeType: 'video/facebook' };
    if (/vimeo\.com/.test(u))
      return { assetType: 'video', label: 'Vidéo Vimeo', mimeType: 'video/vimeo' };
    if (/dailymotion\.com|dai\.ly/.test(u))
      return { assetType: 'video', label: 'Vidéo Dailymotion', mimeType: 'video/dailymotion' };
    if (/\.(mp4|webm|mov|avi|mkv)(\?|$)/i.test(u))
      return { assetType: 'video', label: 'Fichier vidéo', mimeType: 'video/mp4' };
    if (/\.(mp3|wav|m4a|ogg|aac|flac)(\?|$)/i.test(u))
      return { assetType: 'audio', label: 'Fichier audio', mimeType: 'audio/mpeg' };
    if (/\.pdf(\?|$)/i.test(u))
      return { assetType: 'pdf', label: 'Document PDF', mimeType: 'application/pdf' };
    return { assetType: 'link', label: 'Lien de référence', mimeType: 'text/uri-list' };
  };

  const addLinkAsset = async () => {
    if (!id || !currentOrg?.id || !linkUrl.trim()) return;
    setAddingLink(true);
    try {
      const { assetType, label, mimeType } = detectLinkType(linkUrl);

      const { error } = await db.from('ai_project_assets').insert({
        project_id: id,
        organization_id: currentOrg.id,
        file_url: linkUrl.trim(),
        asset_type: assetType as any,
        label,
        mime_type: mimeType,
        display_order: (assets?.length || 0),
        metadata: { source: 'link', original_url: linkUrl.trim() },
      });
      if (error) throw error;

      toast({ title: 'Lien ajouté ✓' });
      setLinkUrl('');
      setShowLinkForm(false);
      await queryClient.invalidateQueries({ queryKey: ['studio-project-assets', id] });
      await queryClient.refetchQueries({ queryKey: ['studio-project-assets', id] });
    } catch (e: any) {
      toast({ title: 'Erreur', description: e.message, variant: 'destructive' });
    } finally {
      setAddingLink(false);
    }
  };

  const toggleCover = useMutation({
    mutationFn: async ({ assetId, isCover }: { assetId: string; isCover: boolean }) => {
      if (isCover) {
        await db.from('ai_project_assets').update({ is_cover: false }).eq('project_id', id);
      }
      await db.from('ai_project_assets').update({ is_cover: isCover }).eq('id', assetId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['studio-project-assets', id] });
      queryClient.invalidateQueries({ queryKey: ['studio-project-cover', id] });
    },
  });

  const togglePreview = useMutation({
    mutationFn: async ({ assetId, isPreview }: { assetId: string; isPreview: boolean }) => {
      await db.from('ai_project_assets').update({ is_preview: isPreview }).eq('id', assetId);
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studio-project-assets', id] }),
  });

  const deleteAsset = useMutation({
    mutationFn: async (assetId: string) => {
      await db.from('ai_project_assets').delete().eq('id', assetId);
    },
    onSuccess: () => {
      toast({ title: 'Asset supprimé' });
      queryClient.invalidateQueries({ queryKey: ['studio-project-assets', id] });
      queryClient.invalidateQueries({ queryKey: ['studio-project-cover', id] });
    },
  });

  const handleFileSelect = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*,application/pdf,audio/*';
    input.multiple = true;
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files;
      if (files) Array.from(files).forEach(uploadAsset);
    };
    input.click();
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" asChild>
            <Link to={`/admin/studio/projects/${id}`}><ArrowLeft className="h-4 w-4 mr-1" /> Projet</Link>
          </Button>
          <h1 className="text-xl font-bold flex items-center gap-2">
            <Image className="h-5 w-5 text-primary" /> Assets & Références
          </h1>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={() => setShowLinkForm(!showLinkForm)}>
            <Link2 className="h-4 w-4 mr-1" /> Ajouter un lien
          </Button>
          <Button size="sm" onClick={handleFileSelect} disabled={uploading}>
            {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Upload className="h-4 w-4 mr-1" />}
            Ajouter
          </Button>
        </div>
      </div>

      {/* Cover generation moved to Editor */}

      {/* Explanation card */}
      <Card className="border-primary/20 bg-primary/5">
        <CardContent className="py-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-primary shrink-0 mt-0.5" />
            <div className="space-y-1 text-sm">
              <p className="font-medium text-foreground">À quoi servent les assets ?</p>
              <p className="text-muted-foreground">
                Les assets servent de <strong>modèles de référence</strong> pour l'IA. Ajoutez des contenus existants
                (livres, articles, vidéos YouTube, audios) dont vous aimez le style ou la structure.
                L'IA s'en inspirera pour générer un contenu qui correspond à votre vision.
              </p>
              <ul className="text-muted-foreground list-disc list-inside space-y-0.5 mt-2">
                <li><strong>Images</strong> — Couverture, illustrations de référence</li>
                <li><strong>PDF / Documents</strong> — Livres ou articles dont vous aimez le style</li>
                <li><strong>Liens YouTube</strong> — Vidéos dont le contenu doit inspirer la rédaction</li>
                <li><strong>Audio</strong> — Podcasts ou enregistrements à transcrire/résumer</li>
                <li><strong>Liens web</strong> — Articles ou pages à utiliser comme référence</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Link form */}
      {showLinkForm && (
        <Card>
          <CardContent className="py-4 space-y-3">
            <div>
              <Label className="text-sm">URL du lien</Label>
              <Input
                value={linkUrl}
                onChange={(e) => setLinkUrl(e.target.value)}
                placeholder="https://youtube.com/watch?v=... ou tout autre lien"
                className="mt-1"
              />
              <p className="text-xs text-muted-foreground mt-1">
                YouTube, TikTok, Facebook, Vimeo, Dailymotion, fichiers audio/vidéo, PDF ou tout lien web
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => setShowLinkForm(false)}>Annuler</Button>
              <Button size="sm" onClick={addLinkAsset} disabled={addingLink || !linkUrl.trim()}>
                {addingLink ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : <Plus className="h-3 w-3 mr-1" />}
                Ajouter le lien
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {isLoading ? (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Card key={i}><CardContent className="py-8"><div className="h-24 bg-muted animate-pulse rounded" /></CardContent></Card>
          ))}
        </div>
      ) : !assets?.filter((a: any) => !a.is_cover).length ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Image className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">Aucun asset de référence</p>
            <p className="text-sm text-muted-foreground mt-1">
              Uploadez des fichiers ou ajoutez des liens de référence pour inspirer l'IA
            </p>
            <div className="flex gap-2 justify-center mt-4">
              <Button variant="outline" onClick={() => setShowLinkForm(true)}>
                <Link2 className="h-4 w-4 mr-2" /> Ajouter un lien
              </Button>
              <Button variant="outline" onClick={handleFileSelect}>
                <Upload className="h-4 w-4 mr-2" /> Importer des fichiers
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {assets.filter((a: any) => !a.is_cover).map((asset: any) => (
            <Card key={asset.id} className="overflow-hidden group">
              <div className="aspect-video bg-muted flex items-center justify-center relative">
                {['image', 'cover', 'preview'].includes(asset.asset_type) ? (
                  <img src={asset.file_url} alt={asset.label || ''} className="w-full h-full object-cover" />
                ) : asset.asset_type === 'video' && getVideoThumbnail(asset.file_url) ? (
                  <a href={asset.file_url} target="_blank" rel="noreferrer" className="w-full h-full relative block">
                    <img src={getVideoThumbnail(asset.file_url)!} alt={asset.label || 'Video'} className="w-full h-full object-cover" />
                    <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                      <div className="w-12 h-12 rounded-full bg-red-600 flex items-center justify-center shadow-lg">
                        <Play className="h-6 w-6 text-white fill-white ml-0.5" />
                      </div>
                    </div>
                  </a>
                ) : asset.asset_type === 'video' ? (
                  <a href={asset.file_url} target="_blank" rel="noreferrer" className="w-full h-full flex flex-col items-center justify-center gap-2 hover:bg-muted/80 transition-colors">
                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                      <Play className="h-6 w-6 text-primary ml-0.5" />
                    </div>
                    <p className="text-[10px] text-muted-foreground text-center truncate max-w-full px-2">{asset.label}</p>
                  </a>
                ) : asset.asset_type === 'link' ? (
                  <a href={asset.file_url} target="_blank" rel="noreferrer" className="w-full h-full flex flex-col items-center justify-center gap-2 hover:bg-muted/80 transition-colors p-4">
                    <ExternalLink className="h-8 w-8 text-primary" />
                    <p className="text-[10px] text-muted-foreground text-center line-clamp-2 px-2">{asset.file_url}</p>
                  </a>
                ) : (
                  <div className="flex flex-col items-center gap-2 p-4">
                    <span className="text-3xl">
                      {asset.asset_type === 'pdf' ? '📄' : asset.asset_type === 'audio' ? '🎵' : '📝'}
                    </span>
                  </div>
                )}
                {asset.is_preview && (
                  <Badge variant="secondary" className="absolute top-2 right-2 text-[10px]"><Eye className="h-3 w-3 mr-1" />Preview</Badge>
                )}
                <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2">
                  {asset.asset_type === 'image' && (
                    <Button
                      size="icon"
                      variant="secondary"
                      className="h-8 w-8"
                      onClick={() => toggleCover.mutate({ assetId: asset.id, isCover: !asset.is_cover })}
                      title="Définir comme cover"
                    >
                      <Star className="h-4 w-4" />
                    </Button>
                  )}
                  <Button
                    size="icon"
                    variant="secondary"
                    className="h-8 w-8"
                    onClick={() => togglePreview.mutate({ assetId: asset.id, isPreview: !asset.is_preview })}
                    title={asset.is_preview ? 'Retirer preview' : 'Marquer preview'}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    size="icon"
                    variant="destructive"
                    className="h-8 w-8"
                    onClick={() => deleteAsset.mutate(asset.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
              <CardContent className="py-2 px-3">
                <p className="text-xs font-medium truncate">{asset.label || asset.asset_type}</p>
                <div className="flex items-center justify-between mt-1">
                  <Badge variant="secondary" className="text-[10px]">{asset.asset_type}</Badge>
                  {asset.asset_type !== 'link' && asset.asset_type !== 'video' ? (
                    <a href={asset.file_url} target="_blank" rel="noreferrer" download>
                      <Download className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </a>
                  ) : (
                    <a href={asset.file_url} target="_blank" rel="noreferrer">
                      <Link2 className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                    </a>
                  )}
                </div>
                {asset.file_size && (
                  <p className="text-[10px] text-muted-foreground mt-0.5">
                    {(asset.file_size / 1024).toFixed(0)} Ko
                  </p>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}