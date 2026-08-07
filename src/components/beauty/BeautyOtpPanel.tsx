import { useState } from "react";
import { KeyRound, ShieldCheck, CheckCircle2, Loader2, AlertTriangle, UserX } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useI18n } from "@/i18n/I18nContext";
import { toast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { askConfirm } from '@/components/ui/confirm-dialog';

interface Props {
  booking: any;
  isClient: boolean;
  isProvider: boolean;
  onChanged: () => void;
}

/**
 * Dual-OTP panel:
 * - Before start: client sees Start Code (big), provider has an input to type it in.
 * - After start, before completion: client can tap "Valider" OR read Completion Code
 *   for provider to type in.
 * - No-show buttons available after slot_start + 15min if never started.
 */
export default function BeautyOtpPanel({ booking, isClient, isProvider, onChanged }: Props) {
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);

  const [startInput, setStartInput] = useState("");
  const [completionInput, setCompletionInput] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  const canOperate = ["paid", "confirmed"].includes(booking.status);
  const started = !!booking.started_at;
  const completed = !!booking.completed_at;
  const now = Date.now();
  const slotStart = new Date(booking.slot_start).getTime();
  const noShowWindowOpen = !started && now >= slotStart + 15 * 60 * 1000;

  async function callRpc(fn: string, args: any, label: string) {
    setBusy(label);
    try {
      const { data, error } = await supabase.rpc(fn as any, args);
      if (error) throw error;
      const res = data as any;
      if (res?.ok === false) {
        toast({
          title: t("Action refusée", "Action refused"),
          description: mapError(res.error, res.attempts_left),
          variant: "destructive",
        });
      } else {
        toast({ title: t("C'est fait", "Done") });
        onChanged();
      }
    } catch (e: any) {
      toast({ title: t("Erreur", "Error"), description: e.message ?? String(e), variant: "destructive" });
    } finally {
      setBusy(null);
    }
  }

  function mapError(code: string, attemptsLeft?: number) {
    switch (code) {
      case "invalid_code":
        return t(
          `Code invalide.${attemptsLeft != null ? ` ${attemptsLeft} essai(s) restant(s).` : ""}`,
          `Wrong code.${attemptsLeft != null ? ` ${attemptsLeft} attempts left.` : ""}`,
        );
      case "too_many_attempts":
        return t("Trop d'essais. Ouvre un litige si besoin.", "Too many attempts. Open a dispute if needed.");
      case "not_started": return t("La prestation n'a pas encore démarré.", "Service hasn't started yet.");
      case "already_started": return t("Déjà démarrée.", "Already started.");
      case "too_early": return t("Attends 15 min après l'heure du RDV.", "Wait 15 min past the appointment time.");
      case "forbidden": return t("Action réservée au client / prestataire concerné.", "Only the assigned party can do this.");
      case "invalid_status": return t("Statut invalide.", "Invalid status.");
      default: return code;
    }
  }

  if (!canOperate && !started && !completed) return null;

  return (
    <div className="rounded-2xl border-2 border-primary/40 bg-gradient-to-br from-primary/5 to-primary/10 p-5">
      <div className="mb-3 flex items-center gap-2">
        <ShieldCheck className="h-5 w-5 text-primary" />
        <h3 className="text-base font-black">{t("Codes de sécurité SiteViral", "SiteViral security codes")}</h3>
      </div>

      {/* PHASE 1 — before service starts */}
      {!started && canOperate && (
        <>
          {isClient && (
            <>
              <div className="mb-2 text-xs text-muted-foreground">
                {t(
                  "Donne ce code au prestataire UNIQUEMENT au moment où la prestation commence.",
                  "Give this code to the provider ONLY when the service is about to begin.",
                )}
              </div>
              <CodeDisplay
                label={t("Code de démarrage", "Start code")}
                code={booking.start_code}
              />
            </>
          )}
          {isProvider && (
            <>
              <div className="mb-2 text-xs text-muted-foreground">
                {t(
                  "Demande le code de démarrage au client et saisis-le pour lancer la prestation.",
                  "Ask the client for the start code and enter it here to begin the service.",
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="••••••"
                  value={startInput}
                  onChange={(e) => setStartInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-2xl font-bold tracking-[0.4em]"
                />
                <Button
                  disabled={startInput.length !== 6 || busy !== null}
                  onClick={() => callRpc("beauty_submit_start_code", { _booking_id: booking.id, _code: startInput }, "start")}
                  className="beauty-gradient text-white"
                >
                  {busy === "start" ? <Loader2 className="h-4 w-4 animate-spin" /> : <KeyRound className="h-4 w-4" />}
                  <span className="ml-1.5">{t("Démarrer", "Start")}</span>
                </Button>
              </div>
            </>
          )}

          {/* No-show buttons */}
          {noShowWindowOpen && (
            <div className="mt-4 flex flex-wrap gap-2 border-t border-primary/20 pt-4">
              <div className="flex-1 text-xs text-muted-foreground">
                {t(
                  "Grâce de 15 min dépassée. Si l'autre partie n'est pas venue :",
                  "15-min grace period elapsed. If the other party didn't show up:",
                )}
              </div>
              {isProvider && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy !== null}
                  onClick={() => {
                    if (!(await askConfirm(t("Marquer le client comme absent ?", "Mark client as no-show?")))) return;
                    callRpc("beauty_mark_no_show", { _booking_id: booking.id, _who: "client" }, "noshow-c");
                  }}
                  className="gap-1.5 text-rose-700"
                >
                  <UserX className="h-4 w-4" />
                  {t("Client absent", "Client no-show")}
                </Button>
              )}
              {isClient && (
                <Button
                  variant="outline"
                  size="sm"
                  disabled={busy !== null}
                  onClick={() => {
                    if (!(await askConfirm(t("Signaler l'absence du prestataire ?", "Report provider no-show?")))) return;
                    callRpc("beauty_mark_no_show", { _booking_id: booking.id, _who: "provider" }, "noshow-p");
                  }}
                  className="gap-1.5 text-rose-700"
                >
                  <AlertTriangle className="h-4 w-4" />
                  {t("Prestataire absent", "Provider no-show")}
                </Button>
              )}
            </div>
          )}
        </>
      )}

      {/* PHASE 2 — service started, waiting for completion */}
      {started && !completed && (
        <>
          <div className="mb-3 rounded-lg bg-emerald-500/10 px-3 py-2 text-xs font-semibold text-emerald-700 dark:text-emerald-400">
            {t("Prestation en cours depuis", "In progress since")}{" "}
            {new Date(booking.started_at).toLocaleTimeString(isFr ? "fr-FR" : "en-US", { hour: "2-digit", minute: "2-digit" })}
          </div>

          {isClient && (
            <>
              <div className="mb-2 text-xs text-muted-foreground">
                {t(
                  "Quand la prestation est terminée, valide-la ci-dessous. Le prestataire peut aussi te demander le code de fin.",
                  "When the service ends, validate below. The provider may also ask you for the completion code.",
                )}
              </div>
              <Button
                disabled={busy !== null}
                onClick={() => {
                  if (!(await askConfirm(t("Confirmer que la prestation est bien terminée ?", "Confirm the service is completed?")))) return;
                  callRpc("beauty_complete_service", { _booking_id: booking.id }, "complete");
                }}
                className="w-full gap-1.5 beauty-gradient text-white"
              >
                {busy === "complete" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                {t("Valider — prestation terminée", "Validate — service completed")}
              </Button>
              <div className="mt-4">
                <CodeDisplay label={t("Ou donne ce code de fin", "Or give this completion code")} code={booking.completion_code} small />
              </div>
            </>
          )}

          {isProvider && (
            <>
              <div className="mb-2 text-xs text-muted-foreground">
                {t(
                  "Demande le code de fin au client et saisis-le pour clôturer.",
                  "Ask the client for the completion code and enter it here to close the booking.",
                )}
              </div>
              <div className="flex gap-2">
                <Input
                  inputMode="numeric"
                  pattern="[0-9]*"
                  maxLength={6}
                  placeholder="••••••"
                  value={completionInput}
                  onChange={(e) => setCompletionInput(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="text-center text-2xl font-bold tracking-[0.4em]"
                />
                <Button
                  disabled={completionInput.length !== 6 || busy !== null}
                  onClick={() =>
                    callRpc("beauty_complete_service", { _booking_id: booking.id, _code: completionInput }, "complete-p")
                  }
                  className="beauty-gradient text-white"
                >
                  {busy === "complete-p" ? <Loader2 className="h-4 w-4 animate-spin" /> : <CheckCircle2 className="h-4 w-4" />}
                  <span className="ml-1.5">{t("Terminer", "Complete")}</span>
                </Button>
              </div>
            </>
          )}
        </>
      )}

      {/* PHASE 3 — completed */}
      {completed && (
        <div className="rounded-lg bg-primary/10 px-3 py-3 text-xs font-semibold text-primary">
          <CheckCircle2 className="mr-1.5 inline h-4 w-4" />
          {t("Prestation validée. Fonds libérés au prestataire dans 24 h (fenêtre de litige).",
            "Service validated. Funds released to provider in 24h (dispute window).")}
        </div>
      )}
    </div>
  );
}

function CodeDisplay({ label, code, small }: { label: string; code: string | null; small?: boolean }) {
  if (!code) return null;
  return (
    <div className="rounded-xl border-2 border-dashed border-primary/50 bg-background p-4 text-center">
      <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={cn("font-black tabular-nums tracking-[0.3em] text-primary", small ? "text-3xl" : "text-5xl mt-1")}>
        {code}
      </div>
    </div>
  );
}
