import { useEffect, useState } from 'react';
import { Link, Navigate, useParams } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  ArrowLeft, Loader2, Sparkles, Save, Send, AlertTriangle, RefreshCw, CheckCircle2, FileText,
  MessageCircle, BookOpen, Video, Newspaper, ListChecks, Copy, FileDown, DollarSign, Eye, EyeOff, Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { toast } from 'sonner';

const VARIANT_META = [
  { type: 'summary', icon: FileText, fr: 'Résumé', en: 'Summary' },
  { type: 'notes', icon: ListChecks, fr: 'Notes de sermon', en: 'Sermon notes' },
  { type: 'whatsapp', icon: MessageCircle, fr: 'WhatsApp', en: 'WhatsApp' },
  { type: 'blog', icon: Newspaper, fr: 'Article blog', en: 'Blog post' },
  { type: 'ebook', icon: BookOpen, fr: 'Ebook', en: 'Ebook draft' },
  { type: 'reel', icon: Video, fr: 'Reel / Short', en: 'Reel / Short' },
] as const;

export default function ChurchProSermonDetail() {
  const { id } = useParams<{ id: string }>();
  const { user, loading } = useAuth();
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const qc = useQueryClient();

  const [transcriptDraft, setTranscriptDraft] = useState<string>('');
  const [title, setTitle] = useState('');
  const [preacher, setPreacher] = useState('');
  const [series, setSeries] = useState('');
  const [saving, setSaving] = useState(false);
  const [transcribing, setTranscribing] = useState(false);
  const [generatingType, setGeneratingType] = useState<string | null>(null);

  const { data: sermon, isLoading, refetch } = useQuery({
    enabled: !!id && !!user,
    queryKey: ['sermon', id],
    queryFn: async () => {
      const { data, error } = await supabase.from('church_sermons').select('*, church:church_providers!inner(id, user_id, slug)').eq('id', id!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: variants = [] } = useQuery({
    enabled: !!id,
    queryKey: ['sermon-variants', id],
    queryFn: async () => {
      const { data } = await supabase.from('church_sermon_variants').select('*').eq('sermon_id', id!).order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const { data: pdfs = [], refetch: refetchPdfs } = useQuery({
    enabled: !!id,
    queryKey: ['sermon-pdfs', id],
    queryFn: async () => {
      const { data } = await supabase.from('church_sermon_pdfs').select('*').eq('sermon_id', id!).order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const [pdfGenId, setPdfGenId] = useState<string | null>(null);


  useEffect(() => {
    if (sermon) {
      setTranscriptDraft(sermon.transcript || '');
      setTitle(sermon.title || '');
      setPreacher(sermon.preacher || '');
      setSeries(sermon.series || '');
      document.title = `${sermon.title} — SiteViral Church`;
    }
  }, [sermon]);

  // Poll while transcribing
  useEffect(() => {
    if (sermon?.transcript_status !== 'transcribing') return;
    const t = setInterval(() => refetch(), 4000);
    return () => clearInterval(t);
  }, [sermon?.transcript_status, refetch]);

  if (loading || isLoading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!user) return <Navigate to="/auth" replace />;
  if (!sermon) return <Navigate to="/admin/church/sermons" replace />;
  if ((sermon as any).church?.user_id !== user.id) return <Navigate to="/dashboard" replace />;

  const unclear: Array<{ start_s: number; end_s: number }> = Array.isArray(sermon.unclear_sections) ? (sermon.unclear_sections as any) : [];

  const saveMeta = async () => {
    setSaving(true);
    const { error } = await supabase.from('church_sermons').update({
      title: title.trim(),
      preacher: preacher.trim() || null,
      series: series.trim() || null,
      transcript: transcriptDraft,
    }).eq('id', sermon.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(fr ? 'Enregistré' : 'Saved');
    qc.invalidateQueries({ queryKey: ['sermon', id] });
  };

  const runTranscribe = async () => {
    setTranscribing(true);
    const { error } = await supabase.functions.invoke('church-transcribe-sermon', { body: { sermon_id: sermon.id } });
    setTranscribing(false);
    if (error) return toast.error(error.message);
    toast.success(fr ? 'Transcription terminée' : 'Transcription completed');
    refetch();
  };

  const generateVariant = async (type: string) => {
    setGeneratingType(type);
    const { error } = await supabase.functions.invoke('church-generate-variant', { body: { sermon_id: sermon.id, type } });
    setGeneratingType(null);
    if (error) return toast.error(error.message);
    toast.success(fr ? 'Variante générée (brouillon)' : 'Variant generated (draft)');
    qc.invalidateQueries({ queryKey: ['sermon-variants', id] });
  };

  const publishSermon = async () => {
    const { error } = await supabase.from('church_sermons').update({
      status: 'published',
      published_at: new Date().toISOString(),
    }).eq('id', sermon.id);
    if (error) return toast.error(error.message);
    toast.success(fr ? 'Prédication publiée' : 'Sermon published');
    refetch();
  };

  const generatePdfFromVariant = async (variant: any, kind: string) => {
    setPdfGenId(variant?.id || 'transcript');
    try {
      const { data, error } = await supabase.functions.invoke('church-generate-sermon-pdf', {
        body: {
          sermon_id: sermon.id,
          variant_id: variant?.id || null,
          kind,
          is_free: true,
          price: 0,
          currency: (sermon as any).currency || 'XOF',
        },
      });
      if (error) throw new Error(error.message);
      if ((data as any)?.error) throw new Error((data as any).error);
      toast.success(fr ? 'PDF généré (brouillon)' : 'PDF generated (draft)');
      refetchPdfs();
    } catch (e: any) {
      toast.error(e?.message || (fr ? 'Erreur PDF' : 'PDF error'));
    } finally {
      setPdfGenId(null);
    }
  };

  const updatePdf = async (pdfId: string, patch: any) => {
    const { error } = await supabase.from('church_sermon_pdfs').update(patch).eq('id', pdfId);
    if (error) return toast.error(error.message);
    refetchPdfs();
  };

  const deletePdf = async (pdfId: string) => {
    if (!confirm(fr ? 'Supprimer ce PDF ?' : 'Delete this PDF?')) return;
    const { error } = await supabase.from('church_sermon_pdfs').delete().eq('id', pdfId);
    if (error) return toast.error(error.message);
    toast.success(fr ? 'PDF supprimé' : 'PDF deleted');
    refetchPdfs();
  };


  const transcriptReady = sermon.transcript_status === 'ready' && (sermon.transcript || '').trim().length > 200;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild><Link to="/admin/church/sermons"><ArrowLeft className="h-5 w-5" /></Link></Button>
            <div>
              <p className="text-xs text-muted-foreground">SiteViral Church · {fr ? 'Prédication' : 'Sermon'}</p>
              <h1 className="text-xl font-bold truncate">{sermon.title}</h1>
            </div>
          </div>
          {sermon.status !== 'published' ? (
            <Button size="sm" onClick={publishSermon} disabled={!transcriptReady}>
              <Send className="mr-1.5 h-4 w-4" /> {fr ? 'Publier' : 'Publish'}
            </Button>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-1"><CheckCircle2 className="h-3.5 w-3.5" /> {fr ? 'Publiée' : 'Published'}</span>
          )}
        </div>

        {/* Metadata */}
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="grid gap-3 md:grid-cols-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{fr ? 'Titre' : 'Title'}</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{fr ? 'Prédicateur' : 'Preacher'}</Label>
              <Input value={preacher} onChange={(e) => setPreacher(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{fr ? 'Série' : 'Series'}</Label>
              <Input value={series} onChange={(e) => setSeries(e.target.value)} />
            </div>
          </div>
        </div>

        <Tabs defaultValue="transcript">
          <TabsList>
            <TabsTrigger value="transcript"><FileText className="h-3.5 w-3.5 mr-1.5" /> {fr ? 'Transcription' : 'Transcript'}</TabsTrigger>
            <TabsTrigger value="ai"><Sparkles className="h-3.5 w-3.5 mr-1.5" /> {fr ? 'Contenus IA' : 'AI Content'}</TabsTrigger>
            <TabsTrigger value="pdfs"><FileDown className="h-3.5 w-3.5 mr-1.5" /> {fr ? 'PDFs' : 'PDFs'}{pdfs.length > 0 ? ` (${pdfs.length})` : ''}</TabsTrigger>
          </TabsList>


          <TabsContent value="transcript" className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
              <div className="flex items-center justify-between gap-2 flex-wrap">
                <div className="flex items-center gap-2">
                  <StatusPill status={sermon.transcript_status} fr={fr} />
                  {sermon.transcript_language && <span className="text-xs text-muted-foreground uppercase">· {sermon.transcript_language}</span>}
                </div>
                <Button variant="outline" size="sm" onClick={runTranscribe} disabled={transcribing || sermon.transcript_status === 'transcribing'}>
                  {transcribing || sermon.transcript_status === 'transcribing' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <RefreshCw className="mr-1.5 h-4 w-4" />}
                  {sermon.transcript ? (fr ? 'Re-transcrire' : 'Re-transcribe') : (fr ? 'Transcrire' : 'Transcribe')}
                </Button>
              </div>

              {unclear.length > 0 && (
                <div className="rounded-lg border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-900/20 p-3 text-xs text-amber-900 dark:text-amber-100 flex gap-2">
                  <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
                  <div>
                    <p className="font-semibold">{fr ? `${unclear.length} passage(s) peu clair(s)` : `${unclear.length} unclear section(s)`}</p>
                    <p className="mt-1">{fr ? 'L\'IA n\'a rien inventé. Vérifiez ces passages avant de générer du contenu.' : 'AI did not fabricate. Verify these passages before generating content.'}</p>
                    <p className="mt-1 font-mono">{unclear.slice(0, 6).map((u) => `${fmt(u.start_s)}–${fmt(u.end_s)}`).join(', ')}</p>
                  </div>
                </div>
              )}

              <Textarea
                value={transcriptDraft}
                onChange={(e) => setTranscriptDraft(e.target.value)}
                rows={16}
                placeholder={fr ? 'La transcription apparaîtra ici. Vous pouvez la corriger avant de générer les contenus IA.' : 'Transcript appears here. Edit it before generating AI content.'}
                className="font-mono text-xs"
              />

              <div className="flex justify-end">
                <Button onClick={saveMeta} disabled={saving} size="sm">
                  {saving ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <Save className="mr-1.5 h-4 w-4" />}
                  {fr ? 'Enregistrer' : 'Save'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="ai" className="space-y-4">
            {!transcriptReady ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
                <Sparkles className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">{fr ? 'Transcrivez d\'abord la prédication' : 'Transcribe the sermon first'}</p>
                <p className="text-xs text-muted-foreground mt-1">{fr ? 'Une transcription d\'au moins 200 caractères est requise.' : 'A transcript of at least 200 characters is required.'}</p>
              </div>
            ) : (
              <>
                <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3">
                  {VARIANT_META.map((v) => (
                    <button
                      key={v.type}
                      onClick={() => generateVariant(v.type)}
                      disabled={!!generatingType}
                      className="rounded-2xl border border-border bg-card p-4 text-left hover:border-primary/40 hover:shadow-sm transition-all disabled:opacity-50"
                    >
                      <div className="flex items-center justify-between mb-2">
                        <v.icon className="h-4 w-4 text-primary" />
                        {generatingType === v.type && <Loader2 className="h-4 w-4 animate-spin text-primary" />}
                      </div>
                      <p className="font-semibold text-sm">{fr ? v.fr : v.en}</p>
                      <p className="text-xs text-muted-foreground mt-1">{fr ? 'Générer un brouillon' : 'Generate a draft'}</p>
                    </button>
                  ))}
                </div>

                {variants.length > 0 && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-muted-foreground">{fr ? 'Brouillons générés' : 'Generated drafts'}</h3>
                    {variants.map((v: any) => (
                      <VariantCard
                        key={v.id}
                        variant={v}
                        fr={fr}
                        onGeneratePdf={(kind) => generatePdfFromVariant(v, kind)}
                        pdfBusy={pdfGenId === v.id}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </TabsContent>

          <TabsContent value="pdfs" className="space-y-4">
            <div className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-center justify-between gap-2 flex-wrap mb-2">
                <div>
                  <h3 className="font-semibold text-sm">{fr ? 'PDFs de la prédication' : 'Sermon PDFs'}</h3>
                  <p className="text-xs text-muted-foreground">{fr ? 'Générés depuis la transcription ou les brouillons IA. Vendez-les pour financer le ministère.' : 'Generated from transcript or AI drafts. Sell them to fund the ministry.'}</p>
                </div>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => generatePdfFromVariant(null, 'transcript')}
                  disabled={!transcriptReady || pdfGenId === 'transcript'}
                >
                  {pdfGenId === 'transcript' ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : <FileDown className="mr-1.5 h-4 w-4" />}
                  {fr ? 'Générer PDF de la transcription' : 'Generate transcript PDF'}
                </Button>
              </div>
            </div>

            {pdfs.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
                <FileDown className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm">{fr ? 'Aucun PDF pour l\'instant.' : 'No PDFs yet.'}</p>
              </div>
            ) : (
              <div className="space-y-3">
                {pdfs.map((p: any) => (
                  <PdfCard
                    key={p.id}
                    pdf={p}
                    fr={fr}
                    onUpdate={(patch) => updatePdf(p.id, patch)}
                    onDelete={() => deletePdf(p.id)}
                    churchSlug={(sermon as any).church.slug}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}


function StatusPill({ status, fr }: { status?: string | null; fr: boolean }) {
  const map: Record<string, { label: string; cls: string }> = {
    ready: { label: fr ? 'Prête' : 'Ready', cls: 'bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300' },
    transcribing: { label: fr ? 'En cours…' : 'Transcribing…', cls: 'bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300' },
    failed: { label: fr ? 'Échec' : 'Failed', cls: 'bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300' },
    pending: { label: fr ? 'En attente' : 'Pending', cls: 'bg-muted text-muted-foreground' },
  };
  const m = map[status || 'pending'] || map.pending;
  return <span className={`text-[10px] rounded-full px-2 py-0.5 ${m.cls}`}>{m.label}</span>;
}

function VariantCard({ variant, fr, onGeneratePdf, pdfBusy }: { variant: any; fr: boolean; onGeneratePdf?: (kind: string) => void; pdfBusy?: boolean }) {
  const meta = VARIANT_META.find((m) => m.type === variant.type);
  const Icon = meta?.icon || FileText;
  const label = meta ? (fr ? meta.fr : meta.en) : variant.type;
  const text = JSON.stringify(variant.content, null, 2);
  const pdfEligible = ['notes', 'ebook', 'blog', 'summary'].includes(variant.type);
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-primary" />
          <span className="font-semibold text-sm">{label}</span>
          <span className="text-[10px] rounded-full bg-muted text-muted-foreground px-2 py-0.5">{fr ? 'Brouillon' : 'Draft'}</span>
        </div>
        <div className="flex items-center gap-1">
          {pdfEligible && onGeneratePdf && (
            <Button variant="ghost" size="sm" onClick={() => onGeneratePdf(variant.type)} disabled={pdfBusy}>
              {pdfBusy ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
              <span className="ml-1 text-xs">PDF</span>
            </Button>
          )}
          <Button variant="ghost" size="sm" onClick={() => { navigator.clipboard.writeText(text); toast.success(fr ? 'Copié' : 'Copied'); }}>
            <Copy className="h-3.5 w-3.5" />
          </Button>
        </div>
      </div>
      <pre className="text-xs bg-muted/30 rounded-lg p-3 overflow-auto max-h-64 whitespace-pre-wrap font-mono">{text}</pre>
      <p className="text-[10px] text-muted-foreground">{new Date(variant.created_at).toLocaleString(fr ? 'fr-FR' : 'en-US')} · {variant.generated_by_model}</p>
    </div>
  );
}

function PdfCard({ pdf, fr, onUpdate, onDelete, churchSlug }: { pdf: any; fr: boolean; onUpdate: (p: any) => void; onDelete: () => void; churchSlug: string }) {
  const [price, setPrice] = useState<string>(String(pdf.price ?? 0));
  const [currency, setCurrency] = useState<string>(pdf.currency || 'XOF');
  const [isFree, setIsFree] = useState<boolean>(!!pdf.is_free);
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{pdf.title}</p>
          <p className="text-[10px] text-muted-foreground">{pdf.page_count || 0} {fr ? 'pages' : 'pages'} · {((pdf.file_size_bytes || 0) / 1024).toFixed(0)} KB · {pdf.kind}</p>
        </div>
        <div className="flex items-center gap-1 shrink-0">
          <Button variant="ghost" size="sm" onClick={() => onUpdate({ is_published: !pdf.is_published })}>
            {pdf.is_published ? <><Eye className="h-3.5 w-3.5 mr-1" />{fr ? 'Publié' : 'Live'}</> : <><EyeOff className="h-3.5 w-3.5 mr-1" />{fr ? 'Brouillon' : 'Draft'}</>}
          </Button>
          <Button variant="ghost" size="sm" onClick={onDelete}>
            <Trash2 className="h-3.5 w-3.5 text-destructive" />
          </Button>
        </div>
      </div>
      <div className="grid grid-cols-3 gap-2">
        <label className="flex items-center gap-2 text-xs col-span-3">
          <input type="checkbox" checked={isFree} onChange={(e) => { setIsFree(e.target.checked); onUpdate({ is_free: e.target.checked, price: e.target.checked ? 0 : Number(price) || 0 }); }} />
          {fr ? 'Gratuit' : 'Free'}
        </label>
        {!isFree && (
          <>
            <div className="col-span-2 space-y-1">
              <Label className="text-[10px]">{fr ? 'Prix' : 'Price'}</Label>
              <Input type="number" value={price} onChange={(e) => setPrice(e.target.value)} onBlur={() => onUpdate({ price: Number(price) || 0 })} />
            </div>
            <div className="space-y-1">
              <Label className="text-[10px]">{fr ? 'Devise' : 'Currency'}</Label>
              <select value={currency} onChange={(e) => { setCurrency(e.target.value); onUpdate({ currency: e.target.value }); }} className="w-full h-9 rounded-md border border-input bg-background px-2 text-xs">
                {['XOF','XAF','EUR','USD','GBP','CAD'].map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
          </>
        )}
      </div>
      {pdf.is_published && (
        <div className="flex items-center gap-2 text-[11px] text-muted-foreground">
          <DollarSign className="h-3 w-3" /> {pdf.sales_count || 0} {fr ? 'ventes' : 'sales'}
          <span className="mx-1">·</span>
          <Link to={`/church/${churchSlug}/pdf/${pdf.id}`} className="text-primary hover:underline" target="_blank">
            {fr ? 'Voir la page publique' : 'View public page'}
          </Link>
        </div>
      )}
    </div>
  );
}

function fmt(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, '0')}`;
}
