import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Sparkles, ArrowLeft, ArrowRight, ShieldCheck, Check, Loader2,
  Scissors, MapPin, Wallet,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";

const ZONES = ["Cocody", "Marcory", "Yopougon", "Riviera", "Plateau", "Treichville", "Abobo", "Angré", "Bingerville"];
const CATEGORIES = ["Coiffure", "Ongles", "Maquillage", "Soins visage", "Extensions & cils", "Massage & spa"];

type StepKey = "identity" | "location" | "service" | "payout";

const STEPS: { key: StepKey; label: string; icon: any }[] = [
  { key: "identity", label: "Identité", icon: Sparkles },
  { key: "location", label: "Zone & lieu", icon: MapPin },
  { key: "service", label: "1er service", icon: Scissors },
  { key: "payout", label: "Paiement", icon: Wallet },
];

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
}

export default function BeautyProviderOnboarding() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stepIdx, setStepIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const [businessName, setBusinessName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [atSalon, setAtSalon] = useState(true);
  const [atHome, setAtHome] = useState(false);
  const [category, setCategory] = useState(CATEGORIES[0]);
  const [serviceTitle, setServiceTitle] = useState("");
  const [duration, setDuration] = useState(60);
  const [price, setPrice] = useState(15000);
  const [allowDeposit, setAllowDeposit] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate(`/auth?returnTo=${encodeURIComponent("/beauty/pro/onboarding")}`);
    }
  }, [user, authLoading, navigate]);

  const step = STEPS[stepIdx];

  const canNext = useMemo(() => {
    if (step.key === "identity") return businessName.trim().length >= 2 && phone.trim().length >= 6;
    if (step.key === "location") return selectedZones.length > 0 && (atSalon || atHome);
    if (step.key === "service") return serviceTitle.trim().length >= 2 && price > 0;
    return true;
  }, [step, businessName, phone, selectedZones, atSalon, atHome, serviceTitle, price]);

  const toggleZone = (z: string) =>
    setSelectedZones((prev) => (prev.includes(z) ? prev.filter((x) => x !== z) : [...prev, z]));

  async function handleFinish() {
    if (!user) return;
    setSubmitting(true);
    try {
      const baseSlug = slugify(businessName) || `pro-${user.id.slice(0, 6)}`;
      const slug = `${baseSlug}-${user.id.slice(0, 6)}`;

      const { data: provider, error: pErr } = await supabase
        .from("beauty_providers")
        .insert({
          user_id: user.id,
          business_name: businessName.trim(),
          slug,
          bio: bio.trim() || null,
          phone: phone.trim(),
          zones: selectedZones,
          home_service_ok: atHome,
          at_salon_ok: atSalon,
          status: "pending",
        })
        .select("id")
        .single();
      if (pErr) throw pErr;

      const { error: sErr } = await supabase.from("beauty_services").insert({
        provider_id: provider.id,
        category,
        title: serviceTitle.trim(),
        duration_min: duration,
        price_xof: price,
        allow_full_escrow: true,
        allow_deposit: allowDeposit,
        deposit_pct: 20,
        allow_cash: false,
        at_salon: atSalon,
        at_home: atHome,
      });
      if (sErr) throw sErr;

      toast.success("Profil pro créé ! Vérification KYC en cours.");
      navigate("/beauty");
    } catch (e: any) {
      toast.error(e.message ?? "Impossible de créer le profil");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="beauty-scope min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link to="/beauty" className="flex items-center gap-2">
            <span className="grid h-9 w-9 place-items-center rounded-xl beauty-gradient text-white shadow-lg">
              <Sparkles className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-black tracking-tight">SiteViral Beauty</div>
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">Onboarding pro</div>
            </div>
          </Link>
          <Badge className="bg-primary/10 text-primary hover:bg-primary/15">
            Étape {stepIdx + 1}/{STEPS.length}
          </Badge>
        </div>
        <div className="mx-auto flex max-w-3xl gap-1 px-4 pb-3">
          {STEPS.map((s, i) => (
            <div
              key={s.key}
              className={`h-1.5 flex-1 rounded-full transition ${
                i <= stepIdx ? "beauty-gradient" : "bg-muted"
              }`}
            />
          ))}
        </div>
      </header>

      <main className="mx-auto max-w-3xl px-4 py-10">
        <div className="mb-8">
          <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.18em] text-primary">
            <step.icon className="h-4 w-4" />
            {step.label}
          </div>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            {step.key === "identity" && "Présente-toi en 30 secondes"}
            {step.key === "location" && "Où travailles-tu ?"}
            {step.key === "service" && "Ton premier service"}
            {step.key === "payout" && "Encaissement & KYC"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {step.key === "identity" && "Ces infos apparaissent sur ton profil public."}
            {step.key === "location" && "Choisis les quartiers d’Abidjan où tu opères et si tu reçois ou te déplaces."}
            {step.key === "service" && "Tu pourras en ajouter d’autres depuis ton dashboard."}
            {step.key === "payout" && "On réutilise ton profil de paiement SiteViral (Mobile Money / Stripe)."}
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          {step.key === "identity" && (
            <div className="space-y-5">
              <div>
                <Label htmlFor="bn">Nom du salon / nom pro</Label>
                <Input id="bn" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Ex : Chez Aïcha Beauty" />
              </div>
              <div>
                <Label htmlFor="ph">Téléphone WhatsApp</Label>
                <Input id="ph" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+225 07 00 00 00 00" />
                <p className="mt-1 text-xs text-muted-foreground">Masqué au client tant que la réservation n’est pas confirmée.</p>
              </div>
              <div>
                <Label htmlFor="bio">Bio courte</Label>
                <Textarea id="bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Spécialiste tresses & lisseur brésilien, 5 ans d’expérience." />
              </div>
            </div>
          )}

          {step.key === "location" && (
            <div className="space-y-6">
              <div>
                <Label>Zones desservies</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {ZONES.map((z) => {
                    const on = selectedZones.includes(z);
                    return (
                      <button
                        key={z}
                        type="button"
                        onClick={() => toggleZone(z)}
                        className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                          on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/50"
                        }`}
                      >
                        {on && <Check className="mr-1 inline h-3.5 w-3.5" />}
                        {z}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="grid gap-3 sm:grid-cols-2">
                <label className="flex items-center justify-between rounded-xl border border-border/60 p-4">
                  <div>
                    <div className="font-semibold">En salon</div>
                    <div className="text-xs text-muted-foreground">Le client vient chez toi.</div>
                  </div>
                  <Switch checked={atSalon} onCheckedChange={setAtSalon} />
                </label>
                <label className="flex items-center justify-between rounded-xl border border-border/60 p-4">
                  <div>
                    <div className="font-semibold">À domicile</div>
                    <div className="text-xs text-muted-foreground">Tu te déplaces chez le client.</div>
                  </div>
                  <Switch checked={atHome} onCheckedChange={setAtHome} />
                </label>
              </div>
            </div>
          )}

          {step.key === "service" && (
            <div className="space-y-5">
              <div>
                <Label>Catégorie</Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {CATEGORIES.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setCategory(c)}
                      className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                        c === category ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/50"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <Label htmlFor="st">Titre du service</Label>
                <Input id="st" value={serviceTitle} onChange={(e) => setServiceTitle(e.target.value)} placeholder="Ex : Tresses collées + soin" />
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <Label htmlFor="dur">Durée (min)</Label>
                  <Input id="dur" type="number" min={15} step={15} value={duration} onChange={(e) => setDuration(Number(e.target.value))} />
                </div>
                <div>
                  <Label htmlFor="pr">Prix (XOF)</Label>
                  <Input id="pr" type="number" min={0} step={500} value={price} onChange={(e) => setPrice(Number(e.target.value))} />
                </div>
              </div>
              <label className="flex items-center gap-3 rounded-xl border border-border/60 p-4">
                <Checkbox checked={allowDeposit} onCheckedChange={(v) => setAllowDeposit(Boolean(v))} />
                <div>
                  <div className="text-sm font-semibold">Autoriser l’acompte 20%</div>
                  <div className="text-xs text-muted-foreground">Le client bloque le créneau, paie le reste en cash à la prestation.</div>
                </div>
              </label>
            </div>
          )}

          {step.key === "payout" && (
            <div className="space-y-4">
              <div className="rounded-2xl border border-border/60 beauty-soft p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="font-bold">Encaissement via SiteViral</div>
                    <div className="text-xs text-muted-foreground">Paystack Mobile Money (XOF) et Stripe (intl). Payout min 10 000 XOF.</div>
                  </div>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-primary" /> KYC obligatoire avant premier payout — géré depuis ton dashboard SiteViral.</li>
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-primary" /> Commission plateforme : 10% (par défaut).</li>
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-primary" /> Fonds débloqués 72h après la prestation (auto-release).</li>
              </ul>
              <p className="text-xs text-muted-foreground">
                En validant, tu acceptes les CGU SiteViral Beauty. Ton profil passe en statut « en attente » jusqu’à validation KYC.
              </p>
            </div>
          )}
        </Card>

        <div className="mt-8 flex items-center justify-between">
          <Button
            variant="ghost"
            disabled={stepIdx === 0 || submitting}
            onClick={() => setStepIdx((i) => Math.max(0, i - 1))}
          >
            <ArrowLeft className="mr-1 h-4 w-4" /> Retour
          </Button>
          {stepIdx < STEPS.length - 1 ? (
            <Button
              disabled={!canNext}
              onClick={() => setStepIdx((i) => Math.min(STEPS.length - 1, i + 1))}
              className="beauty-gradient text-white hover:opacity-90"
            >
              Continuer <ArrowRight className="ml-1 h-4 w-4" />
            </Button>
          ) : (
            <Button
              disabled={submitting}
              onClick={handleFinish}
              className="beauty-gradient text-white hover:opacity-90 beauty-shadow"
            >
              {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Check className="mr-2 h-4 w-4" />}
              Créer mon profil pro
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
