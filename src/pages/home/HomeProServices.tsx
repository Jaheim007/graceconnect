import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Plus, Trash2, Loader2, Wrench } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { HOME_CATEGORIES, homeCategoryLabel } from "@/lib/homeCategories";
import { cn } from "@/lib/utils";

export default function HomeProServices() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<string>("");
  const [priceFrom, setPriceFrom] = useState<string>("");

  const { data: provider, isLoading: loadingProvider } = useQuery({
    queryKey: ["home-provider-me", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("home_providers").select("id, currency").eq("user_id", user!.id).maybeSingle();
      if (!data) navigate("/home/pro/onboarding", { replace: true });
      return data;
    },
  });

  const { data: services, isLoading } = useQuery({
    queryKey: ["home-my-services", provider?.id],
    enabled: !!provider?.id,
    queryFn: async () => {
      const { data } = await supabase.from("home_services")
        .select("id, title, description, category, price_from, active, created_at")
        .eq("provider_id", provider!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const addMut = useMutation({
    mutationFn: async () => {
      if (!provider?.id) throw new Error("No provider");
      if (!title.trim() || !priceFrom) throw new Error(t("Titre et prix requis.", "Title and price required."));
      const { error } = await supabase.from("home_services").insert({
        provider_id: provider.id,
        title: title.trim(),
        description: description.trim() || null,
        category: category || null,
        price_from: Number(priceFrom),
      });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: t("Service ajouté", "Service added") });
      setTitle(""); setDescription(""); setCategory(""); setPriceFrom("");
      qc.invalidateQueries({ queryKey: ["home-my-services", provider?.id] });
    },
    onError: (e: any) => toast({ title: "Error", description: e.message, variant: "destructive" }),
  });

  const toggleActive = useMutation({
    mutationFn: async (s: { id: string; active: boolean }) => {
      const { error } = await supabase.from("home_services").update({ active: !s.active }).eq("id", s.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["home-my-services", provider?.id] }),
  });

  const delMut = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("home_services").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["home-my-services", provider?.id] }),
  });

  if (loadingProvider) return <div className="min-h-screen grid place-items-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <Link to="/home/pro" className="rounded-lg p-2 hover:bg-accent"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="text-sm font-bold">{t("Mes services", "My services")}</h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-5 space-y-5 pb-28">
        <div className="rounded-2xl border border-border bg-card p-4 space-y-3">
          <div className="text-sm font-bold flex items-center gap-2"><Plus className="h-4 w-4" />{t("Ajouter un service", "Add a service")}</div>
          <Input value={title} onChange={(e) => setTitle(e.target.value)}
            placeholder={t("Ex : Débouchage évier", "E.g. Sink unclogging")} />
          <Textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            placeholder={t("Ce qui est inclus (facultatif)", "What's included (optional)")} />
          <div className="flex flex-wrap gap-1.5">
            {HOME_CATEGORIES.map((c) => (
              <button key={c.id} type="button" onClick={() => setCategory(category === c.id ? "" : c.id)}
                className={cn("inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-xs font-semibold",
                  category === c.id ? "border-sky-500 bg-sky-500/10 text-sky-600" : "border-border bg-card")}>
                <c.icon className="h-3 w-3" />{isFr ? c.fr : c.en}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Input type="number" inputMode="numeric" value={priceFrom} onChange={(e) => setPriceFrom(e.target.value)}
              placeholder={t("Prix à partir de", "Price from")} className="flex-1" />
            <span className="text-xs font-semibold text-muted-foreground">{provider?.currency}</span>
          </div>
          <Button onClick={() => addMut.mutate()} disabled={addMut.isPending}
            className="w-full h-11 bg-gradient-to-br from-sky-500 to-emerald-500 text-white">
            {addMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Ajouter", "Add")}
          </Button>
        </div>

        <div className="space-y-2">
          {isLoading && <div className="text-center text-xs text-muted-foreground py-4">…</div>}
          {(services ?? []).length === 0 && !isLoading && (
            <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center">
              <Wrench className="mx-auto h-6 w-6 text-muted-foreground" />
              <p className="mt-2 text-sm">{t("Aucun service publié.", "No services yet.")}</p>
            </div>
          )}
          {(services ?? []).map((s: any) => (
            <div key={s.id} className="rounded-2xl border border-border bg-card p-4">
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0 flex-1">
                  <div className="text-sm font-bold">{s.title}</div>
                  {s.category && <div className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">{homeCategoryLabel(s.category, locale)}</div>}
                  {s.description && <div className="mt-1 text-xs text-muted-foreground line-clamp-2">{s.description}</div>}
                </div>
                <div className="text-right shrink-0">
                  <div className="text-sm font-black text-sky-600">{Number(s.price_from).toLocaleString()} {provider?.currency}</div>
                </div>
              </div>
              <div className="mt-3 flex items-center gap-2">
                <Button size="sm" variant="outline" onClick={() => toggleActive.mutate(s)}>
                  {s.active ? t("Désactiver", "Deactivate") : t("Activer", "Activate")}
                </Button>
                <Button size="sm" variant="ghost" className="text-destructive" onClick={() => { if (confirm(t("Supprimer ce service ?", "Delete this service?"))) delMut.mutate(s.id); }}>
                  <Trash2 className="h-4 w-4" />
                </Button>
                {!s.active && <span className="ml-auto text-[10px] uppercase tracking-wider text-muted-foreground">{t("Inactif", "Inactive")}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
