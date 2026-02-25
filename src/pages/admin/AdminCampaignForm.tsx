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

const schema = z.object({
  title: z.string().min(2, 'Required'),
  description: z.string().optional(),
  image_url: z.string().optional(),
  goal_amount: z.coerce.number().min(0).optional(),
  end_date: z.string().optional(),
  
  is_active: z.boolean().default(true),
  is_published: z.boolean().default(true),
});

type FormData = z.infer<typeof schema>;

export function CampaignForm() {
  const { id } = useParams<{ id: string }>();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);

  const { data: item } = useQuery({
    queryKey: ['campaign-item', id],
    queryFn: async () => {
      const { data } = await db.from('donation_campaigns').select('*').eq('id', id).single();
      return data;
    },
    enabled: isEdit,
  });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { is_active: true, is_published: true },
  });

  useEffect(() => {
    if (item) {
      reset({
        title: item.title,
        description: item.description || '',
        image_url: item.image_url || '',
        goal_amount: item.goal_amount ?? undefined,
        end_date: item.end_date ? item.end_date.slice(0, 10) : '',
        
        is_active: item.is_active ?? true,
        is_published: item.is_published ?? true,
      });
    }
  }, [item, reset]);

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
        currency: currentOrg.currency || 'XOF',
        image_url: data.image_url || null,
        goal_amount: data.goal_amount || null,
        end_date: data.end_date ? new Date(data.end_date).toISOString() : null,
      };
      let error;
      if (isEdit) {
        ({ error } = await db.from('donation_campaigns').update(payload).eq('id', id));
      } else {
        ({ error } = await db.from('donation_campaigns').insert(payload));
      }
      if (error) throw error;
      toast({ title: isEdit ? 'Updated ✅' : 'Created ✅' });
      navigate('/admin/campaigns');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminPageShell title={isEdit ? 'Edit Campaign' : 'New Donation Campaign'} backRoute="/admin/campaigns">


      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
        <div className="space-y-1.5">
          <Label>Campaign Title *</Label>
          <Input {...register('title')} placeholder="Building Fund 2025..." />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea {...register('description')} rows={3} placeholder="What is this campaign for?" />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Goal Amount ({currentOrg?.currency || 'XOF'})</Label>
            <Input type="number" {...register('goal_amount')} placeholder="e.g. 5000000" />
            {errors.goal_amount && <p className="text-xs text-destructive">{errors.goal_amount.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>End Date (optional)</Label>
            <Input type="date" {...register('end_date')} />
          </div>
        </div>

        {/* Image upload */}
        <ImageUploader
          value={watch('image_url') || ''}
          onChange={(url) => setValue('image_url', url)}
          folder="campaigns"
          label="Cover Image"
          hint="Recommended: 1200×630px. JPG/PNG/WEBP · Max 10MB"
          aspectRatio="video"
        />

        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch checked={watch('is_active')} onCheckedChange={v => setValue('is_active', v)} />
            <Label className="text-sm cursor-pointer">Active</Label>
          </div>
          <div className="flex items-center gap-2">
            <Switch checked={watch('is_published')} onCheckedChange={v => setValue('is_published', v)} />
            <Label className="text-sm cursor-pointer">Published</Label>
          </div>
        </div>
        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/campaigns')}>Cancel</Button>
          <Button type="submit" className="bg-primary text-primary-foreground" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </AdminPageShell>
  );
}
