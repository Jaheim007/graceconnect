import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Loader2, BookOpen, Clock } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { EDUCATION_CATEGORIES, EDUCATION_LEVELS, educationCategoryLabel } from "@/lib/educationCategories";
import { cn } from "@/lib/utils";
import { askConfirm } from '@/components/ui/confirm-dialog';

export default function EducationTutorSubjects() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [subject, setSubject] = useState<string>("");
  const [level, setLevel] = useState<string>("");
  const [description, setDescription] = useState("");
  const [rate, setRate] = useState<string>("");
  const [duration, setDuration] = useState<string>("60");

  const { data: tutor, isLoading: loadingTutor } = useQuery({
    queryKey: ["education-tutor-me", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("education_tutors").select("id, hourly_rate_xof").eq("user_id", user!.id).maybeSingle();
      if (!data) navigate("/learn/pro/onboarding", { replace: true });
      return data;
    },
  });

  const { data: subjects, isLoading } = useQuery({
    queryKey: ["education-my-subjects", tutor?.id],
    enabled: !!tutor?.id,
    queryFn: async () => {
      const { data } = await supabase.from("education_subjects")
        .select("*").eq("tutor_id", tutor!.id).order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const addMut = useMutation({
    mutationFn: async () => {
      if (!tutor?.id) throw new Error("No tutor");
      if (!subject || !rate) throw new Error(t("Matière et tarif requis.", "Subject and rate required."));
      const { error } = await supabase.from("education_subjects").insert({
        tutor_id: tutor.id, subject, level: level || null,
        description: description.trim() || null,
        rate_xof: Number(rate), duration_min: Number(duration) || 60,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: t("Matière ajoutée", "Subject added") });
      setSubject(""); setLevel(""); setDescription(""); setRate(""); setDuration("60");
      qc.invalidateQueries({ queryKey: ["education-my-subjects", tutor?.id] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: async (s: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from("education_subjects").update({ is_active: !s.is_active }).eq("id", s.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["education-my-subjects", tutor?.id] }),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("education_subjects").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["education-my-subjects", tutor?.id] }),
  });

  if (loadingTutor) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <Link to="/dashboard" className="rounded-lg p-2 hover:bg-accent"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="text-sm font-bold">{t("Mes matières", "My subjects")}</h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-5 space-y-5 pb-28">
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="text-sm font-bold flex items-center gap-2"><Plus className="h-4 w-4" />{t("Ajouter une matière", "Add a subject")}</div>
          <div className="flex flex-wrap gap-1.5">
            {EDUCATION_CATEGORIES.map((c) => (
              <button key={c.id} type="button" onClick={() => setSubject(subject === c.id ? "" : c.id)}
                className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold",
                  subject === c.id ? "border-teal-500 bg-teal-500/10 text-teal-600" : "border-border bg-card")}>
                <c.icon className="h-3 w-3" />{isFr ? c.fr : c.en}
              </button>
            ))}
          </div>
          <div className="flex flex-wrap gap-1.5">
            {EDUCATION_LEVELS.map((l) => (
              <button key={l.id} type="button" onClick={() => setLevel(level === l.id ? "" : l.id)}
                className={cn("rounded-full border px-2.5 py-1 text-xs font-semibold",
                  level === l.id ? "border-teal-500 bg-teal-500/10 text-teal-600" : "border-border bg-card")}>
                {isFr ? l.fr : l.en}
              </button>
            ))}
          </div>
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            placeholder={t("Ce que le cours couvre (facultatif)", "What the lesson covers (optional)")} />
          <div className="grid grid-cols-2 gap-2">
            <Input type="number" inputMode="numeric" value={rate} onChange={(e) => setRate(e.target.value)}
              placeholder={t("Tarif (XOF)", "Rate (XOF)")} />
            <Input type="number" value={duration} onChange={(e) => setDuration(e.target.value)}
              placeholder={t("Durée (min)", "Duration (min)")} />
          </div>
          <Button onClick={() => addMut.mutate()} disabled={addMut.isPending}
            className="w-full h-11 bg-gradient-to-br from-teal-500 to-cyan-500 text-white">
            {addMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Ajouter", "Add")}
          </Button>
        </div>

        <div className="space-y-2">
          {isLoading && <div className="text-center text-xs text-muted-foreground py-4">…</div>}
          {(subjects ?? []).length === 0 && !isLoading && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
              <BookOpen className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm">{t("Aucune matière publiée.", "No subjects yet.")}</p>
            </div>
          )}
          {(subjects ?? []).map((s: any) => (
            <div key={s.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold">{educationCategoryLabel(s.subject, locale)}</div>
                  {s.level && <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{s.level}</div>}
                  {s.description && <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{s.description}</div>}
                  <div className="mt-1 flex gap-3 text-[10px] text-muted-foreground">
                    <span className="inline-flex items-center gap-0.5"><Clock className="h-3 w-3" />{s.duration_min}min</span>
                  </div>
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-teal-600">{Number(s.rate_xof).toLocaleString()} XOF</div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => toggleActive.mutate(s)}>
                  {s.is_active ? t("Désactiver", "Deactivate") : t("Activer", "Activate")}
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if ((await askConfirm(t("Supprimer ?", "Delete?")))) delMut.mutate(s.id); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                {!s.is_active && <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">{t("Inactif", "Inactive")}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
