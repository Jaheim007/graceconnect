import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Star, MapPin, ShieldCheck, Clock, Home, Store, Sparkles,
  MessageCircle, Calendar, ChevronRight, Eye,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { formatCurrency } from "@/lib/currency";
import { useI18n } from "@/i18n/I18nContext";
import { useAuth } from "@/contexts/AuthContext";
import { SEOHead } from "@/components/seo/SEOHead";
import { cn } from "@/lib/utils";

export default function BeautyProviderProfile() {
  const { slug } = useParams<{ slug: string }>();
  const { locale } = useI18n();
  const { user } = useAuth();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);
  const navigate = useNavigate();
  const [tab, setTab] = useState<"services" | "gallery" | "videos" | "reviews">("services");

  const { data: provider, isLoading } = useQuery({
    queryKey: ["beauty-provider-profile", slug, user?.id],
    enabled: !!slug,
    queryFn: async () => {
      // 1) Public active profile by slug
      let { data } = await supabase
        .from("beauty_providers")
        .select("*")
        .eq("slug", slug!)
        .eq("status", "active")
        .maybeSingle();

      // 2) Fallback by id (still active only)
      if (!data) {
        const { data: byId } = await supabase
          .from("beauty_providers")
          .select("*")
          .eq("id", slug!)
          .eq("status", "active")
          .maybeSingle();
        data = byId ?? null;
      }

      // 3) Owner preview — RLS allows the owner to read their own pending row.
      if (!data && user) {
        const { data: mine } = await supabase
          .from("beauty_providers")
          .select("*")
          .eq("user_id", user.id)
          .or(`slug.eq.${slug},id.eq.${slug}`)
          .maybeSingle();
        data = mine ?? null;
      }
      return data;
    },
  });

  const isOwnerPreview = !!(provider && user && (provider as any).user_id === user.id && (provider as any).status !== "active");

  const { data: services } = useQuery({
    queryKey: ["beauty-provider-services", provider?.id],
    enabled: !!provider?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("beauty_services")
        .select("*")
        .eq("provider_id", provider!.id)
        .eq("active", true)
        .order("price_amount", { ascending: true });
      return data ?? [];
    },
  });

  const { data: media } = useQuery({
    queryKey: ["beauty-provider-media", provider?.id],
    enabled: !!provider?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("beauty_provider_media")
        .select("id, kind, url, embed_url, caption, position")
        .eq("provider_id", provider!.id)
        .order("position", { ascending: true })
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const photos = (media ?? []).filter((m: any) => m.kind === "photo");
  const videos = (media ?? []).filter((m: any) => m.kind === "video");

  const { data: reviews } = useQuery({
    queryKey: ["beauty-provider-reviews", provider?.id],
    enabled: !!provider?.id,
    queryFn: async () => {
      const { data } = await supabase
        .from("beauty_reviews")
        .select("id, rating, title, body, created_at, client_id, provider_reply")
        .eq("provider_id", provider!.id)
        .order("created_at", { ascending: false })
        .limit(30);
      return data ?? [];
    },
  });

  if (isLoading) {
    return (
      <div className="beauty-scope min-h-screen bg-background p-4">
        <Skeleton className="h-56 rounded-2xl" />
        <div className="mt-6 space-y-3">
          <Skeleton className="h-6 w-1/2" />
          <Skeleton className="h-4 w-2/3" />
        </div>
      </div>
    );
  }

  if (!provider) {
    return (
      <div className="beauty-scope grid min-h-screen place-items-center p-8 text-center">
        <div>
          <div className="text-xl font-bold">{t("Profil introuvable", "Profile not found")}</div>
          <p className="mt-2 text-sm text-muted-foreground">
            {t(
              "Ce profil n'existe pas ou n'est pas encore validé.",
              "This profile doesn't exist or isn't verified yet.",
            )}
          </p>
          <Button className="mt-6" onClick={() => navigate("/beauty/search")}>
            {t("Explorer d'autres pros", "Explore other pros")}
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="beauty-scope min-h-screen bg-background pb-32 text-foreground">
      <SEOHead
        title={`${provider.business_name} — SiteViral Beauty`}
        description={provider.bio ?? `${provider.business_name} · ${provider.city ?? ""}`}
      />

      {/* Cover + back */}
      <div className="relative">
        <div className="h-56 w-full overflow-hidden bg-muted">
          {provider.cover_url ? (
            <img src={provider.cover_url} alt="" className="h-full w-full object-cover" />
          ) : (
            <div className="h-full w-full beauty-gradient opacity-70" />
          )}
        </div>
        <button
          onClick={() => navigate(-1)}
          className="absolute left-3 top-3 grid h-9 w-9 place-items-center rounded-full bg-background/70 backdrop-blur"
        >
          <ArrowLeft className="h-4 w-4" />
        </button>
      </div>

      {/* Identity card */}
      <section className="mx-auto max-w-3xl px-4">
        <div className="-mt-10 flex items-end gap-4">
          <div className="h-20 w-20 shrink-0 overflow-hidden rounded-2xl border-4 border-background bg-muted shadow-lg">
            {provider.avatar_url ? (
              <img src={provider.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full w-full place-items-center text-2xl font-black text-muted-foreground">
                {provider.business_name?.[0] ?? "?"}
              </div>
            )}
          </div>
          <div className="min-w-0 flex-1 pb-1">
            <div className="flex items-center gap-2">
              <h1 className="truncate text-xl font-black">{provider.business_name}</h1>
              <ShieldCheck className="h-4 w-4 shrink-0 text-primary" />
            </div>
            <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
              <span className="flex items-center gap-0.5">
                <Star className="h-3 w-3 fill-amber-500 text-amber-500" />
                <span className="font-semibold text-foreground">
                  {Number(provider.avg_rating ?? 0).toFixed(1)}
                </span>
                <span>({provider.total_reviews ?? 0})</span>
              </span>
              {provider.city && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" /> {provider.city}
                </span>
              )}
              {provider.response_time_avg_min ? (
                <span className="hidden items-center gap-1 sm:flex">
                  <Clock className="h-3 w-3" /> ~{provider.response_time_avg_min} min
                </span>
              ) : null}
            </div>
          </div>
        </div>

        {provider.bio && (
          <p className="mt-4 text-sm text-muted-foreground">{provider.bio}</p>
        )}

        <div className="mt-4 flex flex-wrap gap-2">
          {provider.at_salon_ok && (
            <Badge variant="outline" className="gap-1">
              <Store className="h-3 w-3" /> {t("En salon", "At salon")}
            </Badge>
          )}
          {provider.home_service_ok && (
            <Badge variant="outline" className="gap-1">
              <Home className="h-3 w-3" /> {t("À domicile", "At home")}
            </Badge>
          )}
          {(provider.zones ?? []).slice(0, 3).map((z: string) => (
            <Badge key={z} variant="secondary" className="gap-1">
              <MapPin className="h-3 w-3" /> {z}
            </Badge>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={tab} onValueChange={(v) => setTab(v as any)} className="mt-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="services" className="text-xs">
              {t("Services", "Services")} ({services?.length ?? 0})
            </TabsTrigger>
            <TabsTrigger value="gallery" className="text-xs">
              {t("Galerie", "Gallery")} ({photos.length})
            </TabsTrigger>
            <TabsTrigger value="videos" className="text-xs">
              {t("Vidéos", "Videos")} ({videos.length})
            </TabsTrigger>
            <TabsTrigger value="reviews" className="text-xs">
              {t("Avis", "Reviews")} ({reviews?.length ?? 0})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="services" className="mt-4 space-y-3">
            {!services?.length ? (
              <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                {t("Aucun service publié pour l'instant.", "No services published yet.")}
              </p>
            ) : (
              services.map((s) => (
                <ServiceRow key={s.id} service={s} providerSlug={provider.slug ?? provider.id} isFr={isFr} />
              ))
            )}
          </TabsContent>

          <TabsContent value="gallery" className="mt-4">
            {!photos.length ? (
              <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                {t("Aucune photo pour l'instant.", "No photos yet.")}
              </p>
            ) : (
              <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
                {photos.map((p: any) => (
                  <a
                    key={p.id}
                    href={p.url}
                    target="_blank"
                    rel="noreferrer"
                    className="group relative aspect-square overflow-hidden rounded-xl bg-muted"
                  >
                    <img
                      src={p.url}
                      alt={p.caption ?? ""}
                      loading="lazy"
                      className="h-full w-full object-cover transition group-hover:scale-105"
                    />
                    {p.caption && (
                      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-[10px] text-white">
                        {p.caption}
                      </div>
                    )}
                  </a>
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="videos" className="mt-4 space-y-3">
            {!videos.length ? (
              <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                {t("Aucune vidéo pour l'instant.", "No videos yet.")}
              </p>
            ) : (
              videos.map((v: any) => (
                <div key={v.id} className="overflow-hidden rounded-2xl border border-border/60 bg-black">
                  {v.embed_url ? (
                    <div className="aspect-video">
                      <iframe
                        src={v.embed_url}
                        title={v.caption ?? "video"}
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                        allowFullScreen
                        className="h-full w-full"
                      />
                    </div>
                  ) : v.url ? (
                    <video src={v.url} controls className="w-full" />
                  ) : null}
                  {v.caption && (
                    <div className="bg-card px-3 py-2 text-xs text-muted-foreground">
                      {v.caption}
                    </div>
                  )}
                </div>
              ))
            )}
          </TabsContent>

          <TabsContent value="reviews" className="mt-4 space-y-3">
            {!reviews?.length ? (
              <p className="rounded-xl border border-dashed p-6 text-center text-sm text-muted-foreground">
                {t("Pas encore d'avis. Sois la première à réserver !", "No reviews yet. Be the first to book!")}
              </p>
            ) : (
              reviews.map((r) => <ReviewRow key={r.id} review={r} />)
            )}
          </TabsContent>
        </Tabs>
      </section>

      {/* Sticky action bar — chat only (provider sends the offer) */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center gap-2">
          <Button
            className="h-11 flex-1 beauty-gradient text-white hover:opacity-90"
            onClick={() => navigate(`/beauty/messages?provider=${provider.id}`)}
          >
            <MessageCircle className="mr-2 h-4 w-4" />
            {t("Discuter pour réserver", "Chat to book")}
          </Button>
        </div>
      </div>
    </div>
  );
}

function ServiceRow({
  service,
  isFr,
}: {
  service: any;
  providerSlug: string;
  isFr: boolean;
}) {
  const currency = (service.currency ?? "XOF") as any;
  const amount = service.price_amount ?? service.price_xof ?? 0;
  return (
    <div
      className="group flex items-center gap-3 rounded-2xl border border-border/60 bg-card p-4"
    >
      <div className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-primary/10 text-primary">
        <Sparkles className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <div className="truncate font-bold">{service.title}</div>
          {service.category && (
            <Badge variant="secondary" className="text-[10px]">
              {service.category}
            </Badge>
          )}
        </div>
        <div className="mt-0.5 flex items-center gap-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1">
            <Clock className="h-3 w-3" /> {service.duration_min} min
          </span>
          {service.at_home && <span>· {isFr ? "À domicile" : "At home"}</span>}
          {service.at_salon && <span>· {isFr ? "Salon" : "Salon"}</span>}
        </div>
      </div>
      <div className="text-right">
        <div className="text-base font-black">{formatCurrency(amount, currency)}</div>
        <div className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          {isFr ? "Prix indicatif" : "From"}
        </div>
      </div>
    </div>
  );
}

function ReviewRow({ review }: { review: any }) {
  return (
    <div className="rounded-2xl border border-border/60 bg-card p-4">
      <div className="mb-1 flex items-center gap-1">
        {Array.from({ length: 5 }).map((_, i) => (
          <Star
            key={i}
            className={cn(
              "h-3.5 w-3.5",
              i < review.rating
                ? "fill-amber-500 text-amber-500"
                : "text-muted-foreground/30",
            )}
          />
        ))}
        <span className="ml-2 text-xs text-muted-foreground">
          {new Date(review.created_at).toLocaleDateString()}
        </span>
      </div>
      {review.title && <div className="font-bold">{review.title}</div>}
      {review.body && (
        <p className="mt-1 text-sm text-muted-foreground">{review.body}</p>
      )}
      {review.provider_reply && (
        <div className="mt-3 rounded-xl bg-muted/50 p-3 text-xs">
          <div className="mb-1 font-semibold">Réponse de l'expert(e)</div>
          {review.provider_reply}
        </div>
      )}
    </div>
  );
}
