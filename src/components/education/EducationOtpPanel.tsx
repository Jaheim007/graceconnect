import { useState } from "react";
import { Loader2, KeyRound, PlayCircle, CheckCircle2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/hooks/use-toast";
import { useI18n } from "@/i18n/I18nContext";

interface Props {
  booking: any;
  isStudent: boolean;
  isTutor: boolean;
  onChanged: () => void;
}

export default function EducationOtpPanel({ booking, isStudent, isTutor, onChanged }: Props) {
  const { locale } = useI18n();
  const isFr = locale === "fr";
  const t = (fr: string, en: string) => (isFr ? fr : en);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");

  const call = async (action: string, extra: Record<string, any> = {}) => {
    setLoading(true);
    const { data, error } = await supabase.functions.invoke("education-otp", {
      body: { action, booking_id: booking.id, ...extra },
    });
    setLoading(false);
    if (error || (data as any)?.error) {
      toast({ title: "Error", description: error?.message || (data as any)?.error, variant: "destructive" });
      return null;
    }
    onChanged();
    return data;
  };

  if (booking.status === "confirmed") {
    if (isStudent) {
      return (
        <div className="rounded-2xl border-2 border-teal-500/30 bg-teal-50/60 dark:bg-teal-950/20 p-5">
          <div className="flex items-center gap-2 mb-2">
            <KeyRound className="h-5 w-5 text-teal-600" />
            <div className="font-bold">{t("Code de démarrage", "Start code")}</div>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("Au début de la séance, donne ce code au prof pour lancer la session.",
               "At the start of the lesson, give this code to your tutor to begin.")}
          </p>
          {booking.start_otp ? (
            <div className="mt-3 text-center text-4xl font-black tracking-[0.4em] text-teal-600">{booking.start_otp}</div>
          ) : (
            <Button className="mt-3 w-full bg-gradient-to-br from-teal-500 to-cyan-500 text-white"
              onClick={() => call("generate_start")} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Générer le code", "Generate code")}
            </Button>
          )}
        </div>
      );
    }
    if (isTutor) {
      return (
        <div className="rounded-2xl border-2 border-teal-500/30 bg-teal-50/60 dark:bg-teal-950/20 p-5">
          <div className="flex items-center gap-2 mb-2">
            <PlayCircle className="h-5 w-5 text-teal-600" />
            <div className="font-bold">{t("Démarrer la séance", "Start the session")}</div>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("Demande à l'élève son code à 4 chiffres.", "Ask the student for their 4-digit code.")}
          </p>
          <div className="mt-3 flex gap-2">
            <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="1234" maxLength={4} className="text-center font-bold tracking-widest" />
            <Button onClick={async () => { const r = await call("verify_start", { code: otp }); if (r) setOtp(""); }}
              disabled={loading || otp.length !== 4} className="bg-gradient-to-br from-teal-500 to-cyan-500 text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Démarrer", "Start")}
            </Button>
          </div>
        </div>
      );
    }
  }

  if (booking.status === "in_progress") {
    if (isTutor) {
      return (
        <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20 p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <div className="font-bold">{t("Code de fin", "End code")}</div>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("Quand la séance est finie, donne ce code à l'élève pour libérer le paiement.",
               "When the session ends, share this code with the student to release payment.")}
          </p>
          {booking.end_otp ? (
            <div className="mt-3 text-center text-4xl font-black tracking-[0.4em] text-emerald-600">{booking.end_otp}</div>
          ) : (
            <Button className="mt-3 w-full bg-gradient-to-br from-teal-500 to-cyan-500 text-white"
              onClick={() => call("generate_end")} disabled={loading}>
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Générer le code", "Generate code")}
            </Button>
          )}
        </div>
      );
    }
    if (isStudent) {
      return (
        <div className="rounded-2xl border-2 border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/20 p-5">
          <div className="flex items-center gap-2 mb-2">
            <CheckCircle2 className="h-5 w-5 text-emerald-600" />
            <div className="font-bold">{t("Confirmer la fin", "Confirm completion")}</div>
          </div>
          <p className="text-xs text-muted-foreground">
            {t("La séance est-elle finie ? Entre le code que le prof te donne pour libérer son paiement.",
               "Is the session done? Enter the code the tutor gives you to release their payment.")}
          </p>
          <div className="mt-3 flex gap-2">
            <Input value={otp} onChange={(e) => setOtp(e.target.value)} placeholder="1234" maxLength={4} className="text-center font-bold tracking-widest" />
            <Button onClick={async () => { const r = await call("verify_end", { code: otp }); if (r) setOtp(""); }}
              disabled={loading || otp.length !== 4} className="bg-gradient-to-br from-emerald-500 to-emerald-600 text-white">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : t("Valider", "Confirm")}
            </Button>
          </div>
        </div>
      );
    }
  }

  return null;
}
