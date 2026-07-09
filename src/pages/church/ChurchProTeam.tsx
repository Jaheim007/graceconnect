import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Users, Plus, Trash2, Crown, Shield, Mail, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { toast } from 'sonner';

export default function ChurchProTeam() {
  const { user, loading } = useAuth();
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  useEffect(() => { document.title = fr ? 'Équipe — SiteViral Church' : 'Team — SiteViral Church'; }, [fr]);

  const { data: church } = useQuery({
    enabled: !!user,
    queryKey: ['church-owner-team', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('church_providers').select('id, name, user_id').eq('user_id', user!.id).maybeSingle();
      return data;
    },
  });

  const { data: members = [], isLoading } = useQuery({
    enabled: !!church?.id,
    queryKey: ['church-team', church?.id],
    queryFn: async () => {
      const { data } = await supabase
        .from('church_team_members')
        .select('*')
        .eq('church_id', church!.id)
        .order('created_at', { ascending: true });
      return data ?? [];
    },
  });

  const invalidate = () => qc.invalidateQueries({ queryKey: ['church-team', church?.id] });

  if (loading) return <Spin />;
  if (!user) return <Navigate to="/auth?returnTo=/admin/church/team" replace />;
  if (!church) return <Navigate to="/church/pro/onboarding" replace />;

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-4xl px-4 py-6 space-y-6">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Button variant="ghost" size="icon" asChild><Link to="/dashboard"><ArrowLeft className="h-5 w-5" /></Link></Button>
            <div>
              <p className="text-xs text-muted-foreground">SiteViral Church</p>
              <h1 className="text-xl font-bold flex items-center gap-2"><Users className="h-5 w-5 text-primary" /> {fr ? 'Équipe' : 'Team'}</h1>
            </div>
          </div>
          <Button onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> {fr ? 'Inviter' : 'Invite'}</Button>
        </div>

        <div className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-full bg-primary/15 flex items-center justify-center">
            <Crown className="h-5 w-5 text-primary" />
          </div>
          <div className="min-w-0 flex-1">
            <p className="font-semibold text-sm">{fr ? 'Vous (Propriétaire)' : 'You (Owner)'}</p>
            <p className="text-xs text-muted-foreground truncate">{user.email}</p>
          </div>
          <span className="text-[10px] uppercase rounded-full bg-primary/15 text-primary px-2 py-0.5">{fr ? 'Propriétaire' : 'Owner'}</span>
        </div>

        {isLoading ? <Spin /> : members.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center">
            <Users className="h-6 w-6 mx-auto text-muted-foreground mb-2" />
            <p className="font-medium">{fr ? 'Aucun co-administrateur' : 'No co-admins yet'}</p>
            <p className="text-xs text-muted-foreground mt-1 mb-4">{fr ? 'Invitez un pasteur, un secrétaire ou un responsable média.' : 'Invite a pastor, secretary, or media lead.'}</p>
            <Button onClick={() => setOpen(true)}><Plus className="mr-1.5 h-4 w-4" /> {fr ? 'Inviter un membre' : 'Invite a member'}</Button>
          </div>
        ) : (
          <div className="space-y-3">
            {members.map((m) => {
              const accepted = !!m.accepted_at;
              return (
                <div key={m.id} className="rounded-2xl border border-border bg-card p-4 flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center">
                    <Shield className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-sm truncate">{m.invited_email || (fr ? 'Utilisateur' : 'User')}</p>
                      {accepted ? (
                        <span className="text-[10px] uppercase rounded-full bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 px-2 py-0.5 inline-flex items-center gap-1"><Check className="h-3 w-3" /> {fr ? 'Actif' : 'Active'}</span>
                      ) : (
                        <span className="text-[10px] uppercase rounded-full bg-amber-500/15 text-amber-700 dark:text-amber-300 px-2 py-0.5 inline-flex items-center gap-1"><Mail className="h-3 w-3" /> {fr ? 'Invitation envoyée' : 'Invited'}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {fr ? 'Rôle' : 'Role'}: {m.role} · {fr ? 'Invité le' : 'Invited'} {new Date(m.invited_at).toLocaleDateString(fr ? 'fr-FR' : 'en-US')}
                    </p>
                  </div>
                  <Button size="icon" variant="ghost" onClick={async () => {
                    if (!confirm(fr ? 'Retirer ce membre ?' : 'Remove this member?')) return;
                    await supabase.from('church_team_members').delete().eq('id', m.id);
                    invalidate();
                  }}><Trash2 className="h-4 w-4 text-muted-foreground" /></Button>
                </div>
              );
            })}
          </div>
        )}

        <p className="text-[11px] text-muted-foreground text-center">
          {fr
            ? 'Les administrateurs ont accès au tableau de bord, aux sermons, aux prières et aux annonces. La facturation et les paiements restent réservés au propriétaire.'
            : 'Admins can access the dashboard, sermons, prayer, and announcements. Billing and payouts remain owner-only.'}
        </p>
      </div>

      <InviteDialog
        open={open}
        onOpenChange={setOpen}
        churchId={church.id}
        inviterId={user.id}
        onCreated={() => { invalidate(); setOpen(false); }}
      />
    </div>
  );
}

function Spin() { return <div className="min-h-[40vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>; }

function InviteDialog({ open, onOpenChange, churchId, inviterId, onCreated }: {
  open: boolean; onOpenChange: (v: boolean) => void; churchId: string; inviterId: string; onCreated: () => void;
}) {
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const [email, setEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const submit = async () => {
    const clean = email.trim().toLowerCase();
    if (!clean || !clean.includes('@')) {
      toast.error(fr ? 'Email invalide' : 'Invalid email');
      return;
    }
    setSaving(true);
    const { error } = await supabase.from('church_team_members').insert({
      church_id: churchId,
      invited_email: clean,
      invited_by: inviterId,
      role: 'admin',
    });
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(fr ? 'Invitation créée' : 'Invitation created');
    setEmail('');
    onCreated();
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{fr ? 'Inviter un administrateur' : 'Invite an admin'}</DialogTitle>
          <DialogDescription>
            {fr
              ? "L'administrateur pourra gérer les sermons, prières, annonces et événements — mais pas la facturation."
              : 'The admin can manage sermons, prayer, announcements, and events — but not billing.'}
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="space-y-1.5">
            <Label className="text-xs">{fr ? 'Email' : 'Email'} *</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="pasteur@eglise.com" />
          </div>
        </div>
        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)} disabled={saving}>{fr ? 'Annuler' : 'Cancel'}</Button>
          <Button onClick={submit} disabled={saving || !email.trim()}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : (fr ? 'Envoyer' : 'Send')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
