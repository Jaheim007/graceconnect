import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Megaphone, Plus, Pin, PinOff, Trash2, Eye, EyeOff } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { toast } from 'sonner';
import { askConfirm } from '@/components/ui/confirm-dialog';

export default function ChurchProAnnouncements() {
  const { user, loading } = useAuth();
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  useEffect(() => { document.title = fr ? 'Annonces — SiteViral Church' : 'Announcements — SiteViral Church'; }, [fr]);

  const { data: church } = useQuery({
    enabled: !!user,
    queryKey: ['church-owner-ann', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('church_providers').select('id').eq('user_id', user!.id).maybeSingle();
      return data;
    },
  });

  const { data: items = [], isLoading } = useQuery({
    enabled: !!church?.id,
    queryKey: ['church-announcements', church?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('church_announcements')
        .select('*')
        .eq('church_id', church!.id)
        .order('pinned', { ascending: false })
        .order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['church-announcements', church?.id] });

  if (loading) return <Spin />;
  if (!user) return <Navigate to="/auth?returnTo=/admin/church/announcements" replace />;
  if (!church) return <Navigate to="/church/pro/onboarding" replace />;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild><Link to="/dashboard"><ArrowLeft className="h-5 w-5" /></Link></Button>
            <div>
              <p className="text-xs text-muted-foreground">SiteViral Church</p>
              <h1 className="text-xl font-bold flex items-center gap-2"><Megaphone className="h-5 w-5 text-primary" /> {fr ? 'Annonces' : 'Announcements'}</h1>
            </div>
          </div>
          <Button onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> {fr ? 'Nouvelle' : 'New'}</Button>
        </div>

        {isLoading ? <Spin /> : items.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <Megaphone className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
            <p className="font-medium">{fr ? 'Aucune annonce' : 'No announcements'}</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">{fr ? 'Partagez des nouvelles avec votre communauté.' : 'Share news with your community.'}</p>
            <Button onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> {fr ? 'Créer une annonce' : 'Create announcement'}</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {items.map((a) => (
              <div key={a.id} className="rounded-2xl border border-border bg-card p-4 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      {a.pinned && <Pin className="h-3.5 w-3.5 text-primary" />}
                      <p className="font-semibold">{a.title}</p>
                      <span className={`text-[10px] uppercase rounded-full px-2 py-0.5 ${a.status === 'published' ? 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300' : 'bg-muted text-muted-foreground'}`}>
                        {a.status === 'published' ? (fr ? 'Publié' : 'Published') : (fr ? 'Brouillon' : 'Draft')}
                      </span>
                    </div>
                    <p className="text-[11px] text-muted-foreground mt-1">{new Date(a.created_at).toLocaleString(fr ? 'fr-FR' : 'en-US')}</p>
                  </div>
                </div>
                {a.body && <p className="text-sm whitespace-pre-wrap leading-relaxed text-muted-foreground">{a.body}</p>}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={async () => {
                    const next = a.status === 'published' ? 'draft' : 'published';
                    await supabase.from('church_announcements').update({ status: next, published_at: next === 'published' ? new Date().toISOString() : null }).eq('id', a.id);
                    invalidate();
                  }}>
                    {a.status === 'published' ? <><EyeOff className="mr-1.5 h-3.5 w-3.5" /> {fr ? 'Dépublier' : 'Unpublish'}</> : <><Eye className="mr-1.5 h-3.5 w-3.5" /> {fr ? 'Publier' : 'Publish'}</>}
                  </Button>
                  <Button size="sm" variant="outline" onClick={async () => {
                    await supabase.from('church_announcements').update({ pinned: !a.pinned }).eq('id', a.id);
                    invalidate();
                  }}>
                    {a.pinned ? <><PinOff className="mr-1.5 h-3.5 w-3.5" /> {fr ? 'Détacher' : 'Unpin'}</> : <><Pin className="mr-1.5 h-3.5 w-3.5" /> {fr ? 'Épingler' : 'Pin'}</>}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={async () => {
                    if (!(await askConfirm(fr ? 'Supprimer cette annonce ?' : 'Delete this announcement?'))) return;
                    await supabase.from('church_announcements').delete().eq('id', a.id);
                    invalidate();
                  }}><Trash2 className="h-3.5 w-3.5 text-muted-foreground" /></Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <NewAnnouncementDialog
        open={open}
        onOpenChange={setOpen}
        churchId={church.id}
        onCreated={() => { invalidate(); setOpen(false); }}
      />
    </div>
  );
}

function Spin() { return <div className="min-h-[40vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>; }

function NewAnnouncementDialog({ open, onOpenChange, churchId, onCreated }: {
  open: boolean; onOpenChange: (v: boolean) => void; churchId: string; onCreated: () => void;
}) {
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const [title, setTitle] = useState('');
  const [body, setBody] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async (asPublished: boolean) => {
    if (!title.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('church_announcements').insert({
      church_id: churchId,
      title: title.trim(),
      body: body.trim() || null,
      status: asPublished ? 'published' : 'draft',
      published_at: asPublished ? new Date().toISOString() : null,
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(asPublished ? (fr ? 'Annonce publiée' : 'Announcement published') : (fr ? 'Brouillon enregistré' : 'Draft saved'));
    setTitle(''); setBody('');
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{fr ? 'Nouvelle annonce' : 'New announcement'}</DialogTitle>
          <DialogDescription>{fr ? 'Partagez une nouvelle avec votre communauté.' : 'Share news with your community.'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{fr ? 'Titre' : 'Title'} *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={fr ? 'Ex: Culte spécial dimanche' : 'e.g. Special Sunday service'} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{fr ? 'Message' : 'Message'}</Label>
            <Textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => submit(false)} disabled={saving || !title.trim()}>
            {fr ? 'Enregistrer' : 'Save draft'}
          </Button>
          <Button onClick={() => submit(true)} disabled={saving || !title.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (fr ? 'Publier' : 'Publish')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
