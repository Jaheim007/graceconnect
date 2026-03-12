import { useState, useCallback } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Upload, FileText, CheckCircle, ArrowRight, ArrowLeft,
  Loader2, Sparkles, DollarSign, Rocket, Image as ImageIcon,
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';
import { useDisplayCurrency } from '@/hooks/useDisplayCurrency';

type Step = 'info' | 'file' | 'publish';

interface ProductForm {
  title: string;
  description: string;
  price: string;
  productType: string;
  coverFile: File | null;
  productFile: File | null;
}

export default function QuickPublishPage() {
  const { user } = useAuth();
  const { userOrgs } = useOrg();
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const { fmt } = useDisplayCurrency();
  const [step, setStep] = useState<Step>('info');
  const [form, setForm] = useState<ProductForm>({
    title: '', description: '', price: '0',
    productType: 'pdf', coverFile: null, productFile: null,
  });
  const [coverPreview, setCoverPreview] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const managedOrg = userOrgs.find((o: any) =>
    ['owner', 'admin', 'editor'].includes(o.role || '')
  );

  const update = useCallback((key: keyof ProductForm, value: any) => {
    setForm(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleCoverChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      update('coverFile', file);
      const reader = new FileReader();
      reader.onload = () => setCoverPreview(reader.result as string);
      reader.readAsDataURL(file);
    }
  };

  const publishMutation = useMutation({
    mutationFn: async () => {
      if (!user || !managedOrg) throw new Error('No org');
      setUploading(true);

      const orgId = managedOrg.id;
      let coverUrl: string | null = null;
      let fileUrl: string | null = null;

      // Upload cover
      if (form.coverFile) {
        const ext = form.coverFile.name.split('.').pop();
        const path = `${orgId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from('org-assets').upload(path, form.coverFile);
        if (!error) {
          const { data: urlData } = supabase.storage.from('org-assets').getPublicUrl(path);
          coverUrl = urlData.publicUrl;
        }
      }

      // Upload product file
      if (form.productFile) {
        const ext = form.productFile.name.split('.').pop();
        const path = `${orgId}/${crypto.randomUUID()}.${ext}`;
        const { error } = await supabase.storage.from('private-products').upload(path, form.productFile);
        if (!error) {
          const { data: urlData } = supabase.storage.from('private-products').getPublicUrl(path);
          fileUrl = urlData.publicUrl;
        }
      }

      const price = parseFloat(form.price) || 0;
      const slug = form.title.toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .slice(0, 60);

      const { data, error } = await db.from('digital_products').insert({
        organization_id: orgId,
        created_by: user.id,
        title: form.title,
        description: form.description || null,
        price,
        currency: (managedOrg as any).currency || 'XOF',
        is_free: price === 0,
        product_type: form.productType,
        cover_image_url: coverUrl,
        file_url: fileUrl,
        slug,
        is_published: true,
        publication_status: 'published',
      }).select('id, slug').single();

      if (error) throw error;
      return data;
    },
    onSuccess: (data) => {
      setUploading(false);
      qc.invalidateQueries({ queryKey: ['org-products'] });
      toast({ title: isFr ? '🚀 Produit publié !' : '🚀 Product published!', description: isFr ? 'Votre produit est en ligne.' : 'Your product is live.' });
      navigate(`/org/${(managedOrg as any)?.slug}/p/${data.slug || data.id}`);
    },
    onError: (err: Error) => {
      setUploading(false);
      toast({ title: isFr ? 'Erreur' : 'Error', description: err.message, variant: 'destructive' });
    },
  });

  if (!managedOrg) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4 max-w-sm">
          <Rocket className="h-12 w-12 text-primary mx-auto" />
          <h1 className="text-xl font-bold">{isFr ? 'Créez d\'abord votre organisation' : 'Create your organization first'}</h1>
          <p className="text-sm text-muted-foreground">
            {isFr ? 'Pour publier un produit, vous avez besoin d\'une organisation.' : 'You need an organization to publish a product.'}
          </p>
          <Button onClick={() => navigate('/create-org')} className="gap-1.5">
            {isFr ? 'Créer mon organisation' : 'Create my organization'} <ArrowRight className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  const steps: { key: Step; label: string; icon: typeof FileText }[] = [
    { key: 'info', label: isFr ? 'Infos' : 'Info', icon: FileText },
    { key: 'file', label: isFr ? 'Fichier' : 'File', icon: Upload },
    { key: 'publish', label: isFr ? 'Publier' : 'Publish', icon: Rocket },
  ];

  const currentIndex = steps.findIndex(s => s.key === step);
  const canNext = step === 'info' ? form.title.trim().length > 2 : step === 'file' ? true : true;

  return (
    <div className="min-h-screen bg-background">
      <div className="container max-w-lg px-4 py-8 space-y-6">
        <div className="text-center">
          <div className="h-12 w-12 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-3">
            <Sparkles className="h-6 w-6 text-primary" />
          </div>
          <h1 className="text-xl font-extrabold">{isFr ? 'Publier en 3 étapes' : 'Publish in 3 steps'}</h1>
          <p className="text-sm text-muted-foreground mt-1">
            {isFr ? 'Votre produit sera en ligne en moins de 2 minutes.' : 'Your product will be live in under 2 minutes.'}
          </p>
        </div>

        {/* Progress */}
        <div className="flex items-center gap-2">
          {steps.map((s, i) => (
            <div key={s.key} className="flex-1 flex items-center gap-2">
              <div className={cn(
                'h-8 w-8 rounded-full flex items-center justify-center text-xs font-bold shrink-0 transition-colors',
                i <= currentIndex
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
              )}>
                {i < currentIndex ? <CheckCircle className="h-4 w-4" /> : i + 1}
              </div>
              <span className={cn('text-xs font-medium hidden sm:block', i <= currentIndex ? 'text-foreground' : 'text-muted-foreground')}>
                {s.label}
              </span>
              {i < steps.length - 1 && (
                <div className={cn('flex-1 h-0.5 rounded-full', i < currentIndex ? 'bg-primary' : 'bg-muted')} />
              )}
            </div>
          ))}
        </div>

        {/* Step content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="space-y-4"
          >
            {step === 'info' && (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <div>
                  <label className="text-sm font-medium mb-1.5 block">{isFr ? 'Titre du produit' : 'Product title'} *</label>
                  <Input
                    value={form.title}
                    onChange={e => update('title', e.target.value)}
                    placeholder={isFr ? 'Ex: Guide complet du marketing digital' : 'e.g. Complete Digital Marketing Guide'}
                    className="h-11"
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-1.5 block">{isFr ? 'Description (optionnel)' : 'Description (optional)'}</label>
                  <textarea
                    value={form.description}
                    onChange={e => update('description', e.target.value)}
                    placeholder={isFr ? 'Décrivez brièvement votre produit…' : 'Briefly describe your product…'}
                    rows={3}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">
                      <DollarSign className="h-3.5 w-3.5 inline" /> {isFr ? 'Prix' : 'Price'}
                    </label>
                    <Input
                      type="number"
                      value={form.price}
                      onChange={e => update('price', e.target.value)}
                      placeholder={isFr ? '0 = gratuit' : '0 = free'}
                      min="0"
                    />
                    <p className="text-[10px] text-muted-foreground mt-1">{isFr ? '0 = gratuit' : '0 = free'}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-1.5 block">Type</label>
                    <select
                      value={form.productType}
                      onChange={e => update('productType', e.target.value)}
                      className="w-full h-9 rounded-lg border border-input bg-background px-3 text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="pdf">PDF</option>
                      <option value="ebook">E-book</option>
                      <option value="audio">Audio</option>
                      <option value="video">{isFr ? 'Vidéo' : 'Video'}</option>
                      <option value="link">{isFr ? 'Lien externe' : 'External link'}</option>
                    </select>
                  </div>
                </div>
              </div>
            )}

            {step === 'file' && (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                {/* Cover image */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    <ImageIcon className="h-3.5 w-3.5 inline mr-1" /> {isFr ? 'Image de couverture' : 'Cover image'}
                  </label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:bg-muted/30 transition-colors">
                    {coverPreview ? (
                      <img src={coverPreview} alt="" className="h-32 rounded-lg object-cover mb-2" />
                    ) : (
                      <>
                        <ImageIcon className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-xs text-muted-foreground">{isFr ? 'Cliquez pour uploader' : 'Click to upload'}</span>
                      </>
                    )}
                    <input type="file" accept="image/*" onChange={handleCoverChange} className="hidden" />
                  </label>
                </div>

                {/* Product file */}
                <div>
                  <label className="text-sm font-medium mb-1.5 block">
                    <Upload className="h-3.5 w-3.5 inline mr-1" /> {isFr ? 'Fichier du produit' : 'Product file'}
                  </label>
                  <label className="flex flex-col items-center justify-center border-2 border-dashed border-border rounded-xl p-6 cursor-pointer hover:bg-muted/30 transition-colors">
                    {form.productFile ? (
                      <div className="text-center">
                        <FileText className="h-8 w-8 text-primary mx-auto mb-2" />
                        <span className="text-xs font-medium">{form.productFile.name}</span>
                        <span className="text-[10px] text-muted-foreground block">
                          {(form.productFile.size / 1024 / 1024).toFixed(1)} MB
                        </span>
                      </div>
                    ) : (
                      <>
                        <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                        <span className="text-xs text-muted-foreground">{isFr ? 'PDF, Audio, Vidéo…' : 'PDF, Audio, Video…'}</span>
                      </>
                    )}
                    <input
                      type="file"
                      accept=".pdf,.epub,.mp3,.mp4,.wav,.zip,.rar"
                      onChange={e => {
                        const file = e.target.files?.[0];
                        if (file) update('productFile', file);
                      }}
                      className="hidden"
                    />
                  </label>
                </div>
              </div>
            )}

            {step === 'publish' && (
              <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
                <div className="text-center space-y-2">
                  <Rocket className="h-10 w-10 text-primary mx-auto" />
                  <h2 className="font-bold">{isFr ? 'Prêt à publier ?' : 'Ready to publish?'}</h2>
                  <p className="text-sm text-muted-foreground">
                    {isFr ? 'Vérifiez les infos avant de publier.' : 'Review the info before publishing.'}
                  </p>
                </div>

                <div className="bg-muted/30 rounded-xl p-4 space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isFr ? 'Titre' : 'Title'}</span>
                    <span className="font-medium text-right max-w-[60%] truncate">{form.title}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isFr ? 'Prix' : 'Price'}</span>
                    <span className="font-medium">
                      {parseFloat(form.price) === 0
                        ? (isFr ? 'Gratuit' : 'Free')
                        : fmt(parseFloat(form.price), (managedOrg as any)?.currency || 'XOF')}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Type</span>
                    <span className="font-medium capitalize">{form.productType}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isFr ? 'Couverture' : 'Cover'}</span>
                    <span className="font-medium">{form.coverFile ? '✅' : '—'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">{isFr ? 'Fichier' : 'File'}</span>
                    <span className="font-medium">{form.productFile ? '✅' : '—'}</span>
                  </div>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        <div className="flex gap-3">
          {currentIndex > 0 && (
            <Button variant="outline" className="gap-1.5" onClick={() => setStep(steps[currentIndex - 1].key)}>
              <ArrowLeft className="h-4 w-4" /> {isFr ? 'Retour' : 'Back'}
            </Button>
          )}
          <div className="flex-1" />
          {currentIndex < steps.length - 1 ? (
            <Button
              className="gap-1.5"
              disabled={!canNext}
              onClick={() => setStep(steps[currentIndex + 1].key)}
            >
              {isFr ? 'Suivant' : 'Next'} <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              className="gap-1.5 bg-primary"
              disabled={publishMutation.isPending || !form.title.trim()}
              onClick={() => publishMutation.mutate()}
            >
              {publishMutation.isPending ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Rocket className="h-4 w-4" />
              )}
              {publishMutation.isPending ? (isFr ? 'Publication…' : 'Publishing…') : (isFr ? 'Publier maintenant' : 'Publish now')}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
