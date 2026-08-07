import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Zap, ArrowLeft, ArrowRight, ShieldCheck, Check, Loader2, Scissors, MapPin, Wallet, Plus, X, Locate } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { SUPPORTED_CURRENCIES, formatCurrency } from "@/lib/currency";
import { GuestGate } from "@/components/auth/GuestGate";
import { BEAUTY_CATEGORIES } from "@/lib/beautyCategories";

// Currency → payment gateway routing (matches beauty-create-booking)
const MOMO_CURRENCIES = new Set(["XOF", "GHS", "KES"]);
function gatewayFor(currency: string) {
  return MOMO_CURRENCIES.has(currency) ? "GeniusPay (Mobile Money)" : "Stripe (carte + intl)";
}

type StepKey = "identity" | "location" | "services" | "payout";

const STEPS: { key: StepKey; label: string; icon: any }[] = [
  { key: "identity", label: "Identité", icon: Zap },
  { key: "location", label: "Zone & lieu", icon: MapPin },
  { key: "services", label: "Spécialités & services", icon: Scissors },
  { key: "payout", label: "Encaissement", icon: Wallet },
];

function slugify(s: string) {
  return s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 48);
}

type ServiceDraft = {
  category: string;
  title: string;
  duration_min: number;
  price_amount: number;
};

const STORAGE_KEY = "sv_beauty_onboarding_draft_v2";

