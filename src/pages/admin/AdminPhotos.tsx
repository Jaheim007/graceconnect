import { useState } from 'react';
import { AdminPageShell } from './AdminPageShell';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { supabase } from '@/integrations/supabase/client';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonList } from '@/components/ui/SkeletonCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Trash2, GripVertical, Plus, Image as ImageIcon, Eye, EyeOff } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface OrgPhoto {
  id: string;
  organization_id: string;
  image_url: string;
  caption: string | null;
  display_order: number;
  is_published: boolean;
  created_at: string;
}

function useOrgPhotos(orgId: string | undefined) {
  return useQuery({
    queryKey: ['org-photos', orgId],
    queryFn: async () => {
      if (!orgId) return [];
      const { data } = await db
        .from('org_photos')
        .select('*')
        .eq('organization_id', orgId)
        .order('display_order', { ascending: true })
        .order('created_at', { ascending: false });
      return (data || []) as OrgPhoto[];
    },
    enabled: !!orgId,
  });
}

export default function AdminPhotos() {
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: photos = [], isLoading } = useOrgPhotos(currentOrg?.id);
  const [newImageUrl, setNewImageUrl] = useState('');
  const [newCaption, setNewCaption] = useState('');
  const [adding, setAdding] = useState(false);

  const addPhoto = async () => {
    if (!newImageUrl || !currentOrg || !user) return;
    setAdding(true);
    try {
      const { error } = await db.from('org_photos').insert({
        organization_id: currentOrg.id,
        image_url: newImageUrl,
        caption: newCaption || null,
        display_order: photos.length,
        created_by: user.id,
      });
      if (error) throw error;
      setNewImageUrl('');
      setNewCaption('');
      qc.invalidateQueries({ queryKey: ['org-photos', currentOrg.id] });
      toast({ title: 'Photo added!' });
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setAdding(false);
    }
  };

  const deletePhoto = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await db.from('org_photos').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-photos', currentOrg?.id] });
      toast({ title: 'Photo deleted' });
    },
  });

  const togglePublished = useMutation({
    mutationFn: async ({ id, is_published }: { id: string; is_published: boolean }) => {
      const { error } = await db.from('org_photos').update({ is_published }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-photos', currentOrg?.id] });
    },
  });

  const updateCaption = useMutation({
    mutationFn: async ({ id, caption }: { id: string; caption: string }) => {
      const { error } = await db.from('org_photos').update({ caption: caption || null }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['org-photos', currentOrg?.id] });
    },
  });

  return (
    <AdminPageShell title="Photos" backRoute="/admin">
      {/* Add new photo */}
      <div className="bg-card border border-border rounded-2xl p-5 space-y-4 mb-6">
        <h2 className="font-semibold text-sm flex items-center gap-2">
          <Plus className="h-4 w-4 text-primary" /> Add Photo
        </h2>
        <p className="text-xs text-muted-foreground">
          Upload photos of your community, events, or activities. Recommended: landscape 4:3 ratio. You can crop after selecting.
        </p>
        <ImageUploader
          value={newImageUrl}
          onChange={setNewImageUrl}
          folder={`photos/${currentOrg?.id}`}
          label="Photo"
          hint="Landscape 4:3 · 1280×960px recommended · JPG/PNG/WEBP"
          aspectRatio="video"
        />
        {newImageUrl && (
          <div className="space-y-2">
            <Input
              placeholder="Caption (optional)"
              value={newCaption}
              onChange={(e) => setNewCaption(e.target.value)}
              className="text-sm"
            />
            <Button
              onClick={addPhoto}
              disabled={adding}
              className="gold-gradient text-primary-foreground border-0 shadow-gold"
              size="sm"
            >
              {adding ? 'Adding...' : 'Add Photo'}
            </Button>
          </div>
        )}
      </div>

      {/* Existing photos */}
      {isLoading ? (
        <SkeletonList count={4} />
      ) : photos.length === 0 ? (
        <EmptyState
          variant="generic"
          title="No photos yet"
          description="Upload photos to showcase your community on your public page."
        />
      ) : (
        <div className="space-y-3">
          <p className="text-xs text-muted-foreground">{photos.length} photo{photos.length > 1 ? 's' : ''}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className={cn(
                  'relative group rounded-xl border border-border bg-card overflow-hidden transition-all hover:shadow-elevated',
                  !photo.is_published && 'opacity-60'
                )}
              >
                <div className="aspect-[4/3] overflow-hidden">
                  <img
                    src={photo.image_url}
                    alt={photo.caption || 'Photo'}
                    className="w-full h-full object-cover"
                  />
                </div>

                {/* Overlay actions */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity">
                  <div className="absolute bottom-0 left-0 right-0 p-2 flex items-end justify-between">
                    <div className="flex-1 min-w-0">
                      {photo.caption && (
                        <p className="text-[10px] text-white/90 truncate">{photo.caption}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white hover:bg-white/20"
                        onClick={() => togglePublished.mutate({ id: photo.id, is_published: !photo.is_published })}
                        title={photo.is_published ? 'Hide' : 'Show'}
                      >
                        {photo.is_published ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-white hover:bg-destructive/80"
                        onClick={() => deletePhoto.mutate(photo.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>

                {/* Status badge */}
                {!photo.is_published && (
                  <div className="absolute top-2 left-2">
                    <span className="text-[10px] bg-muted/90 text-muted-foreground px-1.5 py-0.5 rounded-md font-medium">
                      Draft
                    </span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </AdminPageShell>
  );
}
