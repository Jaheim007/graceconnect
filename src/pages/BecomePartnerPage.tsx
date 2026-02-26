import { useState } from 'react';
import { Link } from 'react-router-dom';
import { LegalHeader, LegalFooter } from '@/components/layout/LegalPageShell';
import { SEOHead } from '@/components/seo/SEOHead';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { db } from '@/lib/db';
import {
  Handshake, TrendingUp, Shield, Users, Globe, Star,
  CheckCircle, ArrowRight, Loader2
} from 'lucide-react';

const TIERS = [
  { level: 1, name: 'Bronze', orgs: '10+', rate: '5%', color: 'text-amber-700' },
  { level: 2, name: 'Argent', orgs: '50+', rate: '8%', color: 'text-gray-400' },
  { level: 3, name: 'Or', orgs: '150+', rate: '10%', color: 'text-yellow-500' },
  { level: 4, name: 'Platine', orgs: '300+', rate: '12%', color: 'text-blue-400' },
  { level: 5, name: 'Diamant', orgs: '1 000+', rate: '15%', color: 'text-purple-400' },
];

const BENEFITS = [
  { icon: TrendingUp, title: 'Commissions récurrentes', desc: 'Gagnez sur chaque vente et donation des plateformes que vous référez — à vie.' },
  { icon: Shield, title: 'Dashboard dédié', desc: 'Suivez vos performances, organisations référées et paiements en temps réel.' },
  { icon: Users, title: 'Support prioritaire', desc: 'Accès direct à notre équipe pour vous aider à développer votre réseau.' },
  { icon: Globe, title: 'Couverture multi-pays', desc: 'Invitez des organisations de Côte d\'Ivoire, Ghana, Nigeria, Kenya et plus.' },
];

