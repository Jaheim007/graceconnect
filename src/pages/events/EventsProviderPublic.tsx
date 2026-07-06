import { Link, useParams, useNavigate } from "react-router-dom";
import { ArrowLeft, MapPin, Star, MessageSquare, ShieldCheck, Users } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import { eventsCategoryLabel } from "@/lib/eventsCategories";
import { Button } from "@/components/ui/button";
import { toast } from "@/hooks/use-toast";

export default function EventsProviderPublic() {
  const { slug } = useParams();
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const navigate = useNavigate();

  const { data: provider, isLoading } = useQuery({
    queryKey: ["events-provider", slug],
    enabled: !!slug,
    queryFn: async () => {
      const { data, error } = await supabase.from("events_providers")
        .select("*").eq("slug", slug!).maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: packages } = useQuery({
    queryKey: ["events-packages", provider?.id],
    enabled: !!provider?.id,
    queryFn: async () => {
      const { data } = await supabase.from("events_packages")
        .select("*").eq("provider_id", provider!.id).eq("active", true);
      return data ?? [];
    },
  });

  const { data: media } = useQuery({
    queryKey: ["events-media", provider?.id],
    enabled: !!provider?.id,
    queryFn: async () => {
      const { data } = await supabase.from("events_provider_media")
        .select("*").eq("provider_id", provider!.id).order("sort");
      return data ?? [];
    },
  });

  const startChat = async () => {
    if (!user) { navigate(`/auth?returnTo=/events/pro/${slug}`); return; }
    if (!provider) return;
    const { data: existing } = await supabase.from("events_conversations")
      .select("id").eq("client_id", user.id).eq("provider_id", provider.id).maybeSingle();
    if (existing) { navigate(`/events/messages/${existing.id}`); return; }
    const { data: inserted, error } = await supabase.from("events_conversations")
      .insert({ client_id: user.id, provider_id: provider.id }).select("id").single();
    if (error) { toast({ title: "Error", description: error.message, variant: "destructive" }); return; }
    navigate(`/events/messages/${inserted.id}`);
  };

  if (isLoading) return <div className="p-10 text-center text-sm text-muted-foreground">…</div>;
  if (!provider) return <div className="p-10 text-center text-sm">Not found</div>;

  return (
    <div className="min-h-screen bg-background text-foreground pb-32">
      <header className="sticky top-0 z-30 border-b border-border/60 bg-background/90 backdrop-blur">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-4">
          <Link to="/events/discover" className="rounded-lg p-2 hover:bg-accent"><ArrowLeft className="h-4 w-4" /></Link>
          <h1 className="text-sm font-bold truncate">{provider.business_name}</h1>
        </div>
      </header>

      <div className="mx-auto max-w-3xl px-4 py-5 space-y-5">
        <div className="flex items-center gap-4">
          {provider.avatar_url ? (
            <img src={provider.avatar_url} alt="" className="h-20 w-20 rounded-2xl object-cover" />
          ) : (
            <div className="grid h-20 w-20 place-items-center rounded-2xl bg-fuchsia-100 text-2xl font-bold text-fuchsia-600 dark:bg-fuchsia-500/15">
              {provider.business_name?.[0]}
            </div>
          )}
          <div>
            <div className="text-lg font-black">{provider.business_name}</div>
            <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
              {provider.city && <><MapPin className="h-3 w-3" />{provider.city}</>}
              {provider.kyc_verified_at && <span className="inline-flex items-center gap-0.5 text-emerald-600"><ShieldCheck className="h-3 w-3" />{isFr ? "Vérifié" : "Verified"}</span>}
            </div>
            <div className="mt-1 flex items-center gap-1 text-sm">
              <Star className="h-3.5 w-3.5 fill-amber-500 text-amber-500" />
              <span className="font-bold">{Number(provider.rating_avg).toFixed(1)}</span>
              <span className="text-muted-foreground text-xs">({provider.rating_count})</span>
            </div>
          </div>
        </div>

        {provider.bio && <p className="text-sm text-muted-foreground">{provider.bio}</p>}

        <div className="flex flex-wrap gap-1.5">
          {(provider.categories ?? []).map((c: string) => (
            <span key={c} className="rounded-full bg-fuchsia-500/10 px-2.5 py-1 text-[11px] font-semibold text-fuchsia-600">
              {eventsCategoryLabel(c, locale)}
            </span>
          ))}
        </div>

        {(media ?? []).length > 0 && (
          <div>
            <h2 className="mb-2 text-sm font-bold">{isFr ? "Portfolio" : "Portfolio"}</h2>
            <div className="grid grid-cols-3 gap-1.5">
              {(media ?? []).slice(0, 9).map((m: any) => (
                <img key={m.id} src={m.url} alt="" className="aspect-square w-full rounded-lg object-cover" />
              ))}
            </div>
          </div>
        )}

        <div>
          <h2 className="mb-2 text-sm font-bold">{isFr ? "Packages" : "Packages"}</h2>
          <div className="grid gap-2">
            {(packages ?? []).length === 0 && <div className="text-xs text-muted-foreground">{isFr ? "Pas encore de packages publiés." : "No packages published yet."}</div>}
            {(packages ?? []).map((p: any) => (
              <div key={p.id} className="rounded-xl border border-border bg-card p-3">
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0 flex-1">
                    <div className="text-sm font-bold">{p.title}</div>
                    {p.description && <div className="mt-0.5 text-xs text-muted-foreground line-clamp-2">{p.description}</div>}
                    <div className="mt-1 flex gap-3 text-[10px] text-muted-foreground">
                      {p.duration_hours ? <span>{p.duration_hours}h</span> : null}
                      {p.guest_capacity ? <span className="inline-flex items-center gap-0.5"><Users className="h-3 w-3" />{p.guest_capacity}</span> : null}
                    </div>
                  </div>
                  <div className="text-right text-sm font-black text-fuchsia-600 shrink-0">
                    {Number(p.price).toLocaleString()} {p.currency ?? provider.currency}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border/60 bg-background/95 p-3 backdrop-blur pb-[calc(env(safe-area-inset-bottom,0px)+0.75rem)]">
        <div className="mx-auto max-w-3xl">
          <Button onClick={startChat} className="w-full h-12 bg-gradient-to-br from-fuchsia-500 to-violet-500 text-white">
            <MessageSquare className="mr-2 h-4 w-4" />
            {isFr ? "Discuter et demander un devis" : "Chat and request a quote"}
          </Button>
        </div>
      </div>
    </div>
  );
}
