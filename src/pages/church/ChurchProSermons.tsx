import { useEffect, useRef, useState } from 'react';
import { Link, Navigate } from '@/lib/router-compat';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Mic, Upload, Loader2, Zap, CheckCircle2, AlertTriangle, Clock, Plus, FileAudio } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { toast } from 'sonner';

const MAX_MB = 24;

export default function ChurchProSermons() {
  const { user, loading } = useAuth();
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const qc = useQueryClient();
  const [openUpload, setOpenUpload] = useState(false);

  useEffect(() => {
    document.title = fr ? 'Prédications — SiteViral Church' : 'Sermons — SiteViral Church';
  }, [fr]);

  const { data: church } = useQuery({
    enabled: !!user,
    queryKey: ['church-owner', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('church_providers').select('id, slug, name').eq('user_id', user!.id).maybeSingle();
      return data;
    },
  });

  const { data: sermons = [], isLoading } = useQuery({
    enabled: !!church?.id,
    queryKey: ['church-sermons', church?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('church_sermons')
        .select('id, title, preacher, series, duration_s, transcript_status, status, created_at, published_at')
        .eq('church_id', church!.id)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  if (loading) return <Spinner />;
  if (!user) return <Navigate to="/auth?returnTo=/admin/church/sermons" replace />;
  if (!church) return <Navigate to="/church/pro/onboarding" replace />;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild><Link to="/dashboard"><ArrowLeft className="h-5 w-5" /></Link></Button>
            <div>
              <p className="text-xs text-muted-foreground">SiteViral Church</p>
              <h1 className="text-xl font-bold flex items-center gap-2"><Mic className="h-5 w-5 text-primary" /> {fr ? 'Prédications & IA' : 'Sermons & AI'}</h1>
            </div>
          </div>
          <Button onClick={() => setOpenUpload(true)}><Plus className="mr-1.5 h-4 w-4" /> {fr ? 'Nouvelle' : 'New'}</Button>
        </div>

        {isLoading ? (
          <Spinner />
        ) : sermons.length === 0 ? (
          <EmptyState fr={fr} onUpload={() => setOpenUpload(true)} />
        ) : (
          <div className="space-y-3">
            {sermons.map((s) => (
              <Link key={s.id} to={`/church/pro/sermons/${s.id}`} className="block rounded-2xl border border-border bg-card p-4 hover:border-primary/40 hover:shadow-xs transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="font-semibold truncate">{s.title}</h3>
                      <StatusBadge status={s.status} fr={fr} />
                      <TranscriptBadge status={s.transcript_status} fr={fr} />
                    </div>
                    {s.preacher && <p className="text-xs text-muted-foreground mt-1">{s.preacher}{s.series ? ` · ${s.series}` : ''}</p>}
                    <p className="text-xs text-muted-foreground mt-1">
                      {s.duration_s ? `${Math.floor(s.duration_s / 60)} min · ` : ''}
                      {new Date(s.created_at).toLocaleDateString(fr ? 'fr-FR' : 'en-US')}
                    </p>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>

      <UploadDialog
        open={openUpload}
        onOpenChange={setOpenUpload}
        churchId={church.id}
        onCreated={() => {
          qc.invalidateQueries({ queryKey: ['church-sermons', church.id] });
          setOpenUpload(false);
        }}
      />
    </div>
  );
}

function Spinner() {
  return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
}

function EmptyState({ fr, onUpload }: { fr: boolean; onUpload: () => void }) {
  return (
    <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
      <div className="h-12 w-12 mx-auto rounded-xl bg-primary/10 flex items-center justify-center mb-4">
        <FileAudio className="h-6 w-6 text-primary" />
      </div>
      <h2 className="font-semibold mb-1">{fr ? 'Aucune prédication' : 'No sermons yet'}</h2>
      <p className="text-sm text-muted-foreground max-w-md mx-auto mb-4">
        {fr ? 'Uploadez votre premier audio. L\'IA transcrit puis génère notes, résumé, WhatsApp, ebook et bien plus.' : 'Upload your first audio. AI transcribes it and generates notes, summary, WhatsApp posts, ebook and more.'}
      </p>
      <Button onClick={onUpload}><Upload className="mr-1.5 h-4 w-4" /> {fr ? 'Uploader un audio' : 'Upload audio'}</Button>
    </div>
  );
}

function StatusBadge({ status, fr }: { status: string; fr: boolean }) {
  if (status === 'published') return <span className="text-[10px] rounded-full bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 px-2 py-0.5">{fr ? 'Publiée' : 'Published'}</span>;
  return <span className="text-[10px] rounded-full bg-muted text-muted-foreground px-2 py-0.5">{fr ? 'Brouillon' : 'Draft'}</span>;
}

function TranscriptBadge({ status, fr }: { status?: string | null; fr: boolean }) {
  if (status === 'ready') return <span className="inline-flex items-center gap-1 text-[10px] rounded-full bg-primary/10 text-primary px-2 py-0.5"><CheckCircle2 className="h-3 w-3" /> {fr ? 'Transcrite' : 'Transcribed'}</span>;
  if (status === 'transcribing') return <span className="inline-flex items-center gap-1 text-[10px] rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 px-2 py-0.5"><Loader2 className="h-3 w-3 animate-spin" /> {fr ? 'Transcription…' : 'Transcribing…'}</span>;
  if (status === 'failed') return <span className="inline-flex items-center gap-1 text-[10px] rounded-full bg-rose-100 dark:bg-rose-900/30 text-rose-700 dark:text-rose-300 px-2 py-0.5"><AlertTriangle className="h-3 w-3" /> {fr ? 'Échec' : 'Failed'}</span>;
  return <span className="inline-flex items-center gap-1 text-[10px] rounded-full bg-muted text-muted-foreground px-2 py-0.5"><Clock className="h-3 w-3" /> {fr ? 'En attente' : 'Pending'}</span>;
}

function UploadDialog({ open, onOpenChange, churchId, onCreated }: {
  open: boolean; onOpenChange: (v: boolean) => void; churchId: string; onCreated: () => void;
}) {
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const [title, setTitle] = useState('');
  const [preacher, setPreacher] = useState('');
  const [series, setSeries] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [rights, setRights] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const reset = () => {
    setTitle(''); setPreacher(''); setSeries(''); setDescription('');
    setFile(null); setRights(false); if (fileRef.current) fileRef.current.value = '';
  };

  const handleFile = (f: File | null) => {
    if (!f) return setFile(null);
    if (!f.type.startsWith('audio/')) return toast.error(fr ? 'Fichier audio uniquement' : 'Audio files only');
    if (f.size > MAX_MB * 1024 * 1024) return toast.error(fr ? `Max ${MAX_MB} Mo` : `Max ${MAX_MB} MB`);
    setFile(f);
  };

  const submit = async () => {
    if (!title.trim() || !file || !rights) return;
    setUploading(true);
    try {
      const ext = file.name.split('.').pop()?.toLowerCase() || 'mp3';
      const path = `${churchId}/${crypto.randomUUID()}.${ext}`;
      const { error: upErr } = await supabase.storage.from('church-sermons').upload(path, file, {
        contentType: file.type,
        upsert: false,
      });
      if (upErr) throw upErr;

      const { data: sermon, error: insErr } = await supabase
        .from('church_sermons')
        .insert({
          church_id: churchId,
          title: title.trim(),
          preacher: preacher.trim() || null,
          series: series.trim() || null,
          description: description.trim() || null,
          audio_url: path,
          status: 'draft',
          transcript_status: 'pending',
          rights_confirmed_at: new Date().toISOString(),
          is_free: true,
        })
        .select('id')
        .single();
      if (insErr) throw insErr;

      toast.success(fr ? 'Prédication ajoutée' : 'Sermon added');
      reset();
      onCreated();

      // Kick off transcription in background
      supabase.functions.invoke('church-transcribe-sermon', { body: { sermon_id: sermon.id } })
        .then(({ error }) => {
          if (error) toast.error(fr ? `Transcription: ${error.message}` : `Transcription: ${error.message}`);
          else toast.success(fr ? 'Transcription terminée' : 'Transcription completed');
        });
    } catch (e: any) {
      toast.error(e?.message || (fr ? 'Erreur' : 'Error'));
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>{fr ? 'Nouvelle prédication' : 'New sermon'}</DialogTitle>
          <DialogDescription>
            {fr ? 'Uploadez l\'audio. L\'IA le transcrit automatiquement.' : 'Upload the audio. AI will transcribe it automatically.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <Label htmlFor="title" className="text-xs">{fr ? 'Titre' : 'Title'} *</Label>
            <Input id="title" value={title} onChange={(e) => setTitle(e.target.value)} required />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="preacher" className="text-xs">{fr ? 'Prédicateur' : 'Preacher'}</Label>
              <Input id="preacher" value={preacher} onChange={(e) => setPreacher(e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="series" className="text-xs">{fr ? 'Série' : 'Series'}</Label>
              <Input id="series" value={series} onChange={(e) => setSeries(e.target.value)} />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="desc" className="text-xs">{fr ? 'Description' : 'Description'}</Label>
            <Textarea id="desc" rows={2} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="audio" className="text-xs">{fr ? 'Fichier audio (MP3, WAV, M4A · max 24 Mo)' : 'Audio file (MP3, WAV, M4A · max 24 MB)'} *</Label>
            <Input id="audio" ref={fileRef} type="file" accept="audio/*" onChange={(e) => handleFile(e.target.files?.[0] || null)} />
            {file && <p className="text-xs text-muted-foreground">{file.name} · {(file.size / 1024 / 1024).toFixed(1)} Mo</p>}
          </div>
          <div className="flex items-start gap-2 rounded-lg border border-border bg-muted/30 p-3">
            <Checkbox id="rights" checked={rights} onCheckedChange={(v) => setRights(!!v)} className="mt-0.5" />
            <label htmlFor="rights" className="text-xs leading-snug cursor-pointer">
              {fr
                ? 'Je confirme avoir la permission d\'uploader et de publier ce contenu de l\'église.'
                : 'I confirm I have permission to upload and publish this church content.'}
            </label>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={uploading}>{fr ? 'Annuler' : 'Cancel'}</Button>
          <Button onClick={submit} disabled={uploading || !title.trim() || !file || !rights}>
            {uploading ? <Loader2 className="mr-1.5 h-4 w-4 animate-spin" /> : null}
            {fr ? 'Uploader et transcrire' : 'Upload & transcribe'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
