import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Star, MessageSquare, ShieldCheck, Clock } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { educationCategoryLabel } from "@/lib/educationCategories";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function EducationTutorPublic() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const navigate = useNavigate();

  const { data: tutor, isLoading } = useQuery({
    queryKey: ["education-tutor", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data } = await supabase.from("education_tutors").select("*").eq("slug", slug!).maybeSingle();
      return data;
    },
  });

  const { data: subjects } = useQuery({
    queryKey: ["education-tutor-subjects", tutor?.id],
    enabled: !!tutor?.id,
    queryFn: async () => {
      const { data } = await supabase.from("education_subjects")
        .select("*").eq("tutor_id", tutor!.id).eq("is_active", true);
      return data ?? [];
    },
  });

  const { data: media } = useQuery({
    queryKey: ["education-tutor-media", tutor?.id],
    enabled: !!tutor?.id,
    queryFn: async () => {
      const { data } = await supabase.from("education_provider_media")
        .select("*").eq("tutor_id", tutor!.id);
      return data ?? [];
    },
  });

  const startChat = async () => {
    if (!user) { navigate(`/auth?returnTo=/education/pro/${slug}`); return; }
    if (!tutor) return;
    const { data: existing } = await supabase.from("education_conversations")
      .select("id").eq("student_id", user.id).eq("tutor_id", tutor.id).maybeSingle();
    if (existing) { navigate(`/education/messages/${existing.id}`); return; }
    const { data: inserted, error } = await supabase.from("education_conversations")
      .insert({ student_id: user.id, tutor_id: tutor.id }).select("id").single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    navigate(`/education/messages/${inserted.id}`);
  };

  if (isLoading) return <div className="p-10 text-center text-sm text-muted-foreground">…</div>;
  if (!tutor) return <div className="p-10 text-center text-sm">Not found</div>;

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <Link to="/education/discover" className="rounded-lg p-2 hover:bg-accent"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="text-sm font-bold truncate">{tutor.display_name}</h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-5 space-y-5">
        <div className="flex items-center gap-4">
          {tutor.avatar_url ? (
            <img src={tutor.avatar_url} alt="" className="h-20 w-20 rounded-2xl object-cover" />
          ) : (
            <div className="grid h-20 w-20 place-items-center rounded-2xl bg-teal-100 text-2xl font-bold text-teal-600 dark:bg-teal-500/15">
              {tutor.display_name?.[0]}
            </div>
          )}
          <div>
            <div className="text-lg font-black">{tutor.display_name}</div>
            {tutor.headline && <div className="text-xs text-muted-foreground">{tutor.headline}</div>}
            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              {tutor.city && <><MapPin className="h-3 w-3" />{tutor.city}</>}
              {tutor.is_verified && <span className="inline-flex items-center gap-0.5 text-emerald-600"><ShieldCheck className="h-3 w-3" />{isFr ? "Vérifié" : "Verified"}</span>}
            </div>
            <div className="mt-1 flex items-center gap-1 text-sm">
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              <span className="font-bold">{Number(tutor.rating_avg).toFixed(1)}</span>
              <span className="text-muted-foreground text-xs">({tutor.rating_count})</span>
            </div>
          </div>
        </div>

        {tutor.bio && <p className="text-sm text-muted-foreground whitespace-pre-line">{tutor.bio}</p>}

        <div className="grid grid-cols-3 gap-2 text-center">
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="text-[10px] uppercase text-muted-foreground">{isFr ? "Tarif/h" : "Rate/h"}</div>
            <div className="mt-1 text-sm font-black text-teal-600">{Number(tutor.hourly_rate_xof).toLocaleString()} XOF</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="text-[10px] uppercase text-muted-foreground">{isFr ? "Séances" : "Sessions"}</div>
            <div className="mt-1 text-sm font-black">{tutor.sessions_completed}</div>
          </div>
          <div className="rounded-xl border border-border bg-card p-3">
            <div className="text-[10px] uppercase text-muted-foreground">{isFr ? "Expérience" : "Experience"}</div>
            <div className="mt-1 text-sm font-black">{tutor.years_experience} {isFr ? "ans" : "yrs"}</div>
          </div>
        </div>

        <div className="flex flex-wrap gap-1.5">
          {(tutor.teaching_modes ?? []).map((m: string) => (
            <span key={m} className="rounded-full bg-cyan-500/10 px-2.5 py-1 text-[11px] font-semibold text-cyan-600">
              {m === "online" ? (isFr ? "En ligne" : "Online") : (isFr ? "À domicile" : "In-person")}
            </span>
          ))}
          {(tutor.levels ?? []).map((l: string) => (
            <span key={l} className="rounded-full bg-muted px-2.5 py-1 text-[11px] font-semibold text-muted-foreground">{l}</span>
          ))}
        </div>

        {(media ?? []).length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-bold">{isFr ? "Diplômes & Portfolio" : "Diplomas & Portfolio"}</h2>
            <div className="grid grid-cols-3 gap-1.5">
              {(media ?? []).slice(0, 9).map((m: any) => (
                <img key={m.id} src={m.url} alt="" className="aspect-square w-full rounded-lg object-cover" />
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="mb-2 text-sm font-bold">{isFr ? "Matières & Tarifs" : "Subjects & Rates"}</h2>
          <div className="grid gap-2">
            {(subjects ?? []).length === 0 && <div className="text-xs text-muted-foreground">{isFr ? "Pas encore de matières publiées." : "No subjects published yet."}</div>}
            {(subjects ?? []).map((s: any) => (
              <div key={s.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold">{educationCategoryLabel(s.subject, locale)}</div>
                    {s.level && <div className="text-[10px] uppercase tracking-wider text-muted-foreground">{s.level}</div>}
                    {s.description && <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{s.description}</div>}
                    <div className="mt-1 flex gap-3 text-[10px] text-muted-foreground">
                      <span className="inline-flex items-center gap-0.5"><Clock className="h-3 w-3" />{s.duration_min}min</span>
                    </div>
                  </div>
                  <div className="text-right text-sm font-black text-teal-600 shrink-0">
                    {Number(s.rate_xof).toLocaleString()} XOF
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 p-3 backdrop-blur pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]">
        <div className="mx-auto max-w-3xl">
          <Button onClick={startChat} className="w-full h-12 bg-gradient-to-br from-teal-500 to-cyan-500 text-white">
            <MessageSquare className="mr-2 h-4 w-4" />
            {isFr ? "Discuter et réserver une séance" : "Chat and book a session"}
          </Button>
        </div>
      </div>
    </div>
  );
}
