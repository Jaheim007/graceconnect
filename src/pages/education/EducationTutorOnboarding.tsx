import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { EDUCATION_CATEGORIES, EDUCATION_LEVELS, EDUCATION_MODES } from "@/lib/educationCategories";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useI18n } from "@/i18n/I18nContext";
import { cn } from "@/lib/utils";

const slugify = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
  .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 60);

export default function EducationTutorOnboarding() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  const [checking, setChecking] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState("");
  const [headline, setHeadline] = useState("");
  const [city, setCity] = useState("");
  const [bio, setBio] = useState("");
  const [rate, setRate] = useState("5000");
  const [subjects, setSubjects] = useState<string[]>([]);
  const [levels, setLevels] = useState<string[]>([]);
  const [modes, setModes] = useState<string[]>(["online"]);

  useEffect(() => {
    if (!user) { navigate("/auth?returnTo=/learn/pro/onboarding"); return; }
    (async () => {
      const { data } = await supabase.from("education_tutors").select("id").eq("user_id", user.id).maybeSingle();
      if (data) navigate("/learn/pro", { replace: true });
      else setChecking(false);
    })();
  }, [user, navigate]);

  const toggle = (list: string[], setList: (v: string[]) => void, id: string) =>
    setList(list.includes(id) ? list.filter((x) => x !== id) : [...list, id]);

  const submit = async () => {
    if (!user) return;
    if (!displayName.trim() || subjects.length === 0) {
      toast({ title: t("Champs requis", "Required fields"), description: t("Nom et au moins une matière.", "Name and at least one subject."), variant: "destructive" });
      return;
    }
    setSaving(true);
    const slug = `${slugify(displayName)}-${Math.random().toString(36).slice(2, 6)}`;
    const { data: tutor, error } = await supabase.from("education_tutors").insert({
      user_id: user.id, slug, display_name: displayName.trim(),
      headline: headline.trim() || null,
      city: city.trim() || null, bio: bio.trim() || null,
      levels, teaching_modes: modes,
      hourly_rate_xof: Number(rate) || 5000,
    }).select("id").single();
    if (error || !tutor) {
      setSaving(false);
      toast({ title: "Error", description: error?.message, variant: "destructive" });
      return;
    }
    // Insert selected subjects
    if (subjects.length > 0) {
      await supabase.from("education_subjects").insert(
        subjects.map((s) => ({ tutor_id: tutor.id, subject: s, rate_xof: Number(rate) || 5000, duration_min: 60 })),
      );
    }
    setSaving(false);
    toast({ title: t("Compte prof créé", "Tutor account created") });
    navigate("/learn/pro", { replace: true });
  };

  if (checking) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-lg px-4 py-8 space-y-5 pb-32">
        <div>
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-600">SiteViral Learn</div>
          <h1 className="mt-1 text-2xl font-black">{t("Deviens prof particulier", "Become a private tutor")}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {t("Crée ton profil en 1 minute. Tu pourras finaliser plus tard.", "Create your profile in 1 minute. You can finish later.")}
          </p>
        </div>

        <div className="space-y-4 rounded-2xl border border-border bg-card p-4">
          <div>
            <label className="mb-1 block text-xs font-semibold">{t("Nom affiché", "Display name")}</label>
            <Input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
              placeholder={t("Ex : M. Kouassi", "E.g. Ms. Smith")} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">{t("Accroche", "Headline")}</label>
            <Input value={headline} onChange={(e) => setHeadline(e.target.value)}
              placeholder={t("Prof de maths — Bac & Terminale", "Math tutor — high school")} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">{t("Ville", "City")}</label>
            <Input value={city} onChange={(e) => setCity(e.target.value)} placeholder="Abidjan" />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">{t("Présentation", "Bio")}</label>
            <Textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3}
              placeholder={t("Ton expérience, ta pédagogie…", "Your experience, teaching style…")} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">{t("Tarif horaire (XOF)", "Hourly rate (XOF)")}</label>
            <Input type="number" inputMode="numeric" value={rate} onChange={(e) => setRate(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">{t("Matières", "Subjects")}</label>
            <div className="flex flex-wrap gap-1.5">
              {EDUCATION_CATEGORIES.map((c) => (
                <button key={c.id} type="button" onClick={() => toggle(subjects, setSubjects, c.id)}
                  className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold transition",
                    subjects.includes(c.id) ? "border-teal-500 bg-teal-500/10 text-teal-600" : "border-border bg-card")}>
                  <c.icon className="h-3 w-3" />{isFr ? c.fr : c.en}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">{t("Niveaux enseignés", "Levels taught")}</label>
            <div className="flex flex-wrap gap-1.5">
              {EDUCATION_LEVELS.map((l) => (
                <button key={l.id} type="button" onClick={() => toggle(levels, setLevels, l.id)}
                  className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold",
                    levels.includes(l.id) ? "border-teal-500 bg-teal-500/10 text-teal-600" : "border-border bg-card")}>
                  {isFr ? l.fr : l.en}
                </button>
              ))}
            </div>
          </div>
          <div>
            <label className="mb-1 block text-xs font-semibold">{t("Mode de cours", "Teaching mode")}</label>
            <div className="flex flex-wrap gap-1.5">
              {EDUCATION_MODES.map((m) => (
                <button key={m.id} type="button" onClick={() => toggle(modes, setModes, m.id)}
                  className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold",
                    modes.includes(m.id) ? "border-teal-500 bg-teal-500/10 text-teal-600" : "border-border bg-card")}>
                  {isFr ? m.fr : m.en}
                </button>
              ))}
            </div>
          </div>
        </div>

        <Button onClick={submit} disabled={saving} className="w-full h-12 bg-gradient-to-br from-teal-500 to-cyan-500 text-white">
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Créer mon compte prof", "Create my tutor account")}
        </Button>
        <p className="text-[11px] text-muted-foreground text-center">
          {t("La vérification d'identité (KYC) est requise avant d'apparaître dans la recherche.",
             "Identity verification (KYC) is required before you appear in search.")}
        </p>
      </div>
    </div>
  );
}
