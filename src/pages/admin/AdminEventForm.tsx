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
import { useToast } from '@/hooks/use-toast';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { AIWritingAssistant } from '@/components/admin/AIWritingAssistant';

const schema = z.object({
  title: z.string().min(2, 'Required'),
  description: z.string().optional(),
  image_url: z.string().optional(),
  video_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  location: z.string().optional(),
  map_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  event_date: z.string().optional(),
  is_published: z.boolean().default(false),
});

type FormData = z.infer<typeof schema>;

export function EventForm() {
  const { id } = useParams<{ id: string }>();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);
  const [showAI, setShowAI] = useState(false);

  const { data: item } = useQuery({
    queryKey: ['event-item', id],
    queryFn: async () => { const { data } = await db.from('events').select('*').eq('id', id).single(); return data; },
    enabled: isEdit,
  });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_published: false },
  });

  useEffect(() => {
    if (item) { reset({ title: item.title, description: item.description || '', image_url: item.image_url || '', video_url: item.video_url || '', location: item.location || '', map_url: (item as any).map_url || '', event_date: item.event_date ? item.event_date.slice(0, 16) : '', is_published: item.is_published || false }); }
  }, [item, reset]);

  const onSubmit = async (data: FormData) => {
    if (!currentOrg || !user) { toast({ title: isFr ? 'Erreur' : 'Error', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      const payload = { ...data, organization_id: currentOrg.id, created_by: user.id, image_url: data.image_url || null, video_url: data.video_url || null, map_url: data.map_url || null, event_date: data.event_date ? new Date(data.event_date).toISOString() : null };
      let error;
      if (isEdit) { ({ error } = await db.from('events').update(payload).eq('id', id)); }
      else { ({ error } = await db.from('events').insert(payload as any)); }
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['org-events'] });
      toast({ title: isEdit ? (isFr ? 'Mis à jour ✅' : 'Updated ✅') : (isFr ? 'Créé ✅' : 'Created ✅') });
      navigate('/admin/events');
    } catch (err: any) { toast({ title: isFr ? 'Erreur' : 'Error', description: err.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  return (
    <AdminPageShell title={isEdit ? (isFr ? 'Modifier l\'événement' : 'Edit Event') : (isFr ? 'Nouvel événement' : 'New Event')} backRoute="/admin/events">
      <AIWritingAssistant open={showAI} onClose={() => setShowAI(false)} onInsert={(html) => setValue('description', (watch('description') || '') + html, { shouldDirty: true, shouldTouch: true })} context={isFr ? 'description d\'événement' : 'event description'} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
        <div className="space-y-1.5">
          <Label>{isFr ? 'Titre *' : 'Title *'}</Label>
          <Input {...register('title')} placeholder={isFr ? 'Nom de l\'événement...' : 'Event name...'} />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <RichTextEditor
            value={watch('description') || ''}
            onChange={(html) => setValue('description', html)}
            placeholder={isFr ? 'Détails de l\'événement...' : 'Event details...'}
            onAIAssist={() => setShowAI(true)}
          />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5"><Label>{isFr ? 'Date & Heure' : 'Date & Time'}</Label><Input type="datetime-local" {...register('event_date')} /></div>
          <div className="space-y-1.5"><Label>{isFr ? 'Lieu' : 'Location'}</Label><Input {...register('location')} placeholder={isFr ? 'Ville ou adresse...' : 'City or address...'} /></div>
        </div>
        <div className="space-y-1.5">
          <Label>{isFr ? 'Lien Google Maps (optionnel)' : 'Google Maps link (optional)'}</Label>
          <Input {...register('map_url')} placeholder={isFr ? 'https://maps.app.goo.gl/... ou https://maps.google.com/...' : 'https://maps.app.goo.gl/... or https://maps.google.com/...'} />
          {errors.map_url && <p className="text-xs text-destructive">{errors.map_url.message}</p>}
          <p className="text-[11px] text-muted-foreground">{isFr ? 'Collez un lien de partage Google Maps (ex: maps.app.goo.gl/...) pour afficher une carte interactive' : 'Paste a Google Maps share link (e.g., maps.app.goo.gl/...) to display an interactive map'}</p>
        </div>
        <ImageUploader value={watch('image_url') || ''} onChange={(url) => setValue('image_url', url)} folder="events" label={isFr ? 'Bannière' : 'Banner'} hint={isFr ? 'Recommandé: 1200×400px' : 'Recommended: 1200×400px'} aspectRatio="banner" />
        <div className="space-y-1.5">
          <Label>{isFr ? 'URL vidéo (optionnel)' : 'Video URL (optional)'}</Label>
          <Input {...register('video_url')} placeholder="https://youtube.com/..." />
          {errors.video_url && <p className="text-xs text-destructive">{errors.video_url.message}</p>}
        </div>
        <div className="flex items-center gap-2"><Switch checked={watch('is_published')} onCheckedChange={v => setValue('is_published', v)} /><Label className="text-sm cursor-pointer">{isFr ? 'Publié' : 'Published'}</Label></div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/events')}>{isFr ? 'Annuler' : 'Cancel'}</Button>
          <Button type="submit" className="bg-primary text-primary-foreground" disabled={loading}>{loading ? (isFr ? 'Enregistrement...' : 'Saving...') : isEdit ? (isFr ? 'Mettre à jour' : 'Update') : (isFr ? 'Créer' : 'Create')}</Button>
        </div>
      </form>
    </AdminPageShell>
  );
}
