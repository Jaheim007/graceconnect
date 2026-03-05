import { useParams, Link } from 'react-router-dom';
import { useOrg } from '@/contexts/OrgContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';
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
  Link2, Plus, Info
} from 'lucide-react';

export default function ProjectAssets() {
  const { id } = useParams<{ id: string }>();
  const { currentOrg } = useOrg();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [uploading, setUploading] = useState(false);
  const [showLinkForm, setShowLinkForm] = useState(false);
  const [linkUrl, setLinkUrl] = useState('');
  const [linkLabel, setLinkLabel] = useState('');
  const [addingLink, setAddingLink] = useState(false);

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

      const assetType = file.type.startsWith('image/') ? 'image'
        : file.type === 'application/pdf' ? 'pdf'
        : file.type.startsWith('audio/') ? 'audio' : 'text';

      const { error: insertErr } = await db.from('ai_project_assets').insert({
        project_id: id,
        organization_id: currentOrg.id,
        file_url: urlData.publicUrl,
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

  const addLinkAsset = async () => {
    if (!id || !currentOrg?.id || !linkUrl.trim()) return;
    setAddingLink(true);
    try {
      const isYoutube = /youtube\.com|youtu\.be/.test(linkUrl);
      const isAudio = /\.(mp3|wav|m4a|ogg|aac)(\?|$)/i.test(linkUrl);

      const assetType = isYoutube ? 'video' : isAudio ? 'audio' : 'link';
      const label = linkLabel.trim() || (isYoutube ? 'Vidéo YouTube' : 'Lien de référence');

      const { error } = await db.from('ai_project_assets').insert({
        project_id: id,
        organization_id: currentOrg.id,
        file_url: linkUrl.trim(),
        asset_type: assetType as any,
        label,
        mime_type: isYoutube ? 'video/youtube' : 'text/uri-list',
        display_order: (assets?.length || 0),
        metadata: { source: 'link', original_url: linkUrl.trim() },
      });
      if (error) throw error;

      toast({ title: 'Lien ajouté ✓' });
      setLinkUrl('');
      setLinkLabel('');
      setShowLinkForm(false);
      queryClient.invalidateQueries({ queryKey: ['studio-project-assets', id] });
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
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['studio-project-assets', id] }),
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
            </div>
            <div>
              <Label className="text-sm">Label (optionnel)</Label>
              <Input
                value={linkLabel}
                onChange={(e) => setLinkLabel(e.target.value)}
                placeholder="Ex: Vidéo d'inspiration, Article de référence..."
                className="mt-1"
              />
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
      ) : !assets?.length ? (
        <Card>
          <CardContent className="py-16 text-center">
            <Image className="h-12 w-12 mx-auto text-muted-foreground/30 mb-4" />
            <p className="text-muted-foreground font-medium">Aucun asset</p>
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
          {assets.map((asset: any) => (
            <Card key={asset.id} className="overflow-hidden group">
              <div className="aspect-square bg-muted flex items-center justify-center relative">
                {['image', 'cover', 'preview'].includes(asset.asset_type) ? (
                  <img src={asset.file_url} alt={asset.label || ''} className="w-full h-full object-cover" />
                ) : (
                  <div className="flex flex-col items-center gap-2 p-4">
                    <span className="text-3xl">
                      {asset.asset_type === 'pdf' ? '📄' : asset.asset_type === 'audio' ? '🎵' : asset.asset_type === 'video' ? '🎬' : asset.asset_type === 'link' ? '🔗' : '📝'}
                    </span>
                    {(asset.asset_type === 'link' || asset.asset_type === 'video') && (
                      <p className="text-[10px] text-muted-foreground text-center truncate max-w-full px-2">{asset.file_url}</p>
                    )}
                  </div>
                )}
                {asset.is_cover && (
                  <Badge className="absolute top-2 left-2 text-[10px]"><Star className="h-3 w-3 mr-1" />Cover</Badge>
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
                      title={asset.is_cover ? 'Retirer cover' : 'Définir comme cover'}
                    >
                      {asset.is_cover ? <StarOff className="h-4 w-4" /> : <Star className="h-4 w-4" />}
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
