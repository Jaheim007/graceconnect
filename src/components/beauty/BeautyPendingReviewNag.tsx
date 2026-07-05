import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Sparkles, Star } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useI18n } from "@/i18n/I18nContext";
import BeautyReviewForm from "@/pages/beauty/BeautyReviewForm";

/**
 * Persistent, non-dismissable prompt that surfaces every completed / cancelled
 * / no-show booking without a review. If the user closes the dialog it
 * re-appears on the next page load and again after 30 minutes.
 */
export function BeautyPendingReviewNag() {
  const { user } = useAuth();
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);
  const [snoozedId, setSnoozedId] = useState<string | null>(null);

  const { data: pending, refetch } = useQuery({
    queryKey: ["beauty-pending-reviews", user?.id],
    enabled: !!user,
    refetchInterval: 1000 * 60 * 5,
    queryFn: async () => {
      const { data: bookings } = await supabase
        .from("beauty_bookings")
        .select("id, provider_id, currency, price_amount, slot_start, status, beauty_services(title), beauty_providers(business_name)")
        .eq("client_id", user!.id)
        .in("status", ["completed", "cancelled", "no_show"])
        .order("slot_end", { ascending: false })
        .limit(20);
      if (!bookings?.length) return [];
      const ids = bookings.map((b) => b.id);
      const { data: reviews } = await supabase
        .from("beauty_reviews")
        .select("booking_id")
        .in("booking_id", ids);
      const reviewed = new Set((reviews ?? []).map((r) => r.booking_id));
      return bookings.filter((b) => !reviewed.has(b.id));
    },
  });

  const next = useMemo(
    () => (pending ?? []).find((b: any) => b.id !== snoozedId) ?? null,
    [pending, snoozedId],
  );

  // Re-nag every 30 min even if snoozed
  useEffect(() => {
    if (!snoozedId) return;
    const timer = setTimeout(() => setSnoozedId(null), 1000 * 60 * 30);
    return () => clearTimeout(timer);
  }, [snoozedId]);

  if (!user || !next) return null;

  const svc = (next as any).beauty_services?.title ?? t("Prestation", "Service");
  const pro = (next as any).beauty_providers?.business_name ?? "";

  return (
    <Dialog open onOpenChange={(o) => { if (!o) setSnoozedId(next.id); }}>
      <DialogContent className="beauty-scope max-w-md">
        <DialogHeader>
          <div className="mb-2 flex items-center gap-2">
            <div className="grid h-9 w-9 place-items-center rounded-full bg-primary/10 text-primary">
              <Star className="h-4 w-4" />
            </div>
            <DialogTitle className="text-base font-black">
              {t("Un avis à laisser ✨", "One review to leave ✨")}
            </DialogTitle>
          </div>
          <DialogDescription className="text-left">
            {t(
              `Comment s'est passée « ${svc} » avec ${pro} ? Ton avis est obligatoire pour aider les autres clients et faire monter les meilleurs pros.`,
              `How was "${svc}" with ${pro}? Your review is required to help other clients and to lift the best pros.`,
            )}
          </DialogDescription>
        </DialogHeader>

        <BeautyReviewForm
          bookingId={next.id}
          providerId={(next as any).provider_id}
          currency={(next as any).currency ?? "XOF"}
          onSubmitted={() => { setSnoozedId(null); refetch(); }}
        />

        <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1">
            <Sparkles className="h-3 w-3" /> {t("Rappel obligatoire", "Required reminder")}
          </span>
          <Button
            variant="ghost"
            size="sm"
            className="h-7 text-[11px]"
            onClick={() => setSnoozedId(next.id)}
          >
            {t("Plus tard (30 min)", "Later (30 min)")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
