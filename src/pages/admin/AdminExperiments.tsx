import { useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { db } from '@/lib/db';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { EmptyState } from '@/components/ui/EmptyState';
import { SkeletonRow } from '@/components/ui/SkeletonCard';
import { ExperimentResultsPanel } from '@/components/admin/ExperimentResultsPanel';
import {
  Plus, FlaskConical, Trash2, Edit, Pause, Play, Trophy, ChevronDown, ChevronUp,
  Type, MessageSquare, MousePointerClick, DollarSign, Sparkles, Globe, ShoppingCart, Users, Link2, Lightbulb, Copy, ExternalLink
} from 'lucide-react';
import { toast } from 'sonner';
import { AdminPageShell } from './AdminPageShell';
import { useI18n } from '@/i18n/I18nContext';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { Slider } from '@/components/ui/slider';

const TEST_TYPES = [
  { value: 'cta', label: 'CTA Button', icon: MousePointerClick, desc: 'Test different call-to-action texts' },
  { value: 'title', label: 'Product Title', icon: Type, desc: 'Test which title gets more clicks' },
  { value: 'description', label: 'Description', icon: MessageSquare, desc: 'Test different product descriptions' },
  { value: 'price', label: 'Pricing Display', icon: DollarSign, desc: 'Test different price presentations' },
  { value: 'ambassador', label: 'Ambassador Message', icon: Users, desc: 'Test different share messages' },
  { value: 'custom', label: 'Custom', icon: Sparkles, desc: 'Create a custom experiment' },
];

const LOCATIONS = [
  { value: 'product_page', label: 'Product Page', icon: ShoppingCart },
  { value: 'public_page', label: 'Public Profile', icon: Globe },
  { value: 'ambassador_link', label: 'Ambassador Link', icon: Link2 },
  { value: 'checkout', label: 'Checkout', icon: DollarSign },
];

const SUGGESTED_TESTS = [
  { name: 'Main CTA button', type: 'cta', location: 'product_page', versionA: 'Buy Now', versionB: 'Get Instant Access', hypothesis: 'A more urgent CTA may increase conversions' },
  { name: 'Product title impact', type: 'title', location: 'product_page', versionA: '', versionB: '', hypothesis: 'A benefit-focused title increases clicks' },
  { name: 'Ambassador share text', type: 'ambassador', location: 'ambassador_link', versionA: 'Check this out!', versionB: 'This changed my life 🔥', hypothesis: 'Emotional messaging drives more referrals' },
];

interface ExperimentForm {
  name: string;
  testType: string;
  location: string;
  versionA: string;
  versionB: string;
  hypothesis: string;
  trafficPercent: number;
}

const emptyForm: ExperimentForm = {
  name: '', testType: '', location: '', versionA: '', versionB: '', hypothesis: '', trafficPercent: 50,
};

export default function AdminExperiments() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const { locale } = useI18n();
  const isFr = locale === 'fr';
  const [open, setOpen] = useState(false);
  const [editing, setEditing] = useState<any>(null);
  const [form, setForm] = useState<ExperimentForm>(emptyForm);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [step, setStep] = useState(1);

  const { data: experiments = [], isLoading } = useQuery({
    queryKey: ['experiments'],
    queryFn: async () => {
      const { data } = await db.from('experiments').select('*').order('created_at', { ascending: false });
      return data || [];
    },
  });

  const resetForm = () => {
    setForm(emptyForm);
    setEditing(null);
    setStep(1);
  };

  const handleSave = async () => {
    if (!form.name || !form.versionA || !form.versionB) {
      toast.error(isFr ? 'Remplissez tous les champs obligatoires' : 'Fill in all required fields');
      return;
    }

    const variants = {
      a: { label: 'Version A', content: form.versionA },
      b: { label: 'Version B', content: form.versionB },
    };

    // Build slot_key from testType + location (e.g. "product-cta", "ambassador-message")
    const slotKey = `${form.location?.replace('_', '-') || 'product-page'}-${form.testType || 'custom'}`;

    const payload = {
      name: form.name.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      description: JSON.stringify({
        displayName: form.name,
        testType: form.testType,
        location: form.location,
        hypothesis: form.hypothesis,
      }),
      variants,
      traffic_percent: form.trafficPercent,
      created_by: user?.id,
      slot_key: slotKey,
    };

    try {
      if (editing) {
        const { error } = await db.from('experiments').update(payload).eq('id', editing.id);
        if (error) throw error;
      } else {
        const { error } = await db.from('experiments').insert(payload as any);
        if (error) throw error;
      }
      qc.invalidateQueries({ queryKey: ['experiments'] });
      setOpen(false);
      resetForm();
      toast.success(editing ? (isFr ? '✅ Test mis à jour' : '✅ Test updated') : (isFr ? '✅ Test créé !' : '✅ Test created!'));
    } catch (err: any) {
      toast.error(err.message || 'Error');
    }
  };

  const toggleActive = async (id: string, isActive: boolean) => {
    await db.from('experiments').update({ is_active: !isActive }).eq('id', id);
    qc.invalidateQueries({ queryKey: ['experiments'] });
    toast.success(!isActive ? (isFr ? 'Test activé' : 'Test resumed') : (isFr ? 'Test mis en pause' : 'Test paused'));
  };

  const deleteExperiment = async (id: string) => {
    await db.from('experiments').delete().eq('id', id);
    qc.invalidateQueries({ queryKey: ['experiments'] });
    toast.success(isFr ? 'Test supprimé' : 'Test deleted');
  };

  const declareWinner = async (expId: string, winnerVariant: string) => {
    await db.from('experiments').update({
      is_active: false,
      winner_variant: winnerVariant,
    } as any).eq('id', expId);
    qc.invalidateQueries({ queryKey: ['experiments'] });
    toast.success(isFr ? `🏆 ${winnerVariant} déclaré gagnant !` : `🏆 ${winnerVariant} declared winner!`);
  };

  const openEdit = (exp: any) => {
    const meta = parseDescription(exp.description);
    const v = exp.variants as Record<string, any> || {};
    const keys = Object.keys(v);
    setEditing(exp);
    setForm({
      name: meta.displayName || exp.name,
      testType: meta.testType || 'custom',
      location: meta.location || 'product_page',
      versionA: v[keys[0]]?.content || v[keys[0]]?.label || keys[0] || '',
      versionB: v[keys[1]]?.content || v[keys[1]]?.label || keys[1] || '',
      hypothesis: meta.hypothesis || '',
      trafficPercent: exp.traffic_percent || 50,
    });
    setStep(3);
    setOpen(true);
  };

  const applySuggestion = (s: typeof SUGGESTED_TESTS[0]) => {
    setForm({
      name: s.name,
      testType: s.type,
      location: s.location,
      versionA: s.versionA,
      versionB: s.versionB,
      hypothesis: s.hypothesis,
      trafficPercent: 50,
    });
    setStep(2);
  };

  const parseDescription = (desc: string | null): any => {
    if (!desc) return {};
    try { return JSON.parse(desc); } catch { return { displayName: desc }; }
  };

  const getTestTypeInfo = (type: string) => TEST_TYPES.find(t => t.value === type);
  const getLocationInfo = (loc: string) => LOCATIONS.find(l => l.value === loc);

  return (
    <AdminPageShell
      title={isFr ? "Optimisation des conversions" : "Conversion Optimization"}
      subtitle={isFr ? "Testez différentes versions pour trouver ce qui génère le plus de ventes." : "Test different versions to find what generates more sales."}
    >
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-6">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-xs">
            {experiments.filter((e: any) => e.is_active).length} {isFr ? 'tests actifs' : 'active tests'}
          </Badge>
        </div>
        <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) resetForm(); }}>
          <DialogTrigger asChild>
            <Button size="sm" className="gap-1.5">
              <Plus className="h-3.5 w-3.5" /> {isFr ? 'Nouveau test' : 'New test'}
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FlaskConical className="h-5 w-5 text-primary" />
                {editing ? (isFr ? 'Modifier le test' : 'Edit test') : (isFr ? 'Créer un test' : 'Create a test')}
              </DialogTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {isFr ? 'Trouvez ce qui convertit le mieux.' : 'Find what converts best.'}
              </p>
            </DialogHeader>

            {/* Step indicators */}
            <div className="flex items-center gap-2 mb-2">
              {[1, 2, 3].map(s => (
                <div key={s} className={cn(
                  'h-1.5 flex-1 rounded-full transition-colors',
                  s <= step ? 'bg-primary' : 'bg-muted'
                )} />
              ))}
            </div>

            <AnimatePresence mode="wait">
              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <Label className="text-sm font-medium">{isFr ? 'Que voulez-vous tester ?' : 'What do you want to test?'}</Label>
                  <div className="grid grid-cols-2 gap-2">
                    {TEST_TYPES.map(t => {
                      const Icon = t.icon;
                      return (
                        <button
                          key={t.value}
                          onClick={() => { setForm(f => ({ ...f, testType: t.value })); setStep(2); }}
                          className={cn(
                            'flex flex-col items-start gap-1.5 p-3 rounded-xl border text-left transition-all hover:border-primary/50 hover:bg-primary/5',
                            form.testType === t.value ? 'border-primary bg-primary/5 ring-1 ring-primary/20' : 'border-border'
                          )}
                        >
                          <Icon className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium">{t.label}</span>
                          <span className="text-[10px] text-muted-foreground leading-tight">{t.desc}</span>
                        </button>
                      );
                    })}
                  </div>

                  {/* Suggested tests */}
                  <div className="pt-2">
                    <Label className="text-xs text-muted-foreground flex items-center gap-1 mb-2">
                      <Lightbulb className="h-3 w-3" /> {isFr ? 'Tests recommandés' : 'Recommended tests'}
                    </Label>
                    <div className="space-y-1.5">
                      {SUGGESTED_TESTS.map((s, i) => (
                        <button
                          key={i}
                          onClick={() => applySuggestion(s)}
                          className="w-full flex items-center gap-2 p-2.5 rounded-lg border border-dashed border-border hover:border-primary/40 hover:bg-primary/5 transition-all text-left"
                        >
                          <Sparkles className="h-3.5 w-3.5 text-amber-500 shrink-0" />
                          <div>
                            <p className="text-xs font-medium">{s.name}</p>
                            <p className="text-[10px] text-muted-foreground">{s.hypothesis}</p>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div>
                    <Label className="text-sm">{isFr ? "Nom du test" : "Test name"}</Label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm(f => ({ ...f, name: e.target.value }))}
                      placeholder={isFr ? "Ex: Bouton d'achat principal" : "Ex: Main buy button"}
                      className="mt-1"
                    />
                  </div>

                  <div>
                    <Label className="text-sm">{isFr ? "Où est-ce utilisé ?" : "Where is it used?"}</Label>
                    <div className="grid grid-cols-2 gap-2 mt-1.5">
                      {LOCATIONS.map(l => {
                        const Icon = l.icon;
                        return (
                          <button
                            key={l.value}
                            onClick={() => setForm(f => ({ ...f, location: l.value }))}
                            className={cn(
                              'flex items-center gap-2 p-2.5 rounded-lg border transition-all text-sm',
                              form.location === l.value ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40'
                            )}
                          >
                            <Icon className="h-3.5 w-3.5 text-primary" />
                            {l.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(1)} className="flex-1">
                      {isFr ? 'Retour' : 'Back'}
                    </Button>
                    <Button onClick={() => setStep(3)} disabled={!form.name || !form.location} className="flex-1">
                      {isFr ? 'Suivant' : 'Next'}
                    </Button>
                  </div>
                </motion.div>
              )}

              {step === 3 && (
                <motion.div key="step3" initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -20 }} className="space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs flex items-center gap-1.5 mb-1.5">
                        <span className="h-5 w-5 rounded bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">A</span>
                        Version A {isFr ? '(actuelle)' : '(current)'}
                      </Label>
                      <Textarea
                        value={form.versionA}
                        onChange={(e) => setForm(f => ({ ...f, versionA: e.target.value }))}
                        placeholder={isFr ? "Contenu actuel..." : "Current content..."}
                        rows={3}
                      />
                    </div>
                    <div>
                      <Label className="text-xs flex items-center gap-1.5 mb-1.5">
                        <span className="h-5 w-5 rounded bg-emerald-500/10 text-emerald-600 flex items-center justify-center text-[10px] font-bold">B</span>
                        Version B {isFr ? '(nouvelle)' : '(new)'}
                      </Label>
                      <Textarea
                        value={form.versionB}
                        onChange={(e) => setForm(f => ({ ...f, versionB: e.target.value }))}
                        placeholder={isFr ? "Nouvelle version..." : "New version..."}
                        rows={3}
                      />
                    </div>
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground flex items-center gap-1">
                      <Lightbulb className="h-3 w-3" />
                      {isFr ? 'Hypothèse (optionnel)' : 'Hypothesis (optional)'}
                    </Label>
                    <Input
                      value={form.hypothesis}
                      onChange={(e) => setForm(f => ({ ...f, hypothesis: e.target.value }))}
                      placeholder={isFr ? "Nous pensons que..." : "We think that..."}
                      className="mt-1 text-sm"
                    />
                  </div>

                  <div>
                    <Label className="text-xs text-muted-foreground mb-2 block">
                      {isFr ? 'Répartition du trafic' : 'Traffic split'}: {form.trafficPercent}% / {100 - form.trafficPercent}%
                    </Label>
                    <Slider
                      value={[form.trafficPercent]}
                      onValueChange={([v]) => setForm(f => ({ ...f, trafficPercent: v }))}
                      min={10}
                      max={90}
                      step={10}
                      className="w-full"
                    />
                    <div className="flex justify-between text-[10px] text-muted-foreground mt-1">
                      <span>Version A</span>
                      <span>Version B</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setStep(2)} className="flex-1">
                      {isFr ? 'Retour' : 'Back'}
                    </Button>
                    <Button onClick={handleSave} disabled={!form.versionA || !form.versionB} className="flex-1 gap-1.5">
                      <FlaskConical className="h-3.5 w-3.5" />
                      {editing ? (isFr ? 'Mettre à jour' : 'Update') : (isFr ? 'Lancer le test' : 'Launch test')}
                    </Button>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? <SkeletonRow count={3} /> : experiments.length === 0 ? (
        <EmptyState
          variant="generic"
          title={isFr ? "Aucun test en cours" : "No tests yet"}
          description={isFr ? "Créez votre premier test pour découvrir ce qui génère le plus de ventes." : "Create your first test to discover what generates more sales."}
        />
      ) : (
        <div className="space-y-4">
          {experiments.map((exp: any) => {
            const meta = parseDescription(exp.description);
            const typeInfo = getTestTypeInfo(meta.testType);
            const locInfo = getLocationInfo(meta.location);
            const variants = exp.variants as Record<string, any> || {};
            const variantKeys = Object.keys(variants);
            const isExpanded = expandedId === exp.id;
            const TypeIcon = typeInfo?.icon || FlaskConical;

            return (
              <Card key={exp.id} className="shadow-card overflow-hidden">
                <CardContent className="p-0">
                  {/* Header */}
                  <div
                    className="flex items-center gap-3 p-4 cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : exp.id)}
                  >
                    <div className={cn(
                      'h-9 w-9 rounded-lg flex items-center justify-center shrink-0',
                      exp.is_active ? 'bg-primary/10' : 'bg-muted'
                    )}>
                      <TypeIcon className={cn('h-4.5 w-4.5', exp.is_active ? 'text-primary' : 'text-muted-foreground')} />
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-semibold truncate">
                          {meta.displayName || exp.name}
                        </h3>
                        <Badge variant={exp.is_active ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                          {exp.winner_variant
                            ? (isFr ? `🏆 ${exp.winner_variant === 'a' ? 'A' : 'B'} gagnant` : `🏆 ${exp.winner_variant === 'a' ? 'A' : 'B'} winner`)
                            : exp.is_active ? (isFr ? 'Actif' : 'Active') : (isFr ? 'En pause' : 'Paused')}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-2 mt-0.5">
                        {typeInfo && (
                          <span className="text-[10px] text-muted-foreground">{typeInfo.label}</span>
                        )}
                        {locInfo && (
                          <>
                            <span className="text-[10px] text-muted-foreground">·</span>
                            <span className="text-[10px] text-muted-foreground">{locInfo.label}</span>
                          </>
                        )}
                        <span className="text-[10px] text-muted-foreground">·</span>
                        <span className="text-[10px] text-muted-foreground">{exp.traffic_percent}% {isFr ? 'du trafic' : 'traffic'}</span>
                        {exp.slot_key && (
                          <>
                            <span className="text-[10px] text-muted-foreground">·</span>
                            <Badge variant="outline" className="text-[9px] px-1.5 py-0 h-4 font-mono">
                              {exp.slot_key}
                            </Badge>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => { e.stopPropagation(); toggleActive(exp.id, exp.is_active); }}
                      >
                        {exp.is_active ? <Pause className="h-3.5 w-3.5" /> : <Play className="h-3.5 w-3.5" />}
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7"
                        onClick={(e) => { e.stopPropagation(); openEdit(exp); }}
                      >
                        <Edit className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-7 w-7 text-destructive"
                        onClick={(e) => { e.stopPropagation(); deleteExperiment(exp.id); }}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                      {isExpanded ? <ChevronUp className="h-4 w-4 text-muted-foreground" /> : <ChevronDown className="h-4 w-4 text-muted-foreground" />}
                    </div>
                  </div>

                  {/* Expanded content */}
                  <AnimatePresence>
                    {isExpanded && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: 'auto', opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        className="overflow-hidden"
                      >
                        <div className="px-4 pb-4 space-y-4 border-t border-border pt-4">
                          {/* Version previews */}
                          <div className="grid grid-cols-2 gap-3">
                            {variantKeys.slice(0, 2).map((key, idx) => (
                              <div
                                key={key}
                                className={cn(
                                  'p-3 rounded-xl border',
                                  idx === 0 ? 'border-primary/20 bg-primary/5' : 'border-emerald-500/20 bg-emerald-500/5'
                                )}
                              >
                                <div className="flex items-center gap-1.5 mb-2">
                                  <span className={cn(
                                    'h-5 w-5 rounded flex items-center justify-center text-[10px] font-bold',
                                    idx === 0 ? 'bg-primary/10 text-primary' : 'bg-emerald-500/10 text-emerald-600'
                                  )}>
                                    {idx === 0 ? 'A' : 'B'}
                                  </span>
                                  <span className="text-xs font-medium">
                                    Version {idx === 0 ? 'A' : 'B'} {idx === 0 ? (isFr ? '(actuelle)' : '(current)') : (isFr ? '(nouvelle)' : '(new)')}
                                  </span>
                                </div>
                                <p className="text-sm">{variants[key]?.content || variants[key]?.label || key}</p>
                              </div>
                            ))}
                          </div>

                          {/* Hypothesis */}
                          {meta.hypothesis && (
                            <div className="flex items-start gap-2 p-3 rounded-lg bg-amber-500/5 border border-amber-500/20">
                              <Lightbulb className="h-3.5 w-3.5 text-amber-500 mt-0.5 shrink-0" />
                              <p className="text-xs text-muted-foreground">
                                <span className="font-medium text-foreground">{isFr ? 'Hypothèse' : 'Hypothesis'}:</span>{' '}
                                {meta.hypothesis}
                              </p>
                            </div>
                          )}

                          {/* Results */}
                          <ExperimentResultsPanel
                            experimentId={exp.id}
                            experimentName={exp.name}
                            variants={variants}
                          />

                          {/* Debug URL */}
                          <div className="flex items-center gap-2 p-2.5 rounded-lg bg-muted/30 border border-border">
                            <ExternalLink className="h-3 w-3 text-muted-foreground shrink-0" />
                            <code className="text-[10px] text-muted-foreground truncate flex-1">
                              ?exp_{exp.name}=a {isFr ? 'ou' : 'or'} ?exp_{exp.name}=b
                            </code>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 shrink-0"
                              onClick={() => {
                                navigator.clipboard.writeText(`?exp_${exp.name}=b`);
                                toast.success(isFr ? 'Copié !' : 'Copied!');
                              }}
                            >
                              <Copy className="h-3 w-3" />
                            </Button>
                          </div>

                          {/* Actions */}
                          {!exp.winner_variant && (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="flex-1 gap-1.5"
                                onClick={() => declareWinner(exp.id, 'a')}
                              >
                                <Trophy className="h-3.5 w-3.5" />
                                {isFr ? 'Déclarer A gagnant' : 'Declare A winner'}
                              </Button>
                              <Button
                                size="sm"
                                className="flex-1 gap-1.5"
                                onClick={() => declareWinner(exp.id, 'b')}
                              >
                                <Trophy className="h-3.5 w-3.5" />
                                {isFr ? 'Déclarer B gagnant' : 'Declare B winner'}
                              </Button>
                            </div>
                          )}
                          {exp.winner_variant && (
                            <div className="p-3 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-center">
                              <p className="text-sm font-medium text-emerald-700">
                                🏆 {isFr ? 'Version' : 'Version'} {exp.winner_variant === 'a' ? 'A' : 'B'} {isFr ? 'a gagné ce test' : 'won this test'}
                              </p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {isFr ? "Le contenu gagnant est maintenant utilisé par défaut." : "The winning content is now used by default."}
                              </p>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </AdminPageShell>
  );
}
