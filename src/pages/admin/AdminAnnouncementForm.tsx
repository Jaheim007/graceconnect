import { useEffect, useState } from 'react';
import { useNavigate, useParams } from '@/lib/router-compat';
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
  body: z.string().min(5, 'Required'),
  image_url: z.string().optional(),
  is_pinned: z.boolean().default(false),
  is_published: z.boolean().default(true),
  expires_at: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function AnnouncementForm() {
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
    queryKey: ['announcement-item', id],
    queryFn: async () => {
      const { data } = await db.from('announcements').select('*').eq('id', id).single();
      return data;
    },
    enabled: isEdit,
  });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_pinned: false, is_published: true },
  });

  useEffect(() => {
    if (item) {
      reset({ title: item.title, body: item.body, image_url: item.image_url || '', is_pinned: item.is_pinned || false, is_published: item.is_published ?? true, expires_at: item.expires_at ? item.expires_at.slice(0, 10) : '' });
    }
  }, [item, reset]);

  const onSubmit = async (data: FormData) => {
    if (!currentOrg || !user) { toast({ title: isFr ? 'Erreur' : 'Error', description: isFr ? 'Aucune organisation sélectionnée.' : 'No organization selected.', variant: 'destructive' }); return; }
    setLoading(true);
    try {
      const payload = { ...data, organization_id: currentOrg.id, created_by: user.id, image_url: data.image_url || null, expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : null };
      let error;
      if (isEdit) { ({ error } = await db.from('announcements').update(payload).eq('id', id)); }
      else { ({ error } = await db.from('announcements').insert(payload as any)); }
      if (error) throw error;
      await queryClient.invalidateQueries({ queryKey: ['org-announcements'] });
      toast({ title: isEdit ? (isFr ? 'Mis à jour ✅' : 'Updated ✅') : (isFr ? 'Créé ✅' : 'Created ✅') });
      navigate('/admin/announcements');
    } catch (err: any) { toast({ title: isFr ? 'Erreur' : 'Error', description: err.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  };

  return (
    <AdminPageShell title={isEdit ? (isFr ? 'Modifier l\'annonce' : 'Edit Announcement') : (isFr ? 'Nouvelle annonce' : 'New Announcement')} backRoute="/admin/announcements">
      <AIWritingAssistant open={showAI} onClose={() => setShowAI(false)} onInsert={(html) => { const existing = (watch('body') || '').replace(/^(\s*<p>\s*(<br\s*\/?>)?\s*<\/p>\s*)+$/gi, '').trim(); setValue('body', existing ? existing + html : html, { shouldDirty: true, shouldTouch: true }); }} context={isFr ? 'annonce d\'organisation' : 'organization announcement'} />

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
        <div className="space-y-1.5">
          <Label>{isFr ? 'Titre *' : 'Title *'}</Label>
          <Input {...register('title')} placeholder={isFr ? 'Titre de l\'annonce...' : 'Announcement title...'} />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>{isFr ? 'Contenu *' : 'Content *'}</Label>
          <RichTextEditor
            value={watch('body') || ''}
            onChange={(html) => setValue('body', html)}
            placeholder={isFr ? 'Rédigez le contenu de votre annonce...' : 'Write the content of your announcement...'}
            onAIAssist={() => setShowAI(true)}
          />
          {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
        </div>

        <ImageUploader value={watch('image_url') || ''} onChange={(url) => setValue('image_url', url)} folder="announcements" label={isFr ? 'Image (optionnel)' : 'Image (optional)'} hint={isFr ? 'Recommandé: 1200×630px' : 'Recommended: 1200×630px'} aspectRatio="video" />

        <div className="space-y-1.5">
          <Label>{isFr ? 'Expire le (optionnel)' : 'Expires on (optional)'}</Label>
          <Input type="date" {...register('expires_at')} />
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2"><Switch checked={watch('is_pinned')} onCheckedChange={v => setValue('is_pinned', v)} /><Label className="text-sm cursor-pointer">{isFr ? 'Épinglé' : 'Pinned'}</Label></div>
          <div className="flex items-center gap-2"><Switch checked={watch('is_published')} onCheckedChange={v => setValue('is_published', v)} /><Label className="text-sm cursor-pointer">{isFr ? 'Publié' : 'Published'}</Label></div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/announcements')}>{isFr ? 'Annuler' : 'Cancel'}</Button>
          <Button type="submit" className="bg-primary text-primary-foreground" disabled={loading}>{loading ? (isFr ? 'Enregistrement...' : 'Saving...') : isEdit ? (isFr ? 'Mettre à jour' : 'Update') : (isFr ? 'Créer' : 'Create')}</Button>
        </div>
      </form>
    </AdminPageShell>
  );
}
