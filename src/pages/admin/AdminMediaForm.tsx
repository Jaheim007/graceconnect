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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

const schema = z.object({
  title: z.string().min(2, 'Required'),
  description: z.string().optional(),
  media_type: z.enum(['video', 'audio', 'reel', 'live_replay']),
  media_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  thumbnail_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
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

  const { data: item } = useQuery({
    queryKey: ['media-item', id],
    queryFn: async () => {
      const { data } = await db.from('media_content').select('*').eq('id', id).single();
      return data;
    },
    enabled: isEdit,
  });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
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

  const onSubmit = async (data: FormData) => {
    if (!currentOrg || !user) return;
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
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      toast({ title: isEdit ? 'Updated ✅' : 'Created ✅' });
      navigate('/admin/media');
    }
  };

  return (
    <AdminPageShell title={isEdit ? 'Edit Media' : 'New Media'}>
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
        <div className="space-y-1.5">
          <Label>Title *</Label>
          <Input {...register('title')} placeholder="Sermon title..." />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea {...register('description')} rows={3} placeholder="Short description..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Media Type</Label>
            <Select value={watch('media_type')} onValueChange={v => setValue('media_type', v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="reel">Reel</SelectItem>
                <SelectItem value="live_replay">Live Replay</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Speaker</Label>
            <Input {...register('speaker')} placeholder="Pastor Name..." />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Media URL</Label>
          <Input {...register('media_url')} placeholder="https://..." />
          {errors.media_url && <p className="text-xs text-destructive">{errors.media_url.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Thumbnail URL</Label>
          <Input {...register('thumbnail_url')} placeholder="https://..." />
          {errors.thumbnail_url && <p className="text-xs text-destructive">{errors.thumbnail_url.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Series</Label>
          <Input {...register('series')} placeholder="Series name..." />
        </div>
        <div className="space-y-1.5">
          <Label>Tags (comma separated)</Label>
          <Input {...register('tags')} placeholder="faith, prayer, youth..." />
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
          <Button type="button" variant="outline" onClick={() => navigate('/admin/media')}>Cancel</Button>
          <Button type="submit" className="gold-gradient text-primary-foreground border-0 shadow-gold" disabled={isSubmitting}>
            {isSubmitting ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </AdminPageShell>
  );
}
