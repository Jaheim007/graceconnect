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
  description: z.string().optional(),
  image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  video_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  location: z.string().optional(),
  event_date: z.string().optional(),
  is_featured: z.boolean().default(false),
  is_published: z.boolean().default(false),
});

type FormData = z.infer<typeof schema>;

export function EventForm() {
  const { id } = useParams<{ id: string }>();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id;

  const { data: item } = useQuery({
    queryKey: ['event-item', id],
    queryFn: async () => {
      const { data } = await db.from('events').select('*').eq('id', id).single();
      return data;
    },
    enabled: isEdit,
  });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_featured: false, is_published: false },
  });

  useEffect(() => {
    if (item) {
      reset({
        title: item.title,
        description: item.description || '',
        image_url: item.image_url || '',
        video_url: item.video_url || '',
        location: item.location || '',
        event_date: item.event_date ? item.event_date.slice(0, 16) : '',
        is_featured: item.is_featured || false,
        is_published: item.is_published || false,
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
      video_url: data.video_url || null,
      event_date: data.event_date ? new Date(data.event_date).toISOString() : null,
    };
    let error;
    if (isEdit) {
      ({ error } = await db.from('events').update(payload).eq('id', id));
    } else {
      ({ error } = await db.from('events').insert(payload));
    }
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: isEdit ? 'Updated ✅' : 'Created ✅' });
      navigate('/admin/events');
    }
  };

  return (
    <AdminPageShell title={isEdit ? 'Edit Event' : 'New Event'} backRoute="/admin/events">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
        <div className="space-y-1.5">
          <Label>Title *</Label>
          <Input {...register('title')} placeholder="Event name..." />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea {...register('description')} rows={3} placeholder="Event details..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Date & Time</Label>
            <Input type="datetime-local" {...register('event_date')} />
          </div>
          <div className="space-y-1.5">
            <Label>Location</Label>
            <Input {...register('location')} placeholder="City or address..." />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Banner Image URL</Label>
          <Input {...register('image_url')} placeholder="https://..." />
          {errors.image_url && <p className="text-xs text-destructive">{errors.image_url.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Video URL (optional)</Label>
          <Input {...register('video_url')} placeholder="https://..." />
          {errors.video_url && <p className="text-xs text-destructive">{errors.video_url.message}</p>}
        </div>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch checked={watch('is_featured')} onCheckedChange={v => setValue('is_featured', v)} />
            <Label className="text-sm cursor-pointer">Featured</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={watch('is_published')} onCheckedChange={v => setValue('is_published', v)} />
            <Label className="text-sm cursor-pointer">Published</Label>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/events')}>Cancel</Button>
          <Button type="submit" className="gold-gradient text-primary-foreground border-0 shadow-gold" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </AdminPageShell>
  );
}
