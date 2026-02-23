import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Copy, ExternalLink, Share2 } from 'lucide-react';
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
import { ImageUploader } from '@/components/ui/ImageUploader';
import { FileUploader } from '@/components/ui/FileUploader';
import { useToast } from '@/hooks/use-toast';


const schema = z.object({
  title: z.string().min(2, 'Required'),
  description: z.string().optional(),
  product_type: z.enum(['pdf', 'ebook', 'video', 'audio', 'course', 'other']),
  price: z.coerce.number().min(0),
  cover_image_url: z.string().optional(),
  file_url: z.string().optional(),
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
      if (error) throw error;
      toast({ title: isEdit ? 'Updated ✅' : 'Created ✅' });
      navigate('/admin/products');
    } catch (err: any) {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const productUrl = isEdit && currentOrg?.slug && id
    ? `${window.location.origin}/org/${currentOrg.slug}/product/${id}`
    : null;

  const copyLink = () => {
    if (productUrl) {
      navigator.clipboard.writeText(productUrl);
      toast({ title: 'Lien copié ✅' });
    }
  };

  const shareLink = () => {
    if (productUrl) {
      if (navigator.share) {
        navigator.share({ title: watch('title'), url: productUrl });
      } else {
        copyLink();
      }
    }
  };

  return (
    <AdminPageShell title={isEdit ? 'Edit Product' : 'New Digital Product'} backRoute="/admin/products">
      {/* Product link preview */}
      {productUrl && (
        <div className="mb-4 p-3 rounded-xl bg-muted/50 border border-border flex items-center gap-2 flex-wrap">
          <span className="text-xs text-muted-foreground font-medium shrink-0">Lien produit :</span>
          <a href={productUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline truncate max-w-[300px]">
            {productUrl}
          </a>
          <div className="flex gap-1 ml-auto shrink-0">
            <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={copyLink} title="Copier le lien">
              <Copy className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => window.open(productUrl, '_blank')} title="Voir le produit">
              <ExternalLink className="h-3.5 w-3.5" />
            </Button>
            <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={shareLink} title="Partager">
              <Share2 className="h-3.5 w-3.5" />
            </Button>
          </div>
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

        {/* Cover image upload */}
        {/* Cover image upload — hint adapts to product type */}
        {(() => {
          const pt = watch('product_type');
          const coverHints: Record<string, { hint: string; aspect: 'square' | 'video' | 'banner' | 'free' }> = {
            pdf:    { hint: 'Book cover: 1000×1600px (2:3 portrait) · JPG/PNG/WEBP · Max 10MB', aspect: 'free' },
            ebook:  { hint: 'eBook cover: 1000×1600px (2:3 portrait) · JPG/PNG/WEBP · Max 10MB', aspect: 'free' },
            audio:  { hint: 'Album art: 3000×3000px (1:1 square) · JPG/PNG/WEBP · Max 10MB', aspect: 'square' },
            video:  { hint: 'Video cover: 1280×720px (16:9 horizontal) · JPG/PNG/WEBP · Max 10MB', aspect: 'video' },
            course: { hint: 'Course cover: 1280×720px (16:9 horizontal) · JPG/PNG/WEBP · Max 10MB', aspect: 'video' },
            other:  { hint: 'Recommended: 1280×720px (16:9) or 1000×1600px (2:3). JPG/PNG/WEBP · Max 10MB', aspect: 'free' },
          };
          const cfg = coverHints[pt] || coverHints.other;
          return (
            <ImageUploader
              value={watch('cover_image_url') || ''}
              onChange={(url) => setValue('cover_image_url', url)}
              folder="products"
              label="Cover Image"
              hint={cfg.hint}
              aspectRatio={cfg.aspect}
            />
          );
        })()}

        <FileUploader
          value={watch('file_url') || ''}
          onChange={(url) => setValue('file_url', url)}
          folder="products"
          label="Product File"
          hint="Upload a PDF, Word, PowerPoint, audio, or video file (max 100MB), or switch to URL mode to paste a hosted link."
          accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.epub,.zip,.mp3,.mp4,.wav,.aac,.m4a,.ogg,.webm,.mov,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.ms-powerpoint,application/vnd.ms-excel,application/epub+zip,application/zip,audio/*,video/*"
          bucket="private-products"
        />

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
          <Button type="submit" className="bg-primary text-primary-foreground" disabled={loading}>
            {loading ? 'Saving...' : isEdit ? 'Update' : 'Create'}
          </Button>
        </div>
      </form>
    </AdminPageShell>
  );
}
