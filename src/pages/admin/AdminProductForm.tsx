import { useEffect, useState, useCallback, useMemo } from 'react';
import { CurrencySelector } from '@/components/currency/CurrencySelector';
import { SUPPORTED_CURRENCIES, type CurrencyCode } from '@/lib/currency';
import { cn } from '@/lib/utils';
import { getOrCreateShortLink, buildSocialShareUrl, buildShareUrlForPath } from '@/lib/shareMeta';
import { getPublicUrl } from '@/lib/publicUrl';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Copy, ExternalLink, Share2, CheckCircle, Plus, Eye, Trash2, PackagePlus, ArrowUpRight, HelpCircle, Shield, MessageSquareQuote, Sparkles, ImageIcon, AlertTriangle, RefreshCw, Loader2, CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Calendar } from '@/components/ui/calendar';
import { onContentPublished, onContentUnpublished, onProductPriceChanged } from '@/lib/notifications';
import { z } from 'zod';
import { useOrg } from '@/contexts/OrgContext';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { db } from '@/lib/db';
import { useQuery, useQueryClient } from '@tanstack/react-query';
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
import { Badge } from '@/components/ui/badge';
import { useBundleItems, useAddBundleItem, useRemoveBundleItem, useProductRecommendations, useAddRecommendation, useRemoveRecommendation } from '@/hooks/useBundlesAndRecommendations';
import { useOrgProducts } from '@/hooks/useMonetization';
import { EmbedSnippetGen } from '@/components/products/EmbedSnippetGen';
import { ContentTemplateSelector } from '@/components/admin/ContentTemplateSelector';
import { RichTextEditor } from '@/components/ui/RichTextEditor';
import { AIWritingAssistant } from '@/components/admin/AIWritingAssistant';
// AIDescriptionButton removed — use "Aide IA" in the RichTextEditor toolbar instead
import { SocialSnippetsViewer } from '@/components/products/SocialSnippetsViewer';
import { SuggestedPriceHint } from '@/components/admin/SuggestedPriceHint';
import { ContextTip } from '@/components/admin/ContextualTooltips';
import { PrintableQRCode } from '@/components/sharing/PrintableQRCode';
import { ContentVersionHistory } from '@/components/admin/ContentVersionHistory';
import { ContextualFeedback } from '@/components/feedback/ContextualFeedback';
import { useI18n } from '@/i18n/I18nContext';



import type { ProductTemplate } from '@/lib/contentTemplates';

