import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, LogOut, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { db } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';

const schema = z.object({
  display_name: z.string().min(1, 'Requis'),
  bio: z.string().optional(),
  phone: z.string().optional(),
});
type Form = z.infer<typeof schema>;

export default function ProfilePage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { userOrgs, leaveOrg } = useOrg();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: {
      display_name: profile?.display_name || '',
      bio: profile?.bio || '',
      phone: profile?.phone || '',
    },
  });

  const onSubmit = async (data: Form) => {
    if (!user) return;
    setSaving(true);
    const { error } = await db.from('profiles').update(data).eq('id', user.id);
    setSaving(false);
    if (error) {
      toast({ title: 'Erreur', description: error.message, variant: 'destructive' });
    } else {
      await refreshProfile();
      toast({ title: 'Profil mis à jour !' });
    }
  };

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 glass border-b border-border/40 px-4 h-12 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8 text-muted-foreground" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold text-sm">Profil</span>
      </div>

      <div className="container max-w-xl py-6 space-y-5">
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl gold-gradient flex items-center justify-center shadow-gold overflow-hidden">
              {profile?.avatar_url ? <img src={profile.avatar_url} alt={initials} className="h-full w-full object-cover" /> : <span className="text-xl font-bold text-primary-foreground">{initials}</span>}
            </div>
            <button className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-card border border-border flex items-center justify-center shadow-sm hover:bg-muted transition-colors">
              <Camera className="h-3 w-3" />
            </button>
          </div>
          <div>
            <p className="font-semibold">{profile?.display_name || 'Utilisateur'}</p>
            <p className="text-xs text-muted-foreground">{user?.email}</p>
          </div>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 bg-card border border-border rounded-2xl p-5">
          <h2 className="font-semibold text-sm">Informations personnelles</h2>
          <div className="space-y-1.5">
            <Label>Nom d'affichage</Label>
            <Input {...form.register('display_name')} />
            {form.formState.errors.display_name && <p className="text-xs text-destructive">{form.formState.errors.display_name.message}</p>}
          </div>
          <div className="space-y-1.5">
            <Label>Bio</Label>
            <Textarea {...form.register('bio')} className="resize-none" rows={3} placeholder="Parlez-nous de vous..." />
          </div>
          <div className="space-y-1.5">
            <Label>Téléphone</Label>
            <Input {...form.register('phone')} placeholder="+225 00 00 00 00" />
          </div>
          <Button type="submit" disabled={saving} className="gold-gradient text-primary-foreground border-0 shadow-gold">
            {saving ? 'Enregistrement...' : 'Enregistrer'}
          </Button>
        </form>

        {userOrgs.length > 0 && (
          <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
            <h2 className="font-semibold text-sm">Mes communautés</h2>
            {userOrgs.map((org) => (
              <div key={org.id} className="flex items-center gap-3 py-2 border-b border-border/50 last:border-0">
                <div className="h-9 w-9 rounded-xl gold-gradient flex items-center justify-center shrink-0 shadow-gold">
                  {org.logo_url ? <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover rounded-xl" /> : <span className="text-xs font-bold text-primary-foreground">{org.name.slice(0, 2).toUpperCase()}</span>}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium truncate">{org.name}</p>
                  <p className="text-xs text-muted-foreground capitalize">{org.category}</p>
                </div>
                <Button variant="ghost" size="sm" className="text-xs text-destructive hover:text-destructive hover:bg-destructive/10" onClick={() => leaveOrg(org.id)}>Quitter</Button>
              </div>
            ))}
          </div>
        )}

        <Button variant="outline" className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50" onClick={() => { signOut(); navigate('/'); }}>
          <LogOut className="h-4 w-4" /> Déconnexion
        </Button>
      </div>
    </div>
  );
}
