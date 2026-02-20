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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';

const schema = z.object({
  title: z.string().min(2, 'Required'),
  description: z.string().optional(),
  product_type: z.enum(['pdf', 'ebook', 'video', 'audio', 'course', 'other']),
  price: z.coerce.number().min(0),
  cover_image_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  file_url: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  external_link: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  is_free: z.boolean().default(false),
  is_featured: z.boolean().default(false),
  is_published: z.boolean().default(false),
});

type FormData = z.infer<typeof schema>;

export function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const isEdit = !!id;
  const [loading, setLoading] = useState(false);

  const { data: item } = useQuery({
    queryKey: ['product-item', id],
    queryFn: async () => {
      const { data } = await db.from('digital_products').select('*').eq('id', id).single();
      return data;
    },
    enabled: isEdit,
  });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { product_type: 'pdf', price: 0, is_free: false, is_featured: false, is_published: false },
  });

  useEffect(() => {
    if (item) {
      reset({
        title: item.title,
        description: item.description || '',
        product_type: item.product_type || 'pdf',
        price: item.price || 0,
        cover_image_url: item.cover_image_url || '',
        file_url: item.file_url || '',
        external_link: item.external_link || '',
        is_free: item.is_free || false,
        is_featured: item.is_featured || false,
        is_published: item.is_published || false,
      });
    }
  }, [item, reset]);

  const isFree = watch('is_free');

  const onSubmit = async (data: FormData) => {
    if (!currentOrg || !user) {
      toast({ title: 'Error', description: 'No organization selected.', variant: 'destructive' });
      return;
    }
    if (!currentOrg.monetization_enabled && !data.is_free) {
      toast({ title: 'KYC required', description: 'Monetization must be enabled for paid products.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...data,
        organization_id: currentOrg.id,
        created_by: user.id,
        currency: currentOrg.currency || 'XOF',
        price: data.is_free ? 0 : data.price,
        cover_image_url: data.cover_image_url || null,
        file_url: data.file_url || null,
        external_link: data.external_link || null,
      };
      let error;
      if (isEdit) {
        ({ error } = await db.from('digital_products').update(payload).eq('id', id));
      } else {
        ({ error } = await db.from('digital_products').insert(payload));
      }
      if (error) {
        toast({ title: 'Error', description: error.message, variant: 'destructive' });
      } else {
        toast({ title: isEdit ? 'Updated ✅' : 'Created ✅' });
        navigate('/admin/products');
      }
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <AdminPageShell title={isEdit ? 'Edit Product' : 'New Digital Product'} backRoute="/admin/products">
      {!currentOrg?.monetization_enabled && (
      <div className="p-3 rounded-xl bg-destructive/10 border border-destructive/30 text-xs text-destructive mb-4">
          ⚠️ Paid products require monetization. You can still create free products.
        </div>
      )}
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
        <div className="space-y-1.5">
          <Label>Product Title *</Label>
          <Input {...register('title')} placeholder="e.g. Bible Study Guide Vol. 1" />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>Description</Label>
          <Textarea {...register('description')} rows={3} placeholder="Describe the product..." />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={watch('product_type')} onValueChange={v => setValue('product_type', v as any)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="pdf">PDF</SelectItem>
                <SelectItem value="ebook">eBook</SelectItem>
                <SelectItem value="video">Video</SelectItem>
                <SelectItem value="audio">Audio</SelectItem>
                <SelectItem value="course">Course</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label>Price ({currentOrg?.currency || 'XOF'})</Label>
            <Input type="number" {...register('price')} disabled={isFree} placeholder="e.g. 5000" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label>Cover Image URL</Label>
          <Input {...register('cover_image_url')} placeholder="https://..." />
          {errors.cover_image_url && <p className="text-xs text-destructive">{errors.cover_image_url.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>File URL (hosted content)</Label>
          <Input {...register('file_url')} placeholder="https://..." />
          {errors.file_url && <p className="text-xs text-destructive">{errors.file_url.message}</p>}
        </div>
        <div className="space-y-1.5">
          <Label>External Link (optional)</Label>
          <Input {...register('external_link')} placeholder="https://..." />
          {errors.external_link && <p className="text-xs text-destructive">{errors.external_link.message}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2">
            <Switch checked={watch('is_free')} onCheckedChange={v => setValue('is_free', v)} />
            <Label className="text-sm cursor-pointer">Free</Label>
          </div>
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
          <Button type="button" variant="outline" onClick={() => navigate('/admin/products')}>Cancel</Button>
          <Button type="submit" className="gold-gradient text-primary-foreground border-0 shadow-gold" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </AdminPageShell>
  );
}
