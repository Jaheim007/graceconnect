import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useOrg } from '@/contexts/OrgContext';
import { useI18n } from '@/i18n/I18nContext';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/db';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AdminPageShell } from './AdminPageShell';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { ImageUploader } from '@/components/ui/ImageUploader';
import { FileUploader } from '@/components/ui/FileUploader';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';
import { Film, Mic, Play, Radio } from 'lucide-react';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { AIWritingAssistant } from '@/components/admin/AIWritingAssistant';

const schema = z.object({
  title: z.string().min(2, 'Required'),
  description: z.string().optional(),
  media_type: z.enum(['video', 'audio', 'reel', 'live_replay']),
  media_url: z.string().optional().or(z.literal('')),
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
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [showAI, setShowAI] = useState(false);
  const qc = useQueryClient();

  const MEDIA_TYPES = [
    { value: 'video' as const, label: 'Video', icon: Play, desc: isFr ? 'Vidéo complète, formation ou événement.' : 'Full video, training or event.', specs: '16:9 (1920×1080)' },
    { value: 'reel' as const, label: 'Reel', icon: Film, desc: isFr ? 'Clip vertical court (30s–3min).' : 'Short vertical clip (30s–3min).', specs: '9:16 (1080×1920)' },
    { value: 'audio' as const, label: 'Audio', icon: Mic, desc: isFr ? 'Podcast ou contenu audio.' : 'Podcast or audio content.', specs: 'MP3/AAC' },
    { value: 'live_replay' as const, label: 'Live Replay', icon: Radio, desc: isFr ? 'Replay d\'un livestream.' : 'Livestream replay.', specs: '16:9' },
  ];

  const { data: item } = useQuery({
    queryKey: ['media-item', id],
    queryFn: async () => { const { data } = await db.from('media_content').select('*').eq('id', id).single(); return data; },
    enabled: isEdit,
  });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { media_type: 'video', is_premium: false, is_published: false },
  });

  useEffect(() => {
    if (item) { reset({ title: item.title, description: item.description || '', media_type: item.media_type || 'video', media_url: item.media_url || '', thumbnail_url: item.thumbnail_url || '', speaker: item.speaker || '', series: item.series || '', is_premium: item.is_premium || false, is_published: item.is_published || false, tags: item.tags?.join(', ') || '' }); }
  }, [item, reset]);

  const selectedType = watch('media_type');
  const selectedTypeMeta = MEDIA_TYPES.find(t => t.value === selectedType);

  const onSubmit = async (data: FormData) => {
    if (!currentOrg || !user) { toast({ title: isFr ? 'Erreur' : 'Error', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      const payload = { ...data, organization_id: currentOrg.id, created_by: user.id, tags: data.tags ? data.tags.split(',').map(t => t.trim()).filter(Boolean) : [], media_url: data.media_url || null, thumbnail_url: data.thumbnail_url || null };
      let error;
      if (isEdit) { ({ error } = await db.from('media_content').update(payload).eq('id', id)); }
      else { ({ error } = await db.from('media_content').insert(payload as any)); }
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ['org-media'] });
      if (isEdit) qc.invalidateQueries({ queryKey: ['media-by-id', id] });
      toast({ title: isEdit ? (isFr ? 'Mis à jour ✅' : 'Updated ✅') : (isFr ? 'Créé ✅' : 'Created ✅') });
      navigate('/admin/media');
    } catch (err: any) { toast({ title: isFr ? 'Erreur' : 'Error', description: err.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  return (
    <AdminPageShell title={isEdit ? (isFr ? 'Modifier le média' : 'Edit Media') : (isFr ? 'Nouveau média' : 'New Media')} backRoute="/admin/media">
      <AIWritingAssistant open={showAI} onClose={() => setShowAI(false)} onInsert={(html) => { const existing = (watch('description') || '').replace(/^(\s*<p>\s*(<br\s*\/?>)?\s*<\/p>\s*)+$/gi, '').trim(); setValue('description', existing ? existing + html : html, { shouldDirty: true, shouldTouch: true }); }} context={isFr ? 'description de contenu média' : 'media content description'} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5 max-w-xl">
        <div className="space-y-2">
          <Label>{isFr ? 'Type de contenu *' : 'Content type *'}</Label>
          <div className="grid grid-cols-2 gap-2">
            {MEDIA_TYPES.map(({ value, label, icon: Icon, desc, specs }) => (
              <button key={value} type="button" onClick={() => setValue('media_type', value)}
                className={cn('p-3 rounded-xl border-2 text-left transition-all', selectedType === value ? 'border-primary bg-primary/10' : 'border-border bg-card hover:border-muted-foreground/40')}>
                <div className="flex items-center gap-2 mb-1"><Icon className={cn('h-3.5 w-3.5', selectedType === value ? 'text-primary' : 'text-muted-foreground')} /><span className="text-sm font-semibold">{label}</span></div>
                <p className="text-[10px] text-muted-foreground leading-snug">{desc}</p>
              </button>
            ))}
          </div>
          {selectedTypeMeta && <p className="text-[11px] text-primary bg-primary/8 border border-primary/20 rounded-lg px-3 py-1.5">📐 <strong>Specs:</strong> {selectedTypeMeta.specs}</p>}
        </div>

        <div className="space-y-1.5"><Label>{isFr ? 'Titre *' : 'Title *'}</Label><Input {...register('title')} placeholder={isFr ? 'Titre du contenu...' : 'Content title...'} />{errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}</div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <RichTextEditor value={watch('description') || ''} onChange={(html) => setValue('description', html)} placeholder={isFr ? 'Description du contenu...' : 'Content description...'} onAIAssist={() => setShowAI(true)} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>{isFr ? 'Intervenant' : 'Speaker'}</Label><Input {...register('speaker')} placeholder={isFr ? 'Nom...' : 'Name...'} /></div>
          <div className="space-y-1.5"><Label>{isFr ? 'Série' : 'Series'}</Label><Input {...register('series')} placeholder={isFr ? 'Nom de la série...' : 'Series name...'} /></div>
        </div>
        <div className="space-y-1.5">
          <Label>{isFr ? 'Média (upload ou URL) *' : 'Media (upload or URL) *'}</Label>
          <FileUploader
            value={watch('media_url') || ''}
            onChange={(url) => setValue('media_url', url, { shouldDirty: true })}
            folder="media"
            label={isFr ? 'Fichier média' : 'Media file'}
            hint={selectedType === 'audio' ? (isFr ? 'MP3, AAC, WAV · Max 50 Mo' : 'MP3, AAC, WAV · Max 50 MB') : (isFr ? 'MP4, WebM ou lien YouTube/Vimeo' : 'MP4, WebM or YouTube/Vimeo link')}
            accept={selectedType === 'audio' ? 'audio/*' : 'video/*'}
            bucket="org-uploads"
          />
          {errors.media_url && <p className="text-xs text-destructive">{errors.media_url.message}</p>}
        </div>
        <ImageUploader value={watch('thumbnail_url') || ''} onChange={(url) => setValue('thumbnail_url', url)} folder="thumbnails" label={isFr ? 'Miniature' : 'Thumbnail'} hint={selectedType === 'reel' ? '9:16 · 1080×1920px' : '16:9 · 1280×720px'} aspectRatio={selectedType === 'reel' ? 'square' : 'video'} />
        <div className="space-y-1.5"><Label>{isFr ? 'Tags (séparés par virgules)' : 'Tags (comma separated)'}</Label><Input {...register('tags')} placeholder={isFr ? 'formation, leadership...' : 'training, leadership...'} /></div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2"><Switch checked={watch('is_premium')} onCheckedChange={v => setValue('is_premium', v)} /><Label className="text-sm cursor-pointer">Premium</Label></div>
          <div className="flex items-center gap-2"><Switch checked={watch('is_published')} onCheckedChange={v => setValue('is_published', v)} /><Label className="text-sm cursor-pointer">{isFr ? 'Publié' : 'Published'}</Label></div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/media')}>{isFr ? 'Annuler' : 'Cancel'}</Button>
          <Button type="submit" className="bg-primary text-primary-foreground" disabled={loading}>{loading ? (isFr ? 'Enregistrement...' : 'Saving...') : isEdit ? (isFr ? 'Mettre à jour' : 'Update') : (isFr ? 'Créer' : 'Create')}</Button>
        </div>
      </form>
    </AdminPageShell>
  );
}
