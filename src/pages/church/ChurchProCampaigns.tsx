import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, HandHeart, Plus, Share2, ExternalLink, Trash2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { toast } from 'sonner';

export default function ChurchProCampaigns() {
  const { user, loading } = useAuth();
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  useEffect(() => { document.title = fr ? 'Campagnes — SiteViral Church' : 'Campaigns — SiteViral Church'; }, [fr]);

  const { data: church } = useQuery({
    enabled: !!user,
    queryKey: ['church-owner-camp', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('church_providers').select('id, slug, name, currency').eq('user_id', user!.id).maybeSingle();
      return data;
    },
  });

  const { data: campaigns = [], isLoading } = useQuery({
    enabled: !!church?.id,
    queryKey: ['church-campaigns', church?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('church_campaigns')
        .select('*')
        .eq('church_id', church!.id)
        .order('created_at', { ascending: false });
      return data ?? [];
    },
  });

  if (loading) return <Spin />;
  if (!user) return <Navigate to="/auth?returnTo=/church/pro/campaigns" replace />;
  if (!church) return <Navigate to="/church/pro/onboarding" replace />;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild><Link to="/church/pro"><ArrowLeft className="h-5 w-5" /></Link></Button>
            <div>
              <p className="text-xs text-muted-foreground">SiteViral Church</p>
              <h1 className="text-xl font-bold flex items-center gap-2"><HandHeart className="h-5 w-5 text-primary" /> {fr ? 'Campagnes' : 'Campaigns'}</h1>
            </div>
          </div>
          <Button onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> {fr ? 'Nouvelle' : 'New'}</Button>
        </div>

        {isLoading ? <Spin /> : campaigns.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <HandHeart className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
            <p className="font-medium">{fr ? 'Aucune campagne' : 'No campaigns'}</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">{fr ? 'Créez une campagne (construction d\'église, aide médicale, missions…)' : 'Create a campaign (church building, medical aid, missions…)'}</p>
            <Button onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> {fr ? 'Créer une campagne' : 'Create campaign'}</Button>
          </div>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {campaigns.map((c) => {
              const pct = c.goal_amount ? Math.min(100, (Number(c.raised_amount || 0) / Number(c.goal_amount)) * 100) : 0;
              const shareUrl = `${window.location.origin}/church/${church.slug}/give?campaign=${c.id}`;
              return (
                <div key={c.id} className="rounded-2xl border border-border bg-card p-4 space-y-3">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-semibold truncate">{c.title}</p>
                      <span className="text-[10px] rounded-full bg-muted text-muted-foreground px-2 py-0.5 mt-1 inline-block">{c.status}</span>
                    </div>
                    <Button variant="ghost" size="icon" onClick={async () => {
                      if (!confirm(fr ? 'Supprimer cette campagne ?' : 'Delete this campaign?')) return;
                      await supabase.from('church_campaigns').delete().eq('id', c.id);
                      qc.invalidateQueries({ queryKey: ['church-campaigns', church.id] });
                    }}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                  </div>
                  {c.description && <p className="text-xs text-muted-foreground line-clamp-2">{c.description}</p>}
                  {c.goal_amount && (
                    <div>
                      <div className="h-2 rounded-full bg-muted overflow-hidden">
                        <div className="h-full bg-primary" style={{ width: `${pct}%` }} />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {Number(c.raised_amount || 0).toLocaleString()} / {Number(c.goal_amount).toLocaleString()} {c.currency}
                      </p>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="flex-1" onClick={() => { navigator.clipboard.writeText(shareUrl); toast.success(fr ? 'Lien copié' : 'Link copied'); }}>
                      <Share2 className="mr-1.5 h-3.5 w-3.5" /> {fr ? 'Partager' : 'Share'}
                    </Button>
                    <Button size="sm" variant="ghost" asChild>
                      <Link to={shareUrl.replace(window.location.origin, '')} target="_blank"><ExternalLink className="h-3.5 w-3.5" /></Link>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <NewCampaignDialog
        open={open}
        onOpenChange={setOpen}
        churchId={church.id}
        defaultCurrency={church.currency || 'XOF'}
        onCreated={() => { qc.invalidateQueries({ queryKey: ['church-campaigns', church.id] }); setOpen(false); }}
      />
    </div>
  );
}

function Spin() { return <div className="min-h-[40vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>; }

function NewCampaignDialog({ open, onOpenChange, churchId, defaultCurrency, onCreated }: {
  open: boolean; onOpenChange: (v: boolean) => void; churchId: string; defaultCurrency: string; onCreated: () => void;
}) {
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [goal, setGoal] = useState('');
  const [currency, setCurrency] = useState(defaultCurrency);
  const [saving, setSaving] = useState(false);

  useEffect(() => setCurrency(defaultCurrency), [defaultCurrency]);

  const submit = async () => {
    if (!title.trim()) return;
    setSaving(true);
    const { error } = await supabase.from('church_campaigns').insert({
      church_id: churchId,
      title: title.trim(),
      description: description.trim() || null,
      goal_amount: goal ? Number(goal) : null,
      currency,
      status: 'active',
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(fr ? 'Campagne créée' : 'Campaign created');
    setTitle(''); setDescription(''); setGoal('');
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{fr ? 'Nouvelle campagne' : 'New campaign'}</DialogTitle>
          <DialogDescription>{fr ? 'Créez une collecte avec un objectif à atteindre.' : 'Create a fundraiser with a goal.'}</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{fr ? 'Titre' : 'Title'} *</Label>
            <Input value={title} onChange={(e) => setTitle(e.target.value)} placeholder={fr ? 'Ex: Construction du nouveau sanctuaire' : 'e.g. New sanctuary building'} />
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">{fr ? 'Description' : 'Description'}</Label>
            <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} />
          </div>
          <div className="grid grid-cols-[1fr_120px] gap-3">
            <div className="space-y-1.5">
              <Label className="text-xs">{fr ? 'Objectif' : 'Goal'}</Label>
              <Input type="number" value={goal} onChange={(e) => setGoal(e.target.value)} placeholder="1000000" />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">{fr ? 'Devise' : 'Currency'}</Label>
              <select value={currency} onChange={(e) => setCurrency(e.target.value)} className="w-full h-10 border border-border bg-transparent rounded-md px-2 text-sm">
                {['XOF', 'XAF', 'EUR', 'USD'].map((c) => <option key={c}>{c}</option>)}
              </select>
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>{fr ? 'Annuler' : 'Cancel'}</Button>
          <Button onClick={submit} disabled={saving || !title.trim()}>{saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (fr ? 'Créer' : 'Create')}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
