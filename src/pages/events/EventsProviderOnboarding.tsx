import { useEffect, useState } from "react";
import { useNavigate } from "@/lib/router-compat";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { EVENTS_CATEGORIES } from "@/lib/eventsCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useI18n } from "@/i18n/I18nContext";
import { cn } from "@/lib/utils";

const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

export default function EventsProviderOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [cats, setCats] = useState<string[]>([]);

  useEffect(() => {
    if (!user) { navigate("/auth?returnTo=/events/pro/onboarding"); return; }
    (async () => {
      const { data } = await supabase.from("events_providers").select("id").eq("user_id", user.id).maybeSingle();
      if (data) navigate("/dashboard", { replace: true });
      else setChecking(false);
    })();
  }, [user, navigate]);

  const toggleCat = (id: string) => setCats((prev) => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]);

  const submit = async () => {
    if (!user) return;
    if (!businessName.trim() || cats.length === 0) {
      toast({ title: t("Champs requis", "Required fields"), description: t("Nom et au moins une catégorie.", "Name and at least one category."), variant: "destructive" });
      return;
    }
    setSaving(true);
    const slug = `${slugify(businessName)}-${Math.random().toString(36).slice(2, 6)}`;
    const { error } = await supabase.from("events_providers").insert({
      user_id: user.id, slug, business_name: businessName.trim(),
      city: city.trim() || null, bio: bio.trim() || null, categories: cats,
    });
    setSaving(false);
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    toast({ title: t("Compte prestataire créé", "Vendor account created") });
    navigate("/dashboard", { replace: true });
  };

  if (checking) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-lg px-4 py-8 space-y-5 pb-32">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-fuchsia-600">SiteViral Events</div>
          <h1 className="mt-1 text-2xl font-black">{t("Deviens prestataire Events", "Become an Events vendor")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("Crée ton profil en 1 minute. Tu pourras finaliser plus tard.", "Create your profile in 1 minute. You can finish later.")}
          </p>
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <div>
            <label className="mb-1 block text-xs font-semibold">{t("Nom de l'activité", "Business name")}</label>
            <Input value={businessName} onChange={(e) => setBusinessName(e.target.value)}
              placeholder={t("Ex : Studio Kouassi Photo", "E.g. Smith Wedding Photo")} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">{t("Ville", "City")}</label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Abidjan" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">{t("Présentation", "Bio")}</label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
              placeholder={t("Ce que tu fais, ton style, ton expérience…", "What you do, your style, your experience…")} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">{t("Catégories", "Categories")}</label>
            <div className="flex flex-wrap gap-1.5">
              {EVENTS_CATEGORIES.map((c) => (
                <button key={c.id} type="button" onClick={() => toggleCat(c.id)}
                  className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition",
                    cats.includes(c.id) ? "border-fuchsia-500 bg-fuchsia-500/10 text-fuchsia-600" : "border-border bg-card")}>
                  <c.icon className="h-3 w-3" />{isFr ? c.fr : c.en}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button onClick={submit} disabled={saving} className="w-full h-12 bg-gradient-to-br from-fuchsia-500 to-violet-500 text-white">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Créer mon compte prestataire", "Create my vendor account")}
        </Button>
        <p className="text-[11px] text-muted-foreground text-center">
          {t("La vérification d'identité (KYC) est requise avant d'apparaître dans la recherche.",
             "Identity verification (KYC) is required before you appear in search.")}
        </p>
      </div>
    </div>
  );
}