export default function BecomePartnerPage() {
  const [form, setForm] = useState({ full_name: '', email: '', phone: '', country: 'CI', motivation: '' });
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !termsAccepted) return;

    setSubmitting(true);
    try {
      const code = 'SV-' + form.full_name.substring(0, 4).toUpperCase() + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
      const slug = code.toLowerCase().replace(/[^a-z0-9]/g, '-');
      const { error } = await db.from('partners').insert({
        full_name: form.full_name,
        email: form.email,
        phone: form.phone || null,
        country: form.country,
        invite_code: code,
        invite_link_slug: slug,
        status: 'pending',
        notes: form.motivation || null,
        terms_accepted_at: new Date().toISOString(),
      });
      if (error) throw error;
      setSubmitted(true);
    } catch (err: any) {
      toast.error(err.message || 'Erreur lors de la soumission');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <SEOHead
        title="Devenir Partenaire — Gagnez des commissions récurrentes | Siteviral"
        description="Rejoignez le Programme Partenaires Siteviral. Référez des organisations et gagnez jusqu'à 15% de commission récurrente. Inscription gratuite."
        canonicalUrl="https://siteviral.com/become-partner"
        keywords="devenir partenaire, programme partenaires, commissions récurrentes, référer organisations, Siteviral"
      />
      <LegalHeader />

      {/* Hero */}
      <section className="relative pt-24 pb-16 px-4 overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-background to-background" />
        <div className="relative container max-w-4xl text-center space-y-6">
          <Badge variant="secondary" className="gap-1.5 text-sm px-4 py-1.5">
            <Handshake className="h-4 w-4" /> Programme Partenaires Officiel
          </Badge>
          <h1 className="text-4xl sm:text-5xl font-extrabold tracking-tight">
            Gagnez en référant des <span className="text-primary">organisations</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Devenez partenaire Siteviral et recevez jusqu'à <strong className="text-foreground">15% de commission</strong> sur
            les frais de plateforme générés par chaque organisation que vous apportez.
          </p>
          <div className="flex items-center justify-center gap-3">
            <Button size="lg" asChild>
              <a href="#candidature"><ArrowRight className="h-4 w-4 mr-2" />Postuler maintenant</a>
            </Button>
            <Button size="lg" variant="outline" asChild>
              <Link to="/partner-terms">Lire le contrat</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-16 px-4 border-t border-border/40">
        <div className="container max-w-4xl">
          <h2 className="text-2xl font-extrabold text-center mb-10">Comment ça fonctionne</h2>
          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Postulez', desc: 'Remplissez le formulaire ci-dessous. Notre équipe examine chaque candidature.' },
              { step: '2', title: 'Recevez votre code', desc: 'Une fois approuvé, vous recevez un code d\'invitation unique et accédez à votre portail.' },
              { step: '3', title: 'Gagnez', desc: 'Chaque organisation créée avec votre code génère des commissions récurrentes pour vous.' },
            ].map(s => (
              <div key={s.step} className="text-center space-y-3">
                <div className="h-12 w-12 rounded-full bg-primary/10 border border-primary/30 flex items-center justify-center mx-auto">
                  <span className="text-lg font-extrabold text-primary">{s.step}</span>
                </div>
                <h3 className="font-bold">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Benefits */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container max-w-4xl">
          <h2 className="text-2xl font-extrabold text-center mb-10">Vos avantages</h2>
          <div className="grid sm:grid-cols-2 gap-6">
            {BENEFITS.map(b => (
              <Card key={b.title} className="border-border/50">
                <CardContent className="pt-6 flex gap-4">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                    <b.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-bold mb-1">{b.title}</h3>
                    <p className="text-sm text-muted-foreground">{b.desc}</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Tiers */}
      <section className="py-16 px-4 border-t border-border/40">
        <div className="container max-w-3xl">
          <h2 className="text-2xl font-extrabold text-center mb-3">Niveaux & Rémunération</h2>
          <p className="text-center text-muted-foreground mb-8 text-sm">
            Les commissions sont calculées sur la part des <strong>frais de plateforme</strong> (pas sur le montant brut).
            Les donations sont exclues.
          </p>
          <div className="space-y-3">
            {TIERS.map(t => (
              <div key={t.level} className="flex items-center justify-between p-4 rounded-xl bg-card border border-border/50">
                <div className="flex items-center gap-3">
                  <Star className={`h-5 w-5 ${t.color}`} />
                  <div>
                    <span className="font-bold">{t.name}</span>
                    <span className="text-xs text-muted-foreground ml-2">{t.orgs} orgs actives</span>
                  </div>
                </div>
                <Badge variant="outline" className="text-sm font-bold">{t.rate}</Badge>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Requirements */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container max-w-3xl">
          <h2 className="text-2xl font-extrabold text-center mb-8">Conditions requises</h2>
          <div className="space-y-3 max-w-lg mx-auto">
            {[
              'Être majeur (+18 ans)',
              'Disposer d\'un réseau d\'organisations ou de leaders',
              'Accepter le contrat de partenariat',
              'Compléter la vérification d\'identité (KYC) avant le premier paiement',
              'Ne pas être propriétaire des organisations référées (anti-auto-référencement)',
            ].map((r, i) => (
              <div key={i} className="flex items-start gap-3">
                <CheckCircle className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                <span className="text-sm">{r}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Application form */}
      <section id="candidature" className="py-16 px-4 border-t border-border/40">
        <div className="container max-w-lg">
          <h2 className="text-2xl font-extrabold text-center mb-8">Postuler</h2>

          {submitted ? (
            <Card>
              <CardContent className="pt-8 pb-8 text-center space-y-4">
                <CheckCircle className="h-12 w-12 text-primary mx-auto" />
                <h3 className="text-xl font-bold">Candidature envoyée !</h3>
                <p className="text-muted-foreground text-sm">
                  Merci pour votre intérêt. Notre équipe examinera votre candidature et vous contactera
                  par email sous 48h. En attendant, vous pouvez consulter le{' '}
                  <Link to="/partner-terms" className="text-primary underline">contrat de partenariat</Link>.
                </p>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label>Nom complet *</Label>
                    <Input required value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} placeholder="Jean Dupont" />
                  </div>
                  <div>
                    <Label>Email *</Label>
                    <Input type="email" required value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="jean@example.com" />
                  </div>
                  <div>
                    <Label>Téléphone</Label>
                    <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+225 07 00 00 00 00" />
                  </div>
                  <div>
                    <Label>Pays</Label>
                    <Input value={form.country} onChange={e => setForm(f => ({ ...f, country: e.target.value }))} placeholder="CI" />
                  </div>
                  <div>
                    <Label>Pourquoi souhaitez-vous devenir partenaire ?</Label>
                    <Textarea
                      value={form.motivation}
                      onChange={e => setForm(f => ({ ...f, motivation: e.target.value }))}
                      placeholder="Décrivez votre réseau, votre expérience…"
                      maxLength={500}
                    />
                  </div>
                  <div className="flex items-start gap-2">
                    <Checkbox checked={termsAccepted} onCheckedChange={v => setTermsAccepted(!!v)} id="terms" />
                    <label htmlFor="terms" className="text-xs text-muted-foreground leading-relaxed cursor-pointer">
                      J'ai lu et j'accepte le{' '}
                      <Link to="/partner-terms" className="text-primary underline" target="_blank">Contrat de Partenariat</Link>{' '}
                      ainsi que les{' '}
                      <Link to="/terms" className="text-primary underline" target="_blank">Conditions Générales</Link>.
                    </label>
                  </div>
                  <Button type="submit" className="w-full" size="lg" disabled={submitting || !termsAccepted || !form.full_name || !form.email}>
                    {submitting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Handshake className="h-4 w-4 mr-2" />}
                    Envoyer ma candidature
                  </Button>
                </form>
              </CardContent>
            </Card>
          )}
        </div>
      </section>

      <LegalFooter />
    </div>
  );
}
