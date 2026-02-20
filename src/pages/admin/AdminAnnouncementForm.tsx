import { useEffect } from 'react';
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
import { useToast } from '@/hooks/use-toast';

const schema = z.object({
  title: z.string().min(2, 'Required'),
  body: z.string().min(5, 'Required'),
  image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
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
  const isEdit = !!id;

  const { data: item } = useQuery({
    queryKey: ['announcement-item', id],
    queryFn: async () => {
      const { data } = await db.from('announcements').select('*').eq('id', id).single();
      return data;
    },
    enabled: isEdit,
  });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_pinned: false, is_published: true },
  });

  useEffect(() => {
    if (item) {
      reset({
        title: item.title,
        body: item.body,
        image_url: item.image_url || '',
        is_pinned: item.is_pinned || false,
        is_published: item.is_published ?? true,
        expires_at: item.expires_at ? item.expires_at.slice(0, 10) : '',
      });
    }
  }, [item, reset]);

  const onSubmit = async (data: FormData) => {
    if (!currentOrg || !user) return;
    const payload = {
      ...data,
      organization_id: currentOrg.id,
      created_by: user.id,
      image_url: data.image_url || null,
      expires_at: data.expires_at ? new Date(data.expires_at).toISOString() : null,
    };
    let error;
    if (isEdit) {
      ({ error } = await db.from('announcements').update(payload).eq('id', id));
    } else {
      ({ error } = await db.from('announcements').insert(payload));
    }
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: isEdit ? 'Updated ✅' : 'Created ✅' });
      navigate('/admin/announcements');
    }
  };

  return (
    <AdminPageShell title={isEdit ? 'Edit Announcement' : 'New Announcement'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
        <div className="space-y-1.5">
          <Label>Title *</Label>
          <Input {...register('title')} placeholder="Announcement title..." />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Body *</Label>
          <Textarea {...register('body')} rows={5} placeholder="Announcement content..." />
          {errors.body && <p className="text-xs text-destructive">{errors.body.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Image URL (optional)</Label>
          <Input {...register('image_url')} placeholder="https://..." />
          {errors.image_url && <p className="text-xs text-destructive">{errors.image_url.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Expires At (optional)</Label>
          <Input type="date" {...register('expires_at')} />
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch checked={watch('is_pinned')} onCheckedChange={v => setValue('is_pinned', v)} />
            <Label className="text-sm cursor-pointer">Pinned</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={watch('is_published')} onCheckedChange={v => setValue('is_published', v)} />
            <Label className="text-sm cursor-pointer">Published</Label>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/announcements')}>Cancel</Button>
          <Button type="submit" className="gold-gradient text-primary-foreground border-0 shadow-gold" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </AdminPageShell>
  );
}
