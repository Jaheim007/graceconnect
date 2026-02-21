import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/db';
import { useQuery } from '@tanstack/react-query';
import { AdminPageShell } from './AdminPageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Film, Mic, Play, Radio } from 'lucide-react';

const MEDIA_TYPES = [
  {
    value: 'video',
    label: 'Video',
    icon: Play,
    desc: 'Vidéo complète, formation ou événement. Affiché dans la section Regarder.',
    specs: 'Any aspect ratio · Recommend 16:9 (1920×1080)',
  },
  {
    value: 'reel',
    label: 'Reel',
    icon: Film,
    desc: 'Clip vertical court (30s–3min). Affiché dans le fil Reels.',
    specs: 'Vertical 9:16 · Recommend 1080×1920',
  },
  {
    value: 'audio',
    label: 'Audio',
    icon: Mic,
    desc: 'Podcast ou contenu audio uniquement.',
    specs: 'MP3/AAC · Add a cover art thumbnail',
  },
  {
    value: 'live_replay',
    label: 'Live Replay',
    icon: Radio,
    desc: 'Replay d\'un livestream archivé.',
    specs: '16:9 · Same as Video',
  },
] as const;

const schema = z.object({
  title: z.string().min(2, 'Required'),
  description: z.string().optional(),
  media_type: z.enum(['video', 'audio', 'reel', 'live_replay']),
  media_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  thumbnail_url: z.string().optional(),
  speaker: z.string().optional(),
  series: z.string().optional(),
  is_premium: z.boolean().default(false),
  is_published: z.boolean().default(false),
  tags: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function MediaForm() {
  const { id } = useParams<{ id: string }>();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);

  const { data: item } = useQuery({
    queryKey: ['media-item', id],
    queryFn: async () => {
      const { data } = await db.from('media_content').select('*').eq('id', id).single();
      return data;
    },
    enabled: isEdit,
  });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { media_type: 'video', is_premium: false, is_published: false },
  });

  useEffect(() => {
    if (item) {
      reset({
        title: item.title,
        description: item.description || '',
        media_type: item.media_type || 'video',
        media_url: item.media_url || '',
        thumbnail_url: item.thumbnail_url || '',
        speaker: item.speaker || '',
        series: item.series || '',
        is_premium: item.is_premium || false,
        is_published: item.is_published || false,
        tags: item.tags?.join(', ') || '',
      });
    }
  }, [item, reset]);

  const selectedType = watch('media_type');
  const selectedTypeMeta = MEDIA_TYPES.find(t => t.value === selectedType);

  const onSubmit = async (data: FormData) => {
    if (!currentOrg || !user) {
      toast({ title: 'Error', description: 'No organization selected.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...data,
        organization_id: currentOrg.id,
        created_by: user.id,
        tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        media_url: data.media_url || null,
        thumbnail_url: data.thumbnail_url || null,
      };
      let error;
      if (isEdit) {
        ({ error } = await db.from('media_content').update(payload).eq('id', id));
      } else {
        ({ error } = await db.from('media_content').insert(payload));
      }
      if (error) throw error;
      toast({ title: isEdit ? 'Mis à jour ✅' : 'Créé ✅' });
      navigate('/admin/media');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminPageShell title={isEdit ? 'Modifier le média' : 'Nouveau média'} backRoute="/admin/media">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-xl">

        {/* Media Type Picker */}
        <div className="space-y-2">
          <Label>Type de contenu *</Label>
          <div className="grid grid-cols-2 gap-2">
            {MEDIA_TYPES.map(({ value, label, icon: Icon, desc, specs }) => (
              <button
                key={value}
                type="button"
                onClick={() => setValue('media_type', value)}
                className={cn(
                  'p-3 rounded-xl border-2 text-left transition-all',
                  selectedType === value
                    ? 'border-primary bg-primary/10'
                    : 'border-border bg-card hover:border-muted-foreground/40'
                )}
              >
                <div className="flex items-center gap-2 mb-1">
                  <Icon className={cn('h-3.5 w-3.5', selectedType === value ? 'text-primary' : 'text-muted-foreground')} />
                  <span className="text-sm font-semibold">{label}</span>
                </div>
                <p className="text-[10px] text-muted-foreground leading-snug">{desc}</p>
              </button>
            ))}
          </div>
          {selectedTypeMeta && (
            <p className="text-[11px] text-primary bg-primary/8 border border-primary/20 rounded-lg px-3 py-1.5">
              📐 <strong>Specs:</strong> {selectedTypeMeta.specs}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <Label>Titre *</Label>
          <Input {...register('title')} placeholder="Titre du contenu..." />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea {...register('description')} rows={3} placeholder="Courte description..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Intervenant</Label>
            <Input {...register('speaker')} placeholder="Nom de l'intervenant..." />
          </div>
          <div className="space-y-1.5">
            <Label>Série</Label>
            <Input {...register('series')} placeholder="Nom de la série..." />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>URL du média *</Label>
          <Input {...register('media_url')} placeholder="https://youtube.com/... or direct .mp4 / .mp3" />
          <p className="text-[11px] text-muted-foreground">
            Paste a YouTube, Vimeo, or direct file link. Reels should use direct .mp4 links for best playback.
          </p>
          {errors.media_url && <p className="text-xs text-destructive">{errors.media_url.message}</p>}
        </div>

        {/* Thumbnail upload */}
        <ImageUploader
          value={watch('thumbnail_url') || ''}
          onChange={(url) => setValue('thumbnail_url', url)}
          folder="thumbnails"
          label="Thumbnail Image"
          hint={
            selectedType === 'reel'
              ? 'Vertical 9:16 · 1080×1920px recommended'
              : 'Horizontal 16:9 · 1280×720px recommended · JPG/PNG/WEBP'
          }
          aspectRatio={selectedType === 'reel' ? 'square' : 'video'}
        />

        <div className="space-y-1.5">
          <Label>Tags (séparés par des virgules)</Label>
          <Input {...register('tags')} placeholder="formation, leadership, jeunesse..." />
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch checked={watch('is_premium')} onCheckedChange={v => setValue('is_premium', v)} />
            <Label className="text-sm cursor-pointer">Premium</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={watch('is_published')} onCheckedChange={v => setValue('is_published', v)} />
            <Label className="text-sm cursor-pointer">Published</Label>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/media')}>Annuler</Button>
          <Button type="submit" className="gold-gradient text-primary-foreground border-0 shadow-gold" disabled={loading}>
            {loading ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer'}
          </Button>
        </div>
      </form>
    </AdminPageShell>
  );
}
