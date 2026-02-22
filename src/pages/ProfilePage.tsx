import { useState, useRef } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Camera, LogOut, ChevronRight, User, Lock, Bell, Globe,
  Info, Moon, Sun, HelpCircle, Mail, Shield, ArrowLeft, Trash2, BookOpen, Languages
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { useAuth } from '@/contexts/AuthContext';
import { useOrg } from '@/contexts/OrgContext';
import { useTheme } from '@/contexts/ThemeContext';
import { db, supabase } from '@/lib/db';
import { useToast } from '@/hooks/use-toast';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';
import { LOCALE_LABELS, SUPPORTED_LOCALES, Locale } from '@/i18n/locales';

const schema = z.object({
  display_name: z.string().min(1, 'Ce champ est requis'),
  bio: z.string().optional(),
  phone: z.string().optional(),
});
type Form = z.infer<typeof schema>;

type Section = 'main' | 'edit-profile' | 'communities';

export default function ProfilePage() {
  const { user, profile, signOut, refreshProfile } = useAuth();
  const { userOrgs, leaveOrg, canManage, canAdmin, getRoleFor } = useOrg();
  const { theme, toggleTheme } = useTheme();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [saving, setSaving] = useState(false);
  const [activeSection, setActiveSection] = useState<Section>('main');
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

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
      setActiveSection('main');
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const ext = file.name.split('.').pop();
      const path = `avatars/${user.id}.${ext}`;
      const { error: uploadError } = await supabase.storage.from('org-uploads').upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: urlData } = supabase.storage.from('org-uploads').getPublicUrl(path);
      const avatarUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      await db.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id);
      await refreshProfile();
      toast({ title: 'Photo mise à jour !' });
    } catch (err: unknown) {
      toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Réessayez.', variant: 'destructive' });
    } finally {
      setUploadingAvatar(false);
    }
  };

  // Get Google avatar as fallback
  const googleAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const avatarUrl = profile?.avatar_url || googleAvatar;

  const initials = profile?.display_name
    ? profile.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';

  const displayName = profile?.display_name || user?.user_metadata?.full_name || 'Utilisateur';

  // Settings menu items
  const accountItems = [
    { icon: User, label: 'Modifier le profil', sub: displayName, onClick: () => setActiveSection('edit-profile') },
    { icon: BookOpen, label: 'Tableau de bord', sub: 'Achats & ressources', onClick: () => navigate('/dashboard') },
    { icon: Bell, label: 'Notifications', sub: '', onClick: () => navigate('/notifications') },
  ];

  const { locale, setLocale } = useI18n();
  const cycleLocale = () => {
    const idx = SUPPORTED_LOCALES.indexOf(locale);
    setLocale(SUPPORTED_LOCALES[(idx + 1) % SUPPORTED_LOCALES.length]);
  };

  const preferenceItems = [
    { icon: theme === 'dark' ? Sun : Moon, label: 'Thème', sub: theme === 'dark' ? 'Sombre' : 'Clair', onClick: toggleTheme, isToggle: true },
    { icon: Languages, label: 'Langue', sub: LOCALE_LABELS[locale], onClick: cycleLocale },
    { icon: Info, label: 'À propos', sub: '', onClick: () => navigate('/about') },
  ];

  const supportItems = [
    { icon: HelpCircle, label: 'Centre d\'aide', sub: '', onClick: () => toast({ title: 'Bientôt disponible' }) },
    { icon: Mail, label: 'Nous contacter', sub: '', onClick: () => window.open('mailto:support@siteviral.com') },
    { icon: Shield, label: 'Confidentialité', sub: '', onClick: () => navigate('/privacy') },
  ];

  const renderMenuItem = (item: typeof accountItems[number] & { isToggle?: boolean }, index: number) => (
    <motion.button
      key={item.label}
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={item.onClick}
      className="flex items-center gap-3.5 w-full px-4 py-3.5 hover:bg-muted/50 transition-colors text-left"
    >
      <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0">
        <item.icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground">{item.label}</p>
      </div>
      {item.sub && !item.isToggle && (
        <span className="text-xs text-muted-foreground mr-1">{item.sub}</span>
      )}
      {item.isToggle ? (
        <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} />
      ) : (
        <ChevronRight className="h-4 w-4 text-muted-foreground/60" />
      )}
    </motion.button>
  );

  // ══ EDIT PROFILE VIEW ══
  if (activeSection === 'edit-profile') {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 glass border-b border-border/40 px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActiveSection('main')}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <span className="font-semibold text-sm">Modifier le profil</span>
        </div>
        <div className="container max-w-lg px-4 py-5 sm:py-6 space-y-5 sm:space-y-6">
          {/* Avatar editor */}
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <div className="h-24 w-24 rounded-2xl gold-gradient flex items-center justify-center shadow-gold overflow-hidden">
                {avatarUrl ? (
                  <img src={avatarUrl} alt={initials} className="h-full w-full object-cover" />
                ) : (
                  <span className="text-2xl font-bold text-primary-foreground">{initials}</span>
                )}
              </div>
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploadingAvatar}
                className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity"
              >
                <Camera className="h-5 w-5 text-white" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              className="text-xs text-primary font-medium hover:underline"
            >
              {uploadingAvatar ? 'Envoi en cours...' : 'Changer la photo'}
            </button>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Nom d'affichage</Label>
                <Input {...form.register('display_name')} className="h-11" />
                {form.formState.errors.display_name && (
                  <p className="text-xs text-destructive">{form.formState.errors.display_name.message}</p>
                )}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Bio</Label>
                <Textarea {...form.register('bio')} className="resize-none min-h-[80px]" rows={3} placeholder="Parlez-nous de vous..." />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Téléphone</Label>
                <Input {...form.register('phone')} placeholder="+1 234 567 8900" className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Email</Label>
                <Input value={user?.email || ''} disabled className="h-11 bg-muted/50" />
              </div>
            </div>

            <Button type="submit" disabled={saving} className="w-full h-11 gold-gradient text-primary-foreground border-0 shadow-gold font-semibold">
              {saving ? 'Enregistrement...' : 'Enregistrer les modifications'}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // ══ MAIN SETTINGS VIEW ══
  return (
    <div className="min-h-screen bg-background">
      <div className="sticky top-0 z-10 glass border-b border-border/40 px-4 h-14 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <span className="font-semibold text-sm">Mon Compte</span>
      </div>

      <div className="container max-w-lg px-4 py-5 sm:py-6 space-y-4 sm:space-y-5">
        {/* Profile Card */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl shadow-card"
        >
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl gold-gradient flex items-center justify-center shadow-gold overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={initials} className="h-full w-full object-cover" />
              ) : (
                <span className="text-xl font-bold text-primary-foreground">{initials}</span>
              )}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => setActiveSection('edit-profile')}>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </Button>
        </motion.div>

        {/* Account Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-card border border-border rounded-2xl overflow-hidden shadow-card"
        >
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Compte</p>
          </div>
          <div className="divide-y divide-border/50">
            {accountItems.map((item, i) => renderMenuItem(item, i))}
          </div>
        </motion.div>

        {/* Communities */}
        {userOrgs.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-card border border-border rounded-2xl overflow-hidden shadow-card"
          >
            <div className="px-4 pt-4 pb-2">
              <p className="text-xs font-semibold text-primary uppercase tracking-wider">Mes communautés</p>
            </div>
            <div className="divide-y divide-border/50">
              {userOrgs.map((org) => {
                const role = getRoleFor(org.id);
                const roleLabels: Record<string, string> = {
                  owner: 'Propriétaire',
                  admin: 'Administrateur',
                  editor: 'Éditeur',
                  member: 'Membre',
                  affiliate: 'Affilié',
                };
                const roleLabel = roleLabels[role || ''] || 'Membre';
                const roleColor = role === 'owner'
                  ? 'bg-primary/10 text-primary'
                  : role === 'admin'
                  ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400'
                  : 'bg-muted text-muted-foreground';

                const isManagerOrOwner = role === 'owner' || role === 'admin' || role === 'editor';

                return (
                  <div key={org.id} className="flex items-center gap-3.5 px-4 py-3.5">
                    <div className="h-9 w-9 rounded-xl gold-gradient flex items-center justify-center shrink-0 shadow-gold overflow-hidden">
                      {org.logo_url ? (
                        <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" />
                      ) : (
                        <span className="text-xs font-bold text-primary-foreground">{org.name.slice(0, 2).toUpperCase()}</span>
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{org.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded-md font-medium', roleColor)}>
                          {roleLabel}
                        </span>
                        <span className="text-[10px] text-muted-foreground capitalize">{org.category}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button
                        variant="ghost"
                        size="sm"
                        className="text-xs h-7 px-2"
                        onClick={() => navigate(`/org/${org.slug}`)}
                      >
                        Voir
                      </Button>
                      {isManagerOrOwner && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="text-xs h-7 px-2 text-primary"
                          onClick={() => navigate('/admin')}
                        >
                          Gérer
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Preferences Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="bg-card border border-border rounded-2xl overflow-hidden shadow-card"
        >
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Préférences</p>
          </div>
          <div className="divide-y divide-border/50">
            {preferenceItems.map((item, i) => renderMenuItem(item as typeof accountItems[number] & { isToggle?: boolean }, i))}
          </div>
        </motion.div>

        {/* Support Section */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-card border border-border rounded-2xl overflow-hidden shadow-card"
        >
          <div className="px-4 pt-4 pb-2">
            <p className="text-xs font-semibold text-primary uppercase tracking-wider">Support</p>
          </div>
          <div className="divide-y divide-border/50">
            {supportItems.map((item, i) => renderMenuItem(item, i))}
          </div>
        </motion.div>

        {/* Sign out */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="space-y-3"
        >
          <Button
            variant="outline"
            className="w-full h-12 gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50 rounded-2xl font-semibold"
            onClick={() => { signOut(); navigate('/'); }}
          >
            <LogOut className="h-4 w-4" /> Déconnexion
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button
                variant="ghost"
                className="w-full h-10 gap-2 text-destructive/70 hover:text-destructive hover:bg-destructive/5 rounded-2xl text-xs"
              >
                <Trash2 className="h-3.5 w-3.5" /> Supprimer mon compte
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Supprimer votre compte ?</AlertDialogTitle>
                <AlertDialogDescription>
                  Cette action est irréversible. Toutes vos données, vos organisations créées et leur contenu seront définitivement supprimés.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Annuler</AlertDialogCancel>
                <AlertDialogAction
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={async () => {
                    if (!user) return;
                    setDeleting(true);
                    try {
                      const { error } = await db.rpc('delete_user_account', { _user_id: user.id });
                      if (error) throw error;
                      toast({ title: 'Compte supprimé', description: 'Votre compte a été supprimé avec succès.' });
                      await signOut();
                      navigate('/');
                    } catch (err: unknown) {
                      toast({ title: 'Erreur', description: err instanceof Error ? err.message : 'Réessayez.', variant: 'destructive' });
                    } finally {
                      setDeleting(false);
                    }
                  }}
                >
                  {deleting ? 'Suppression...' : 'Oui, supprimer'}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>

        {/* App version */}
        <p className="text-center text-[10px] text-muted-foreground/50 pb-4">
          Siteviral v1.0 · Fait avec ❤️ en Côte d'Ivoire
        </p>
      </div>
    </div>
  );
}
