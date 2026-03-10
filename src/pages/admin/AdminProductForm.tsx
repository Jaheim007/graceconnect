import { useEffect, useState, useCallback } from 'react';
import { getOrCreateShortLink, buildSocialShareUrl } from '@/lib/shareMeta';
import { getPublicUrl } from '@/lib/publicUrl';
import { useNavigate, useParams, useLocation } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Copy, ExternalLink, Share2, CheckCircle, Plus, Eye, Trash2, PackagePlus, ArrowUpRight, HelpCircle, Shield, MessageSquareQuote, Sparkles, ImageIcon, AlertTriangle, RefreshCw, Loader2 } from 'lucide-react';
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
import { AIDescriptionButton } from '@/components/admin/AIDescriptionButton';
import { SocialSnippetsViewer } from '@/components/products/SocialSnippetsViewer';
import { SuggestedPriceHint } from '@/components/admin/SuggestedPriceHint';
import { ContextTip } from '@/components/admin/ContextualTooltips';
import { PrintableQRCode } from '@/components/sharing/PrintableQRCode';
import { ContentVersionHistory } from '@/components/admin/ContentVersionHistory';
import { ContextualFeedback } from '@/components/feedback/ContextualFeedback';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';


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
  const [orderBumpProductId, setOrderBumpProductId] = useState('');
  const [orderBumpDiscount, setOrderBumpDiscount] = useState('');
  const [upsellProductIds, setUpsellProductIds] = useState<string[]>([]);
  const [fbPixel, setFbPixel] = useState('');
  const [ttPixel, setTtPixel] = useState('');
  const [gTag, setGTag] = useState('');

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
      reset({
        title: item.title,
        description: item.description || '',
        product_type: (item.product_type || 'pdf') as any,
        price: item.price || 0,
        cover_image_url: item.cover_image_url || '',
        file_url: item.file_url || '',
        external_link: item.external_link || '',
        is_free: item.is_free || false,
        is_published: item.is_published || false,
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
        currency: currentOrg.currency || 'XOF',
        price: data.is_free ? 0 : data.price,
        is_pwyw: data.is_free ? false : data.is_pwyw,
        min_price: (() => {
          if (!data.is_pwyw || data.is_free) return null;
          const cur = currentOrg?.currency || 'XOF';
          const floors: Record<string, number> = { XOF: 500, XAF: 500, NGN: 500, USD: 1, EUR: 1, GBP: 1, GHS: 5, KES: 100, ZAR: 10, MAD: 10, TND: 3 };
          const floor = floors[cur] || 500;
          return Math.max(data.min_price || 0, floor);
        })(),
        cover_image_url: data.cover_image_url || null,
        file_url: data.file_url || null,
        external_link: data.external_link || null,
        guarantee_text: data.guarantee_text || null,
        faq_json: faqItems.length > 0 ? faqItems : [],
        testimonials_json: testimonials.length > 0 ? testimonials : [],
        sale_price: data.is_free ? null : (salePrice ? parseFloat(salePrice) : null),
        sale_ends_at: data.is_free ? null : (saleEndsAt ? new Date(saleEndsAt).toISOString() : null),
        is_express_demo: false,
        order_bump_product_id: orderBumpProductId || null,
        order_bump_discount_percent: orderBumpDiscount ? parseFloat(orderBumpDiscount) : null,
        upsell_product_ids: upsellProductIds.length > 0 ? upsellProductIds : null,
        facebook_pixel_id: fbPixel.trim() || null,
        tiktok_pixel_id: ttPixel.trim() || null,
        google_tag_id: gTag.trim() || null,
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
        onContentPublished(currentOrg.id, currentOrg.name, 'product', payload.title, resultData.id, { price: String(payload.price || 0), currency: payload.currency }, user.id);
      }
      if (isEdit && item) {
        if (!item.is_published && payload.is_published) onContentPublished(currentOrg.id, currentOrg.name, 'product', payload.title, id!, { price: String(payload.price || 0), currency: payload.currency }, user.id);
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
    try { return await getOrCreateShortLink({ targetPath: path, title: watch('title') || 'Produit Siteviral' }); }
    catch { return buildSocialShareUrl({ targetUrl: `${window.location.origin}${path}`, title: watch('title') || 'Produit Siteviral' }); }
  };
  const copyLink = async () => { if (productUrl) { const url = await getProductShortLink(`/org/${currentOrg?.slug}/product/${id}`); navigator.clipboard.writeText(url); toast({ title: 'Lien copié ✅' }); } };
  const shareLink = async () => { if (productUrl) { const url = await getProductShortLink(`/org/${currentOrg?.slug}/product/${id}`); if (navigator.share) navigator.share({ title: watch('title'), url }); else { navigator.clipboard.writeText(url); toast({ title: 'Lien copié ✅' }); } } };

  // Loading state for edit mode
  if (isEdit && isLoadingItem) {
    return (
      <AdminPageShell title="Chargement…" backRoute="/admin/products">
        <div className="flex items-center justify-center min-h-[40dvh]">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      </AdminPageShell>
    );
  }

  // Product not found or error
  if (isEdit && !isLoadingItem && (!item || isItemError)) {
    return (
      <AdminPageShell title="Produit introuvable" backRoute="/admin/products">
        <div className="flex flex-col items-center justify-center min-h-[40dvh] gap-4 text-center">
          <AlertTriangle className="h-10 w-10 text-destructive" />
          <p className="text-muted-foreground">Ce produit n'existe pas ou vous n'avez pas les droits pour y accéder.</p>
          <Button onClick={() => navigate('/admin/products')}>Retour à la boutique</Button>
        </div>
      </AdminPageShell>
    );
  }

  // Success screen
  if (createdProduct) {
    const newProductUrl = getPublicUrl(`/org/${currentOrg?.slug}/product/${createdProduct.id}`);
    const newProductPath = `/org/${currentOrg?.slug}/product/${createdProduct.id}`;
    const copyNewLink = async () => { const url = await getProductShortLink(newProductPath); navigator.clipboard.writeText(url); toast({ title: 'Lien copié ✅' }); };
    const shareNewLink = async () => { const url = await getProductShortLink(newProductPath); if (navigator.share) navigator.share({ title: watch('title'), url }); else { navigator.clipboard.writeText(url); toast({ title: 'Lien copié ✅' }); } };
    return (
      <AdminPageShell title="Produit créé !" backRoute="/admin/products">
        <div className="max-w-md mx-auto text-center space-y-6 py-8">
          <div className="h-16 w-16 rounded-full bg-green-500/15 flex items-center justify-center mx-auto"><CheckCircle className="h-8 w-8 text-green-600 dark:text-green-400" /></div>
          <div><h2 className="text-xl font-bold">Produit créé avec succès !</h2><p className="text-sm text-muted-foreground mt-1">Votre produit est prêt. Partagez-le avec votre audience.</p></div>
          <div className="bg-muted/50 border border-border rounded-xl p-3 text-left">
            <p className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1">Lien du produit</p>
            <div className="flex items-center gap-2"><p className="text-xs font-mono text-foreground truncate flex-1">{newProductUrl}</p><Button size="sm" variant="ghost" className="h-7 w-7 p-0 shrink-0" onClick={copyNewLink}><Copy className="h-3.5 w-3.5" /></Button></div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Button variant="outline" className="gap-2" onClick={() => window.open(newProductUrl, '_blank')}><Eye className="h-4 w-4" /> Voir le produit</Button>
            <Button variant="outline" className="gap-2" onClick={shareNewLink}><Share2 className="h-4 w-4" /> Partager</Button>
            <Button className="gap-2 bg-primary text-primary-foreground" onClick={() => { setCreatedProduct(null); reset({ product_type: 'pdf', price: 0, is_free: false, is_published: true }); }}><Plus className="h-4 w-4" /> Nouveau produit</Button>
          </div>
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground" onClick={() => navigate('/admin/products')}>← Retour à la boutique</Button>
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
    <AdminPageShell title={isEdit ? 'Modifier le produit' : 'Nouveau produit'} backRoute="/admin/products">
      {!isEdit && (<ContentTemplateSelector type="product" open={showTemplates} onClose={() => setShowTemplates(false)} onSelect={(tpl) => applyProductTemplate(tpl as ProductTemplate)} />)}
      {!isEdit && !showTemplates && (<div className="mb-4"><Button variant="outline" size="sm" onClick={() => setShowTemplates(true)} className="gap-1.5 text-xs"><Sparkles className="h-3.5 w-3.5" /> Utiliser un modèle</Button></div>)}
      {productUrl && (
        <div className="mb-4 p-3 rounded-xl bg-muted/50 border border-border space-y-2">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs text-muted-foreground font-medium shrink-0">Lien produit :</span>
            <a href={productUrl} target="_blank" rel="noreferrer" className="text-xs text-primary underline truncate max-w-[260px]">{productUrl}</a>
            <div className="flex gap-1 ml-auto shrink-0">
              <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={copyLink}><Copy className="h-3.5 w-3.5" /></Button>
              <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={() => window.open(productUrl, '_blank')}><ExternalLink className="h-3.5 w-3.5" /></Button>
              <Button type="button" size="sm" variant="ghost" className="h-7 w-7 p-0" onClick={shareLink}><Share2 className="h-3.5 w-3.5" /></Button>
            </div>
          </div>
          <div className="flex gap-2 flex-wrap">
            <Button type="button" variant="outline" size="sm" className="gap-2" onClick={() => window.open(productUrl, '_blank')}>
              <Eye className="h-4 w-4" /> Prévisualiser
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
      <AIWritingAssistant open={showAI} onClose={() => setShowAI(false)} onInsert={(html) => setValue('description', (watch('description') || '') + html, { shouldDirty: true, shouldTouch: true })} context="description de produit numérique" />
      

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
        <div className="space-y-1.5">
          <div className="flex items-center gap-1.5">
            <Label>Titre du produit *</Label>
            <ContextTip tipKey="product_title" />
          </div>
          <Input {...register('title')} placeholder="Ex: Guide d'étude biblique Vol. 1" />
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
            placeholder="Décrivez votre produit en détail..."
            onAIAssist={() => setShowAI(true)}
          />
          <AIDescriptionButton
            title={watch('title') || ''}
            productType={watch('product_type') || 'pdf'}
            price={watch('price') || 0}
            currency={currentOrg?.currency || 'XOF'}
            existingDescription={watch('description') || ''}
            onGenerated={(html) => setValue('description', html, { shouldDirty: true })}
          />
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
            <div className="flex items-center gap-1.5">
              <Label>Prix ({currentOrg?.currency || 'XOF'})</Label>
              <ContextTip tipKey="product_price" />
            </div>
            <Input type="number" {...register('price')} disabled={isFree} placeholder="Ex: 5000" />
            {!isFree && <SuggestedPriceHint productType={watch('product_type') || 'pdf'} />}
          </div>
        </div>

        {/* Flash Sale */}
        {!isFree && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-xl p-4 space-y-3">
            <p className="text-sm font-semibold flex items-center gap-2">🔥 Vente Flash</p>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs">Prix promo ({currentOrg?.currency || 'XOF'})</Label>
                <Input type="number" value={salePrice} onChange={e => setSalePrice(e.target.value)} placeholder="Ex: 2500" className="h-8 text-xs" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Fin de la promo</Label>
                <Input type="datetime-local" value={saleEndsAt} onChange={e => setSaleEndsAt(e.target.value)} className="h-8 text-xs" />
              </div>
            </div>
            <p className="text-[10px] text-muted-foreground">Laissez vide pour désactiver.</p>
          </div>
        )}

        {/* Pay What You Want */}
        {!isFree && (() => {
          const pwywCurrency = currentOrg?.currency || 'XOF';
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
                  }
                }} />
                <Label className="text-sm font-semibold cursor-pointer">💰 Pay What You Want</Label>
              </div>
              {watch('is_pwyw') && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">L'acheteur choisit le montant qu'il souhaite payer, au-dessus du prix minimum.</p>
                  <div className="space-y-1.5">
                    <Label className="text-xs">Prix minimum ({pwywCurrency})</Label>
                    <Input
                      type="number"
                      min={pwywFloor}
                      value={watch('min_price') || pwywFloor}
                      onChange={e => {
                        const val = Number(e.target.value);
                        setValue('min_price', val < pwywFloor ? pwywFloor : val);
                      }}
                      placeholder={`Min: ${pwywFloor}`}
                      className="h-8 text-xs"
                    />
                    <p className="text-[10px] text-muted-foreground">
                      Minimum : {pwywFloor.toLocaleString('fr-FR')} {pwywCurrency}. Le prix du produit ci-dessus sera utilisé comme prix suggéré.
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
            const coverHints: Record<string, { hint: string; aspect: 'square' | 'video' | 'banner' | 'free' | 'book' }> = {
              pdf: { hint: 'Couverture livre: 1000×1600px (2:3 portrait)', aspect: 'book' },
              ebook: { hint: 'Couverture eBook: 1000×1600px (2:3 portrait)', aspect: 'book' },
              audio: { hint: 'Pochette: 3000×3000px (1:1 carré)', aspect: 'square' },
              video: { hint: 'Couverture vidéo: 1280×720px (16:9)', aspect: 'video' },
              course: { hint: 'Couverture cours: 1280×720px (16:9)', aspect: 'video' },
              other: { hint: '1280×720px (16:9) ou 1000×1600px (2:3)', aspect: 'free' },
            };
            const cfg = coverHints[pt] || coverHints.other;
            return (
              <ImageUploader value={watch('cover_image_url') || ''} onChange={(url) => setValue('cover_image_url', url)} folder="products" label="Image de couverture" hint={cfg.hint} aspectRatio={cfg.aspect} />
            );
          })()}
        </div>

        <FileUploader value={watch('file_url') || ''} onChange={(url) => setValue('file_url', url)} folder="products" label="Fichier du produit" hint="PDF, Word, Audio, Vidéo (max 50 Mo)" accept=".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.epub,.zip,.mp3,.mp4,.wav,.aac,.m4a,.ogg,.webm,.mov,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,application/vnd.openxmlformats-officedocument.presentationml.presentation,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet,application/msword,application/vnd.ms-powerpoint,application/vnd.ms-excel,application/epub+zip,application/zip,audio/*,video/*" bucket="private-products" />

        {/* Regenerate PDF for AI products */}
        {isEdit && item?.ai_generated && item?.ai_project_id && currentOrg?.id && (
          <div className="bg-primary/5 border border-primary/20 rounded-xl p-4 space-y-2">
            <p className="text-sm font-semibold flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-primary" /> Produit généré par IA
            </p>
            <p className="text-xs text-muted-foreground">
              Si vous avez modifié la couverture ou le contenu, vous pouvez régénérer le PDF.
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
                  const { data: pdfData, error: pdfError } = await supabase.functions.invoke('ai-generate-pdf', {
                    body: {
                      org_id: currentOrg.id,
                      project_id: item.ai_project_id,
                      format: 'ebook',
                      page_size: 'A4',
                    },
                  });
                  if (pdfError) throw pdfError;
                  if (pdfData?.error) throw new Error(pdfData.error);
                  if (pdfData?.download_url) {
                    setValue('file_url', pdfData.download_url, { shouldDirty: true });
                    toast({ title: '✅ PDF régénéré avec succès !' });
                  } else {
                    throw new Error('Aucune URL retournée');
                  }
                } catch (err: any) {
                  toast({ title: '❌ Erreur de régénération', description: err.message, variant: 'destructive' });
                } finally {
                  setRegeneratingPdf(false);
                }
              }}
            >
              {regeneratingPdf ? (
                <><Loader2 className="h-4 w-4 animate-spin" /> Régénération en cours…</>
              ) : (
                <><RefreshCw className="h-4 w-4" /> Joindre / Régénérer le PDF</>
              )}
            </Button>
          </div>
        )}


        <div className="space-y-1.5">
          <Label>Lien externe (optionnel)</Label>
          <Input {...register('external_link')} placeholder="https://..." />
          {errors.external_link && <p className="text-xs text-destructive">{errors.external_link.message}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-6">
          <div className="flex items-center gap-2"><Switch checked={watch('is_free')} onCheckedChange={v => { const isAi = !!(studioState || item?.ai_generated); if (v && isAi) { toast({ title: 'Non autorisé', description: 'Les produits générés par IA ne peuvent pas être gratuits.', variant: 'destructive' }); return; } setValue('is_free', v); }} /><Label className="text-sm cursor-pointer">Gratuit</Label>{(studioState || item?.ai_generated) && <span className="text-[10px] text-amber-500 ml-1">🤖 IA</span>}</div>
          <div className="flex items-center gap-2"><Switch checked={watch('is_published')} onCheckedChange={v => setValue('is_published', v)} /><Label className="text-sm cursor-pointer">Publié</Label></div>
          <div className="flex items-center gap-2"><Switch checked={watch('is_bundle')} onCheckedChange={v => setValue('is_bundle', v)} /><Label className="text-sm cursor-pointer flex items-center gap-1"><PackagePlus className="h-3.5 w-3.5" /> Bundle</Label></div>
        </div>

        {/* Guarantee */}
        <div className="space-y-1.5">
          <Label className="flex items-center gap-1"><Shield className="h-3.5 w-3.5" /> Garantie (optionnel)</Label>
          <Textarea {...register('guarantee_text')} rows={2} placeholder="Ex: Satisfait ou remboursé sous 30 jours" />
        </div>

        {/* Tracking Pixels */}
        <div className="space-y-3 border border-border rounded-xl p-4">
          <p className="text-sm font-semibold flex items-center gap-2">📊 Pixels de tracking (optionnel)</p>
          <p className="text-[10px] text-muted-foreground">Ajoutez vos pixels pour suivre les conversions et faire du retargeting sur ce produit spécifique.</p>
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

        {/* Order Bump & Upsells */}
        {isEdit && !isFree && (
          <div className="space-y-3 border border-amber-500/20 bg-amber-500/5 rounded-xl p-4">
            <p className="text-sm font-semibold flex items-center gap-2">🚀 Upsell & Order Bump</p>
            
            {/* Order Bump */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Order Bump (ajout au panier)</Label>
              <p className="text-[10px] text-muted-foreground">Proposer un produit complémentaire à prix réduit lors du checkout.</p>
              <div className="grid grid-cols-2 gap-2">
                <Select value={orderBumpProductId || '_none'} onValueChange={(v) => setOrderBumpProductId(v === '_none' ? '' : v)}>
                  <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Aucun" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="_none">Aucun</SelectItem>
                    {allProducts.filter((p: any) => p.id !== id && !p.is_free).map((p: any) => (
                      <SelectItem key={p.id} value={p.id}>{p.title} — {p.price?.toLocaleString()} {currentOrg?.currency || 'XOF'}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <div className="space-y-1">
                  <Input type="number" value={orderBumpDiscount} onChange={e => setOrderBumpDiscount(e.target.value)} placeholder="Réduction %" className="h-8 text-xs" min={0} max={90} />
                </div>
              </div>
            </div>

            {/* Upsells */}
            <div className="space-y-2">
              <Label className="text-xs font-medium">Upsells (après achat)</Label>
              <p className="text-[10px] text-muted-foreground">Proposer ces produits après un achat réussi.</p>
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
          <Label className="flex items-center gap-1 text-sm font-semibold"><HelpCircle className="h-3.5 w-3.5" /> FAQ du produit</Label>
          {faqItems.map((faq, i) => (
            <div key={i} className="flex items-start gap-2 bg-muted/50 rounded-lg p-2">
              <div className="flex-1 min-w-0"><p className="text-xs font-semibold">{faq.q}</p><p className="text-xs text-muted-foreground">{faq.a}</p></div>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setFaqItems(prev => prev.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
          <div className="grid gap-2">
            <Input placeholder="Question" value={newFaq.q} onChange={e => setNewFaq(f => ({ ...f, q: e.target.value }))} className="h-8 text-xs" />
            <Input placeholder="Réponse" value={newFaq.a} onChange={e => setNewFaq(f => ({ ...f, a: e.target.value }))} className="h-8 text-xs" />
            <Button type="button" variant="outline" size="sm" className="w-fit gap-1" onClick={() => { if (newFaq.q && newFaq.a) { setFaqItems(prev => [...prev, { ...newFaq }]); setNewFaq({ q: '', a: '' }); } }}><Plus className="h-3 w-3" /> Ajouter</Button>
          </div>
        </div>

        {/* Testimonials */}
        <div className="space-y-2 border border-border rounded-xl p-4">
          <Label className="flex items-center gap-1 text-sm font-semibold"><MessageSquareQuote className="h-3.5 w-3.5" /> Témoignages</Label>
          {testimonials.map((t, i) => (
            <div key={i} className="flex items-start gap-2 bg-muted/50 rounded-lg p-2">
              <div className="flex-1 min-w-0"><p className="text-xs font-semibold">{t.name}</p><p className="text-xs text-muted-foreground italic">"{t.text}"</p></div>
              <Button variant="ghost" size="icon" className="h-6 w-6 shrink-0" onClick={() => setTestimonials(prev => prev.filter((_, idx) => idx !== i))}><Trash2 className="h-3 w-3" /></Button>
            </div>
          ))}
          <div className="grid gap-2">
            <Input placeholder="Nom du client" value={newTestimonial.name} onChange={e => setNewTestimonial(t => ({ ...t, name: e.target.value }))} className="h-8 text-xs" />
            <Input placeholder="Témoignage" value={newTestimonial.text} onChange={e => setNewTestimonial(t => ({ ...t, text: e.target.value }))} className="h-8 text-xs" />
            <Button type="button" variant="outline" size="sm" className="w-fit gap-1" onClick={() => { if (newTestimonial.name && newTestimonial.text) { setTestimonials(prev => [...prev, { ...newTestimonial }]); setNewTestimonial({ name: '', text: '' }); } }}><Plus className="h-3 w-3" /> Ajouter</Button>
          </div>
        </div>

        {/* Bundle Items */}
        {isEdit && watch('is_bundle') && (
          <div className="space-y-2 border border-primary/20 rounded-xl p-4">
            <Label className="flex items-center gap-1 text-sm font-semibold"><PackagePlus className="h-3.5 w-3.5 text-primary" /> Produits inclus dans le bundle</Label>
            {bundleItems.map((bi: any) => (
              <div key={bi.id} className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
                <span className="text-xs font-medium flex-1">{bi.included_product?.title || bi.included_product_id}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeBundleItem.mutate({ id: bi.id, bundleProductId: id! })}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
            <div className="flex gap-2">
              <Select value={selectedBundleProduct} onValueChange={setSelectedBundleProduct}><SelectTrigger className="h-8 text-xs flex-1"><SelectValue placeholder="Sélectionner un produit" /></SelectTrigger><SelectContent>{allProducts.filter((p: any) => p.id !== id && !bundleItems.some((bi: any) => bi.included_product_id === p.id)).map((p: any) => (<SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>))}</SelectContent></Select>
              <Button type="button" variant="outline" size="sm" className="h-8 gap-1" onClick={() => { if (selectedBundleProduct) { addBundleItem.mutate({ bundleProductId: id!, includedProductId: selectedBundleProduct }); setSelectedBundleProduct(''); } }}><Plus className="h-3 w-3" /> Ajouter</Button>
            </div>
          </div>
        )}

        {/* Recommendations */}
        {isEdit && (
          <div className="space-y-2 border border-border rounded-xl p-4">
            <Label className="flex items-center gap-1 text-sm font-semibold"><ArrowUpRight className="h-3.5 w-3.5" /> Produits recommandés</Label>
            {recommendations.map((rec: any) => (
              <div key={rec.id} className="flex items-center gap-2 bg-muted/50 rounded-lg p-2">
                <Badge variant="outline" className="text-[10px] capitalize">{rec.recommendation_type}</Badge>
                <span className="text-xs font-medium flex-1">{rec.recommended_product?.title || rec.recommended_product_id}</span>
                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeRecommendation.mutate({ id: rec.id, productId: id! })}><Trash2 className="h-3 w-3" /></Button>
              </div>
            ))}
            <div className="flex gap-2 flex-wrap">
              <Select value={recommendationType} onValueChange={setRecommendationType}><SelectTrigger className="h-8 text-xs w-28"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="upsell">Upsell</SelectItem><SelectItem value="cross_sell">Cross-sell</SelectItem><SelectItem value="related">Related</SelectItem></SelectContent></Select>
              <Select value={selectedRecommendation} onValueChange={setSelectedRecommendation}><SelectTrigger className="h-8 text-xs flex-1"><SelectValue placeholder="Sélectionner un produit" /></SelectTrigger><SelectContent>{allProducts.filter((p: any) => p.id !== id && !recommendations.some((r: any) => r.recommended_product_id === p.id)).map((p: any) => (<SelectItem key={p.id} value={p.id}>{p.title}</SelectItem>))}</SelectContent></Select>
              <Button type="button" variant="outline" size="sm" className="h-8 gap-1" onClick={() => { if (selectedRecommendation) { addRecommendation.mutate({ productId: id!, recommendedProductId: selectedRecommendation, type: recommendationType }); setSelectedRecommendation(''); } }}><Plus className="h-3 w-3" /> Ajouter</Button>
            </div>
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <Button type="button" variant="outline" onClick={() => navigate('/admin/products')}>Annuler</Button>
          <Button type="submit" className="bg-primary text-primary-foreground" disabled={loading}>{loading ? 'Enregistrement...' : isEdit ? 'Mettre à jour' : 'Créer'}</Button>
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