export default function BeautyProviderOnboarding() {
  const { user, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const [stepIdx, setStepIdx] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  // Identity
  const [businessName, setBusinessName] = useState("");
  const [bio, setBio] = useState("");
  const [phone, setPhone] = useState("");

  // Location
  const [city, setCity] = useState("");
  const [address, setAddress] = useState("");
  const [latitude, setLatitude] = useState<number | null>(null);
  const [longitude, setLongitude] = useState<number | null>(null);
  const [zonesText, setZonesText] = useState("");
  const [atSalon, setAtSalon] = useState(true);
  const [atHome, setAtHome] = useState(false);
  const [geoLoading, setGeoLoading] = useState(false);

  // Specialties + services
  const [specialties, setSpecialties] = useState<string[]>([]);
  const [services, setServices] = useState<ServiceDraft[]>([
    { category: "", title: "", duration_min: 60, price_amount: 15000 },
  ]);

  // Payout currency (locked once payout profile exists)
  const [currency, setCurrency] = useState<string>("XOF");

  // Restore draft on mount
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return;
      const d = JSON.parse(raw);
      if (d.businessName) setBusinessName(d.businessName);
      if (d.bio) setBio(d.bio);
      if (d.phone) setPhone(d.phone);
      if (d.city) setCity(d.city);
      if (d.address) setAddress(d.address);
      if (d.latitude != null) setLatitude(d.latitude);
      if (d.longitude != null) setLongitude(d.longitude);
      if (d.zonesText) setZonesText(d.zonesText);
      if (typeof d.atSalon === "boolean") setAtSalon(d.atSalon);
      if (typeof d.atHome === "boolean") setAtHome(d.atHome);
      if (Array.isArray(d.specialties)) setSpecialties(d.specialties);
      if (Array.isArray(d.services) && d.services.length) setServices(d.services);
    } catch {}
  }, []);

  // Persist draft on every change
  useEffect(() => {
    const draft = {
      businessName, bio, phone, city, address, latitude, longitude,
      zonesText, atSalon, atHome, specialties, services,
    };
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(draft)); } catch {}
  }, [businessName, bio, phone, city, address, latitude, longitude, zonesText, atSalon, atHome, specialties, services]);

  // If the user already has a provider profile, skip onboarding and send them
  // straight to their dashboard. This avoids the "recreate service" trap for
  // returning pros who sign back in and click "Propose my services".
  const [providerCheckDone, setProviderCheckDone] = useState(false);
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      const { data: existingProvider } = await supabase
        .from("beauty_providers")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();
      if (cancelled) return;
      if (existingProvider) {
        try { localStorage.removeItem(STORAGE_KEY); } catch {}
        navigate("/dashboard", { replace: true });
        return;
      }
      const { data } = await supabase
        .from("payout_profiles")
        .select("payout_currency")
        .eq("user_id", user.id)
        .maybeSingle();
      if (data?.payout_currency) setCurrency(data.payout_currency);
      setProviderCheckDone(true);
    })();
    return () => { cancelled = true; };
  }, [user, navigate]);


  const step = STEPS[stepIdx];

  const toggleSpecialty = (c: string) => {
    setSpecialties((prev) => prev.includes(c) ? prev.filter((x) => x !== c) : [...prev, c]);
    // Auto-assign first service category if empty
    setServices((prev) => prev.map((s, i) => (i === 0 && !s.category) ? { ...s, category: c } : s));
  };

  const addService = () => {
    if (services.length >= 3) return;
    setServices([...services, { category: specialties[0] ?? "", title: "", duration_min: 60, price_amount: 15000 }]);
  };
  const removeService = (i: number) => setServices(services.filter((_, idx) => idx !== i));
  const updateService = (i: number, patch: Partial<ServiceDraft>) =>
    setServices(services.map((s, idx) => idx === i ? { ...s, ...patch } : s));

  const useMyPosition = () => {
    if (!("geolocation" in navigator)) { toast.error("Géolocalisation indisponible sur cet appareil."); return; }
    setGeoLoading(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setLatitude(Number(pos.coords.latitude.toFixed(6)));
        setLongitude(Number(pos.coords.longitude.toFixed(6)));
        toast.success("Position enregistrée.");
        setGeoLoading(false);
      },
      (err) => {
        toast.error(err.message || "Impossible d'obtenir la position.");
        setGeoLoading(false);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const canNext = useMemo(() => {
    if (step.key === "identity") return businessName.trim().length >= 2 && phone.trim().length >= 6;
    if (step.key === "location") return city.trim().length >= 2 && (atSalon || atHome);
    if (step.key === "services") {
      if (specialties.length === 0) return false;
      const validServices = services.filter((s) => s.title.trim().length >= 2 && s.price_amount > 0 && s.category);
      return validServices.length >= 1;
    }
    return true;
  }, [step, businessName, phone, city, atSalon, atHome, specialties, services]);

  async function handleFinish() {
    if (!user) return;
    setSubmitting(true);
    try {
      const baseSlug = slugify(businessName) || `pro-${user.id.slice(0, 6)}`;
      const slug = `${baseSlug}-${user.id.slice(0, 6)}`;

      const zones = zonesText.split(",").map((s) => s.trim()).filter(Boolean);

      const { data: provider, error: pErr } = await supabase
        .from("beauty_providers")
        .insert({
          user_id: user.id,
          business_name: businessName.trim(),
          slug,
          bio: bio.trim() || null,
          phone: phone.trim(),
          city: city.trim(),
          address: address.trim() || null,
          latitude,
          longitude,
          zones,
          home_service_ok: atHome,
          at_salon_ok: atSalon,
          specialties,
          status: "pending",
        } as any)
        .select("id")
        .single();
      if (pErr) throw pErr;

      // Ensure payout currency
      const { data: existingPayout } = await supabase
        .from("payout_profiles")
        .select("id, payout_currency")
        .eq("user_id", user.id)
        .maybeSingle();
      if (!existingPayout) {
        await supabase.from("payout_profiles").insert({ user_id: user.id, payout_currency: currency });
      } else if (existingPayout.payout_currency !== currency) {
        await supabase.from("payout_profiles").update({ payout_currency: currency }).eq("id", existingPayout.id);
      }

      // Insert valid services
      const validServices = services.filter((s) => s.title.trim().length >= 2 && s.price_amount > 0 && s.category);
      if (validServices.length) {
        const rows = validServices.map((s) => ({
          provider_id: provider.id,
          category: s.category,
          title: s.title.trim(),
          duration_min: s.duration_min,
          currency,
          price_amount: s.price_amount,
          price_xof: currency === "XOF" ? s.price_amount : 0,
          allow_full_escrow: true,
          allow_deposit: false,
          deposit_pct: 0,
          allow_cash: false,
          at_salon: atSalon,
          at_home: atHome,
        }));
        const { error: sErr } = await supabase.from("beauty_services").insert(rows);
        if (sErr) throw sErr;
      }

      try { localStorage.removeItem(STORAGE_KEY); } catch {}
      toast.success("Profil créé ! Prochaine étape : KYC.");
      navigate("/dashboard");
    } catch (e: any) {
      toast.error(e.message ?? "Impossible de créer le profil");
    } finally {
      setSubmitting(false);
    }
  }

  if (!authLoading && !user) {
    return (
      <GuestGate
        icon={Scissors}
        title="Propose tes services beauté"
        subtitle="Crée ton compte pour proposer tes prestations et recevoir des réservations. Gratuit pour commencer."
        nextUrl="/beauty/pro/onboarding"
      />
    );
  }

  // While we're checking whether the user already has a provider profile,
  // don't flash the onboarding form (it would let existing pros re-create).
  if (user && !providerCheckDone) {
    return (
      <div className="min-h-screen grid place-items-center bg-background text-muted-foreground">
        <Loader2 className="h-6 w-6 animate-spin" />
      </div>
    );
  }


  return (
    <div className="beauty-scope min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/85 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-4">
          <Link to="/beauty" className="flex items-center gap-2.5">
            <span className="grid h-10 w-10 place-items-center rounded-xl beauty-gradient text-white shadow-md">
              <Scissors className="h-5 w-5" />
            </span>
            <div className="leading-tight">
              <div className="text-sm font-black tracking-tight">SiteViral Beauty</div>
              <div className="text-[10px] font-semibold uppercase tracking-[0.18em] text-primary">Créer mon profil</div>
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
              className={`h-1.5 flex-1 rounded-full transition ${i <= stepIdx ? "beauty-gradient" : "bg-muted"}`}
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
            {step.key === "services" && "Tes spécialités & services"}
            {step.key === "payout" && "Encaissement & KYC"}
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            {step.key === "identity" && "Ces infos apparaissent sur ton profil public."}
            {step.key === "location" && "Ville, adresse et zones où tu opères — partout en Afrique."}
            {step.key === "services" && "Choisis toutes tes spécialités, puis ajoute jusqu'à 3 services à démarrer."}
            {step.key === "payout" && "Ta devise détermine le mode de paiement des clients."}
          </p>
        </div>

        <Card className="p-6 sm:p-8">
          {step.key === "identity" && (
            <div className="space-y-5">
              <div>
                <Label htmlFor="bn">Nom du salon / nom d'artiste</Label>
                <Input id="bn" value={businessName} onChange={(e) => setBusinessName(e.target.value)} placeholder="Ex : Chez Aïcha Beauty" />
              </div>
              <div>
                <Label htmlFor="ph">Téléphone WhatsApp (interne SiteViral)</Label>
                <Input id="ph" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+225 07 00 00 00 00" />
                <p className="mt-1 text-xs text-muted-foreground">
                  Utilisé uniquement par l'équipe SiteViral (support, KYC, litiges, paiements). <strong>Jamais visible par les clients</strong>. Toute la communication client passe par le chat SiteViral.
                </p>
              </div>
              <div>
                <Label htmlFor="bio">Bio courte</Label>
                <Textarea id="bio" rows={3} value={bio} onChange={(e) => setBio(e.target.value)} placeholder="Spécialiste tresses & lisseur brésilien, 5 ans d'expérience." />
              </div>
            </div>
          )}

          {step.key === "location" && (
            <div className="space-y-6">
              <div>
                <Label htmlFor="city">Ville *</Label>
                <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="Ex : Abidjan, Dakar, Accra, Lagos, Kinshasa…" />
              </div>
              <div>
                <Label htmlFor="addr">Adresse du salon (optionnel)</Label>
                <Input id="addr" value={address} onChange={(e) => setAddress(e.target.value)} placeholder="Rue, immeuble, point de repère…" />
                <p className="mt-1 text-xs text-muted-foreground">Visible seulement après réservation confirmée si tu travailles en salon.</p>
              </div>
              <div className="rounded-xl border border-border/60 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <div className="text-sm font-semibold">Position GPS (optionnel)</div>
                    <div className="text-xs text-muted-foreground">
                      {latitude != null && longitude != null
                        ? <>Enregistrée : <b>{latitude.toFixed(4)}, {longitude.toFixed(4)}</b></>
                        : "Aide les clients proches à te trouver."}
                    </div>
                  </div>
                  <Button type="button" variant="outline" size="sm" onClick={useMyPosition} disabled={geoLoading}>
                    {geoLoading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Locate className="mr-2 h-4 w-4" />}
                    Utiliser ma position
                  </Button>
                </div>
              </div>
              <div>
                <Label htmlFor="zones">Quartiers desservis (optionnel)</Label>
                <Input id="zones" value={zonesText} onChange={(e) => setZonesText(e.target.value)} placeholder="Cocody, Marcory, Riviera" />
                <p className="mt-1 text-xs text-muted-foreground">Séparés par des virgules.</p>
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

          {step.key === "services" && (
            <div className="space-y-7">
              <div>
                <Label>Mes spécialités <span className="text-muted-foreground font-normal">(sélectionne-en une ou plusieurs)</span></Label>
                <div className="mt-2 flex flex-wrap gap-2">
                  {BEAUTY_CATEGORIES.map((c) => {
                    const active = specialties.includes(c);
                    return (
                      <button
                        key={c}
                        type="button"
                        onClick={() => toggleSpecialty(c)}
                        className={`rounded-full border px-3 py-1.5 text-sm font-semibold transition ${
                          active ? "border-primary bg-primary text-primary-foreground" : "border-border bg-background hover:border-primary/50"
                        }`}
                      >
                        {c}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="border-t border-border/60 pt-5">
                <div className="mb-3 flex items-center justify-between">
                  <Label className="text-base">Services à publier</Label>
                  <span className="text-xs text-muted-foreground">{services.length}/3</span>
                </div>

                <div className="mb-4 rounded-lg bg-muted/50 px-3 py-2 text-[11px] text-muted-foreground">
                  Devise d'encaissement : <b>{currency}</b> · Le prix affiché ici est celui que le client paie et que <b>tu reçois dans ta devise</b>. Encaissement via <b>{gatewayFor(currency)}</b>.
                </div>

                <div className="space-y-4">
                  {services.map((s, i) => (
                    <div key={i} className="rounded-xl border border-border/60 p-4 space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="text-xs font-semibold uppercase tracking-wider text-primary">Service {i + 1}</div>
                        {services.length > 1 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => removeService(i)}>
                            <X className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      <div>
                        <Label>Catégorie</Label>
                        <Select value={s.category} onValueChange={(v) => updateService(i, { category: v })}>
                          <SelectTrigger><SelectValue placeholder="Choisis une catégorie" /></SelectTrigger>
                          <SelectContent>
                            {(specialties.length ? specialties : BEAUTY_CATEGORIES.slice()).map((c) => (
                              <SelectItem key={c} value={c}>{c}</SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label>Titre du service</Label>
                        <Input value={s.title} onChange={(e) => updateService(i, { title: e.target.value })} placeholder="Ex : Tresses collées + soin" />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <div>
                          <Label>Durée (min)</Label>
                          <Input type="number" min={15} step={15} value={s.duration_min} onChange={(e) => updateService(i, { duration_min: Number(e.target.value) })} />
                        </div>
                        <div>
                          <Label>Prix ({currency})</Label>
                          <Input type="number" min={0} step={100} value={s.price_amount} onChange={(e) => updateService(i, { price_amount: Number(e.target.value) })} />
                          <p className="mt-1 text-[11px] text-muted-foreground">{formatCurrency(s.price_amount, currency)}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {services.length < 3 && (
                  <Button type="button" variant="outline" size="sm" className="mt-3" onClick={addService}>
                    <Plus className="mr-1 h-4 w-4" /> Ajouter un service
                  </Button>
                )}
              </div>
            </div>
          )}

          {step.key === "payout" && (
            <div className="space-y-5">
              <div>
                <Label>Devise d'encaissement</Label>
                <Select value={currency} onValueChange={setCurrency}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {SUPPORTED_CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>{c.code} — {c.label}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="rounded-2xl border border-border/60 beauty-soft p-5">
                <div className="flex items-center gap-3">
                  <span className="grid h-10 w-10 place-items-center rounded-xl bg-primary text-primary-foreground">
                    <ShieldCheck className="h-5 w-5" />
                  </span>
                  <div>
                    <div className="font-bold">Encaissement en {currency}</div>
                    <div className="text-xs text-muted-foreground">Route : {gatewayFor(currency)}. Payout min 10 000 XOF (≈ 15 EUR / 16 USD).</div>
                  </div>
                </div>
              </div>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-primary" /> KYC obligatoire avant premier payout — géré depuis ton dashboard SiteViral.</li>
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-primary" /> Commission plateforme : 10%.</li>
                <li className="flex gap-2"><Check className="mt-0.5 h-4 w-4 text-primary" /> Fonds débloqués 24–48h après la prestation confirmée.</li>
              </ul>
              <p className="text-xs text-muted-foreground">
                En validant, tu acceptes les CGU SiteViral Beauty. Ton profil passe en statut « en attente » jusqu'à validation KYC.
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
              Créer mon profil
            </Button>
          )}
        </div>
      </main>
    </div>
  );
}
