import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { ChevronRight, ChevronLeft, Building2, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

const CATEGORIES = [
  { value: 'church', label: '⛪ Church' },
  { value: 'ministry', label: '✝️ Ministry' },
  { value: 'leader', label: '👤 Leader' },
  { value: 'ngo', label: '🤝 NGO' },
  { value: 'community', label: '🏘️ Community' },
  { value: 'other', label: '🔷 Other' },
] as const;

const schema = z.object({
  name: z.string().min(3, 'At least 3 characters').max(80),
  slug: z.string().min(3).max(50).regex(/^[a-z0-9-]+$/, 'Lowercase letters, numbers and hyphens only'),
  category: z.enum(['church', 'ministry', 'leader', 'ngo', 'community', 'other']),
  description: z.string().max(500).optional(),
});

type FormData = z.infer<typeof schema>;

const slugify = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');

export default function CreateOrgPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refetchOrgs, setCurrentOrg, userOrgs, isLoadingOrgs } = useOrg();
  const { toast } = useToast();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);
  const [loading, setLoading] = useState(false);

  const form = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { category: 'church', name: '', slug: '', description: '' },
  });

  const { watch, setValue, formState: { errors } } = form;
  const nameVal = watch('name');

  const handleNameBlur = () => {
    if (nameVal && !watch('slug')) {
      setValue('slug', slugify(nameVal), { shouldValidate: true });
    }
  };

  const steps = ['Category', 'Details', 'Confirm'];

  const onSubmit = async (data: FormData) => {
    if (!user) return;
    setLoading(true);
    try {
      const { data: orgId, error } = await db.rpc('create_organization_with_owner', {
        _name: data.name,
        _slug: data.slug,
        _category: data.category,
        _description: data.description || null,
      });
      if (error) throw error;

      // Fetch the newly created org so we can set it immediately
      const { data: newOrg, error: fetchError } = await db
        .from('organizations')
        .select('*')
        .eq('id', orgId)
        .maybeSingle();

      if (fetchError) throw fetchError;

      // Set as current org BEFORE navigating so AdminLayout doesn't redirect
      if (newOrg) setCurrentOrg(newOrg);

      // Trigger background refetch (non-blocking)
      refetchOrgs();

      toast({ title: '🎉 Organization created!', description: data.name });
      navigate('/admin');
    } catch (err: any) {
      const msg = err?.message || String(err);
      if (msg.includes('duplicate') || msg.includes('unique') || msg.includes('slug')) {
        toast({
          title: 'Slug already taken',
          description: 'Choose a different URL handle on the previous step.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error creating organization',
          description: msg,
          variant: 'destructive',
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const nextStep = async () => {
    let fieldsToValidate: (keyof FormData)[] = [];
    if (step === 0) fieldsToValidate = ['category'];
    if (step === 1) fieldsToValidate = ['name', 'slug'];
    const valid = await form.trigger(fieldsToValidate);
    if (valid) setStep(s => s + 1);
  };

  const slideVariants = {
    enter: (d: number) => ({ x: d > 0 ? 60 : -60, opacity: 0 }),
    center: { x: 0, opacity: 1 },
    exit: (d: number) => ({ x: d > 0 ? -60 : 60, opacity: 0 }),
  };

  const goNext = () => { setDirection(1); nextStep(); };
  const goBack = () => { setDirection(-1); setStep(s => s - 1); };

  const selectedCategory = watch('category');
  const formValues = form.getValues();

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="flex items-center gap-3 mb-8">
          <div className="h-10 w-10 rounded-xl gold-gradient flex items-center justify-center">
            <Building2 className="h-5 w-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="text-xl font-bold">Create Organization</h1>
            <p className="text-xs text-muted-foreground">Step {step + 1} of {steps.length}</p>
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex gap-1.5 mb-8">
          {steps.map((_, i) => (
            <div key={i} className={cn('h-1.5 flex-1 rounded-full transition-all duration-300',
              i <= step ? 'gold-gradient' : 'bg-muted')} />
          ))}
        </div>

        {/* Step content */}
        <div className="relative overflow-hidden">
          <AnimatePresence custom={direction} mode="wait">
            <motion.div key={step} custom={direction} variants={slideVariants}
              initial="enter" animate="center" exit="exit"
              transition={{ duration: 0.25, ease: 'easeInOut' }}>

              {step === 0 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">What type of organization?</h2>
                  <div className="grid grid-cols-2 gap-3">
                    {CATEGORIES.map(cat => (
                      <button key={cat.value} type="button"
                        onClick={() => setValue('category', cat.value)}
                        className={cn('p-4 rounded-2xl border-2 text-left transition-all',
                          selectedCategory === cat.value
                            ? 'border-primary bg-primary/10 shadow-gold'
                            : 'border-border bg-card hover:border-muted-foreground/40')}>
                        <span className="text-xl block mb-1">{cat.label.split(' ')[0]}</span>
                        <span className="text-sm font-medium">{cat.label.split(' ').slice(1).join(' ')}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === 1 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Name your organization</h2>
                  <div className="space-y-2">
                    <Label>Organization Name *</Label>
                    <Input placeholder="e.g. Grace Church Abidjan" {...form.register('name')}
                      onBlur={handleNameBlur}
                      className={errors.name ? 'border-destructive' : ''} />
                    {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Slug (URL handle) *</Label>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground shrink-0">graceco.app/org/</span>
                      <Input placeholder="grace-church-abidjan" {...form.register('slug')}
                        className={errors.slug ? 'border-destructive' : ''} />
                    </div>
                    {errors.slug && <p className="text-xs text-destructive">{errors.slug.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label>Description (optional)</Label>
                    <Textarea placeholder="Briefly describe your organization..." rows={3}
                      {...form.register('description')} />
                  </div>
                </div>
              )}

              {step === 2 && (
                <div className="space-y-4">
                  <h2 className="text-lg font-semibold">Confirm & Create</h2>
                  <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
                    {[
                      { label: 'Name', value: formValues.name },
                      { label: 'Slug', value: formValues.slug },
                      { label: 'Category', value: CATEGORIES.find(c => c.value === formValues.category)?.label },
                      { label: 'Description', value: formValues.description || '—' },
                    ].map(({ label, value }) => (
                      <div key={label} className="flex gap-3 text-sm">
                        <span className="text-muted-foreground w-24 shrink-0">{label}</span>
                        <span className="font-medium break-all">{value}</span>
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    You'll be set as the <strong>owner</strong>. You can invite other members from the admin panel.
                  </p>
                </div>
              )}
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation buttons */}
        <div className="flex gap-3 mt-8">
          {step > 0 && (
            <Button type="button" variant="outline" className="flex-1" onClick={goBack}>
              <ChevronLeft className="h-4 w-4 mr-1" /> Back
            </Button>
          )}
          {step < 2 ? (
            <Button type="button" className="flex-1 gold-gradient text-primary-foreground border-0 shadow-gold" onClick={goNext}>
              Next <ChevronRight className="h-4 w-4 ml-1" />
            </Button>
          ) : (
            <Button type="button" className="flex-1 gold-gradient text-primary-foreground border-0 shadow-gold"
              onClick={form.handleSubmit(onSubmit)} disabled={loading}>
              {loading ? 'Creating...' : <><Check className="h-4 w-4 mr-1" /> Create Organization</>}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
