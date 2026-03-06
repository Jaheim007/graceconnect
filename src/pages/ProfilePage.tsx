import { useState, useRef } from 'react';
import { getOrgCategoryLabel } from '@/lib/categoryLabels';
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
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { useI18n } from '@/i18n/I18nContext';
import { LOCALE_LABELS, SUPPORTED_LOCALES } from '@/i18n/locales';
import { SEOHead } from '@/components/seo/SEOHead';

const schema = z.object({
  display_name: z.string().min(1),
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
  const { locale, setLocale, t } = useI18n();

  const form = useForm<Form>({
    resolver: zodResolver(schema),
    defaultValues: { display_name: profile?.display_name || '', bio: profile?.bio || '', phone: profile?.phone || '' },
  });

  const onSubmit = async (data: Form) => {
    if (!user) return;
    setSaving(true);
    const { error } = await db.from('profiles').update(data).eq('id', user.id);
    setSaving(false);
    if (error) {
      toast({ title: t('common.error'), description: error.message, variant: 'destructive' });
    } else {
      await refreshProfile();
      toast({ title: t('profile.updated') });
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
      const avatarUrl = `${brandUrl(urlData.publicUrl)}?t=${Date.now()}`;
      await db.from('profiles').update({ avatar_url: avatarUrl }).eq('id', user.id);
      await refreshProfile();
      toast({ title: t('profile.photo_updated') });
    } catch (err: unknown) {
      toast({ title: t('common.error'), description: err instanceof Error ? err.message : '', variant: 'destructive' });
    } finally { setUploadingAvatar(false); }
  };

  const googleAvatar = user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
  const avatarUrl = profile?.avatar_url || googleAvatar;
  const initials = profile?.display_name
    ? profile.display_name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : user?.email?.[0]?.toUpperCase() || 'U';
  const displayName = profile?.display_name || user?.user_metadata?.full_name || 'User';

  const accountItems = [
    { icon: User, label: t('profile.edit_profile'), sub: displayName, onClick: () => setActiveSection('edit-profile') },
    { icon: BookOpen, label: t('profile.dashboard'), sub: t('profile.dashboard_sub'), onClick: () => navigate('/dashboard') },
    { icon: Bell, label: t('nav.notifications'), sub: '', onClick: () => navigate('/notifications') },
  ];

  const cycleLocale = () => {
    const idx = SUPPORTED_LOCALES.indexOf(locale);
    setLocale(SUPPORTED_LOCALES[(idx + 1) % SUPPORTED_LOCALES.length]);
  };

  const preferenceItems = [
    { icon: theme === 'dark' ? Sun : Moon, label: t('profile.theme'), sub: theme === 'dark' ? t('theme.dark') : t('theme.light'), onClick: toggleTheme, isToggle: true },
    { icon: Languages, label: t('profile.language'), sub: LOCALE_LABELS[locale], onClick: cycleLocale },
    { icon: Info, label: t('profile.about'), sub: '', onClick: () => navigate('/about') },
  ];

  const supportItems = [
    { icon: HelpCircle, label: t('profile.help'), sub: '', onClick: () => toast({ title: t('profile.coming_soon') }) },
    { icon: Mail, label: t('profile.contact'), sub: '', onClick: () => window.open('mailto:support@siteviral.com') },
    { icon: Shield, label: t('profile.privacy'), sub: '', onClick: () => navigate('/privacy') },
  ];

  const roleLabels: Record<string, string> = {
    owner: t('role.owner'), admin: t('role.admin'), editor: t('role.editor'), member: t('role.member'), affiliate: t('role.affiliate'),
  };

  const renderMenuItem = (item: typeof accountItems[number] & { isToggle?: boolean }, index: number) => (
    <motion.button key={item.label} initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: index * 0.03 }}
      onClick={item.onClick} className="flex items-center gap-3.5 w-full px-4 py-3.5 hover:bg-muted/50 transition-colors text-left">
      <div className="h-9 w-9 rounded-xl bg-muted flex items-center justify-center shrink-0"><item.icon className="h-4 w-4 text-muted-foreground" /></div>
      <div className="flex-1 min-w-0"><p className="text-sm font-medium text-foreground">{item.label}</p></div>
      {item.sub && !item.isToggle && <span className="text-xs text-muted-foreground mr-1">{item.sub}</span>}
      {item.isToggle ? <Switch checked={theme === 'dark'} onCheckedChange={toggleTheme} /> : <ChevronRight className="h-4 w-4 text-muted-foreground/60" />}
    </motion.button>
  );

  if (activeSection === 'edit-profile') {
    return (
      <div className="min-h-screen bg-background">
        <div className="sticky top-0 z-10 glass border-b border-border/40 px-4 h-14 flex items-center gap-3">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setActiveSection('main')}><ArrowLeft className="h-4 w-4" /></Button>
          <span className="font-semibold text-sm">{t('profile.edit_profile')}</span>
        </div>
        <div className="container max-w-lg px-4 py-5 sm:py-6 space-y-5 sm:space-y-6">
          <div className="flex flex-col items-center gap-3">
            <div className="relative group">
              <div className="h-24 w-24 rounded-2xl bg-primary flex items-center justify-center overflow-hidden">
                {avatarUrl ? <img src={avatarUrl} alt={initials} className="h-full w-full object-cover" /> : <span className="text-2xl font-bold text-primary-foreground">{initials}</span>}
              </div>
              <button onClick={() => fileRef.current?.click()} disabled={uploadingAvatar} className="absolute inset-0 flex items-center justify-center bg-black/40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity">
                <Camera className="h-5 w-5 text-white" />
              </button>
              <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarUpload} />
            </div>
            <button onClick={() => fileRef.current?.click()} className="text-xs text-primary font-medium hover:underline">
              {uploadingAvatar ? t('profile.uploading') : t('profile.upload_photo')}
            </button>
          </div>

          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <div className="bg-card border border-border rounded-2xl p-5 space-y-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('profile.display_name_label')}</Label>
                <Input {...form.register('display_name')} className="h-11" />
                {form.formState.errors.display_name && <p className="text-xs text-destructive">{form.formState.errors.display_name.message}</p>}
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('profile.bio_label')}</Label>
                <Textarea {...form.register('bio')} className="resize-none min-h-[80px]" rows={3} placeholder={t('profile.bio_placeholder')} />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('profile.phone_label')}</Label>
                <Input {...form.register('phone')} placeholder="+1 234 567 8900" className="h-11" />
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('profile.email_label')}</Label>
                <Input value={user?.email || ''} disabled className="h-11 bg-muted/50" />
              </div>
            </div>
            <Button type="submit" disabled={saving} className="w-full h-11 bg-primary text-primary-foreground font-semibold">
              {saving ? t('profile.saving') : t('profile.save_changes')}
            </Button>
          </form>
        </div>
      </div>
    );
  }

  // Profile completion
  const completionSteps = [
    { done: !!profile?.display_name, label: locale === 'fr' ? 'Nom' : 'Name' },
    { done: !!avatarUrl, label: 'Avatar' },
    { done: !!profile?.bio, label: 'Bio' },
    { done: !!profile?.phone, label: locale === 'fr' ? 'Téléphone' : 'Phone' },
    { done: userOrgs.length > 0, label: locale === 'fr' ? 'Communauté' : 'Community' },
  ];
  const completedCount = completionSteps.filter(s => s.done).length;
  const completionPercent = Math.round((completedCount / completionSteps.length) * 100);

  return (
    <div className="min-h-screen bg-background">
      <SEOHead title="Mon profil — Siteviral" description="Gérez votre profil, vos préférences et vos communautés sur Siteviral." noindex />
      <div className="sticky top-0 z-10 glass border-b border-border/40 px-4 h-14 flex items-center gap-3">
        <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => navigate(-1)}><ArrowLeft className="h-4 w-4" /></Button>
        <span className="font-semibold text-sm">{t('profile.my_account')}</span>
      </div>

      <div className="container max-w-lg px-4 py-5 sm:py-6 space-y-4 sm:space-y-5">
        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="flex items-center gap-4 p-4 bg-card border border-border rounded-2xl shadow-card">
          <div className="relative">
            <div className="h-16 w-16 rounded-2xl bg-primary flex items-center justify-center overflow-hidden">
              {avatarUrl ? <img src={avatarUrl} alt={initials} className="h-full w-full object-cover" /> : <span className="text-xl font-bold text-primary-foreground">{initials}</span>}
            </div>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-base truncate">{displayName}</p>
            <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            {/* Completion bar */}
            <div className="flex items-center gap-2 mt-2">
              <div className="flex-1 h-1.5 rounded-full bg-muted overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${completionPercent}%` }}
                  transition={{ duration: 0.8, ease: 'easeOut' }}
                  className={cn('h-full rounded-full', completionPercent === 100 ? 'bg-green-500' : 'bg-primary')}
                />
              </div>
              <span className="text-[10px] font-semibold text-muted-foreground">{completionPercent}%</span>
            </div>
          </div>
          <Button variant="ghost" size="icon" className="shrink-0 h-8 w-8" onClick={() => setActiveSection('edit-profile')}><ChevronRight className="h-4 w-4 text-muted-foreground" /></Button>
        </motion.div>

        {/* Completion hints */}
        {completionPercent < 100 && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.2 }} className="bg-primary/5 border border-primary/15 rounded-2xl p-3.5">
            <p className="text-xs font-semibold mb-2">{locale === 'fr' ? '✨ Complétez votre profil' : '✨ Complete your profile'}</p>
            <div className="flex flex-wrap gap-1.5">
              {completionSteps.filter(s => !s.done).map(s => (
                <button
                  key={s.label}
                  onClick={() => setActiveSection('edit-profile')}
                  className="text-[10px] px-2.5 py-1 rounded-lg bg-primary/10 text-primary font-medium hover:bg-primary/20 transition-colors"
                >
                  + {s.label}
                </button>
              ))}
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }} className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
          <div className="px-4 pt-4 pb-2"><p className="text-xs font-semibold text-primary uppercase tracking-wider">{t('profile.account_section')}</p></div>
          <div className="divide-y divide-border/50">{accountItems.map((item, i) => renderMenuItem(item, i))}</div>
        </motion.div>

        {userOrgs.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
            <div className="px-4 pt-4 pb-2"><p className="text-xs font-semibold text-primary uppercase tracking-wider">{t('profile.communities')}</p></div>
            <div className="divide-y divide-border/50">
              {userOrgs.map((org) => {
                const role = getRoleFor(org.id);
                const roleLabel = roleLabels[role || ''] || t('role.member');
                const roleColor = role === 'owner' ? 'bg-primary/10 text-primary' : role === 'admin' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-400' : 'bg-muted text-muted-foreground';
                const isManagerOrOwner = role === 'owner' || role === 'admin' || role === 'editor';
                return (
                  <div key={org.id} className="flex items-center gap-3.5 px-4 py-3.5">
                    <div className="h-9 w-9 rounded-xl bg-primary flex items-center justify-center shrink-0 overflow-hidden">
                      {org.logo_url ? <img src={org.logo_url} alt={org.name} className="w-full h-full object-cover" /> : <span className="text-xs font-bold text-primary-foreground">{org.name.slice(0, 2).toUpperCase()}</span>}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{org.name}</p>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={cn('text-[10px] px-1.5 py-0.5 rounded-md font-medium', roleColor)}>{roleLabel}</span>
                        <span className="text-[10px] text-muted-foreground">{getOrgCategoryLabel(org.category)}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1 shrink-0">
                      <Button variant="ghost" size="sm" className="text-xs h-7 px-2" onClick={() => navigate(`/org/${org.slug}`)}>{t('profile.view')}</Button>
                      {isManagerOrOwner && <Button variant="ghost" size="sm" className="text-xs h-7 px-2 text-primary" onClick={() => navigate('/admin')}>{t('profile.manage')}</Button>}
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }} className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
          <div className="px-4 pt-4 pb-2"><p className="text-xs font-semibold text-primary uppercase tracking-wider">{t('profile.preferences')}</p></div>
          <div className="divide-y divide-border/50">{preferenceItems.map((item, i) => renderMenuItem(item as typeof accountItems[number] & { isToggle?: boolean }, i))}</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="bg-card border border-border rounded-2xl overflow-hidden shadow-card">
          <div className="px-4 pt-4 pb-2"><p className="text-xs font-semibold text-primary uppercase tracking-wider">{t('profile.support_section')}</p></div>
          <div className="divide-y divide-border/50">{supportItems.map((item, i) => renderMenuItem(item, i))}</div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }} className="space-y-3">
          <Button variant="outline" className="w-full h-12 gap-2 text-destructive border-destructive/30 hover:bg-destructive/10 hover:border-destructive/50 rounded-2xl font-semibold"
            onClick={() => { signOut(); navigate('/'); }}>
            <LogOut className="h-4 w-4" /> {t('profile.sign_out')}
          </Button>

          <AlertDialog>
            <AlertDialogTrigger asChild>
              <Button variant="ghost" className="w-full h-10 gap-2 text-destructive/70 hover:text-destructive hover:bg-destructive/5 rounded-2xl text-xs">
                <Trash2 className="h-3.5 w-3.5" /> {t('profile.delete_account')}
              </Button>
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>{t('profile.delete_title')}</AlertDialogTitle>
                <AlertDialogDescription>{t('profile.delete_desc')}</AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
                <AlertDialogAction
                  disabled={deleting}
                  className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                  onClick={async () => {
                    if (!user) return;
                    setDeleting(true);
                    try {
                      const { error } = await db.rpc('delete_user_account', { _user_id: user.id });
                      if (error) throw error;
                      toast({ title: t('profile.deleted'), description: t('profile.deleted_desc') });
                      await signOut();
                      navigate('/');
                    } catch (err: unknown) {
                      toast({ title: t('common.error'), description: err instanceof Error ? err.message : '', variant: 'destructive' });
                    } finally { setDeleting(false); }
                  }}
                >
                  {deleting ? t('profile.deleting') : t('profile.yes_delete')}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </motion.div>

        <p className="text-center text-[10px] text-muted-foreground/50 pb-4">{t('profile.version')}</p>
      </div>
    </div>
  );
}