const schema = z.object({
  title: z.string().min(2, 'Required'),
  description: z.string().optional(),
  product_type: z.enum(['pdf', 'ebook', 'video', 'audio', 'course', 'other']),
  price: z.coerce.number().min(0),
  cover_image_url: z.string().optional(),
  file_url: z.string().optional(),
  external_link: z.string().url('Must be a valid URL').optional().or(z.literal('')),
  is_free: z.boolean().default(false),
  is_published: z.boolean().default(false),
  is_bundle: z.boolean().default(false),
  is_pwyw: z.boolean().default(false),
  min_price: z.coerce.number().min(0).optional(),
  guarantee_text: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export function ProductForm() {
  const { id } = useParams<{ id: string }>();
  const { currentOrg } = useOrg();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const isEdit = !!id;
  
  // Support pre-fill from AI Studio
  const studioState = (location.state as any)?.fromStudio ? (location.state as any) : null;
  const studioPrefill = studioState?.prefill || null;
  const [loading, setLoading] = useState(false);
  const [createdProduct, setCreatedProduct] = useState<{ id: string; slug: string } | null>(null);
  const [faqItems, setFaqItems] = useState<{ q: string; a: string }[]>([]);
  const [testimonials, setTestimonials] = useState<{ name: string; text: string }[]>([]);
  const [newFaq, setNewFaq] = useState({ q: '', a: '' });
  const [newTestimonial, setNewTestimonial] = useState({ name: '', text: '' });
  const [showTemplates, setShowTemplates] = useState(!isEdit && !studioPrefill);
  const [salePrice, setSalePrice] = useState('');
  const [saleEndsAt, setSaleEndsAt] = useState('');
  const [showAI, setShowAI] = useState(false);
  
  const [regeneratingPdf, setRegeneratingPdf] = useState(false);
  const [regeneratingCover, setRegeneratingCover] = useState(false);
  const [orderBumpProductId, setOrderBumpProductId] = useState('');
  const [orderBumpDiscount, setOrderBumpDiscount] = useState('');
  const [upsellProductIds, setUpsellProductIds] = useState<string[]>([]);
  const [fbPixel, setFbPixel] = useState('');
  const [ttPixel, setTtPixel] = useState('');
  const [gTag, setGTag] = useState('');
  const [seoTitle, setSeoTitle] = useState('');
  const [seoDescription, setSeoDescription] = useState('');
  const [productCurrency, setProductCurrency] = useState<string>('');
  const [productCommissionRate, setProductCommissionRate] = useState<string>('');

  // Effective currency: product override > org default
  const effectiveCurrency = productCurrency || currentOrg?.currency || 'XOF';

  // Bundle & Recommendation hooks
  const { data: allProducts = [] } = useOrgProducts(currentOrg?.id, false);
  const { data: bundleItems = [] } = useBundleItems(isEdit ? id : undefined);
  const addBundleItem = useAddBundleItem();
  const removeBundleItem = useRemoveBundleItem();
  const { data: recommendations = [] } = useProductRecommendations(isEdit ? id : undefined);
  const addRecommendation = useAddRecommendation();
  const removeRecommendation = useRemoveRecommendation();
  const [selectedBundleProduct, setSelectedBundleProduct] = useState('');
  const [selectedRecommendation, setSelectedRecommendation] = useState('');
  const [recommendationType, setRecommendationType] = useState<string>('related');

  const { data: item, isLoading: isLoadingItem, isError: isItemError } = useQuery({
    queryKey: ['product-item', id],
    queryFn: async () => {
      const { data, error } = await db.from('digital_products').select('*').eq('id', id!).maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: isEdit && !!id,
    retry: 2,
  });

  const { register, handleSubmit, setValue, watch, reset, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { product_type: 'pdf', price: 0, is_free: false, is_published: true, is_bundle: false, is_pwyw: false, min_price: 0, guarantee_text: '' },
  });

  useEffect(() => {
    if (item) {
      const resolvedPublished = item.is_published || (item as any).publication_status === 'published';
      reset({
        title: item.title,
        description: item.description || '',
        product_type: (['pdf', 'ebook', 'video', 'audio', 'course', 'other'].includes((item.product_type || '').toLowerCase()) ? (item.product_type as any).toLowerCase() : 'pdf') as any,
        price: item.price || 0,
        cover_image_url: item.cover_image_url || '',
        file_url: item.file_url || '',
        external_link: item.external_link || '',
        is_free: item.is_free || false,
        is_published: resolvedPublished,
        is_bundle: item.is_bundle || false,
        is_pwyw: item.is_pwyw || false,
        min_price: item.min_price || 0,
        guarantee_text: item.guarantee_text || '',
      });
      setFaqItems((item.faq_json as any) || []);
      setTestimonials((item.testimonials_json as any) || []);
      setSalePrice(item.sale_price != null ? String(item.sale_price) : '');
      setSaleEndsAt(item.sale_ends_at ? item.sale_ends_at.slice(0, 16) : '');
      setOrderBumpProductId(item.order_bump_product_id || '');
      setOrderBumpDiscount(item.order_bump_discount_percent != null ? String(item.order_bump_discount_percent) : '');
      setUpsellProductIds(item.upsell_product_ids || []);
      setFbPixel((item as any).facebook_pixel_id || '');
      setTtPixel((item as any).tiktok_pixel_id || '');
      setGTag((item as any).google_tag_id || '');
      setSeoTitle((item as any).seo_title || '');
      setSeoDescription((item as any).seo_description || '');
      setProductCurrency(item.currency && item.currency !== (currentOrg?.currency || 'XOF') ? item.currency : '');
      setProductCommissionRate((item as any).commission_rate != null ? String((item as any).commission_rate) : '');
    }
  }, [item, reset]);

  // Pre-fill from AI Studio
  useEffect(() => {
    if (studioPrefill && !isEdit) {
      reset({
        title: studioPrefill.title || '',
        description: studioPrefill.description || '',
        product_type: (studioPrefill.product_type as any) || 'ebook',
        price: studioPrefill.price || 0,
        cover_image_url: studioPrefill.cover_image_url || '',
        file_url: studioPrefill.file_url || '',
        is_free: studioPrefill.is_free || false,
        is_published: studioPrefill.is_published ?? true,
        is_bundle: false,
        guarantee_text: '',
      });
    }
  }, [studioPrefill, isEdit, reset]);

  const isFree = watch('is_free');
  const fileUrl = watch('file_url') || '';

  const onSubmit = async (data: FormData) => {
    if (!currentOrg || !user) {
      toast({ title: 'Error', description: 'No organization selected.', variant: 'destructive' });
      return;
    }
    if (data.is_published && !data.file_url && !data.external_link) {
      toast({ title: 'Fichier requis', description: 'Impossible de publier un produit sans fichier ni lien externe.', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const payload = {
        ...data,
        organization_id: currentOrg.id,
        created_by: user.id,
        currency: productCurrency || currentOrg.currency || 'XOF',
        commission_rate: productCommissionRate ? parseFloat(productCommissionRate) : null,
        price: data.is_free ? 0 : data.price,
        is_pwyw: data.is_free ? false : data.is_pwyw,
        min_price: (() => {
          if (!data.is_pwyw || data.is_free) return null;
          const cur = productCurrency || currentOrg?.currency || 'XOF';
          const floors: Record<string, number> = { XOF: 500, XAF: 500, NGN: 500, USD: 1, EUR: 1, GBP: 1, GHS: 5, KES: 100, ZAR: 10, MAD: 10, TND: 3 };
          const floor = floors[cur] || 500;
          return Math.max(data.min_price || 0, floor);
        })(),
        publication_status: data.is_published ? 'published' : 'draft',
        cover_image_url: data.cover_image_url || null,
        file_url: data.file_url || null,
        external_link: data.external_link || null,
        guarantee_text: data.guarantee_text || null,
        faq_json: faqItems.length > 0 ? faqItems : [],
        testimonials_json: testimonials.length > 0 ? testimonials : [],
        sale_price: data.is_free || data.is_pwyw ? null : (salePrice ? parseFloat(salePrice) : null),
        sale_ends_at: data.is_free || data.is_pwyw ? null : (saleEndsAt ? new Date(saleEndsAt).toISOString() : null),
        is_express_demo: false,
        order_bump_product_id: orderBumpProductId || null,
        order_bump_discount_percent: orderBumpDiscount ? parseFloat(orderBumpDiscount) : null,
        upsell_product_ids: upsellProductIds.length > 0 ? upsellProductIds : null,
        facebook_pixel_id: fbPixel.trim() || null,
        tiktok_pixel_id: ttPixel.trim() || null,
        google_tag_id: gTag.trim() || null,
        seo_title: seoTitle.trim() || null,
        seo_description: seoDescription.trim() || null,
      };
      let error;
      let resultData: any;
      if (isEdit) {
        ({ error } = await db.from('digital_products').update(payload).eq('id', id));
      } else {
        const res = await db.from('digital_products').insert(payload as any).select('id, slug').single();
        error = res.error;
        resultData = res.data;
      }
      if (error) throw error;

      // Link back to AI Studio project if created from studio
      if (!isEdit && resultData && studioState?.studioProjectId) {
        await db.from('ai_content_projects').update({
          linked_product_id: resultData.id,
          status: 'published',
          published_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }).eq('id', studioState.studioProjectId);
      }
      if (!isEdit && resultData && payload.is_published) {
        onContentPublished(currentOrg.id, currentOrg.name, 'product', payload.title, resultData.id, { price: String(payload.price || 0), currency: payload.currency, slug: resultData.slug || '' }, user.id);
      }
      if (isEdit && item) {
        if (!item.is_published && payload.is_published) onContentPublished(currentOrg.id, currentOrg.name, 'product', payload.title, id!, { price: String(payload.price || 0), currency: payload.currency, slug: (item as any).slug || '' }, user.id);
        if (item.is_published && !payload.is_published) onContentUnpublished(currentOrg.id, currentOrg.name, 'product', payload.title);
        if (item.price !== payload.price && payload.is_published) onProductPriceChanged(currentOrg.id, currentOrg.name, payload.title, item.price || 0, payload.price, payload.currency);
      }
      const productIdForPreview = isEdit ? id : resultData?.id;
      if (productIdForPreview && payload.file_url) {
        const { data: { session } } = await db.auth.getSession();
        if (session?.access_token) {
          fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-preview`, {
            method: 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${session.access_token}` },
            body: JSON.stringify({ product_id: productIdForPreview }),
          }).catch(() => {});
        }
      }
      if (isEdit) {
        qc.invalidateQueries({ queryKey: ['org-products'] });
        qc.invalidateQueries({ queryKey: ['product-item', id] });
        toast({ title: 'Mis à jour ✅' }); navigate('/admin/products');
      }
      else if (resultData) { setCreatedProduct({ id: resultData.id, slug: resultData.slug }); }
      else { navigate('/admin/products'); }
    } catch (err: any) {
      toast({ title: 'Erreur', description: err.message, variant: 'destructive' });
    } finally { setLoading(false); }
  };

  const productUrl = isEdit && currentOrg?.slug && id ? getPublicUrl(`/org/${currentOrg.slug}/product/${id}`) : null;
  const getProductShortLink = async (path: string) => {
    try { return await getOrCreateShortLink({ targetPath: path, title: watch('title') || 'Product' }); }
    catch { return buildSocialShareUrl({ targetUrl: `${window.location.origin}${path}`, title: watch('title') || 'Product' }); }
  };
  const copyLink = async () => { if (productUrl) { const url = await getProductShortLink(`/org/${currentOrg?.slug}/product/${id}`); navigator.clipboard.writeText(url); toast({ title: isFr ? 'Lien copié ✅' : 'Link copied ✅' }); } };
  const shareLink = async () => { if (productUrl) { const url = await getProductShortLink(`/org/${currentOrg?.slug}/product/${id}`); if (navigator.share) navigator.share({ title: watch('title'), url }); else { navigator.clipboard.writeText(url); toast({ title: isFr ? 'Lien copié ✅' : 'Link copied ✅' }); } } };

  // Loading state for edit mode
  if (isEdit && isLoadingItem) {
    return (
      <AdminPageShell title={isFr ? 'Chargement…' : 'Loading…'} backRoute="/admin/products">
        <div className="flex items-center justify-center min-h-[40dvh]">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AdminPageShell>
    );
  }

  // Product not found or error
  if (isEdit && !isLoadingItem && (!item || isItemError)) {
    return (
      <AdminPageShell title={isFr ? 'Produit introuvable' : 'Product not found'} backRoute="/admin/products">
        <div className="flex flex-col items-center justify-center min-h-[40dvh] gap-4 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <p className="text-muted-foreground">{isFr ? "Ce produit n'existe pas ou vous n'avez pas les droits pour y accéder." : "This product doesn't exist or you don't have access."}</p>
          <Button onClick={() => navigate('/admin/products')}>{isFr ? 'Retour à la boutique' : 'Back to store'}</Button>
        </div>
      </AdminPageShell>
    );
  }

  // Success screen
  if (createdProduct) {
    const newProductPath = `/org/${currentOrg?.slug}/product/${createdProduct.id}`;
    const newProductShareUrl = buildShareUrlForPath(newProductPath);
    const copyNewLink = async () => { const url = await getProductShortLink(newProductPath); navigator.clipboard.writeText(url); toast({ title: isFr ? 'Lien copié ✅' : 'Link copied ✅' }); };
    const shareNewLink = async () => { const url = await getProductShortLink(newProductPath); if (navigator.share) navigator.share({ title: watch('title'), url }); else { navigator.clipboard.writeText(url); toast({ title: isFr ? 'Lien copié ✅' : 'Link copied ✅' }); } };
    return (
      <AdminPageShell title={isFr ? 'Produit créé !' : 'Product created!'} backRoute="/admin/products">
        <div className="max-w-md mx-auto text-center space-y-6 py-8">
          <div className="h-16 w-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto"><CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" /></div>
          <div><h2 className="text-xl font-bold">{isFr ? 'Produit créé avec succès !' : 'Product created successfully!'}</h2><p className="text-sm text-muted-foreground mt-1">{isFr ? 'Votre produit est prêt. Partagez-le avec votre audience.' : 'Your product is ready. Share it with your audience.'}</p></div>
          <div className="bg-muted/50 border border-border rounded-xl p-3 text-left">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">{isFr ? 'Lien du produit' : 'Product link'}</p>
            <div className="flex items-center gap-2"><p className="text-xs font-mono text-foreground truncate flex-1">{newProductShareUrl}</p><Button size="sm" variant="ghost" className="h-7 w-7 p-0 shrink-0" onClick={copyNewLink}><Copy className="h-3.5 w-3.5" /></Button></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button variant="outline" className="gap-2" onClick={() => window.open(newProductShareUrl, '_blank')}><Eye className="h-4 w-4" /> {isFr ? 'Voir le produit' : 'View product'}</Button>
            <Button variant="outline" className="gap-2" onClick={shareNewLink}><Share2 className="h-4 w-4" /> {isFr ? 'Partager' : 'Share'}</Button>
            <Button className="gap-2 bg-primary text-primary-foreground" onClick={() => { setCreatedProduct(null); reset({ product_type: 'pdf', price: 0, is_free: false, is_published: true }); }}><Plus className="h-4 w-4" /> {isFr ? 'Nouveau produit' : 'New product'}</Button>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('/admin/products')}>{isFr ? '← Retour à la boutique' : '← Back to store'}</Button>
        </div>
      </AdminPageShell>
    );
  }

  const applyProductTemplate = (tpl: ProductTemplate) => {
    setValue('title', tpl.fields.title);
    setValue('description', tpl.fields.description);
    setValue('product_type', tpl.fields.product_type as any);
    setValue('price', tpl.fields.price);
    setValue('is_free', tpl.fields.is_free);
    if (tpl.fields.guarantee_text) setValue('guarantee_text', tpl.fields.guarantee_text);
    setShowTemplates(false);
  };

  return (
    <AdminPageShell title={isEdit ? (isFr ? 'Modifier le produit' : 'Edit product') : (isFr ? 'Nouveau produit' : 'New product')} backRoute="/admin/products">
      {!isEdit && (<ContentTemplateSelector type="product" open={showTemplates} onClose={() => setShowTemplates(false)} onSelect={(tpl) => applyProductTemplate(tpl as ProductTemplate)} />)}
      {!isEdit && !showTemplates && (<div className="mb-4"><Button variant="outline" size="sm" onClick={() => setShowTemplates(true)} className="gap-1.5 text-xs"><Sparkles className="h-3.5 w-3.5" /> {isFr ? 'Utiliser un modèle' : 'Use a template'}</Button></div>)}
      {productUrl && (
        <div className="mb-4 p-3 rounded-xl bg-muted/50 border border-border space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium shrink-0">{isFr ? 'Lien produit :' : 'Product link:'}</span>
            <a href={productUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline truncate max-w-[260px]">{productUrl}</a>
            <div className="flex gap-1 ml-auto shrink-0">
              <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={copyLink}><Copy className="h-3.5 w-3.5" /></Button>
              <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => window.open(productUrl, '_blank')}><ExternalLink className="h-3.5 w-3.5" /></Button>
              <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={shareLink}><Share2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => window.open(productUrl, '_blank')}>
              <Eye className="h-4 w-4" /> {isFr ? 'Prévisualiser' : 'Preview'}
            </Button>
            <PrintableQRCode
              productTitle={watch('title') || ''}
              productUrl={productUrl}
              coverImageUrl={watch('cover_image_url')}
              orgName={currentOrg?.name}
              price={watch('price')}
              currency={currentOrg?.currency || 'XOF'}
            />
          </div>
        </div>
      )}

      {/* AI Assistants */}
      <AIWritingAssistant open={showAI} onClose={() => setShowAI(false)} onInsert={(html) => { const existing = (watch('description') || '').replace(/^(\s*<p>\s*(<br\s*\/?>)?\s*<\/p>\s*)+$/gi, '').trim(); setValue('description', existing ? existing + html : html, { shouldDirty: true, shouldTouch: true }); }} context={isFr ? 'description de produit numérique' : 'digital product description'} />
      

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Label>{isFr ? 'Titre du produit *' : 'Product title *'}</Label>
            <ContextTip tipKey="product_title" />
          </div>
          <Input {...register('title')} placeholder={isFr ? 'Ex: Guide d\'étude biblique Vol. 1' : 'E.g. Bible Study Guide Vol. 1'} />
          {errors.title && <p className="text-xs text-destructive">{errors.title.message}</p>}
        </div>
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Label>Description</Label>
            <ContextTip tipKey="product_description" />
          </div>
          <RichTextEditor
            value={watch('description') || ''}
            onChange={(html) => setValue('description', html)}
            placeholder={isFr ? 'Décrivez votre produit en détail...' : 'Describe your product in detail...'}
            onAIAssist={() => setShowAI(true)}
          />
          {/* AI description via "Aide IA" button in toolbar above */}
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label>Type</Label>
            <Select value={watch('product_type') || 'pdf'} onValueChange={v => setValue('product_type', v as any)}>
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
            <div className="flex items-center gap-1.5">
              <Label>{isFr ? `Prix (${effectiveCurrency})` : `Price (${effectiveCurrency})`}</Label>
              <ContextTip tipKey="product_price" />
            </div>
            <Input type="number" {...register('price')} disabled={isFree || watch('is_pwyw')} placeholder="Ex: 5000" className={watch('is_pwyw') ? 'opacity-50 cursor-not-allowed' : ''} />
            {watch('is_pwyw') && <p className="text-[11px] text-amber-600">💰 {isFr ? '"Prix libre" est activé — le prix ci-dessus sert de prix suggéré.' : '"Pay What You Want" is active — the price above is used as suggested price.'}</p>}
            {!isFree && !watch('is_pwyw') && <SuggestedPriceHint productType={watch('product_type') || 'pdf'} />}
          </div>
        </div>

        {/* Per-product currency & commission override */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{isFr ? 'Devise du produit' : 'Product currency'}</Label>
            <CurrencySelector
              value={effectiveCurrency}
              onChange={(v) => setProductCurrency(v === (currentOrg?.currency || 'XOF') ? '' : v)}
              className="h-9"
            />
            {productCurrency && productCurrency !== (currentOrg?.currency || 'XOF') && (
              <p className="text-[10px] text-muted-foreground">
                {isFr ? `Différent de la devise org (${currentOrg?.currency || 'XOF'})` : `Different from org currency (${currentOrg?.currency || 'XOF'})`}
              </p>
            )}
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{isFr ? 'Commission ambassadeur (%)' : 'Ambassador commission (%)'}</Label>
            <Input
              type="number"
              min={0}
              max={50}
              value={productCommissionRate}
              onChange={e => setProductCommissionRate(e.target.value)}
              placeholder={`${isFr ? 'Défaut org' : 'Org default'}: ${currentOrg?.affiliation_commission_percent ?? 10}%`}
              className="h-9 text-xs"
            />
            <p className="text-[10px] text-muted-foreground">
              {isFr ? 'Laissez vide pour utiliser le taux par défaut de l\'organisation.' : 'Leave empty to use the organization default rate.'}
            </p>
          </div>
        </div>

        {/* Flash Sale — disabled when PWYW is active or no price */}
        {!isFree && (() => {
          const currentPrice = watch('price') || 0;
          const hasNoPrice = currentPrice <= 0;
          const isPwyw = watch('is_pwyw');
          const isDisabled = isPwyw || hasNoPrice;
          return (
            <div className={cn('bg-destructive/5 border border-destructive/20 rounded-xl p-4 space-y-3', isDisabled && 'opacity-40 pointer-events-none')}>
              <p className="text-sm font-semibold flex items-center gap-2">🔥 {isFr ? 'Vente Flash' : 'Flash Sale'}</p>
              {isPwyw && (
                <p className="text-[10px] text-muted-foreground italic">{isFr ? 'Désactivé lorsque "Pay What You Want" est actif.' : 'Disabled when "Pay What You Want" is active.'}</p>
              )}
              {hasNoPrice && !isPwyw && (
                <p className="text-[10px] text-muted-foreground italic">{isFr ? 'Ajoutez un prix au produit pour activer la vente flash.' : 'Add a price to the product to enable flash sale.'}</p>
              )}
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label className="text-xs">{isFr ? `Prix promo (${effectiveCurrency})` : `Sale price (${effectiveCurrency})`}</Label>
                  <Input type="number" value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder={isFr ? 'Ex: 2500' : 'E.g. 2500'} className="h-8 text-xs" disabled={isDisabled} />
                </div>
                <div className="space-y-1.5">
                  <Label className="text-xs">{isFr ? 'Fin de la promo' : 'Sale ends'}</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button variant="outline" className={cn('h-8 text-xs w-full justify-start text-left font-normal', !saleEndsAt && 'text-muted-foreground')} disabled={isDisabled || !salePrice}>
                        <CalendarIcon className="mr-2 h-3 w-3" />
                        {saleEndsAt ? format(new Date(saleEndsAt), 'dd/MM/yyyy HH:mm') : (isFr ? 'Choisir une date' : 'Pick a date')}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <Calendar
                        mode="single"
                        selected={saleEndsAt ? new Date(saleEndsAt) : undefined}
                        onSelect={(date) => {
                          if (date) {
                            // Keep the time part or default to end of day
                            const existing = saleEndsAt ? new Date(saleEndsAt) : null;
                            const hours = existing ? existing.getHours() : 23;
                            const mins = existing ? existing.getMinutes() : 59;
                            date.setHours(hours, mins, 0, 0);
                            setSaleEndsAt(date.toISOString().slice(0, 16));
                          } else {
                            setSaleEndsAt('');
                          }
                        }}
                        disabled={(date) => date < new Date()}
                        initialFocus
                        className="p-3 pointer-events-auto"
                      />
                      <div className="p-3 border-t flex items-center gap-2">
                        <Label className="text-xs">{isFr ? 'Heure' : 'Time'}:</Label>
                        <Input
                          type="time"
                          value={saleEndsAt ? saleEndsAt.slice(11, 16) : '23:59'}
                          onChange={e => {
                            if (saleEndsAt) {
                              setSaleEndsAt(saleEndsAt.slice(0, 11) + e.target.value);
                            }
                          }}
                          className="h-7 text-xs w-24"
                        />
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
              <p className="text-[10px] text-muted-foreground">{isFr ? 'Laissez vide pour désactiver.' : 'Leave empty to disable.'}</p>
            </div>
          );
        })()}

        {/* Pay What You Want */}
        {!isFree && (() => {
          const pwywCurrency = effectiveCurrency;
          const minFloors: Record<string, number> = { XOF: 500, XAF: 500, NGN: 500, USD: 1, EUR: 1, GBP: 1, GHS: 5, KES: 100, ZAR: 10, MAD: 10, TND: 3 };
          const pwywFloor = minFloors[pwywCurrency] || 500;

          return (
            <div className="bg-accent/30 border border-accent/50 rounded-xl p-4 space-y-3">
              <div className="flex items-center gap-2">
                <Switch checked={watch('is_pwyw')} onCheckedChange={v => {
                  setValue('is_pwyw', v);
                  if (v) {
                    const current = watch('min_price') || 0;
                    if (current < pwywFloor) setValue('min_price', pwywFloor);
                    // Clear flash sale fields when enabling PWYW
                    setSalePrice('');
                    setSaleEndsAt('');
                  }
                }} />
                <Label className="text-sm font-semibold cursor-pointer">💰 Pay What You Want</Label>
              </div>
              {watch('is_pwyw') && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">{isFr ? "L'acheteur choisit le montant qu'il souhaite payer, au-dessus du prix minimum." : 'The buyer chooses the amount they want to pay, above the minimum price.'}</p>
                  <div className="space-y-1.5">
                    <Label className="text-xs">{isFr ? `Prix minimum (${pwywCurrency})` : `Minimum price (${pwywCurrency})`}</Label>
                    <Input
                      type="number"
                      min={pwywFloor}
                      value={watch('min_price') ?? pwywFloor}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setValue('min_price', val < pwywFloor ? pwywFloor : val);
                      }}
                      placeholder={`Min: ${pwywFloor}`}
                      className="h-8 text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      {isFr
                        ? `Minimum : ${pwywFloor.toLocaleString('fr-FR')} ${pwywCurrency}. Le prix du produit ci-dessus sera utilisé comme prix suggéré.`
                        : `Minimum: ${pwywFloor.toLocaleString('en-US')} ${pwywCurrency}. The product price above will be used as suggested price.`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          );
        })()}


        <div className="space-y-2">
          {(() => {
            const pt = watch('product_type');
            const coverHints: Record<string, { hint: string; aspect: 'square' | 'video' | 'banner' | 'free' | 'book' }> = isFr ? {
              pdf: { hint: 'Couverture livre: 1000×1600px (2:3 portrait)', aspect: 'book' },
              ebook: { hint: 'Couverture eBook: 1000×1600px (2:3 portrait)', aspect: 'book' },
              audio: { hint: 'Pochette: 3000×3000px (1:1 carré)', aspect: 'square' },
              video: { hint: 'Couverture vidéo: 1280×720px (16:9)', aspect: 'video' },
              course: { hint: 'Couverture cours: 1280×720px (16:9)', aspect: 'video' },
              other: { hint: '1280×720px (16:9) ou 1000×1600px (2:3)', aspect: 'free' },
            } : {
              pdf: { hint: 'Book cover: 1000×1600px (2:3 portrait)', aspect: 'book' },
              ebook: { hint: 'eBook cover: 1000×1600px (2:3 portrait)', aspect: 'book' },
              audio: { hint: 'Artwork: 3000×3000px (1:1 square)', aspect: 'square' },
              video: { hint: 'Video cover: 1280×720px (16:9)', aspect: 'video' },
              course: { hint: 'Course cover: 1280×720px (16:9)', aspect: 'video' },
              other: { hint: '1280×720px (16:9) or 1000×1600px (2:3)', aspect: 'free' },
            };
            const cfg = coverHints[pt] || coverHints.other;
            return (
              <div className="space-y-2">
                <ImageUploader value={watch('cover_image_url') || ''} onChange={(url) => setValue('cover_image_url', url)} folder="products" label={isFr ? 'Image de couverture' : 'Cover image'} hint={cfg.hint} aspectRatio={cfg.aspect} />
                {isEdit && item?.id && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    disabled={regeneratingCover}
                    className="gap-2 text-xs"
                    onClick={async () => {
                      setRegeneratingCover(true);
                      try {
                        const { data, error } = await supabase.functions.invoke('ai-generate-cover', {
                          body: {
                            product_id: item.id,
                            title: watch('title') || item.title,
                            product_type: watch('product_type'),
                            description: (watch('description') || '').slice(0, 300),
                            author_name: currentOrg?.name || '',
                            book_style: item.product_type || 'ebook',
                          },
                        });
                        if (error) throw error;
                        if (data?.error) throw new Error(data.error);
                        if (data?.cover_url) {
                          setValue('cover_image_url', data.cover_url);
                          toast({ title: isFr ? '✅ Couverture générée' : '✅ Cover generated' });
                        }
                      } catch (err: any) {
                        toast({ title: isFr ? '❌ Erreur' : '❌ Error', description: err.message, variant: 'destructive' });
                      } finally {
                        setRegeneratingCover(false);
                      }
                    }}
                  >
                    {regeneratingCover ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
                    {regeneratingCover
                      ? (isFr ? 'Génération en cours…' : 'Generating…')
                      : (isFr ? 'Générer une couverture avec l\'IA' : 'Generate cover with AI')}
                  </Button>
                )}
              </div>
            );
          })()}
        </div>

        <FileUploader value={watch('file_url') || ''} onChange={(url) => setValue('file_url', url)} folder="products" label={isFr ? 'Fichier du produit' : 'Product file'} hint={isFr ? 'PDF, Word, Audio, Vidéo (max 50 Mo)' : 'PDF, Word, Audio, Video (max 50 MB)'} accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.epub,.zip,.mp3,.mp4,.wav,.aac,.m4a,.ogg,.webm,.mov,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.ms-powerpoint,application/vnd.ms-excel,application/epub+zip,application/zip,audio/*,video/*" bucket="private-products" />

        {/* Regenerate PDF for AI products */}
        {isEdit && (item?.ai_generated || item?.ai_project_id) && currentOrg?.id && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> {isFr ? 'Produit généré par IA' : 'AI-generated product'}
            </p>
            <p className="text-xs text-muted-foreground">
              {isFr
                ? 'Si vous avez modifié la couverture ou le contenu, vous pouvez régénérer le PDF. Le nouveau fichier remplacera l\'ancien.'
                : 'If you modified the cover or content, you can regenerate the PDF. The new file will replace the old one.'}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              className="gap-2"
              disabled={regeneratingPdf}
              onClick={async () => {
                setRegeneratingPdf(true);
                try {
                  // Try to resolve the project ID: direct link, or lookup by linked_product_id
                  let projectId = item?.ai_project_id;
                  if (!projectId && item?.id) {
                    const { data: linkedProject } = await supabase
                      .from('ai_content_projects')
                      .select('id')
                      .eq('linked_product_id', item.id)
                      .order('created_at', { ascending: false })
                      .limit(1)
                      .maybeSingle();
                    projectId = linkedProject?.id || null;
                  }

                  if (!projectId) {
                    toast({
                      title: isFr ? 'Source IA introuvable' : 'AI source not found',
                      description: isFr
                        ? "Impossible de retrouver le projet source. Veuillez téléverser un nouveau PDF manuellement."
                        : 'Could not find the source project. Please upload a new PDF manually.',
                      variant: 'destructive',
                    });
                    return;
                  }

                  const { data: pdfData, error: pdfError } = await supabase.functions.invoke('ai-generate-pdf', {
                    body: {
                      org_id: currentOrg.id,
                      project_id: projectId,
                      product_id: item.id,
                      format: 'ebook',
                      page_size: 'A4',
                    },
                  });
                  if (pdfError) throw pdfError;
                  if (pdfData?.error) throw new Error(pdfData.error);
                  if (pdfData?.download_url) {
                    setValue('file_url', pdfData.download_url, { shouldDirty: true });
                    toast({ title: isFr ? '✅ PDF régénéré avec succès !' : '✅ PDF regenerated successfully!' });
                  } else {
                    throw new Error(isFr ? 'Aucune URL retournée' : 'No URL returned');
                  }
                } catch (err: any) {
                  toast({ title: isFr ? '❌ Erreur de régénération' : '❌ Regeneration error', description: err.message, variant: 'destructive' });
                } finally {
                  setRegeneratingPdf(false);
                }
              }}
            >
              {regeneratingPdf ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> {isFr ? 'Régénération en cours…' : 'Regenerating…'}</>
              ) : (
                <><RefreshCw className="h-4 w-4" /> {isFr ? 'Joindre / Régénérer le PDF' : 'Attach / Regenerate PDF'}</>
              )}
            </Button>
          </div>
        )}


        <div className="space-y-1.5">
          <Label>{isFr ? 'Lien externe (optionnel)' : 'External link (optional)'}</Label>
          <Input {...register('external_link')} placeholder="https://..." />
          {errors.external_link && <p className="text-xs text-destructive">{errors.external_link.message}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-6">
          {(() => { const priceVal = Number(watch('price')) || 0; const saleVal = parseFloat(salePrice) || 0; const hasPricing = watch('is_pwyw') || priceVal > 0 || saleVal > 0; const isAi = !!(studioState || item?.ai_generated); return <div className="flex items-center gap-2"><Switch checked={watch('is_free')} disabled={hasPricing} onCheckedChange={v => { if (v && isAi) { toast({ title: isFr ? 'Non autorisé' : 'Not allowed', description: isFr ? 'Les produits générés par IA ne peuvent pas être gratuits.' : 'AI-generated products cannot be free.', variant: 'destructive' }); return; } setValue('is_free', v); }} /><Label className={cn('text-sm cursor-pointer', hasPricing && 'opacity-50')}>{isFr ? 'Gratuit' : 'Free'}</Label>{hasPricing && <span className="text-[10px] text-muted-foreground">{isFr ? '(désactivé — un prix est défini)' : '(disabled — a price is set)'}</span>}{isAi && <span className="text-[10px] text-amber-500 ml-1">🤖 AI</span>}</div>; })()}
          <div className="flex items-center gap-2"><Switch checked={watch('is_published')} onCheckedChange={v => setValue('is_published', v)} /><Label className="text-sm cursor-pointer">{isFr ? 'Publié' : 'Published'}</Label></div>
          <div className="flex items-center gap-2"><Switch checked={watch('is_bundle')} onCheckedChange={v => setValue('is_bundle', v)} /><Label className="text-sm cursor-pointer flex items-center gap-1"><PackagePlus className="h-3.5 w-3.5" /> Bundle</Label></div>
        </div>

        {/* Guarantee */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> {isFr ? 'Garantie (optionnel)' : 'Guarantee (optional)'}</Label>
          <Textarea {...register('guarantee_text')} rows={2} placeholder={isFr ? 'Ex: Satisfait ou remboursé sous 30 jours' : 'E.g. 30-day money-back guarantee'} />
        </div>

        {/* Tracking Pixels */}
        <div className="space-y-3 border border-border rounded-xl p-4">
          <p className="text-sm font-semibold flex items-center gap-2">📊 {isFr ? 'Pixels de tracking (optionnel)' : 'Tracking pixels (optional)'}</p>
          <p className="text-[10px] text-muted-foreground">{isFr ? 'Ajoutez vos pixels pour suivre les conversions et faire du retargeting sur ce produit spécifique.' : 'Add your pixels to track conversions and retarget for this specific product.'}</p>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="space-y-1">
              <Label className="text-xs font-medium">Facebook Pixel ID</Label>
              <Input value={fbPixel} onChange={e => setFbPixel(e.target.value)} placeholder="123456789012345" className="h-8 text-xs font-mono" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">TikTok Pixel ID</Label>
              <Input value={ttPixel} onChange={e => setTtPixel(e.target.value)} placeholder="ABCDEF123456" className="h-8 text-xs font-mono" />
            </div>
            <div className="space-y-1">
              <Label className="text-xs font-medium">Google Tag ID</Label>
              <Input value={gTag} onChange={e => setGTag(e.target.value)} placeholder="G-XXXXXXXXXX" className="h-8 text-xs font-mono" />
            </div>
          </div>
        </div>

        {/* SEO Settings */}
        <div className="space-y-3 border border-border rounded-xl p-4">
          <p className="text-sm font-semibold flex items-center gap-2">🔍 SEO & Référencement</p>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label className="text-xs">Titre SEO <Badge variant="outline" className={`text-[10px] border-0 ml-1 ${seoTitle.length > 60 ? 'text-amber-600' : 'text-muted-foreground'}`}>{seoTitle.length}/60</Badge></Label>
              <Input value={seoTitle} onChange={e => setSeoTitle(e.target.value)} placeholder={watch('title') || 'Titre optimisé pour Google'} className="h-8 text-xs" maxLength={70} />
            </div>
            <div className="space-y-1">
              <Label className="text-xs">Description SEO <Badge variant="outline" className={`text-[10px] border-0 ml-1 ${seoDescription.length > 160 ? 'text-amber-600' : 'text-muted-foreground'}`}>{seoDescription.length}/160</Badge></Label>
              <Textarea value={seoDescription} onChange={e => setSeoDescription(e.target.value)} placeholder="Décrivez votre produit pour les moteurs de recherche..." className="text-xs min-h-[50px]" maxLength={170} />
            </div>
            {/* Google Preview */}
            <div className="bg-background border border-border rounded-lg p-3 space-y-0.5">
              <p className="text-[10px] text-muted-foreground">Aperçu Google</p>
              <p className="text-sm text-blue-600 font-medium truncate">{seoTitle || watch('title') || 'Titre du produit'}</p>
              <p className="text-xs text-muted-foreground line-clamp-2">{seoDescription || 'Description de votre produit...'}</p>
            </div>
          </div>
        </div>

        {/* Order Bump & Upsells */}
        {isEdit && !isFree && (
          <div className="space-y-3 border border-amber-500/20 bg-amber-500/5 rounded-xl p-4">
            <p className="text-sm font-semibold flex items-center gap-2">🚀 Upsell & Order Bump</p>
            
            {/* Order Bump */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">{isFr ? 'Order Bump (ajout au panier)' : 'Order Bump (add to cart)'}</Label>
              <p className="text-[10px] text-muted-foreground">{isFr ? 'Proposer un produit complémentaire à prix réduit lors du checkout.' : 'Offer a complementary product at a discount during checkout.'}</p>
              <div className="grid grid-cols-2 gap-2">
                <Select value={orderBumpProductId || '_none'} onValueChange={(v) => setOrderBumpProductId(v === '_none' ? '' : v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder={isFr ? 'Aucun' : 'None'} /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">{isFr ? 'Aucun' : 'None'}</SelectItem>
                    {allProducts.filter((p: any) => p.id !== id && !p.is_free).map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.title} — {p.price?.toLocaleString()} {currentOrg?.currency || 'XOF'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="space-y-1">
                  <Input type="number" value={orderBumpDiscount} onChange={e => setOrderBumpDiscount(e.target.value)} placeholder={isFr ? 'Réduction %' : 'Discount %'} className="h-8 text-xs" min={0} max={90} />
                </div>
              </div>
            </div>

            {/* Upsells */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">{isFr ? 'Upsells (après achat)' : 'Upsells (after purchase)'}</Label>
              <p className="text-[10px] text-muted-foreground">{isFr ? 'Proposer ces produits après un achat réussi.' : 'Suggest these products after a successful purchase.'}</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {upsellProductIds.map(uid => {
                  const p = allProducts.find((p: any) => p.id === uid);
                  return (
                    <Badge key={uid} variant="secondary" className="text-[10px] gap-1 cursor-pointer" onClick={() => setUpsellProductIds(prev => prev.filter(x => x !== uid))}>
                      {p?.title || uid} ✕
                    </Badge>
                  );
                })}
              </div>
              <Select value="" onValueChange={v => { if (v && !upsellProductIds.includes(v)) setUpsellProductIds(prev => [...prev, v]); }}>
                <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Ajouter un upsell" /></SelectTrigger>
                <SelectContent>
                  {allProducts.filter((p: any) => p.id !== id && !upsellProductIds.includes(p.id)).map((p: any) => (
                    <SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="space-y-2 border border-border rounded-xl p-4">
          <Label className="flex items-center gap-1 text-sm font-semibold"><HelpCircle className="h-3.5 w-3.5" /> {isFr ? 'FAQ du produit' : 'Product FAQ'}</Label>
          {faqItems.map((faq, i) => (
            <div key={i} className="flex items-start gap-2 bg-muted/50 rounded-lg p-2">
              <div className="flex-1 min-w-0"><p className="text-xs font-semibold">{faq.q}</p><p className="text-xs text-muted-foreground">{faq.a}</p></div>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setFaqItems(prev => prev.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
          <div className="grid gap-2">
            <Input placeholder={isFr ? 'Question' : 'Question'} value={newFaq.q} onChange={e => setNewFaq(f => ({ ...f, q: e.target.value }))} className="h-8 text-xs" />
            <Input placeholder={isFr ? 'Réponse' : 'Answer'} value={newFaq.a} onChange={e => setNewFaq(f => ({ ...f, a: e.target.value }))} className="h-8 text-xs" />
            <Button type="button" variant="outline" size="sm" className="w-fit gap-1" onClick={() => { if (newFaq.q && newFaq.a) { setFaqItems(prev => [...prev, { ...newFaq }]); setNewFaq({ q: '', a: '' }); } }}><Plus className="h-3 w-3" /> {isFr ? 'Ajouter' : 'Add'}</Button>
          </div>
        </div>

        {/* Testimonials */}
        <div className="space-y-2 border border-border rounded-xl p-4">
          <Label className="flex items-center gap-1 text-sm font-semibold"><MessageSquareQuote className="h-3.5 w-3.5" /> {isFr ? 'Témoignages' : 'Testimonials'}</Label>
          {testimonials.map((t, i) => (
            <div key={i} className="flex items-start gap-2 bg-muted/50 rounded-lg p-2">
              <div className="flex-1 min-w-0"><p className="text-xs font-semibold">{t.name}</p><p className="text-xs text-muted-foreground italic">"{t.text}"</p></div>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setTestimonials(prev => prev.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
          <div className="grid gap-2">
            <Input placeholder={isFr ? 'Nom du client' : 'Customer name'} value={newTestimonial.name} onChange={e => setNewTestimonial(t => ({ ...t, name: e.target.value }))} className="h-8 text-xs" />
            <Input placeholder={isFr ? 'Témoignage' : 'Testimonial'} value={newTestimonial.text} onChange={e => setNewTestimonial(t => ({ ...t, text: e.target.value }))} className="h-8 text-xs" />
            <Button type="button" variant="outline" size="sm" className="w-fit gap-1" onClick={() => { if (newTestimonial.name && newTestimonial.text) { setTestimonials(prev => [...prev, { ...newTestimonial }]); setNewTestimonial({ name: '', text: '' }); } }}><Plus className="h-3 w-3" /> {isFr ? 'Ajouter' : 'Add'}</Button>
          </div>
        </div>

        {/* Bundle Items */}
        {isEdit && watch('is_bundle') && (
          <div className="space-y-2 border border-primary/20 rounded-xl p-4">
            <Label className="flex items-center gap-1 text-sm font-semibold"><PackagePlus className="h-3.5 w-3.5 text-primary" /> {isFr ? 'Produits inclus dans le bundle' : 'Products included in bundle'}</Label>
            {bundleItems.map((bi: any) => (
              <div key={bi.id} className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
                <span className="text-xs font-medium flex-1">{bi.included_product?.title || bi.included_product_id}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeBundleItem.mutate({ id: bi.id, bundleProductId: id! })}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Select value={selectedBundleProduct} onValueChange={setSelectedBundleProduct}><SelectTrigger className="h-8 text-xs flex-1"><SelectValue placeholder={isFr ? 'Sélectionner un produit' : 'Select a product'} /></SelectTrigger><SelectContent>{allProducts.filter((p: any) => p.id !== id && !bundleItems.some((bi: any) => bi.included_product_id === p.id)).map((p: any) => (<SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>))}</SelectContent></Select>
              <Button type="button" variant="outline" size="sm" className="h-8 gap-1" onClick={() => { if (selectedBundleProduct) { addBundleItem.mutate({ bundleProductId: id!, includedProductId: selectedBundleProduct }); setSelectedBundleProduct(''); } }}><Plus className="h-3 w-3" /> {isFr ? 'Ajouter' : 'Add'}</Button>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {isEdit && (
          <div className="space-y-2 border border-border rounded-xl p-4">
            <Label className="flex items-center gap-1 text-sm font-semibold"><ArrowUpRight className="h-3.5 w-3.5" /> {isFr ? 'Produits recommandés' : 'Recommended products'}</Label>
            {recommendations.map((rec: any) => (
              <div key={rec.id} className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
                <Badge variant="outline" className="text-[10px] capitalize">{rec.recommendation_type}</Badge>
                <span className="text-xs font-medium flex-1">{rec.recommended_product?.title || rec.recommended_product_id}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeRecommendation.mutate({ id: rec.id, productId: id! })}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
            <div className="flex gap-2 flex-wrap">
              <Select value={recommendationType} onValueChange={setRecommendationType}><SelectTrigger className="h-8 text-xs w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="upsell">Upsell</SelectItem><SelectItem value="cross_sell">Cross-sell</SelectItem><SelectItem value="related">Related</SelectItem></SelectContent></Select>
              <Select value={selectedRecommendation} onValueChange={setSelectedRecommendation}><SelectTrigger className="h-8 text-xs flex-1"><SelectValue placeholder={isFr ? 'Sélectionner un produit' : 'Select a product'} /></SelectTrigger><SelectContent>{allProducts.filter((p: any) => p.id !== id && !recommendations.some((r: any) => r.recommended_product_id === p.id)).map((p: any) => (<SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>))}</SelectContent></Select>
              <Button type="button" variant="outline" size="sm" className="h-8 gap-1" onClick={() => { if (selectedRecommendation) { addRecommendation.mutate({ productId: id!, recommendedProductId: selectedRecommendation, type: recommendationType }); setSelectedRecommendation(''); } }}><Plus className="h-3 w-3" /> {isFr ? 'Ajouter' : 'Add'}</Button>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/products')}>{isFr ? 'Annuler' : 'Cancel'}</Button>
          <Button type="submit" className="bg-primary text-primary-foreground" disabled={loading}>{loading ? (isFr ? 'Enregistrement...' : 'Saving...') : isEdit ? (isFr ? 'Mettre à jour' : 'Update') : (isFr ? 'Créer' : 'Create')}</Button>
        </div>

        {isEdit && productUrl && (
          <div className="mt-6 space-y-4">
            <div className="flex items-center gap-2">
              <ContentVersionHistory contentId={id!} contentType="product" onRestore={(snapshot) => {
                if (snapshot.title) setValue('title', snapshot.title as string);
                if (snapshot.description) setValue('description', snapshot.description as string);
                if (snapshot.price !== undefined) setValue('price', snapshot.price as number);
              }} />
            </div>
            <EmbedSnippetGen productId={id!} orgSlug={currentOrg?.slug || ''} productTitle={watch('title')} price={watch('price') || 0} currency={currentOrg?.currency || 'XOF'} isFree={watch('is_free')} />
            <SocialSnippetsViewer productId={id!} orgId={currentOrg?.id || ''} />
            <ContextualFeedback context="post_publication" question="Comment s'est passée cette publication ?" />
          </div>
        )}
      </form>
    </AdminPageShell>
  );
}
