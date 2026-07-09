import { useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { ArrowLeft, Loader2, Settings, Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { CHURCH_DENOMINATIONS } from '@/lib/churchDenominations';
import { toast } from 'sonner';

export default function ChurchProSettings() {
  const { user, loading } = useAuth();
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const [form, setForm] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => { document.title = fr ? 'Paramètres — SiteViral Church' : 'Settings — SiteViral Church'; }, [fr]);

  const { data: church, refetch } = useQuery({
    enabled: !!user,
    queryKey: ['church-owner-settings', user?.id],
    queryFn: async () => {
      const { data } = await supabase.from('church_providers').select('*').eq('user_id', user!.id).maybeSingle();
      return data;
    },
  });

  useEffect(() => { if (church && !form) setForm(church); }, [church, form]);

  if (loading) return <Spin />;
  if (!user) return <Navigate to="/auth?returnTo=/church/pro/settings" replace />;
  if (church === null) return <Navigate to="/church/pro/onboarding" replace />;
  if (!form) return <Spin />;

  const set = (k: string, v: any) => setForm({ ...form, [k]: v });

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from('church_providers').update({
      name: form.name,
      bio: form.bio,
      denomination: form.denomination,
      default_language: form.default_language,
      currency: form.currency,
      phone: form.phone,
      email: form.email,
      website: form.website,
      address: form.address,
      city: form.city,
      country: form.country,
      logo_url: form.logo_url,
      cover_url: form.cover_url,
      socials: form.socials,
    }).eq('id', form.id);
    setSaving(false);
    if (error) return toast.error(error.message);
    toast.success(fr ? 'Enregistré' : 'Saved');
    refetch();
  };

  const socials = form.socials || {};
  const setSocial = (k: string, v: string) => set('socials', { ...socials, [k]: v || undefined });

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-3xl px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild><Link to="/dashboard"><ArrowLeft className="h-5 w-5" /></Link></Button>
          <div>
            <p className="text-xs text-muted-foreground">SiteViral Church</p>
            <h1 className="text-xl font-bold flex items-center gap-2"><Settings className="h-5 w-5 text-primary" /> {fr ? 'Paramètres' : 'Settings'}</h1>
          </div>
        </div>

        <Section title={fr ? 'Profil' : 'Profile'}>
          <Field label={fr ? 'Nom de l\'église' : 'Church name'}><Input value={form.name || ''} onChange={(e) => set('name', e.target.value)} /></Field>
          <Field label={fr ? 'Présentation' : 'About'}><Textarea rows={4} value={form.bio || ''} onChange={(e) => set('bio', e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={fr ? 'Dénomination' : 'Denomination'}>
              <select value={form.denomination || ''} onChange={(e) => set('denomination', e.target.value)} className="w-full h-10 border border-border bg-transparent rounded-md px-2 text-sm">
                <option value="">—</option>
                {CHURCH_DENOMINATIONS.map((d) => <option key={d.value} value={d.value}>{fr ? d.fr : d.en}</option>)}
              </select>
            </Field>
            <Field label={fr ? 'Langue par défaut' : 'Default language'}>
              <select value={form.default_language || 'fr'} onChange={(e) => set('default_language', e.target.value)} className="w-full h-10 border border-border bg-transparent rounded-md px-2 text-sm">
                <option value="fr">Français</option><option value="en">English</option>
              </select>
            </Field>
          </div>
        </Section>

        <Section title={fr ? 'Marque' : 'Branding'}>
          <Field label={fr ? 'Logo (URL)' : 'Logo (URL)'}><Input value={form.logo_url || ''} onChange={(e) => set('logo_url', e.target.value)} placeholder="https://…" /></Field>
          <Field label={fr ? 'Bannière (URL)' : 'Cover (URL)'}><Input value={form.cover_url || ''} onChange={(e) => set('cover_url', e.target.value)} placeholder="https://…" /></Field>
        </Section>

        <Section title={fr ? 'Contact & lieu' : 'Contact & location'}>
          <div className="grid grid-cols-2 gap-3">
            <Field label={fr ? 'Téléphone' : 'Phone'}><Input value={form.phone || ''} onChange={(e) => set('phone', e.target.value)} /></Field>
            <Field label="Email"><Input type="email" value={form.email || ''} onChange={(e) => set('email', e.target.value)} /></Field>
          </div>
          <Field label={fr ? 'Site web' : 'Website'}><Input value={form.website || ''} onChange={(e) => set('website', e.target.value)} placeholder="https://…" /></Field>
          <Field label={fr ? 'Adresse' : 'Address'}><Input value={form.address || ''} onChange={(e) => set('address', e.target.value)} /></Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label={fr ? 'Ville' : 'City'}><Input value={form.city || ''} onChange={(e) => set('city', e.target.value)} /></Field>
            <Field label={fr ? 'Pays' : 'Country'}><Input value={form.country || ''} onChange={(e) => set('country', e.target.value)} /></Field>
          </div>
        </Section>

        <Section title={fr ? 'Réseaux sociaux' : 'Social links'}>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Facebook"><Input value={socials.facebook || ''} onChange={(e) => setSocial('facebook', e.target.value)} placeholder="https://facebook.com/…" /></Field>
            <Field label="Instagram"><Input value={socials.instagram || ''} onChange={(e) => setSocial('instagram', e.target.value)} placeholder="https://instagram.com/…" /></Field>
            <Field label="YouTube"><Input value={socials.youtube || ''} onChange={(e) => setSocial('youtube', e.target.value)} placeholder="https://youtube.com/…" /></Field>
            <Field label="TikTok"><Input value={socials.tiktok || ''} onChange={(e) => setSocial('tiktok', e.target.value)} placeholder="https://tiktok.com/@…" /></Field>
            <Field label="WhatsApp"><Input value={socials.whatsapp || ''} onChange={(e) => setSocial('whatsapp', e.target.value)} placeholder="+225…" /></Field>
            <Field label="Telegram"><Input value={socials.telegram || ''} onChange={(e) => setSocial('telegram', e.target.value)} placeholder="https://t.me/…" /></Field>
          </div>
        </Section>

        <Section title={fr ? 'Paiement' : 'Payout'}>
          <Field label={fr ? 'Devise par défaut' : 'Default currency'}>
            <select value={form.currency || 'XOF'} onChange={(e) => set('currency', e.target.value)} className="w-full h-10 border border-border bg-transparent rounded-md px-2 text-sm">
              {['XOF','XAF','GHS','KES','NGN','EUR','USD','GBP','CAD'].map((c) => <option key={c}>{c}</option>)}
            </select>
          </Field>
          <div className="rounded-xl border border-border bg-muted/30 p-3 text-xs text-muted-foreground">
            {fr ? 'Vérification de paiement : ' : 'Payout verification: '}
            <span className={form.payout_verified ? 'text-emerald-600 font-medium' : 'text-amber-600 font-medium'}>
              {form.payout_verified ? (fr ? 'Vérifié ✓' : 'Verified ✓') : (fr ? 'À compléter' : 'Not verified')}
            </span>
            {' · '}<Link to="/admin/church/kyc" className="underline text-primary">{fr ? 'Ouvrir' : 'Open'}</Link>
          </div>
        </Section>

        <div className="sticky bottom-4 z-10">
          <Button onClick={save} disabled={saving} className="w-full h-11 shadow-lg">
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <><Save className="mr-2 h-4 w-4" /> {fr ? 'Enregistrer' : 'Save'}</>}
          </Button>
        </div>
      </div>
    </div>
  );
}

function Spin() { return <div className="min-h-[40vh] flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>; }

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
      <h2 className="text-sm font-semibold">{title}</h2>
      {children}
    </div>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-1.5"><Label className="text-xs">{label}</Label>{children}</div>;
}
