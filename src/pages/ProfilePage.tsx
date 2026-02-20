import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Camera, LogOut, User as UserIcon } from 'lucide-react';
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
  display_name: z.string().min(1, 'Required'),
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
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      await refreshProfile();
      toast({ title: 'Profile updated!' });
    }
  };

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  return (
    <div className="container max-w-xl py-8 space-y-6">
      <h1 className="text-xl font-bold">Profile</h1>

      {/* Avatar */}
      <div className="flex items-center gap-4">
        <div className="relative">
          <div className="h-16 w-16 rounded-2xl gold-gradient flex items-center justify-center shadow-gold overflow-hidden">
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt={initials} className="h-full w-full object-cover" />
            ) : (
              <span className="text-xl font-bold text-primary-foreground">{initials}</span>
            )}
          </div>
          <button className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-card border border-border flex items-center justify-center shadow-sm">
            <Camera className="h-3 w-3" />
          </button>
        </div>
        <div>
          <p className="font-semibold">{profile?.display_name || 'User'}</p>
          <p className="text-xs text-muted-foreground">{user?.email}</p>
        </div>
      </div>

      {/* Form */}
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 bg-card border border-border rounded-2xl p-5">
        <h2 className="font-semibold text-sm">Personal Info</h2>
        <div>
          <Label>Display Name</Label>
          <Input {...form.register('display_name')} className="mt-1.5" />
          {form.formState.errors.display_name && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.display_name.message}</p>
          )}
        </div>
        <div>
          <Label>Bio</Label>
          <Textarea {...form.register('bio')} className="mt-1.5 resize-none" rows={3} placeholder="Tell us about yourself..." />
        </div>
        <div>
          <Label>Phone</Label>
          <Input {...form.register('phone')} className="mt-1.5" placeholder="+225 00 00 00 00" />
        </div>
        <Button type="submit" disabled={saving} className="gold-gradient text-primary-foreground border-0 shadow-gold">
          {saving ? 'Saving...' : 'Save Changes'}
        </Button>
      </form>

      {/* Orgs */}
      {userOrgs.length > 0 && (
        <div className="bg-card border border-border rounded-2xl p-5 space-y-3">
          <h2 className="font-semibold text-sm">My Communities</h2>
          {userOrgs.map((org) => (
            <div key={org.id} className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg gold-gradient flex items-center justify-center shrink-0">
                <span className="text-xs font-bold text-primary-foreground">{org.name.slice(0, 2).toUpperCase()}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{org.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{org.category}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                className="text-xs text-destructive hover:text-destructive"
                onClick={() => leaveOrg(org.id)}
              >
                Leave
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Sign out */}
      <Button
        variant="outline"
        className="w-full gap-2 text-destructive border-destructive/30 hover:bg-destructive/10"
        onClick={() => { signOut(); navigate('/'); }}
      >
        <LogOut className="h-4 w-4" /> Sign Out
      </Button>
    </div>
  );
}
