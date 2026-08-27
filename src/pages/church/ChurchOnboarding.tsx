import { useEffect, useState } from 'react';
import { useNavigate, Navigate, Link } from '@/lib/router-compat';
import { ArrowLeft, Church, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useI18n } from '@/i18n/I18nContext';
import { CHURCH_DENOMINATIONS } from '@/lib/churchDenominations';
import { GuestGate } from '@/components/auth/GuestGate';
import { toast } from 'sonner';


const slugify = (s: string) =>
  s.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 60);

export default function ChurchOnboarding() {
  const { user, loading } = useAuth();
  const { locale } = useI18n();
  const fr = locale === 'fr';
  const navigate = useNavigate();

  const [name, setName] = useState('');
  const [denomination, setDenomination] = useState<string>('pentecostal');
  const [city, setCity] = useState('');
  const [country, setCountry] = useState('');
  const [bio, setBio] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [existing, setExisting] = useState<{ slug: string } | null | undefined>(undefined);

  useEffect(() => {
    document.title = fr ? 'Créer mon église — SiteViral Church' : 'Create my church — SiteViral Church';
  }, [fr]);

  useEffect(() => {
    if (!user) return;
    supabase.from('church_providers').select('slug').eq('user_id', user.id).maybeSingle()
      .then(({ data }) => setExisting(data ?? null));
  }, [user]);

  if (loading) return <div className="min-h-screen flex items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-primary" /></div>;
  if (!loading && !user) {
    return (
      <GuestGate
        icon={Church}
        title={fr ? 'Crée ton église' : 'Create your church'}
        subtitle={fr
          ? 'Crée ton compte pour publier tes prédications, recevoir dîmes & offrandes et gérer ta communauté. Gratuit pour commencer.'
          : 'Create your account to publish your sermons, receive tithes & offerings and grow your community. Free to start.'}
        nextUrl="/church/pro/onboarding"
      />
    );
  }

  if (existing) return <Navigate to="/dashboard" replace />;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error(fr ? 'Nom requis' : 'Name required');
    if (!user) return toast.error(fr ? 'Connexion requise' : 'Login required');
    setSubmitting(true);
    try {
      const base = slugify(name);
      let slug = base;
      // Ensure unique
      for (let i = 1; i < 10; i++) {
        const { data: dup } = await supabase.from('church_providers').select('id').eq('slug', slug).maybeSingle();
        if (!dup) break;
        slug = `${base}-${i}`;
      }
      const { error } = await supabase.from('church_providers').insert({
        user_id: user.id,
        slug,
        name: name.trim(),
        bio: bio.trim() || null,
        denomination,
        city: city.trim() || null,
        country: country.trim() || null,
        status: 'draft',
      });
      if (error) throw error;
      toast.success(fr ? 'Église créée ! Complétez votre KYC.' : 'Church created! Complete your KYC.');
      navigate('/church/pro');
    } catch (err: any) {
      toast.error(err.message || 'Error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto max-w-xl px-4 py-6 space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link to="/church"><ArrowLeft className="h-5 w-5" /></Link>
          </Button>
          <div>
            <p className="text-xs text-muted-foreground">SiteViral Church</p>
            <h1 className="text-xl font-bold flex items-center gap-2">
              <Church className="h-5 w-5 text-primary" />
              {fr ? 'Créer mon église' : 'Create my church'}
            </h1>
          </div>
        </div>

        <form onSubmit={submit} className="space-y-4 rounded-2xl border border-border bg-card p-6">
          <div className="space-y-1.5">
            <Label htmlFor="name">{fr ? "Nom de l'église *" : 'Church name *'}</Label>
            <Input id="name" value={name} onChange={(e) => setName(e.target.value)} placeholder={fr ? 'Ex : Église de la Grâce' : 'e.g. Grace Church'} required />
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="denom">{fr ? 'Confession' : 'Denomination'}</Label>
            <select id="denom" value={denomination} onChange={(e) => setDenomination(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm">
              {CHURCH_DENOMINATIONS.map((d) => <option key={d.value} value={d.value}>{fr ? d.fr : d.en}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label htmlFor="city">{fr ? 'Ville' : 'City'}</Label>
              <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Abidjan" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="country">{fr ? 'Pays' : 'Country'}</Label>
              <Input id="country" value={country} onChange={(e) => setCountry(e.target.value)} placeholder={fr ? 'Côte d\'Ivoire' : 'Ivory Coast'} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label htmlFor="bio">{fr ? 'Présentation courte' : 'Short bio'}</Label>
            <Textarea id="bio" value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
              placeholder={fr ? 'Notre mission, notre pasteur, nos horaires…' : 'Our mission, our pastor, service times…'} />
          </div>

          <Button type="submit" disabled={submitting} className="w-full">
            {submitting ? <Loader2 className="h-4 w-4 animate-spin" /> : (fr ? 'Créer mon église' : 'Create my church')}
          </Button>
          <p className="text-xs text-muted-foreground text-center">
            {fr ? 'Votre église restera privée jusqu\'à la validation du KYC.' : 'Your church stays private until KYC is approved.'}
          </p>
        </form>
      </div>
    </div>
  );
}
