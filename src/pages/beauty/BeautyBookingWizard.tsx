import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft, Calendar as CalIcon, Clock, MapPin, ShieldCheck, Home, Store,
  Loader2, AlertCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { formatCurrency } from "@/lib/currency";
import { useI18n } from "@/i18n/I18nContext";
import { cn } from "@/lib/utils";
import { toast } from "@/hooks/use-toast";
import { SEOHead } from "@/components/seo/SEOHead";

type Step = "slot" | "location" | "review";

export default function BeautyBookingWizard() {
  const { serviceId } = useParams<{ serviceId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  const [step, setStep] = useState<Step>("slot");
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [locationType, setLocationType] = useState<"salon" | "home">("salon");
  const [address, setAddress] = useState("");
  const [notes, setNotes] = useState("");
  const [submitting, setSubmitting] = useState(false);

  // Redirect to auth if not logged in
  useEffect(() => {
    if (!user) navigate(`/auth?returnTo=/beauty/book/${serviceId}`);
  }, [user, serviceId, navigate]);

  // Service + provider
  const { data: bundle, isLoading } = useQuery({
    queryKey: ["beauty-book-service", serviceId],
    enabled: !!serviceId,
    queryFn: async () => {
      const { data: service } = await supabase
        .from("beauty_services")
        .select("*")
        .eq("id", serviceId!)
        .maybeSingle();
      if (!service) return null;
      const { data: provider } = await supabase
        .from("beauty_providers")
        .select("id, business_name, slug, avatar_url, city, at_salon_ok, home_service_ok")
        .eq("id", service.provider_id)
        .maybeSingle();
      return { service, provider };
    },
  });

  // Available slots — next 14 days
  const { data: slots, isLoading: slotsLoading } = useQuery({
    queryKey: ["beauty-slots", serviceId],
    enabled: !!serviceId,
    queryFn: async () => {
      const today = new Date();
      const to = new Date();
      to.setDate(to.getDate() + 14);
      const { data } = await (supabase.rpc as any)("beauty_get_available_slots", {
        _service_id: serviceId,
        _date_from: today.toISOString().slice(0, 10),
        _date_to: to.toISOString().slice(0, 10),
        _step_min: 30,
      });
      return (data as { slot_start: string; slot_end: string }[]) ?? [];
    },
  });

  const grouped = useMemo(() => {
    const map = new Map<string, { slot_start: string; slot_end: string }[]>();
    (slots ?? []).forEach((s) => {
      const day = s.slot_start.slice(0, 10);
      const arr = map.get(day) ?? [];
      arr.push(s);
      map.set(day, arr);
    });
    return Array.from(map.entries()).slice(0, 7);
  }, [slots]);

  if (isLoading) {
    return (
      <div className="beauty-scope min-h-screen bg-background p-6">
        <Skeleton className="h-8 w-32" />
        <Skeleton className="mt-6 h-40 rounded-2xl" />
      </div>
    );
  }

  if (!bundle?.service || !bundle.provider) {
    return (
      <div className="beauty-scope grid min-h-screen place-items-center p-8 text-center">
        <div>
          <div className="text-lg font-bold">{t("Service introuvable", "Service not found")}</div>
          <Button className="mt-4" onClick={() => navigate("/beauty/search")}>
            {t("Explorer les pros", "Explore pros")}
          </Button>
        </div>
      </div>
    );
  }

  const { service, provider } = bundle;
  const currency = (service.currency ?? "XOF") as any;
  const amount = service.price_amount ?? service.price_xof ?? 0;
  const commission = Math.round(amount * 0.1);

  const canProceed =
    (step === "slot" && !!selectedSlot) ||
    (step === "location" &&
      !!locationType &&
      (locationType !== "home" || address.trim().length > 5));

  async function handlePay() {
    if (!selectedSlot || !bundle) return;
    setSubmitting(true);
    try {
      const slot = (slots ?? []).find((s) => s.slot_start === selectedSlot);
      if (!slot) throw new Error("Slot expired");
      const { data, error } = await supabase.functions.invoke("beauty-create-booking", {
        body: {
          service_id: bundle.service.id,
          slot_start: slot.slot_start,
          slot_end: slot.slot_end,
          location_type: locationType,
          address: locationType === "home" ? address : null,
          notes,
          return_origin: window.location.origin,
        },
      });
      if (error) throw error;
      if (!data?.checkout_url) throw new Error("No checkout URL returned");
      window.location.href = data.checkout_url;
    } catch (e: any) {
      toast({
        title: t("Impossible de créer la réservation", "Booking failed"),
        description: e?.message ?? String(e),
        variant: "destructive",
      });
      setSubmitting(false);
    }
  }

  return (
    <div className="beauty-scope min-h-screen bg-background pb-32 text-foreground">
      <SEOHead title={`${t("Réserver", "Book")} — ${service.title}`} />

      {/* Header */}
      <header className="sticky top-0 z-30 h-14 border-b border-border/60 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-full max-w-3xl items-center gap-3 px-4">
          <Button variant="ghost" size="icon" className="h-9 w-9" onClick={() => navigate(-1)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="min-w-0 flex-1">
            <div className="truncate text-sm font-bold">{service.title}</div>
            <div className="truncate text-[11px] text-muted-foreground">
              {provider.business_name}
            </div>
          </div>
          <Badge variant="outline" className="gap-1 text-[10px]">
            <ShieldCheck className="h-3 w-3 text-primary" />
            {t("Paiement sécurisé", "Secure payment")}
          </Badge>
        </div>
      </header>

      {/* Stepper */}
      <div className="mx-auto max-w-3xl px-4 py-4">
        <div className="flex items-center gap-2 text-[10px] font-semibold uppercase tracking-wider">
          {(["slot", "location", "review"] as Step[]).map((s, i) => {
            const active = step === s;
            const done =
              (s === "slot" && (step === "location" || step === "review")) ||
              (s === "location" && step === "review");
            return (
              <div key={s} className="flex flex-1 items-center gap-2">
                <div
                  className={cn(
                    "grid h-6 w-6 place-items-center rounded-full border text-[10px] font-black",
                    active && "border-primary bg-primary text-primary-foreground",
                    done && "border-primary bg-primary/20 text-primary",
                    !active && !done && "border-border text-muted-foreground",
                  )}
                >
                  {i + 1}
                </div>
                <span className={cn(active ? "text-foreground" : "text-muted-foreground")}>
                  {s === "slot"
                    ? t("Créneau", "Slot")
                    : s === "location"
                    ? t("Lieu", "Location")
                    : t("Résumé", "Review")}
                </span>
                {i < 2 && <div className="h-px flex-1 bg-border" />}
              </div>
            );
          })}
        </div>
      </div>

      <main className="mx-auto max-w-3xl px-4">
        {/* STEP 1 — Slot */}
        {step === "slot" && (
          <section>
            <h2 className="text-lg font-black">{t("Choisis un créneau", "Pick a slot")}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              <Clock className="mr-1 inline h-3 w-3" /> {service.duration_min} min ·{" "}
              {formatCurrency(amount, currency)}
            </p>

            <div className="mt-6 space-y-6">
              {slotsLoading ? (
                <Skeleton className="h-40 rounded-2xl" />
              ) : !grouped.length ? (
                <div className="rounded-2xl border border-dashed p-8 text-center text-sm text-muted-foreground">
                  <AlertCircle className="mx-auto mb-2 h-6 w-6" />
                  {t(
                    "Aucun créneau disponible dans les 14 prochains jours.",
                    "No slots available in the next 14 days.",
                  )}
                </div>
              ) : (
                grouped.map(([day, list]) => (
                  <div key={day}>
                    <div className="mb-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {new Date(day).toLocaleDateString(isFr ? "fr-FR" : "en-US", {
                        weekday: "long",
                        day: "numeric",
                        month: "long",
                      })}
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {list.slice(0, 12).map((s) => {
                        const active = selectedSlot === s.slot_start;
                        return (
                          <button
                            key={s.slot_start}
                            onClick={() => setSelectedSlot(s.slot_start)}
                            className={cn(
                              "min-w-[70px] rounded-lg border px-3 py-2 text-xs font-semibold transition",
                              active
                                ? "border-primary bg-primary text-primary-foreground"
                                : "border-border/60 hover:border-primary/50",
                            )}
                          >
                            {new Date(s.slot_start).toLocaleTimeString(
                              isFr ? "fr-FR" : "en-US",
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* STEP 2 — Location */}
        {step === "location" && (
          <section>
            <h2 className="text-lg font-black">{t("Où ?", "Where?")}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              {t("Choisis l'emplacement de la prestation.", "Choose where the service takes place.")}
            </p>
            <RadioGroup
              value={locationType}
              onValueChange={(v) => setLocationType(v as any)}
              className="mt-4 space-y-2"
            >
              {provider.at_salon_ok && service.at_salon && (
                <Label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border/60 p-4 hover:border-primary/50">
                  <RadioGroupItem value="salon" />
                  <Store className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <div className="font-bold">{t("En salon", "At the salon")}</div>
                    <div className="text-xs text-muted-foreground">
                      {provider.city ?? t("Adresse partagée après paiement", "Address shared after payment")}
                    </div>
                  </div>
                </Label>
              )}
              {provider.home_service_ok && service.at_home && (
                <Label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-border/60 p-4 hover:border-primary/50">
                  <RadioGroupItem value="home" />
                  <Home className="h-5 w-5 text-primary" />
                  <div className="flex-1">
                    <div className="font-bold">{t("À domicile", "At home")}</div>
                    <div className="text-xs text-muted-foreground">
                      {t("Renseigne ton adresse ci-dessous.", "Enter your address below.")}
                    </div>
                  </div>
                </Label>
              )}
            </RadioGroup>

            {locationType === "home" && (
              <div className="mt-4 space-y-2">
                <Label htmlFor="addr" className="text-xs font-semibold">
                  {t("Adresse", "Address")}
                </Label>
                <Input
                  id="addr"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t("Ex. Cocody, Angré 8e tranche…", "Ex. Cocody, Angré…")}
                />
              </div>
            )}

            <div className="mt-6 space-y-2">
              <Label htmlFor="notes" className="text-xs font-semibold">
                {t("Note pour l'expert(e) (facultatif)", "Note to the expert (optional)")}
              </Label>
              <Textarea
                id="notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder={t("Longueur, style, préférences…", "Length, style, preferences…")}
                rows={3}
              />
            </div>
          </section>
        )}

        {/* STEP 3 — Review */}
        {step === "review" && selectedSlot && (
          <section>
            <h2 className="text-lg font-black">{t("Vérifie et paie", "Review and pay")}</h2>

            <div className="mt-4 space-y-3 rounded-2xl border border-border/60 bg-card p-5">
              <Row
                icon={<CalIcon className="h-4 w-4" />}
                label={t("Créneau", "Slot")}
                value={new Date(selectedSlot).toLocaleString(isFr ? "fr-FR" : "en-US", {
                  weekday: "long",
                  day: "numeric",
                  month: "long",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              />
              <Row
                icon={<MapPin className="h-4 w-4" />}
                label={t("Lieu", "Location")}
                value={
                  locationType === "home"
                    ? `${t("À domicile", "At home")} — ${address}`
                    : t("En salon", "At the salon")
                }
              />
              <Row
                icon={<Clock className="h-4 w-4" />}
                label={t("Durée", "Duration")}
                value={`${service.duration_min} min`}
              />
            </div>

            <div className="mt-4 rounded-2xl border border-border/60 bg-card p-5">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">{service.title}</span>
                <span className="font-semibold">{formatCurrency(amount, currency)}</span>
              </div>
              <div className="mt-2 flex items-center justify-between text-xs text-muted-foreground">
                <span>{t("Dont commission plateforme (10%)", "Incl. platform fee (10%)")}</span>
                <span>{formatCurrency(commission, currency)}</span>
              </div>
              <div className="mt-4 flex items-center justify-between border-t border-border/50 pt-3">
                <span className="font-bold">{t("Total à payer", "Total to pay")}</span>
                <span className="text-lg font-black">{formatCurrency(amount, currency)}</span>
              </div>
            </div>

            <div className="mt-4 rounded-xl bg-primary/5 p-4 text-xs text-muted-foreground">
              <ShieldCheck className="mr-1 inline h-3.5 w-3.5 text-primary" />
              {t(
                "Ton paiement est bloqué en escrow chez SiteViral. L'expert(e) n'est payé(e) qu'après ta confirmation du service.",
                "Your payment is held in escrow by SiteViral. The expert is only paid after you confirm the service.",
              )}
            </div>
          </section>
        )}
      </main>

      {/* Sticky action bar */}
      <div className="fixed inset-x-0 bottom-16 z-30 border-t border-border/60 bg-background/95 px-4 py-3 backdrop-blur">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-3">
          <div className="text-sm">
            <div className="text-[10px] uppercase tracking-wider text-muted-foreground">
              {t("Total", "Total")}
            </div>
            <div className="text-lg font-black">{formatCurrency(amount, currency)}</div>
          </div>
          <div className="flex gap-2">
            {step !== "slot" && (
              <Button
                variant="outline"
                onClick={() => setStep(step === "review" ? "location" : "slot")}
              >
                {t("Retour", "Back")}
              </Button>
            )}
            {step !== "review" ? (
              <Button
                onClick={() => setStep(step === "slot" ? "location" : "review")}
                disabled={!canProceed}
                className="beauty-gradient text-white hover:opacity-90"
              >
                {t("Continuer", "Continue")}
              </Button>
            ) : (
              <Button
                onClick={handlePay}
                disabled={submitting}
                className="beauty-gradient text-white hover:opacity-90"
              >
                {submitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t("Payer", "Pay")} {formatCurrency(amount, currency)}
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function Row({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-3 text-sm">
      <div className="mt-0.5 text-muted-foreground">{icon}</div>
      <div className="flex-1">
        <div className="text-[11px] uppercase tracking-wider text-muted-foreground">{label}</div>
        <div className="font-semibold">{value}</div>
      </div>
    </div>
  );
}
